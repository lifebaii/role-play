import { dbSet, dbGet, dbDelete, fileSet, fileGet, fileDelete, getAllKeys, getByPrefix, deleteByPrefix, getStorageUsage, STORE_NAME, FILES_STORE_NAME } from './db'

const MIGRATION_KEY = '_storage_migrated_v4'

interface StorageExportData {
  version: number
  exportedAt: number
  store: Record<string, any>
  files: Record<string, string>
}

async function migrateFromLocalStorage(): Promise<void> {
  const alreadyMigrated = await dbGet<string>(MIGRATION_KEY)
  if (alreadyMigrated) return

  const keysToMigrate = [
    'role_play_user_data',
    'role_play_selected_model',
    'role_play_use_custom_model',
    'role_play_custom_model_config',
    'role_play_last_character_id',
    'friend_order',
    'characters_list',
    'shared_characters_list',
    'local_characters_list',
  ]

  for (const key of keysToMigrate) {
    const value = localStorage.getItem(key)
    if (value !== null) {
      try {
        await dbSet(key, JSON.parse(value))
      } catch {
        await dbSet(key, value)
      }
    }
  }

  await dbSet(MIGRATION_KEY, new Date().toISOString())
}

async function exportAllData(): Promise<Blob> {
  const storeKeys = await getAllKeys(STORE_NAME)
  const fileKeys = await getAllKeys(FILES_STORE_NAME)

  const storeData: Record<string, any> = {}
  for (const key of storeKeys) {
    const value = await dbGet(key)
    if (value !== null) {
      storeData[key as string] = value
    }
  }

  const filesData: Record<string, string> = {}
  for (const key of fileKeys) {
    const blob = await fileGet(key as string)
    if (blob) {
      const buffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      filesData[key as string] = btoa(binary)
    }
  }

  const exportData: StorageExportData = {
    version: 3,
    exportedAt: Date.now(),
    store: storeData,
    files: filesData,
  }

  return new Blob([JSON.stringify(exportData)], { type: 'application/json' })
}

async function importAllData(blob: Blob): Promise<{ storeCount: number; fileCount: number }> {
  const text = await blob.text()
  const data: StorageExportData = JSON.parse(text)

  if (!data.version || !data.store) {
    throw new Error('Invalid backup format')
  }

  let storeCount = 0
  let fileCount = 0

  for (const [key, value] of Object.entries(data.store)) {
    await dbSet(key, value)
    storeCount++
  }

  if (data.files) {
    for (const [key, base64] of Object.entries(data.files)) {
      try {
        const binaryString = atob(base64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const fileBlob = new Blob([bytes])
        await fileSet(key, fileBlob)
        fileCount++
      } catch (e) {
        console.error(`Failed to import file: ${key}`, e)
      }
    }
  }

  return { storeCount, fileCount }
}

async function exportPartial(options: {
  characters?: boolean
  chats?: boolean
  settings?: boolean
  worldInfo?: boolean
  presets?: boolean
  regexScripts?: boolean
  secrets?: boolean
  themes?: boolean
  backgrounds?: boolean
}): Promise<Blob> {
  const storeKeys = await getAllKeys(STORE_NAME)
  const fileKeys = await getAllKeys(FILES_STORE_NAME)

  const storeData: Record<string, any> = {}
  const filesData: Record<string, string> = {}

  const shouldInclude = (key: string): boolean => {
    if (options.characters && (key === 'local_friends_list' || key.startsWith('character_img_'))) return true
    if (options.chats && key.startsWith('silly_tavern_chat_')) return true
    if (options.settings && (key === 'settings' || key.startsWith('ls_role_play_') || key === 'friend_order')) return true
    if (options.worldInfo && key === 'role_play_user_data') return true
    if (options.presets && key === 'role_play_user_data') return true
    if (options.regexScripts && key === 'role_play_user_data') return true
    if (options.secrets && key === 'secrets') return true
    if (options.themes && (key === 'themes' || key === 'active_theme')) return true
    if (options.backgrounds && (key.startsWith('background_') || key === 'backgrounds_settings')) return true
    return false
  }

  for (const key of storeKeys) {
    if (shouldInclude(key as string)) {
      const value = await dbGet(key as string)
      if (value !== null) storeData[key as string] = value
    }
  }

  for (const key of fileKeys) {
    if (shouldInclude(key as string)) {
      const blob = await fileGet(key as string)
      if (blob) {
        const buffer = await blob.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        filesData[key as string] = btoa(binary)
      }
    }
  }

  const exportData: StorageExportData = {
    version: 3,
    exportedAt: Date.now(),
    store: storeData,
    files: filesData,
  }

  return new Blob([JSON.stringify(exportData)], { type: 'application/json' })
}

async function clearAllData(): Promise<void> {
  const storeKeys = await getAllKeys(STORE_NAME)
  const fileKeys = await getAllKeys(FILES_STORE_NAME)

  for (const key of storeKeys) {
    await dbDelete(key as string)
  }
  for (const key of fileKeys) {
    await fileDelete(key as string)
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = decodeURIComponent(encodeURIComponent(filename))
  a.click()
  URL.revokeObjectURL(url)
}

async function exportAndDownload(): Promise<void> {
  const blob = await exportAllData()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  downloadBlob(blob, `sillytavern-backup-${timestamp}.json`)
}

async function importFromFile(file: File): Promise<{ storeCount: number; fileCount: number }> {
  return importAllData(file)
}

export {
  migrateFromLocalStorage,
  exportAllData,
  importAllData,
  exportPartial,
  clearAllData,
  downloadBlob,
  exportAndDownload,
  importFromFile,
  getStorageUsage,
  getByPrefix,
  deleteByPrefix,
}

export type { StorageExportData }
