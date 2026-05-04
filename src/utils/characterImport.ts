/**
 * @deprecated Use NormalizedCharacter instead
 */
export interface ImportedCharacter {
  name: string
  description?: string
  avatar?: string
  first_mes?: string
  personality?: string
  scenario?: string
  system_prompt?: string
  creator_notes?: string
  temperature?: number
  world_info?: any[]
  regex_scripts?: any[]
  spec?: string
  spec_version?: number
  creator?: string
  character_version?: string
  tags?: string[]
  [key: string]: any
}

export interface ImportResult {
  characters: NormalizedCharacter[]
  imageFiles: File[]
  pngFilesWithData: { file: File; data: NormalizedCharacter }[]
  failCount: number
}

function generateUUID(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch (e) {
    console.warn('crypto.randomUUID failed, using fallback:', e)
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export async function decompressZlib(data: Uint8Array): Promise<string> {
  const cs = new DecompressionStream('deflate')
  const writer = cs.writable.getWriter()
  writer.write(data as unknown as BufferSource)
  writer.close()
  const reader = cs.readable.getReader()
  const parts: Uint8Array[] = []
  let totalLen = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    parts.push(value)
    totalLen += value.length
  }
  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return new TextDecoder().decode(result)
}

export async function readPngChunks(buffer: ArrayBuffer): Promise<Record<string, string>> {
  const view = new DataView(buffer)
  const chunks: Record<string, string> = {}
  let offset = 8

  while (offset < view.byteLength) {
    if (offset + 8 > view.byteLength) break

    const length = view.getUint32(offset)
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7)
    )

    if (offset + 12 + length > view.byteLength) break

    if (type === 'tEXt') {
      const data = new Uint8Array(buffer, offset + 8, length)
      let splitIndex = -1
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          splitIndex = i
          break
        }
      }
      if (splitIndex !== -1) {
        const key = new TextDecoder().decode(data.slice(0, splitIndex))
        const value = new TextDecoder().decode(data.slice(splitIndex + 1))
        chunks[key] = value
      }
    } else if (type === 'iTXt') {
      const data = new Uint8Array(buffer, offset + 8, length)
      let p = 0
      while (p < data.length && data[p] !== 0) p++
      const keyword = new TextDecoder().decode(data.slice(0, p))
      p++
      if (p + 2 <= data.length) {
        const compressionFlag = data[p]
        p++
        const compressionMethod = data[p]
        p++
        while (p < data.length && data[p] !== 0) p++
        p++
        while (p < data.length && data[p] !== 0) p++
        p++
        if (p < data.length) {
          if (compressionFlag === 0) {
            chunks[keyword] = new TextDecoder().decode(data.slice(p))
          } else if (compressionFlag === 1 && compressionMethod === 0) {
            try {
              chunks[keyword] = await decompressZlib(data.slice(p))
            } catch {
            }
          }
        }
      }
    } else if (type === 'zTXt') {
      const data = new Uint8Array(buffer, offset + 8, length)
      let p = 0
      while (p < data.length && data[p] !== 0) p++
      const keyword = new TextDecoder().decode(data.slice(0, p))
      p++
      if (p < data.length) {
        const compressionMethod = data[p]
        p++
        if (compressionMethod === 0) {
          try {
            chunks[keyword] = await decompressZlib(data.slice(p))
          } catch {
          }
        }
      }
    }

    offset += 12 + length
  }

  return chunks
}

export function decodeBase64Utf8(str: string): string {
  try {
    const binaryString = atob(str)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return str
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function fileToDataUrl(file: File, arrayBuffer?: ArrayBuffer): string {
  const buffer = arrayBuffer || file.arrayBuffer
  const base64 = arrayBufferToBase64(arrayBuffer as ArrayBuffer)
  const mimeType = file.type || 'image/png'
  return `data:${mimeType};base64,${base64}`
}

export async function parseCharacterFromPng(file: File): Promise<{ data: any | null; hasEmbeddedData: boolean }> {
  const buffer = await file.arrayBuffer()
  const chunks = await readPngChunks(buffer)

  let rawDataStr = chunks['chara'] || chunks['character'] || ''

  if (!rawDataStr) {
    for (const key of Object.keys(chunks)) {
      try {
        const parsed = JSON.parse(chunks[key])
        if (parsed.spec || parsed.data) {
          rawDataStr = chunks[key]
          break
        }
      } catch {
        continue
      }
    }
  }

  if (rawDataStr) {
    try {
      const charData = JSON.parse(decodeBase64Utf8(rawDataStr))
      return { data: charData, hasEmbeddedData: true }
    } catch {
      return { data: null, hasEmbeddedData: false }
    }
  }

  return { data: null, hasEmbeddedData: false }
}

export function createCharacterFromImage(file: File, arrayBuffer?: ArrayBuffer): NormalizedCharacter {
  const buffer = arrayBuffer ? arrayBuffer : null
  const base64 = buffer ? arrayBufferToBase64(buffer) : ''
  const mimeType = file.type || 'image/png'
  const dataUrl = `data:${mimeType};base64,${base64}`

  const newId = generateUUID()

  return {
    data: {
      name: file.name.replace(/\.[^/.]+$/, ''),
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
    },
    role_play: {
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      shared: false
    }
  }
}

export interface NormalizedCharacter {
  data: any
  role_play: {
    id?: string
    createdAt?: number
    updatedAt?: number
    originalId?: string
    shared?: boolean
  },
  spec?: string,
  spec_version?: string
}

export function normalizeCharacterData(charData: any): NormalizedCharacter | NormalizedCharacter[] | null {
  if (Array.isArray(charData)) {
    return charData.map(c => normalizeSingleCharacter(c))
  }

  if (charData) {
    return normalizeSingleCharacter(charData)
  }

  return null
}

// 导入数据格式化处理
function normalizeSingleCharacter(charData: any): NormalizedCharacter {
  // const isV2 = charData.spec === 'chara_card_v2' || charData.spec === 'chara_card_v3' || !!charData.data
  // const data = isV2 && charData.data ? charData.data : charData

  const role_play = {
    id: generateUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    originalId: '',
    shared: false
  }

  let res: NormalizedCharacter | any = {}
  if (charData.data) {
    res = {
      ...charData,
      role_play
    }
  } else if (charData.name) {
    res = {
      data: charData,
      role_play
    }
  }

  if (res.data && res.data.greeting && !res.data.first_mes) {
    res.data.first_mes = res.data.greeting
    delete res.data.greeting
  }

  if (res.data && res.data.world_info && !res.data.character_book) {
    res.data.character_book = { entries: res.data.world_info }
    delete res.data.world_info
  }

  if (Array.isArray(res.data.regex_scripts)) {
    if (!res.data.extensions) {
      res.data.extensions = {};
    }
    if (!Array.isArray(res.data.extensions.regex_scripts)) {
      res.data.extensions.regex_scripts = res.data.regex_scripts;
      delete res.data.regex_scripts;
    }
  }

  return res as NormalizedCharacter
}

export async function importCharactersFromFiles(files: FileList | File[]): Promise<ImportResult> {
  const allCharactersToImport: NormalizedCharacter[] = []
  const imageFilesToImport: File[] = []
  const pngFilesWithData: { file: File; data: NormalizedCharacter }[] = []
  let failCount = 0

  for (const file of Array.from(files)) {
    console.log(`[Import] Processing file: ${file.name}, type: ${file.type}`)

    try {
      if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.png')) {
        const buffer = await file.arrayBuffer()
        const { data: charData, hasEmbeddedData } = await parseCharacterFromPng(file)

        if (hasEmbeddedData && charData) {
          console.log(`[Import] Found embedded data in image file`)
          const normalized = normalizeCharacterData(charData)

          if (Array.isArray(normalized)) {
            allCharactersToImport.push(...normalized)
          } else if (normalized) {
            pngFilesWithData.push({ file, data: normalized })
            allCharactersToImport.push(normalized)
          } else {
            failCount++
          }
        } else {
          console.log(`[Import] No embedded data, treating as pure image`)
          imageFilesToImport.push(file)
        }
      } else {
        const text = await file.text()
        const charData = JSON.parse(text)
        const normalized = normalizeCharacterData(charData)

        if (Array.isArray(normalized)) {
          allCharactersToImport.push(...normalized)
        } else if (normalized) {
          allCharactersToImport.push(normalized)
        } else {
          failCount++
        }
      }
    } catch (e) {
      console.error(`[Import] Failed to process file: ${file.name}`, e)
      failCount++
    }
  }

  console.log(`[Import] Summary: ${allCharactersToImport.length} characters, ${imageFilesToImport.length} pure images, ${pngFilesWithData.length} PNGs with data`)

  return {
    characters: allCharactersToImport,
    imageFiles: imageFilesToImport,
    pngFilesWithData,
    failCount
  }
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF
  const table = new Int32Array(256)

  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      if (c & 1) {
        c = 0xEDB88320 ^ (c >>> 1)
      } else {
        c = c >>> 1
      }
    }
    table[i] = c
  }

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8)
  }

  return (crc ^ 0xFFFFFFFF) >>> 0
}

function createPngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type)
  const length = data.length
  const chunk = new Uint8Array(12 + length)
  const view = new DataView(chunk.buffer)

  view.setUint32(0, length)
  chunk[4] = typeBytes[0]
  chunk[5] = typeBytes[1]
  chunk[6] = typeBytes[2]
  chunk[7] = typeBytes[3]
  chunk.set(data, 8)

  const crcData = new Uint8Array(4 + length)
  crcData.set(typeBytes, 0)
  crcData.set(data, 4)
  const crcValue = crc32(crcData)
  view.setUint32(8 + length, crcValue)

  return chunk
}

function extractPngChunksRaw(buffer: ArrayBuffer): { type: string; data: Uint8Array; offset: number }[] {
  const view = new DataView(buffer)
  const chunks: { type: string; data: Uint8Array; offset: number }[] = []
  let offset = 8

  while (offset < view.byteLength) {
    if (offset + 8 > view.byteLength) break
    const length = view.getUint32(offset)
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7)
    )
    if (offset + 12 + length > view.byteLength) break
    const data = new Uint8Array(buffer, offset + 8, length)
    chunks.push({ type, data, offset })
    offset += 12 + length
  }

  return chunks
}

export async function writePngChunks(
  imageBuffer: ArrayBuffer,
  characterData: any
): Promise<Blob> {
  const chunks = extractPngChunksRaw(imageBuffer)

  const filteredChunks = chunks.filter(c =>
    c.type !== 'tEXt' || !['chara', 'ccv3'].some(k => {
      const keyBytes = new TextEncoder().encode(k)
      return c.data.length > keyBytes.length && keyBytes.every((b, i) => c.data[i] === b)
    })
  )

  const charaJson = JSON.stringify(characterData)
  const charaBase64 = btoa(
    new TextEncoder().encode(charaJson).reduce((acc, b) => acc + String.fromCharCode(b), '')
  )

  const keyword = 'chara'
  const keywordBytes = new TextEncoder().encode(keyword)
  const valueBytes = new TextEncoder().encode(charaBase64)
  const textData = new Uint8Array(keywordBytes.length + 1 + valueBytes.length)
  textData.set(keywordBytes, 0)
  textData[keywordBytes.length] = 0
  textData.set(valueBytes, keywordBytes.length + 1)

  const charaChunk = createPngChunk('tEXt', textData)

  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrChunk = filteredChunks.find(c => c.type === 'IHDR')
  if (!ihdrChunk) throw new Error('Invalid PNG: no IHDR chunk')

  const ihdrRaw = new Uint8Array(12 + ihdrChunk.data.length)
  const ihdrView = new DataView(ihdrRaw.buffer)
  ihdrView.setUint32(0, ihdrChunk.data.length)
  const ihdrType = new TextEncoder().encode('IHDR')
  ihdrRaw[4] = ihdrType[0]
  ihdrRaw[5] = ihdrType[1]
  ihdrRaw[6] = ihdrType[2]
  ihdrRaw[7] = ihdrType[3]
  ihdrRaw.set(ihdrChunk.data, 8)
  const ihdrCrcData = new Uint8Array(4 + ihdrChunk.data.length)
  ihdrCrcData.set(ihdrType, 0)
  ihdrCrcData.set(ihdrChunk.data, 4)
  ihdrView.setUint32(8 + ihdrChunk.data.length, crc32(ihdrCrcData))

  const otherChunks = filteredChunks.filter(c => c.type !== 'IHDR')

  const parts: Uint8Array[] = [signature, ihdrRaw, charaChunk]
  for (const chunk of otherChunks) {
    const raw = new Uint8Array(12 + chunk.data.length)
    const rawView = new DataView(raw.buffer)
    rawView.setUint32(0, chunk.data.length)
    const typeBytes = new TextEncoder().encode(chunk.type)
    raw[4] = typeBytes[0]
    raw[5] = typeBytes[1]
    raw[6] = typeBytes[2]
    raw[7] = typeBytes[3]
    raw.set(chunk.data, 8)
    const crcData = new Uint8Array(4 + chunk.data.length)
    crcData.set(typeBytes, 0)
    crcData.set(chunk.data, 4)
    rawView.setUint32(8 + chunk.data.length, crc32(crcData))
    parts.push(raw)
  }

  return new Blob(parts, { type: 'image/png' })
}

export async function exportCharacterAsPng(character: NormalizedCharacter): Promise<Blob | null> {
  const avatarData = character.data?.avatar
  if (!avatarData) return null

  let imageBuffer: ArrayBuffer

  if (avatarData.startsWith('data:')) {
    const base64 = avatarData.split(',')[1]
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    imageBuffer = bytes.buffer
  } else {
    return null
  }

  const exportData = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      ...character.data,
      avatar: undefined,
    }
  }

  return writePngChunks(imageBuffer, exportData)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportCharacterAsJson(character: NormalizedCharacter): Promise<void> {
  const exportData = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      ...character.data,
      avatar: undefined,
    }
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `${character.data?.name || 'character'}.json`)
}
