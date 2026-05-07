import { dbSet, dbGet, dbDelete, fileSet, fileGet, fileDelete, getAllKeys, STORE_NAME, FILES_STORE_NAME } from './db'

export interface ExportOptions {
  characters?: boolean
  chats?: boolean
  settings?: boolean
  worldInfo?: boolean
  presets?: boolean
  regexScripts?: boolean
  secrets?: boolean
  themes?: boolean
  backgrounds?: boolean
  instructTemplates?: boolean
  contextTemplates?: boolean
  authorsNotes?: boolean
  quickReplies?: boolean
  groups?: boolean
  sprites?: boolean
}

export interface ExportData {
  version: number
  exportedAt: number
  store: Record<string, any>
  files: Record<string, string>
}

const EXPORT_VERSION = 3

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, type: string = 'application/octet-stream'): Blob {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Blob([bytes], { type })
}

function shouldIncludeKey(key: string, options: ExportOptions): boolean {
  if (options.characters && (key === 'local_friends_list' || key === 'friend_order')) return true
  if (options.chats && key.startsWith('silly_tavern_chat_')) return true
  if (options.settings && (key === 'app_settings' || key === 'role_play_user_data')) return true
  if (options.worldInfo && key === 'role_play_user_data') return true
  if (options.presets && key === 'role_play_user_data') return true
  if (options.regexScripts && key === 'role_play_user_data') return true
  if (options.secrets && key === 'secrets') return true
  if (options.themes && (key === 'themes' || key === 'active_theme')) return true
  if (options.backgrounds && (key.startsWith('background_') || key === 'backgrounds_settings')) return true
  if (options.instructTemplates && key === 'instruct_templates') return true
  if (options.contextTemplates && key === 'context_templates') return true
  if (options.authorsNotes && key === 'authors_notes') return true
  if (options.quickReplies && key === 'quick_replies') return true
  if (options.groups && (key === 'groups' || key.startsWith('group_chat_'))) return true
  if (options.sprites && key.startsWith('sprite_')) return true
  return false
}

function shouldIncludeFile(key: string, options: ExportOptions): boolean {
  if (options.characters && key.startsWith('character_img_')) return true
  if (options.backgrounds && key.startsWith('background_')) return true
  if (options.sprites && key.startsWith('sprite_')) return true
  return false
}

async function exportData(options: ExportOptions): Promise<Blob> {
  const storeKeys = await getAllKeys(STORE_NAME)
  const fileKeys = await getAllKeys(FILES_STORE_NAME)

  const storeData: Record<string, any> = {}
  const filesData: Record<string, string> = {}

  for (const key of storeKeys) {
    if (shouldIncludeKey(key as string, options)) {
      const value = await dbGet(key as string)
      if (value !== null) storeData[key as string] = value
    }
  }

  for (const key of fileKeys) {
    if (shouldIncludeFile(key as string, options)) {
      const blob = await fileGet(key as string)
      if (blob) {
        filesData[key as string] = await blobToBase64(blob)
      }
    }
  }

  const exportObj: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    store: storeData,
    files: filesData,
  }

  return new Blob([JSON.stringify(exportObj)], { type: 'application/json' })
}

async function exportAllData(): Promise<Blob> {
  return exportData({
    characters: true,
    chats: true,
    settings: true,
    worldInfo: true,
    presets: true,
    regexScripts: true,
    secrets: true,
    themes: true,
    backgrounds: true,
    instructTemplates: true,
    contextTemplates: true,
    authorsNotes: true,
    quickReplies: true,
    groups: true,
    sprites: true,
  })
}

async function importData(blob: Blob): Promise<{ storeCount: number; fileCount: number }> {
  const text = await blob.text()
  const data: ExportData = JSON.parse(text)

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
        const fileBlob = base64ToBlob(base64)
        await fileSet(key, fileBlob)
        fileCount++
      } catch (e) {
        console.error(`Failed to import file: ${key}`, e)
      }
    }
  }

  return { storeCount, fileCount }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = decodeURIComponent(encodeURIComponent(filename))
  a.click()
  URL.revokeObjectURL(url)
}

async function exportAndDownload(options?: ExportOptions): Promise<void> {
  const blob = options ? await exportData(options) : await exportAllData()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  downloadBlob(blob, `sillytavern-backup-${timestamp}.json`)
}

async function importFromFile(file: File): Promise<{ storeCount: number; fileCount: number }> {
  return importData(file)
}

async function importFromSillyTavernFormat(file: File): Promise<{ storeCount: number; fileCount: number }> {
  const text = await file.text()

  try {
    const data = JSON.parse(text)

    if (data.spec === 'chara_card_v2' && data.data) {
      await dbSet('imported_character', data)
      return { storeCount: 1, fileCount: 0 }
    }

    if (Array.isArray(data)) {
      let count = 0
      for (const item of data) {
        if (item.name || item.data?.name) {
          await dbSet(`imported_character_${count}`, item)
          count++
        }
      }
      return { storeCount: count, fileCount: 0 }
    }

    return importData(file)
  } catch {
    return importData(file)
  }
}

export {
  exportData,
  exportAllData,
  importData,
  downloadBlob,
  exportAndDownload,
  importFromFile,
  importFromSillyTavernFormat,
}

export type { ExportOptions, ExportData }
