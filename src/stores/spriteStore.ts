import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbSet, dbGet, fileSet, fileGet, fileDelete, getAllKeys, FILES_STORE_NAME } from '@/utils/db'

export interface SpriteEntry {
  name: string
  path: string
}

const SPRITE_PREFIX = 'sprite_'
const SPRITE_INDEX_PREFIX = 'sprite_index_'

function getSpriteKey(characterId: string, spriteName: string): string {
  return `${SPRITE_PREFIX}${characterId}_${spriteName.replace(/[^a-zA-Z0-9_\-.]/g, '_')}`
}

function getSpriteIndexKey(characterId: string): string {
  return `${SPRITE_INDEX_PREFIX}${characterId}`
}

export const useSpriteStore = defineStore('sprite', () => {
  const spriteIndexes = ref<Record<string, SpriteEntry[]>>({})
  const isLoaded = ref(false)

  async function load() {
    if (isLoaded.value) return
    const keys = await getAllKeys(FILES_STORE_NAME)
    const indexKeys = keys.filter(k => typeof k === 'string' && (k as string).startsWith(SPRITE_INDEX_PREFIX))

    for (const key of indexKeys) {
      const data = await dbGet<SpriteEntry[]>(key as string)
      if (data) {
        const characterId = (key as string).slice(SPRITE_INDEX_PREFIX.length)
        spriteIndexes.value[characterId] = data
      }
    }
    isLoaded.value = true
  }

  async function getSprites(characterId: string): Promise<SpriteEntry[]> {
    if (spriteIndexes.value[characterId]) {
      return spriteIndexes.value[characterId]
    }

    const data = await dbGet<SpriteEntry[]>(getSpriteIndexKey(characterId))
    if (data) {
      spriteIndexes.value[characterId] = data
      return data
    }
    return []
  }

  async function getSpriteBlob(characterId: string, spriteName: string): Promise<Blob | null> {
    return fileGet(getSpriteKey(characterId, spriteName))
  }

  async function getSpriteUrl(characterId: string, spriteName: string): Promise<string | null> {
    const blob = await getSpriteBlob(characterId, spriteName)
    if (!blob) return null
    return URL.createObjectURL(blob)
  }

  async function addSprite(characterId: string, name: string, blob: Blob): Promise<void> {
    const safeName = name.replace(/[^a-zA-Z0-9_\-.]/g, '_')
    await fileSet(getSpriteKey(characterId, safeName), blob)

    if (!spriteIndexes.value[characterId]) {
      spriteIndexes.value[characterId] = []
    }

    const existing = spriteIndexes.value[characterId].find(s => s.name === safeName)
    if (!existing) {
      const entry: SpriteEntry = { name: safeName, path: getSpriteKey(characterId, safeName) }
      spriteIndexes.value[characterId].push(entry)
      await dbSet(getSpriteIndexKey(characterId), spriteIndexes.value[characterId])
    }
  }

  async function removeSprite(characterId: string, name: string): Promise<void> {
    await fileDelete(getSpriteKey(characterId, name))

    if (spriteIndexes.value[characterId]) {
      spriteIndexes.value[characterId] = spriteIndexes.value[characterId].filter(s => s.name !== name)
      await dbSet(getSpriteIndexKey(characterId), spriteIndexes.value[characterId])
    }
  }

  async function importSpritesFromZip(characterId: string, zipFile: File): Promise<number> {
    try {
      const { default: JSZip } = await import('jszip')
      const zip = await JSZip.loadAsync(zipFile)
      let imported = 0

      for (const [filename, file] of Object.entries(zip.files)) {
        if (file.dir) continue
        if (!/\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(filename)) continue

        const blob = await file.async('blob')
        const name = filename.split('/').pop() || filename
        await addSprite(characterId, name, blob)
        imported++
      }

      return imported
    } catch (e) {
      console.error('Failed to import sprites from ZIP:', e)
      return 0
    }
  }

  async function importSpritesFromFiles(characterId: string, files: FileList | File[]): Promise<number> {
    let imported = 0
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await addSprite(characterId, file.name, file)
        imported++
      }
    }
    return imported
  }

  async function clearSprites(characterId: string): Promise<void> {
    const sprites = spriteIndexes.value[characterId] || []
    for (const sprite of sprites) {
      await fileDelete(getSpriteKey(characterId, sprite.name))
    }
    delete spriteIndexes.value[characterId]
    await dbSet(getSpriteIndexKey(characterId), null)
  }

  return {
    spriteIndexes,
    isLoaded,
    load,
    getSprites,
    getSpriteBlob,
    getSpriteUrl,
    addSprite,
    removeSprite,
    importSpritesFromZip,
    importSpritesFromFiles,
    clearSprites,
  }
})
