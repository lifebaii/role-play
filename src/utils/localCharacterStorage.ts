import { initDB, dbGet, dbSet, dbDelete, fileSet, fileGet, fileDelete } from './db'
import type { Character } from '@/types'

const LOCAL_CHARACTER_IDS_KEY = 'role_play_local_character_ids'
const CHARACTER_IMG_PREFIX = 'character_img_'

let localCharacterIdsCache: Set<string> | null = null

function generateUUID(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch (e) {
    console.warn('crypto.randomUUID failed, using fallback:', e)
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function getLocalCharacterIds(): Set<string> {
  if (localCharacterIdsCache) {
    return localCharacterIdsCache
  }
  try {
    const saved = localStorage.getItem(LOCAL_CHARACTER_IDS_KEY)
    if (saved) {
      localCharacterIdsCache = new Set(JSON.parse(saved))
      return localCharacterIdsCache
    }
  } catch {
  }
  localCharacterIdsCache = new Set()
  return localCharacterIdsCache
}

function saveLocalCharacterIds(ids: Set<string>): void {
  localCharacterIdsCache = ids
  localStorage.setItem(LOCAL_CHARACTER_IDS_KEY, JSON.stringify([...ids]))
}

function addLocalCharacterId(id: string): void {
  const ids = getLocalCharacterIds()
  ids.add(id)
  saveLocalCharacterIds(ids)
}

function removeLocalCharacterId(id: string): void {
  const ids = getLocalCharacterIds()
  ids.delete(id)
  saveLocalCharacterIds(ids)
}

export interface LocalCharacter {
  role_play: {
    id: string
    createdAt: number
    userId: string
    shared: boolean
  }
  [key: string]: any
}

function getCharacterKey(id: string): string {
  return `local_character_${id}`
}

function getCharacterImgKey(id: string): string {
  return `${CHARACTER_IMG_PREFIX}${id}`
}

function getAvatarFromData(charData: any): string | undefined {
  if (charData.avatar) {
    return charData.avatar
  }
  if (charData.data && charData.data.avatar) {
    return charData.data.avatar
  }
  return undefined
}

export async function getLocalCharacters(): Promise<LocalCharacter[]> {
  const ids = getLocalCharacterIds()
  const characters: LocalCharacter[] = []
  
  for (const id of ids) {
    try {
      const char = await dbGet<LocalCharacter>(getCharacterKey(id))
      if (char) {
        characters.push(char)
      }
    } catch (e) {
      console.error(`Failed to get character ${id}:`, e)
    }
  }
  
  return characters
}

export async function saveLocalCharacter(character: LocalCharacter): Promise<void> {
  try {
    console.log(`[LocalCharacter] Saving character data: ${character.role_play.id}`)
    await dbSet(getCharacterKey(character.role_play.id), character)
  } catch (error) {
    console.error('Failed to save local character:', error)
    throw error
  }
}

export async function addLocalCharacter(character: Partial<Character>): Promise<LocalCharacter> {
  const newId = generateUUID()
  
  const newCharacter: LocalCharacter = {
    ...character,
    role_play: {
      id: newId,
      createdAt: Date.now(),
      userId: 'local',
      shared: false
    }
  }
  
  await saveLocalCharacter(newCharacter)
  addLocalCharacterId(newId)
  
  return newCharacter
}

export async function updateLocalCharacter(characterId: string, updates: Partial<Character>): Promise<LocalCharacter | null> {
  const character = await getLocalCharacter(characterId)
  
  if (!character) {
    return null
  }
  
  const updatedCharacter: LocalCharacter = {
    ...character,
    ...updates,
    role_play: {
      ...character.role_play
    }
  }
  
  await saveLocalCharacter(updatedCharacter)
  
  return updatedCharacter
}

export async function deleteLocalCharacter(characterId: string): Promise<boolean> {
  const character = await getLocalCharacter(characterId)
  
  if (!character) {
    return false
  }
  
  console.log(`[LocalCharacter] Deleting character: ${characterId}`)
  
  try {
    await dbDelete(getCharacterKey(characterId))
  } catch {
  }
  
  removeLocalCharacterId(characterId)
  
  try {
    await fileDelete(getCharacterImgKey(characterId))
    console.log(`[LocalCharacter] Deleted character image file: ${characterId}`)
  } catch {
  }
  
  try {
    await dbDelete(`silly_tavern_chat_${characterId}`)
  } catch {
  }
  
  return true
}

export async function getLocalCharacter(characterId: string): Promise<LocalCharacter | null> {
  try {
    return await dbGet<LocalCharacter>(getCharacterKey(characterId))
  } catch {
    return null
  }
}

async function saveCharacterImg(id: string, file: Blob): Promise<void> {
  const key = getCharacterImgKey(id)
  console.log(`[LocalCharacter] Saving character image file: ${key}`)
  await fileSet(key, file)
}

export async function getCharacterImg(id: string): Promise<Blob | null> {
  try {
    return await fileGet(getCharacterImgKey(id))
  } catch {
    return null
  }
}

export async function importLocalCharacters(charactersData: any[]): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  
  for (const charData of charactersData) {
    try {
      const newId = generateUUID()
      
      const newCharacter: LocalCharacter = {
        ...charData,
        role_play: {
          id: newId,
          createdAt: Date.now(),
          userId: 'local',
          shared: false
        }
      }
      
      await saveLocalCharacter(newCharacter)
      addLocalCharacterId(newId)
      success++
    } catch (e) {
      console.error('Failed to import character:', e)
      failed++
    }
  }
  
  return { success, failed }
}

export async function importCharacterFromFile(file: File): Promise<LocalCharacter> {
  const newId = generateUUID()
  
  let charData: any
  
  if (file.type.startsWith('image/')) {
    const arrayBuffer = await file.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)
    const mimeType = file.type || 'image/png'
    const dataUrl = `data:${mimeType};base64,${base64}`
    
    charData = {
      name: file.name.replace(/\.[^/.]+$/, ''),
      avatar: dataUrl
    }
    
    await saveCharacterImg(newId, file)
  } else {
    const text = await file.text()
    charData = JSON.parse(text)
  }
  
  const newCharacter: LocalCharacter = {
    ...charData,
    role_play: {
      id: newId,
      createdAt: Date.now(),
      userId: 'local',
      shared: false
    }
  }
  
  await saveLocalCharacter(newCharacter)
  addLocalCharacterId(newId)
  
  return newCharacter
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function exportLocalCharacters(): Promise<LocalCharacter[]> {
  return await getLocalCharacters()
}

export async function clearLocalCharacters(): Promise<void> {
  const ids = getLocalCharacterIds()
  
  for (const id of ids) {
    try {
      await fileDelete(getCharacterImgKey(id))
    } catch {
    }
    try {
      await dbDelete(getCharacterKey(id))
    } catch {
    }
  }
  
  saveLocalCharacterIds(new Set())
}

export function isLocalCharacter(characterId: string): boolean {
  return getLocalCharacterIds().has(characterId)
}

export async function getCharacterAvatar(character: LocalCharacter): Promise<string | undefined> {
  const avatar = getAvatarFromData(character)
  
  if (!avatar) {
    return undefined
  }
  
  if (avatar.startsWith('data:')) {
    return avatar
  }
  
  return avatar
}

export function getCharacterName(character: LocalCharacter): string {
  if (character.data && character.data.name) {
    return character.data.name
  }
  return character.name || 'Unknown'
}

export function getCharacterDescription(character: LocalCharacter): string {
  if (character.data && character.data.description) {
    return character.data.description
  }
  return character.description || ''
}

export async function migrateLocalCharactersToServer(
  uploadFn: (character: LocalCharacter) => Promise<Character>
): Promise<{ success: number; failed: number }> {
  const localCharacters = await getLocalCharacters()
  let success = 0
  let failed = 0
  
  for (const character of localCharacters) {
    try {
      await uploadFn(character)
      success++
    } catch {
      failed++
    }
  }
  
  return { success, failed }
}
