<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-theme-text-primary mb-2">角色数据查看器</h2>
        <p class="text-theme-text-secondary">导入角色数据文件，查看原始 JSON 数据结构</p>
      </div>

      <div class="bg-[var(--theme-sidebar-bg)] border border-theme-border rounded-xl p-6 mb-6">
        <div class="flex items-center gap-4 mb-4">
          <label
            class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-md"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            <span>选择文件</span>
            <input
              type="file"
              accept=".json,.png"
              multiple
              @change="handleFileSelect"
              class="hidden"
            />
          </label>
          <span class="text-theme-text-secondary text-sm">支持 .json 和 .png 格式</span>
        </div>

        <div v-if="importedData.length > 0" class="flex items-center gap-2">
          <button
            @click="clearAll"
            class="px-4 py-2 bg-[var(--theme-danger-bg)] text-[var(--theme-danger)] rounded-xl hover:opacity-80 transition-opacity"
          >
            清空全部
          </button>
          <span class="text-theme-text-secondary text-sm">已加载 {{ importedData.length }} 个角色</span>
        </div>
      </div>

      <div v-if="importedData.length === 0" class="bg-[var(--theme-sidebar-bg)] border border-theme-border rounded-xl p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-theme-text-secondary opacity-50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p class="text-theme-text-secondary">请选择角色数据文件进行查看</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="(item, index) in importedData"
          :key="index"
          class="bg-[var(--theme-sidebar-bg)] border border-theme-border rounded-xl overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10 cursor-pointer"
            @click="toggleExpand(index)"
          >
            <div class="flex items-center gap-3">
              <img
                v-if="item.avatar"
                :src="item.avatar"
                class="w-10 h-10 rounded-lg object-cover"
                alt="avatar"
              />
              <div
                v-else
                class="w-10 h-10 rounded-lg bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center text-white font-bold"
              >
                {{ item.name?.charAt(0) || '?' }}
              </div>
              <div>
                <h3 class="font-semibold text-theme-text-primary">{{ item.name || 'Unknown Character' }}</h3>
                <p class="text-sm text-theme-text-secondary">
                  {{ item.spec || 'V1' }} · {{ item.data?.description?.substring(0, 50) || item.description?.substring(0, 50) || 'No description' }}{{ (item.data?.description?.length || item.description?.length || 0) > 50 ? '...' : '' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click.stop="copyToClipboard(item.rawData, index)"
                class="p-2 text-theme-text-secondary hover:text-theme-text-primary hover:bg-[var(--theme-primary)]/10 rounded-lg transition-all"
                :title="item.copied ? '已复制' : '复制 JSON'"
              >
                <svg v-if="!item.copied" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                <svg v-else class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </button>
              <button
                @click.stop="downloadJson(item.rawData, item.name)"
                class="p-2 text-theme-text-secondary hover:text-theme-text-primary hover:bg-[var(--theme-primary)]/10 rounded-lg transition-all"
                title="下载 JSON"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              </button>
              <svg
                class="w-5 h-5 text-theme-text-secondary transition-transform"
                :class="{ 'rotate-180': item.expanded }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          <div
            v-show="item.expanded"
            class="border-t border-theme-border"
          >
            <pre class="p-4 text-sm text-theme-text-primary overflow-auto max-h-[600px] bg-[var(--theme-bg-start)]"><code>{{ formatJson(item.rawData) }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ImportedItem {
  name: string
  avatar?: string
  description?: string
  spec?: string
  rawData: any
  expanded: boolean
  copied: boolean
}

const importedData = ref<ImportedItem[]>([])

async function decompressZlib(data: Uint8Array): Promise<string> {
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

async function readPngChunks(buffer: ArrayBuffer) {
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
              // skip failed decompression
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
            // skip failed decompression
          }
        }
      }
    }

    offset += 12 + length
  }

  return chunks
}

function decodeBase64Utf8(str: string) {
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

async function handleFileSelect(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files || files.length === 0) return

  for (const file of Array.from(files)) {
    try {
      let charData: any

      if (file.name.toLowerCase().endsWith('.png')) {
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

        if (!rawDataStr) {
          continue
        }

        charData = JSON.parse(decodeBase64Utf8(rawDataStr))
      } else {
        const text = await file.text()
        charData = JSON.parse(text)
      }

      if (Array.isArray(charData)) {
        for (const char of charData) {
          addItem(char)
        }
      } else {
        addItem(charData)
      }
    } catch (err) {
      console.error('Failed to parse file:', file.name, err)
    }
  }

  ;(event.target as HTMLInputElement).value = ''
}

function addItem(rawData: any) {
  const isV2 = rawData.spec === 'chara_card_v2' || rawData.spec === 'chara_card_v3' || !!rawData.data
  const data = isV2 && rawData.data ? rawData.data : rawData

  const item: ImportedItem = {
    name: data.name || data.char_name || 'Unknown Character',
    avatar: data.avatar || (isV2 && rawData.data?.avatar) || undefined,
    description: data.description || data.char_persona || '',
    spec: rawData.spec || 'V1',
    rawData: rawData,
    expanded: false,
    copied: false
  }

  importedData.value.push(item)
}

function toggleExpand(index: number) {
  importedData.value[index].expanded = !importedData.value[index].expanded
}

function formatJson(data: any): string {
  return JSON.stringify(data, null, 2)
}

function copyToClipboard(data: any, index: number) {
  const text = formatJson(data)
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      importedData.value[index].copied = true
      setTimeout(() => {
        importedData.value[index].copied = false
      }, 2000)
    }).catch(err => {
      console.error('Failed to copy:', err)
      fallbackCopy(text, index)
    })
  } else {
    fallbackCopy(text, index)
  }
}

function fallbackCopy(text: string, index: number) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  
  try {
    document.execCommand('copy')
    importedData.value[index].copied = true
    setTimeout(() => {
      importedData.value[index].copied = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  } finally {
    document.body.removeChild(textarea)
  }
}

function downloadJson(data: any, name: string) {
  const json = formatJson(data)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name || 'character'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function clearAll() {
  importedData.value = []
}
</script>
