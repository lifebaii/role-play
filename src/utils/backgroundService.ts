import { dbSet, dbGet, dbDelete, fileSet, fileGet, fileDelete, getAllKeys, getByPrefix, deleteByPrefix, FILES_STORE_NAME, STORE_NAME } from './db'
import { getOrCreateThumbnail, invalidateThumbnail } from './thumbnailService'

const BACKGROUND_PREFIX = 'background_'
const BACKGROUND_SETTINGS_KEY = 'backgrounds_settings'

export interface BackgroundSettings {
  selectedBackground: string | null
  customBackgrounds: string[]
  folders: BackgroundFolder[]
  imageFolderMap: Record<string, string[]>
}

export interface BackgroundFolder {
  id: string
  name: string
  thumbnail?: string
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function getBackgroundKey(name: string): string {
  return `${BACKGROUND_PREFIX}${name}`
}

async function loadSettings(): Promise<BackgroundSettings> {
  const data = await dbGet<BackgroundSettings>(BACKGROUND_SETTINGS_KEY)
  return data || {
    selectedBackground: null,
    customBackgrounds: [],
    folders: [],
    imageFolderMap: {},
  }
}

async function saveSettings(settings: BackgroundSettings): Promise<void> {
  await dbSet(BACKGROUND_SETTINGS_KEY, settings)
}

async function listBackgrounds(): Promise<string[]> {
  const keys = await getAllKeys(FILES_STORE_NAME)
  return keys
    .filter(k => typeof k === 'string' && k.startsWith(BACKGROUND_PREFIX))
    .map(k => (k as string).slice(BACKGROUND_PREFIX.length))
}

async function getBackground(name: string): Promise<Blob | null> {
  return fileGet(getBackgroundKey(name))
}

async function getBackgroundUrl(name: string): Promise<string | null> {
  const blob = await getBackground(name)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

async function addBackground(name: string, blob: Blob): Promise<void> {
  const safeName = name.replace(/[^a-zA-Z0-9_\-.]/g, '_')
  await fileSet(getBackgroundKey(safeName), blob)

  const settings = await loadSettings()
  if (!settings.customBackgrounds.includes(safeName)) {
    settings.customBackgrounds.push(safeName)
    await saveSettings(settings)
  }

  try {
    await getOrCreateThumbnail('bg', safeName, blob, 300, 200)
  } catch (e) {
    console.warn('Failed to generate background thumbnail:', e)
  }
}

async function removeBackground(name: string): Promise<void> {
  await fileDelete(getBackgroundKey(name))
  await invalidateThumbnail('bg', name)

  const settings = await loadSettings()
  settings.customBackgrounds = settings.customBackgrounds.filter(n => n !== name)

  for (const folderId of Object.keys(settings.imageFolderMap)) {
    settings.imageFolderMap[folderId] = settings.imageFolderMap[folderId].filter(n => n !== name)
  }

  if (settings.selectedBackground === name) {
    settings.selectedBackground = null
  }

  await saveSettings(settings)
}

async function renameBackground(oldName: string, newName: string): Promise<void> {
  const blob = await getBackground(oldName)
  if (!blob) return

  const safeNewName = newName.replace(/[^a-zA-Z0-9_\-.]/g, '_')
  await fileSet(getBackgroundKey(safeNewName), blob)
  await fileDelete(getBackgroundKey(oldName))
  await invalidateThumbnail('bg', oldName)

  try {
    await getOrCreateThumbnail('bg', safeNewName, blob, 300, 200)
  } catch (e) {
    console.warn('Failed to generate thumbnail for renamed background:', e)
  }

  const settings = await loadSettings()
  const idx = settings.customBackgrounds.indexOf(oldName)
  if (idx !== -1) {
    settings.customBackgrounds[idx] = safeNewName
  }

  for (const folderId of Object.keys(settings.imageFolderMap)) {
    const folderImages = settings.imageFolderMap[folderId]
    const imgIdx = folderImages.indexOf(oldName)
    if (imgIdx !== -1) {
      folderImages[imgIdx] = safeNewName
    }
  }

  if (settings.selectedBackground === oldName) {
    settings.selectedBackground = safeNewName
  }

  await saveSettings(settings)
}

async function selectBackground(name: string | null): Promise<void> {
  const settings = await loadSettings()
  settings.selectedBackground = name
  await saveSettings(settings)
}

async function createFolder(name: string): Promise<BackgroundFolder> {
  const settings = await loadSettings()
  const folder: BackgroundFolder = {
    id: generateId(),
    name,
  }
  settings.folders.push(folder)
  settings.imageFolderMap[folder.id] = []
  await saveSettings(settings)
  return folder
}

async function deleteFolder(folderId: string): Promise<void> {
  const settings = await loadSettings()
  settings.folders = settings.folders.filter(f => f.id !== folderId)
  delete settings.imageFolderMap[folderId]
  await saveSettings(settings)
}

async function assignToFolder(folderId: string, backgroundName: string): Promise<void> {
  const settings = await loadSettings()
  if (!settings.imageFolderMap[folderId]) {
    settings.imageFolderMap[folderId] = []
  }
  if (!settings.imageFolderMap[folderId].includes(backgroundName)) {
    settings.imageFolderMap[folderId].push(backgroundName)
  }
  await saveSettings(settings)
}

async function unassignFromFolder(folderId: string, backgroundName: string): Promise<void> {
  const settings = await loadSettings()
  if (settings.imageFolderMap[folderId]) {
    settings.imageFolderMap[folderId] = settings.imageFolderMap[folderId].filter(n => n !== backgroundName)
  }
  await saveSettings(settings)
}

async function importBackgroundsFromFiles(files: FileList | File[]): Promise<number> {
  let imported = 0
  for (const file of Array.from(files)) {
    if (file.type.startsWith('image/')) {
      const name = file.name.replace(/[^a-zA-Z0-9_\-.]/g, '_')
      await addBackground(name, file)
      imported++
    }
  }
  return imported
}

export {
  loadSettings,
  saveSettings,
  listBackgrounds,
  getBackground,
  getBackgroundUrl,
  addBackground,
  removeBackground,
  renameBackground,
  selectBackground,
  createFolder,
  deleteFolder,
  assignToFolder,
  unassignFromFolder,
  importBackgroundsFromFiles,
}
