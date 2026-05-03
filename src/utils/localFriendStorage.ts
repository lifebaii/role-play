import { dbGet, dbDelete, fileGet, fileDelete, deleteByPrefix, STORE_NAME, FILES_STORE_NAME, characterSet, characterGet, characterDelete, characterGetAll, characterClear } from './db'
import { parseCharacterFromPng, normalizeCharacterData, writePngChunks } from './characterImport'

const LOCAL_FRIENDS_KEY = 'local_friends_list'
const FRIEND_IMG_PREFIX = 'character_img_'

let friendsCache: LocalFriend[] | null = null

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

function getFriendImgKey(id: string): string {
  return `${FRIEND_IMG_PREFIX}${id}`
}

export async function getFriendImg(id: string): Promise<Blob | null> {
  try {
    return await fileGet(getFriendImgKey(id))
  } catch {
    return null
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function isImageBlob(blob: Blob): boolean {
  return blob.type?.startsWith('image/')
}

async function parseCharacterFile(id: string, blob: Blob): Promise<LocalFriend | null> {
  if (isImageBlob(blob)) {
    const file = new File([blob], 'character.png', { type: blob.type || 'image/png' })
    const { data: charData, hasEmbeddedData } = await parseCharacterFromPng(file)

    let friendData: any
    if (hasEmbeddedData && charData) {
      const normalized = normalizeCharacterData(charData)
      if (Array.isArray(normalized) && normalized.length > 0) {
        friendData = normalized[0].data || normalized[0]
      } else if (normalized && !Array.isArray(normalized)) {
        friendData = normalized.data || normalized
      }
    }

    if (!friendData) {
      const arrayBuffer = await blob.arrayBuffer()
      const base64 = arrayBufferToBase64(arrayBuffer)
      const dataUrl = `data:${blob.type || 'image/png'};base64,${base64}`
      friendData = {
        name: 'Unnamed',
        avatar: dataUrl,
        description: '',
        first_mes: '',
        personality: '',
        scenario: '',
        system_prompt: '',
        creator_notes: '',
        temperature: 1,
        world_info: [],
        regex_scripts: []
      }
    }

    return {
      data: friendData,
      role_play: {
        id
      }
    }
  } else {
    const text = await blob.text()
    try {
      const charData = JSON.parse(text)
      const normalized = normalizeCharacterData(charData)

      let friendData: any
      if (Array.isArray(normalized) && normalized.length > 0) {
        friendData = normalized[0].data || normalized[0]
      } else if (normalized) {
        friendData = normalized.data || normalized
      } else {
        friendData = charData
      }

      return {
        data: friendData,
        role_play: {
          id
        }
      }
    } catch {
      return null
    }
  }
}

async function migrateFromOldFormat(): Promise<void> {
  const oldFriends = await dbGet<any[]>(LOCAL_FRIENDS_KEY)
  if (!oldFriends || oldFriends.length === 0) return

  console.log(`[LocalFriend] Migrating ${oldFriends.length} friends from old format`)

  for (const friend of oldFriends) {
    const id = friend.role_play?.id
    if (!id) continue

    try {
      let data = friend.data ? { ...friend.data } : { ...friend }
      delete (data as any).role_play

      try {
        const imgBlob = await fileGet(getFriendImgKey(id))
        if (imgBlob && !data.avatar) {
          const arrayBuffer = await imgBlob.arrayBuffer()
          const base64 = arrayBufferToBase64(arrayBuffer)
          const mimeType = imgBlob.type || 'image/jpeg'
          data.avatar = `data:${mimeType};base64,${base64}`
        }
      } catch {}

      const characterName = data.name || 'character'
      const jsonFile = new File([JSON.stringify(data)], `${characterName}.json`, { type: 'application/json' })
      await characterSet(id, jsonFile)
    } catch (e) {
      console.error(`[LocalFriend] Failed to migrate friend: ${id}`, e)
    }
  }

  await dbDelete(LOCAL_FRIENDS_KEY)

  try {
    await deleteByPrefix(FILES_STORE_NAME, FRIEND_IMG_PREFIX)
  } catch {}

  try {
    await deleteByPrefix(STORE_NAME, 'character_meta_')
  } catch {}

  try {
    await dbDelete('character_order')
  } catch {}

  console.log(`[LocalFriend] Migration completed`)
}

export async function getLocalFriends(): Promise<LocalFriend[]> {
  if (friendsCache) {
    return friendsCache
  }

  try {
    let allFiles = await characterGetAll()

    if (allFiles.size === 0) {
      await migrateFromOldFormat()
      allFiles = await characterGetAll()
      if (allFiles.size === 0) {
        friendsCache = []
        return friendsCache
      }
    }

    const friends: LocalFriend[] = []

    for (const [id, blob] of allFiles) {
      try {
        const friend = await parseCharacterFile(id, blob)
        if (friend) {
          friends.push(friend)
        }
      } catch (e) {
        console.error(`[LocalFriend] Failed to parse character: ${id}`, e)
      }
    }

    friendsCache = friends
    return friendsCache
  } catch {
    friendsCache = []
    return friendsCache
  }
}

export interface LocalFriend {
  data?: any
  role_play: {
    id: string
  }
  [key: string]: any
}

async function saveCharacterData(id: string, data: any): Promise<void> {
  const saveData = { ...data }
  delete (saveData as any).role_play

  const existingBlob = await characterGet(id)
  if (existingBlob && isImageBlob(existingBlob)) {
    const imageBuffer = await existingBlob.arrayBuffer()
    const exportData = {
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        ...saveData,
        avatar: undefined
      }
    }
    const newImageBlob = await writePngChunks(imageBuffer, exportData)
    const characterName = saveData.name || 'character'
    const newFile = new File([newImageBlob], `${characterName}.png`, { type: 'image/png' })
    await characterSet(id, newFile)
  } else {
    const characterName = saveData.name || 'character'
    const jsonFile = new File([JSON.stringify(saveData)], `${characterName}.json`, { type: 'application/json' })
    await characterSet(id, jsonFile)
  }
}

export async function addLocalFriend(character: any): Promise<LocalFriend> {
  const friends = await getLocalFriends()

  const checkId = character.role_play?.id || character.id
  const existingIndex = friends.findIndex(f => f.role_play.id === checkId)

  if (existingIndex !== -1) {
    return friends[existingIndex]
  }

  const newId = generateUUID()

  const hasDataField = character.data !== undefined
  const characterData = hasDataField ? character.data : character

  const characterName = characterData.name || 'character'
  const jsonFile = new File([JSON.stringify(characterData)], `${characterName}.json`, { type: 'application/json' })
  await characterSet(newId, jsonFile)

  const newFriend: LocalFriend = {
    ...character,
    data: characterData,
    role_play: {
      id: newId
    }
  }

  friends.unshift(newFriend)
  friendsCache = friends

  return newFriend
}

export async function createLocalFriend(characterData: any, _shared: boolean = false): Promise<LocalFriend> {
  const newId = generateUUID()

  const saveData = { ...characterData }

  const characterName = saveData.name || 'character'
  const jsonFile = new File([JSON.stringify(saveData)], `${characterName}.json`, { type: 'application/json' })
  await characterSet(newId, jsonFile)

  const newFriend: LocalFriend = {
    data: saveData,
    role_play: {
      id: newId
    }
  }

  if (friendsCache) {
    friendsCache.unshift(newFriend)
  } else {
    friendsCache = null
  }

  console.log(`[LocalFriend] Created new friend: ${newId}`)

  return newFriend
}

export async function saveLocalFriend(friend: LocalFriend): Promise<void> {
  const id = friend.role_play.id

  const characterData = friend.data || friend
  await saveCharacterData(id, characterData)

  if (friendsCache) {
    const index = friendsCache.findIndex(f => f.role_play.id === id)
    if (index >= 0) {
      friendsCache[index] = friend
    } else {
      friendsCache.unshift(friend)
    }
  } else {
    friendsCache = null
  }
}

export async function updateLocalFriendData(friendId: string, data: any): Promise<LocalFriend | null> {
  const blob = await characterGet(friendId)
  if (!blob) return null

  let currentData: any = {}
  if (isImageBlob(blob)) {
    const file = new File([blob], 'character.png', { type: blob.type || 'image/png' })
    const { data: charData, hasEmbeddedData } = await parseCharacterFromPng(file)
    if (hasEmbeddedData && charData) {
      const normalized = normalizeCharacterData(charData)
      if (normalized && !Array.isArray(normalized)) {
        currentData = normalized.data || normalized
      }
    }
  } else {
    const text = await blob.text()
    try {
      currentData = JSON.parse(text)
    } catch {}
  }

  const mergedData = { ...currentData, ...data }
  await saveCharacterData(friendId, mergedData)

  if (friendsCache) {
    const index = friendsCache.findIndex(f => f.role_play.id === friendId)
    if (index >= 0) {
      friendsCache[index].data = mergedData
    }
  }

  return await getLocalFriend(friendId)
}

export async function updateLocalFriendShared(_friendId: string, _shared: boolean): Promise<LocalFriend | null> {
  return await getLocalFriend(_friendId)
}

export async function removeLocalFriend(friendId: string): Promise<boolean> {
  const blob = await characterGet(friendId)
  if (!blob) return false

  console.log(`[LocalFriend] Deleting friend: ${friendId}`)

  await characterDelete(friendId)

  try {
    await fileDelete(getFriendImgKey(friendId))
  } catch {}

  if (friendsCache) {
    const index = friendsCache.findIndex(f => f.role_play.id === friendId)
    if (index >= 0) {
      friendsCache.splice(index, 1)
    }
  }

  return true
}

export async function updateLocalFriend(friendId: string, updates: any): Promise<LocalFriend | null> {
  const blob = await characterGet(friendId)
  if (!blob) return null

  let currentData: any = {}
  if (isImageBlob(blob)) {
    const file = new File([blob], 'character.png', { type: blob.type || 'image/png' })
    const { data: charData, hasEmbeddedData } = await parseCharacterFromPng(file)
    if (hasEmbeddedData && charData) {
      const normalized = normalizeCharacterData(charData)
      if (normalized && !Array.isArray(normalized)) {
        currentData = normalized.data || normalized
      }
    }
  } else {
    const text = await blob.text()
    try {
      currentData = JSON.parse(text)
    } catch {}
  }

  const mergedData = { ...currentData, ...updates }
  await saveCharacterData(friendId, mergedData)

  friendsCache = null
  return await getLocalFriend(friendId)
}

export async function clearLocalFriends(): Promise<void> {
  await characterClear()
  await dbDelete(LOCAL_FRIENDS_KEY)
  await deleteByPrefix(FILES_STORE_NAME, FRIEND_IMG_PREFIX)

  friendsCache = []
}

export async function isLocalFriend(friendId: string): Promise<boolean> {
  if (friendsCache) {
    return friendsCache.some(f => f.role_play.id === friendId)
  }
  const blob = await characterGet(friendId)
  return blob !== null
}

export async function getLocalFriend(friendId: string): Promise<LocalFriend | null> {
  if (friendsCache) {
    return friendsCache.find(f => f.role_play.id === friendId) || null
  }

  const blob = await characterGet(friendId)
  if (!blob) return null

  return await parseCharacterFile(friendId, blob)
}

export async function getLocalFriendByOriginalId(_originalId: string): Promise<LocalFriend | null> {
  return null
}

export async function reorderLocalFriends(oldIndex: number, newIndex: number): Promise<void> {
  const friends = await getLocalFriends()
  const [moved] = friends.splice(oldIndex, 1)
  friends.splice(newIndex, 0, moved)
  friendsCache = friends
}

export async function getLocalFriendCount(): Promise<number> {
  const friends = await getLocalFriends()
  return friends.length
}

const blobUrlCache = new Map<string, string>()

function revokeBlobUrl(id: string) {
  const url = blobUrlCache.get(id)
  if (url) {
    URL.revokeObjectURL(url)
    blobUrlCache.delete(id)
  }
}

export function clearAllBlobUrls() {
  for (const [id, url] of blobUrlCache) {
    URL.revokeObjectURL(url)
  }
  blobUrlCache.clear()
}

export function clearCharacterAvatarCache(characterId: string) {
  revokeBlobUrl(characterId)
}

function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

export async function compressImageToBlob(imageUrl: string, maxWidth: number = 200, maxHeight: number = 200, quality: number = 0.8): Promise<Blob> {
  let dataUrl: string = imageUrl
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch (e) {
      console.warn('Failed to fetch image, trying to load directly:', e)
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const originalWidth = img.width
      const originalHeight = img.height

      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = width * ratio
        height = height * ratio
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        if (dataUrl.startsWith('data:')) {
          resolve(dataUrlToBlob(dataUrl))
        } else {
          fetch(dataUrl).then(r => r.blob()).then(resolve).catch(() => reject(new Error('Failed to process image')))
        }
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      try {
        const originalSize = dataUrl.startsWith('data:') ? Math.round(dataUrl.length * 0.75) : 0

        canvas.toBlob((blob) => {
          if (blob) {
            if (originalSize > 0) {
              const compressedSize = blob.size
              const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1)
              console.log(`[Image Compression] ${originalWidth}x${originalHeight} -> ${Math.round(width)}x${Math.round(height)}, ${(originalSize / 1024).toFixed(1)}KB -> ${(compressedSize / 1024).toFixed(1)}KB, compressed ${compressionRatio}%`)
            }
            resolve(blob)
          } else if (dataUrl.startsWith('data:')) {
            resolve(dataUrlToBlob(dataUrl))
          } else {
            fetch(dataUrl).then(r => r.blob()).then(resolve).catch(() => reject(new Error('Failed to process image')))
          }
        }, 'image/jpeg', quality)
      } catch (e) {
        console.warn('Failed to compress image, using original:', e)
        if (dataUrl.startsWith('data:')) {
          resolve(dataUrlToBlob(dataUrl))
        } else {
          fetch(dataUrl).then(r => r.blob()).then(resolve).catch(() => reject(new Error('Failed to process image')))
        }
      }
    }

    img.onerror = () => {
      console.warn('Failed to load image for compression, using original')
      if (dataUrl.startsWith('data:')) {
        resolve(dataUrlToBlob(dataUrl))
      } else {
        fetch(dataUrl).then(r => r.blob()).then(resolve).catch(() => reject(new Error('Failed to process image')))
      }
    }

    img.src = dataUrl
  })
}

async function compressImage(dataUrl: string, maxWidth: number = 200, maxHeight: number = 200, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = width * ratio
        height = height * ratio
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      try {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      } catch (e) {
        console.warn('Failed to compress image, using original:', e)
        resolve(dataUrl)
      }
    }

    img.onerror = () => {
      console.warn('Failed to load image for compression, using original')
      resolve(dataUrl)
    }

    img.src = dataUrl
  })
}

export async function compressImageFile(file: File | Blob, maxWidth: number = 200, maxHeight: number = 200, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const originalWidth = img.width
        const originalHeight = img.height

        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        try {
          const originalSize = file.size

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedSize = blob.size
              const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1)
              console.log(`[Image Compression] ${originalWidth}x${originalHeight} -> ${Math.round(width)}x${Math.round(height)}, ${(originalSize / 1024).toFixed(1)}KB -> ${(compressedSize / 1024).toFixed(1)}KB, compressed ${compressionRatio}%`)
              resolve(blob)
            } else {
              resolve(file)
            }
          }, 'image/jpeg', quality)
        } catch (e) {
          console.warn('Failed to compress image file, using original:', e)
          resolve(file)
        }
      }

      img.onerror = () => {
        console.warn('Failed to load image for compression, using original')
        resolve(file)
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      console.warn('Failed to read file for compression, using original')
      resolve(file)
    }

    reader.readAsDataURL(file)
  })
}

export async function getFriendAvatar(friend: LocalFriend): Promise<string | undefined> {
  const cacheKey = friend.role_play?.id
  if (cacheKey && blobUrlCache.has(cacheKey)) {
    return blobUrlCache.get(cacheKey)
  }

  let blob: Blob | undefined

  if (friend.data && friend.data.avatar) {
    blob = await compressImageToBlob(friend.data.avatar)
  } else {
    try {
      const charBlob = await characterGet(friend.role_play.id)
      if (charBlob && isImageBlob(charBlob)) {
        blob = await compressImageFile(charBlob)
      } else {
        const imgBlob = await getFriendImg(friend.role_play.id)
        if (imgBlob) {
          blob = await compressImageFile(imgBlob)
        }
      }
    } catch (e) {
      console.error('Failed to load friend image from IndexedDB:', e)
    }
  }

  if (blob && cacheKey) {
    const blobUrl = URL.createObjectURL(blob)
    blobUrlCache.set(cacheKey, blobUrl)
    return blobUrl
  }

  return undefined
}

export function getFriendName(friend: LocalFriend): string {
  if (friend.data && friend.data.name) {
    return friend.data.name
  }
  return friend.name || 'Unknown'
}

export function getFriendDescription(friend: LocalFriend): string {
  if (friend.data && friend.data.description) {
    return friend.data.description
  }
  return friend.description || ''
}

export async function importLocalFriends(friendsData: any[]): Promise<{ success: number; failed: number; friends: LocalFriend[] }> {
  console.log(`[LocalFriend] importLocalFriends called with ${friendsData.length} items`)
  let success = 0
  let failed = 0
  const importedFriends: LocalFriend[] = []

  for (const friendData of friendsData) {
    try {
      console.log(`[LocalFriend] Processing friend data:`, friendData.name || friendData.data?.name || 'unnamed')
      const friend = await addLocalFriend(friendData)
      importedFriends.push(friend)
      success++
    } catch (e) {
      console.error('Failed to import friend:', e)
      failed++
    }
  }

  return { success, failed, friends: importedFriends }
}

export async function importFriendFromFile(file: File): Promise<LocalFriend> {
  console.log(`[LocalFriend] importFriendFromFile called, file: ${file.name}, type: ${file.type}`)
  const newId = generateUUID()
  console.log(`[LocalFriend] Generated new id: ${newId}`)

  await characterSet(newId, file)

  friendsCache = null
  const friends = await getLocalFriends()
  const newFriend = friends.find(f => f.role_play.id === newId)

  if (newFriend) {
    return newFriend
  }

  const isImage = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.png')
  let friendData: any
  if (isImage) {
    const arrayBuffer = await file.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)
    const dataUrl = `data:${file.type || 'image/png'};base64,${base64}`
    friendData = {
      name: file.name.replace(/\.[^/.]+$/, ''),
      avatar: dataUrl
    }
  } else {
    const text = await file.text()
    friendData = JSON.parse(text)
  }

  return {
    data: friendData,
    role_play: {
      id: newId
    }
  }
}

export async function importRawFile(file: File): Promise<{ id: string; fileType: 'json' | 'image' }> {
  const newId = generateUUID()

  await characterSet(newId, file)

  const isImage = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.png')
  const fileType = isImage ? 'image' : 'json'

  friendsCache = null

  return { id: newId, fileType }
}

export async function exportCharacterFile(friendId: string): Promise<{ blob: Blob; fileName: string } | null> {
  const blob = await characterGet(friendId)
  if (!blob) return null

  let friend: LocalFriend | null
  if (friendsCache) {
    friend = friendsCache.find(f => f.role_play.id === friendId) || null
  } else {
    friend = await parseCharacterFile(friendId, blob)
  }

  const name = friend?.data?.name || 'character'

  if (isImageBlob(blob)) {
    const fileName = (blob instanceof File && blob.name) ? blob.name : `${name}.png`
    return { blob, fileName }
  } else {
    const fileName = (blob instanceof File && blob.name) ? blob.name : `${name}.json`
    return { blob, fileName }
  }
}

export async function getCharacterSourceType(friendId: string): Promise<'image' | 'json'> {
  const blob = await characterGet(friendId)
  if (!blob) return 'json'
  return isImageBlob(blob) ? 'image' : 'json'
}

export async function getCharacterBlob(friendId: string): Promise<Blob | null> {
  return characterGet(friendId)
}

async function convertImageToPng(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert image to PNG'))
        }
      }, 'image/png')
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export async function saveCharacterImage(
  friendId: string,
  imageFile: File,
  characterData: any
): Promise<boolean> {
  try {
    console.log(`[LocalFriend] Saving character image for: ${friendId}`)
    
    let pngBlob: Blob
    if (imageFile.type === 'image/png') {
      pngBlob = imageFile
    } else {
      console.log(`[LocalFriend] Converting ${imageFile.type} to PNG`)
      pngBlob = await convertImageToPng(imageFile)
    }
    
    const imageBuffer = await pngBlob.arrayBuffer()
    
    const exportData = {
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        ...characterData,
        avatar: undefined
      }
    }
    
    const newImageBlob = await writePngChunks(imageBuffer, exportData)
    
    const characterName = characterData.name || 'character'
    const newFile = new File([newImageBlob], `${characterName}.png`, { type: 'image/png' })
    
    await characterSet(friendId, newFile)
    
    if (friendsCache) {
      const index = friendsCache.findIndex(f => f.role_play.id === friendId)
      if (index >= 0) {
        friendsCache[index] = await parseCharacterFile(friendId, newFile) || friendsCache[index]
      }
    } else {
      friendsCache = null
    }
    
    console.log(`[LocalFriend] Character image saved successfully`)
    return true
  } catch (error) {
    console.error('[LocalFriend] Failed to save character image:', error)
    return false
  }
}
