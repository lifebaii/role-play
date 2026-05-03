const DB_NAME = 'SillyTavernDB'
const DB_VERSION = 4
const STORE_NAME = 'store'
const FILES_STORE_NAME = 'files'
const CHATS_STORE_NAME = 'chats'
const BACKUPS_STORE_NAME = 'backups'
const CHARACTERS_STORE_NAME = 'characters'

let db: IDBDatabase | null = null
let dbPromise: Promise<IDBDatabase> | null = null

function initDB(): Promise<IDBDatabase> {
  if (db && !db.closed && db.version === DB_VERSION) {
    return Promise.resolve(db)
  }

  if (db && db.version !== DB_VERSION) {
    db.close()
    db = null
    dbPromise = null
  }

  if (dbPromise) {
    return dbPromise
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      dbPromise = null
      reject('DB Error: ' + (event.target as IDBRequest).error)
    }

    request.onsuccess = (event) => {
      const database = (event.target as IDBRequest).result

      database.onclose = () => {
        db = null
        dbPromise = null
      }

      database.onerror = () => {
        db = null
        dbPromise = null
      }

      database.onversionchange = () => {
        database.close()
        db = null
        dbPromise = null
      }

      db = database
      dbPromise = null
      resolve(database)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
      if (!database.objectStoreNames.contains(FILES_STORE_NAME)) {
        database.createObjectStore(FILES_STORE_NAME)
      }
      if (!database.objectStoreNames.contains(CHATS_STORE_NAME)) {
        const chatStore = database.createObjectStore(CHATS_STORE_NAME, { keyPath: 'id' })
        chatStore.createIndex('characterId', 'characterId', { unique: false })
        chatStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
      if (!database.objectStoreNames.contains(BACKUPS_STORE_NAME)) {
        const backupStore = database.createObjectStore(BACKUPS_STORE_NAME, { keyPath: 'id' })
        backupStore.createIndex('type', 'type', { unique: false })
        backupStore.createIndex('createdAt', 'createdAt', { unique: false })
      }
      if (!database.objectStoreNames.contains(CHARACTERS_STORE_NAME)) {
        database.createObjectStore(CHARACTERS_STORE_NAME)
      }
    }
  })

  return dbPromise
}

async function getDB(): Promise<IDBDatabase> {
  try {
    const database = await initDB()
    if (database.closed) {
      db = null
      return await initDB()
    }
    return database
  } catch (error) {
    db = null
    dbPromise = null
    return await initDB()
  }
}

function dbSet<T>(key: string, value: T): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(JSON.parse(JSON.stringify(value)), key)

      request.onsuccess = () => resolve()
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

function dbGet<T>(key: string): Promise<T | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

function dbDelete(key: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

function fileSet(key: string, file: Blob | File): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([FILES_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(FILES_STORE_NAME)
      const request = store.put(file, key)

      request.onsuccess = () => resolve()
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

function fileGet(key: string): Promise<Blob | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([FILES_STORE_NAME], 'readonly')
      const store = transaction.objectStore(FILES_STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

function fileDelete(key: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([FILES_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(FILES_STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

function getAllKeys(storeName: string): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAllKeys()

      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

async function getByPrefix<T>(storeName: string, prefix: string): Promise<Map<string, T>> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.openCursor()
      const results = new Map<string, T>()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
            results.set(cursor.key, cursor.value)
          }
          cursor.continue()
        } else {
          resolve(results)
        }
      }

      request.onerror = (event) => reject((event.target as IDBRequest).error)
      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

async function deleteByPrefix(storeName: string, prefix: string): Promise<number> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.openCursor()
      let deletedCount = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
            cursor.delete()
            deletedCount++
          }
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }

      request.onerror = (event) => reject((event.target as IDBRequest).error)
      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

async function getStorageUsage(): Promise<{ store: number; files: number; chats: number; backups: number; total: number }> {
  const storeKeys = await getAllKeys(STORE_NAME)
  const fileKeys = await getAllKeys(FILES_STORE_NAME)
  const chatKeys = await getAllKeys(CHATS_STORE_NAME)
  const backupKeys = await getAllKeys(BACKUPS_STORE_NAME)

  let storeSize = 0
  let filesSize = 0

  try {
    const database = await getDB()

    const storeTx = database.transaction([STORE_NAME], 'readonly')
    const storeObj = storeTx.objectStore(STORE_NAME)
    for (const key of storeKeys) {
      try {
        const val = await new Promise<any>((res) => {
          const req = storeObj.get(key)
          req.onsuccess = () => res(req.result)
          req.onerror = () => res(null)
        })
        if (val) storeSize += JSON.stringify(val).length * 2
      } catch { }
    }

    const fileTx = database.transaction([FILES_STORE_NAME], 'readonly')
    const fileObj = fileTx.objectStore(FILES_STORE_NAME)
    for (const key of fileKeys) {
      try {
        const val = await new Promise<Blob | null>((res) => {
          const req = fileObj.get(key)
          req.onsuccess = () => res(req.result)
          req.onerror = () => res(null)
        })
        if (val) filesSize += val.size
      } catch { }
    }
  } catch { }

  return {
    store: storeSize,
    files: filesSize,
    chats: chatKeys.length,
    backups: backupKeys.length,
    total: storeSize + filesSize
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  name?: string
  content: string
  shouldAnimate?: boolean
  isSelf?: boolean
  avatar?: string
  isGreeting?: boolean
  reasoning?: string
  swipes?: string[]
  currentSwipe?: number
}

export interface ChatRecord {
  id: string
  characterId: string
  chatId: string
  messages: ChatMessage[]
  metadata: Record<string, any>
  updatedAt: number
  createdAt: number
}

export interface BackupRecord {
  id: string
  type: 'chat' | 'settings'
  data: any
  createdAt: number
  label?: string
}

export async function getChatHistory(characterId: string): Promise<ChatMessage[]> {
  const history = await dbGet<ChatMessage[]>(`silly_tavern_chat_${characterId}`)
  return history || []
}

export async function saveChatHistory(characterId: string, messages: ChatMessage[]): Promise<void> {
  await dbSet(`silly_tavern_chat_${characterId}`, messages)
}

export async function clearChatHistory(characterId: string): Promise<void> {
  await dbDelete(`silly_tavern_chat_${characterId}`)
}

export async function exportChatHistory(characterId: string): Promise<string> {
  const history = await getChatHistory(characterId)
  return history.map(msg => JSON.stringify(msg)).join('\n')
}

export async function importChatHistory(characterId: string, content: string): Promise<number> {
  const lines = content.split('\n').filter(line => line.trim() !== '')
  const messages: ChatMessage[] = lines.map(line => JSON.parse(line))

  if (messages.length > 0) {
    await saveChatHistory(characterId, messages)
  }

  return messages.length
}

export async function saveChatRecord(record: ChatRecord): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([CHATS_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(CHATS_STORE_NAME)
      const request = store.put(record)

      request.onsuccess = () => resolve()
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

export async function getChatRecord(id: string): Promise<ChatRecord | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([CHATS_STORE_NAME], 'readonly')
      const store = transaction.objectStore(CHATS_STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

export async function getChatRecordsByCharacter(characterId: string): Promise<ChatRecord[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([CHATS_STORE_NAME], 'readonly')
      const store = transaction.objectStore(CHATS_STORE_NAME)
      const index = store.index('characterId')
      const request = index.getAll(characterId)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

export async function deleteChatRecord(id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([CHATS_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(CHATS_STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

export async function saveBackupRecord(record: BackupRecord): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([BACKUPS_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(BACKUPS_STORE_NAME)
      const request = store.put(record)

      request.onsuccess = () => resolve()
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

export async function getBackupRecord(id: string): Promise<BackupRecord | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([BACKUPS_STORE_NAME], 'readonly')
      const store = transaction.objectStore(BACKUPS_STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

export async function getBackupsByType(type: 'chat' | 'settings'): Promise<BackupRecord[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([BACKUPS_STORE_NAME], 'readonly')
      const store = transaction.objectStore(BACKUPS_STORE_NAME)
      const index = store.index('type')
      const request = index.getAll(type)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

export async function deleteBackupRecord(id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([BACKUPS_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(BACKUPS_STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = (event) => reject((event.target as IDBRequest).error)

      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

export {
  dbSet, dbGet, dbDelete, initDB, fileSet, fileGet, fileDelete,
  getAllKeys, getByPrefix, deleteByPrefix, getStorageUsage,
  STORE_NAME, FILES_STORE_NAME, CHATS_STORE_NAME, BACKUPS_STORE_NAME,
  CHARACTERS_STORE_NAME, characterSet, characterGet, characterDelete, characterGetAll, characterGetAllKeys, characterClear
}

function characterSet(key: string, file: Blob | File): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([CHARACTERS_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(CHARACTERS_STORE_NAME)
      const request = store.put(file, key)
      request.onsuccess = () => resolve()
      request.onerror = (event) => reject((event.target as IDBRequest).error)
      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

function characterGet(key: string): Promise<Blob | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([CHARACTERS_STORE_NAME], 'readonly')
      const store = transaction.objectStore(CHARACTERS_STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = (event) => reject((event.target as IDBRequest).error)
      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

function characterDelete(key: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([CHARACTERS_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(CHARACTERS_STORE_NAME)
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = (event) => reject((event.target as IDBRequest).error)
      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

function characterGetAll(): Promise<Map<string, Blob>> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([CHARACTERS_STORE_NAME], 'readonly')
      const store = transaction.objectStore(CHARACTERS_STORE_NAME)
      const request = store.openCursor()
      const results = new Map<string, Blob>()
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          results.set(cursor.key as string, cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = (event) => reject((event.target as IDBRequest).error)
      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}

function characterGetAllKeys(): Promise<string[]> {
  return getAllKeys(CHARACTERS_STORE_NAME)
}

function characterClear(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDB()
      const transaction = database.transaction([CHARACTERS_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(CHARACTERS_STORE_NAME)
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = (event) => reject((event.target as IDBRequest).error)
      transaction.onerror = (event) => reject((event.target as IDBTransaction).error)
    } catch (error) {
      reject(error)
    }
  })
}
