<template>
  <div class="min-h-screen bg-[var(--theme-bg-start)] py-6 sm:py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <div v-if="isEdit" class="mb-4 flex flex-wrap gap-2">
        <button
          @click="loadFromSource"
          :disabled="isLoadingSource || !sourceUrl"
          class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-light)] text-white rounded-xl hover:from-[var(--theme-accent-dark)] hover:to-[var(--theme-accent)] transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="isLoadingSource" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {{ isLoadingSource ? '加载中...' : '从源文件加载' }}
        </button>
        <button
          v-if="sourceUrl"
          @click="openSourceUrl"
          class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--theme-card-hover)] border border-theme-border text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] transition-all duration-200 font-medium text-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          查看源文件
        </button>
      </div>
      
      <CharacterForm
        ref="characterFormRef"
        :model-value="formData"
        :character-id="isEdit ? route.params.id as string : undefined"
        :is-edit="isEdit"
        :is-admin-mode="true"
        :show-admin-fields="true"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { readPngChunks, decodeBase64Utf8, normalizeCharacterData, writePngChunks } from '@/utils/characterImport'
import { charactersApi } from '@/api'
import CharacterForm from '@/components/CharacterForm.vue'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()

const isEdit = computed(() => !!route.params.id)
const isLoading = ref(false)
const isLoadingSource = ref(false)
const characterFormRef = ref<InstanceType<typeof CharacterForm> | null>(null)

const sourceUrl = ref<string | null>(null)
const sourceFileType = ref<'json' | 'png' | null>(null)
const sourceFile = ref<File | Blob | null>(null)

const formData = ref({
  name: '',
  description: '',
  avatar: '',
  first_mes: '',
  personality: '',
  scenario: '',
  system_prompt: '',
  creator_notes: '',
  temperature: 1,
  character_book: { entries: [] as any[] },
  regex_scripts: [] as any[],
  shared: false,
  tags: [] as string[]
})

function getCharacterId(character: any): string {
  return character?.role_play?.id || character?.id || ''
}

function getCharacterData(character: any): any {
  if (character?.data) {
    return character.data
  }
  return character
}

function getCharacterMeta(character: any): any {
  if (character?.role_play) {
    return character.role_play
  }
  return character
}

onMounted(async () => {
  adminStore.showSaveButton(handleSave)
  
  if (isEdit.value) {
    const characterId = route.params.id as string
    let character = adminStore.characters.find(c => getCharacterId(c) === characterId)
    
    if (character) {
      sourceUrl.value = (character as any).sourceUrl || null
    }
    
    if (!character) {
      try {
        const meta = await charactersApi.getMeta(characterId)
        sourceUrl.value = meta.sourceUrl
        sourceFileType.value = meta.file_type as 'json' | 'png' || null
      } catch (e) {
        console.error('Failed to get character meta:', e)
      }
    } else if (character) {
      try {
        const meta = await charactersApi.getMeta(characterId)
        sourceFileType.value = meta.file_type as 'json' | 'png' || null
      } catch (e) {
        console.error('Failed to get character meta:', e)
      }
    }
    
    if (sourceUrl.value) {
      await loadFromSource(true)
    } else {
      if (!character) {
        character = await adminStore.loadCharacterDetail(characterId)
      }
      
      if (character) {
        const data = getCharacterData(character)
        const meta = getCharacterMeta(character)
        
        formData.value = {
          name: data.name || '',
          description: data.description || '',
          avatar: data.avatar || '',
          first_mes: data.first_mes || data.greeting || '',
          greeting: data.first_mes || data.greeting || '',
          personality: data.personality || '',
          scenario: data.scenario || '',
          system_prompt: data.system_prompt || '',
          creator_notes: data.creator_notes || '',
          temperature: data.temperature ?? 1,
          character_book: data.character_book || { entries: data.world_info || [] },
          extensions: data.extensions || {},
          regex_scripts: data.extensions?.regex_scripts || [],
          shared: meta.shared || false,
          tags: data.tags || []
        }
        
        if (sourceFileType.value === 'png') {
          try {
            const { blob } = await charactersApi.getRaw(characterId)
            sourceFile.value = blob
          } catch (e) {
            console.error('Failed to load raw PNG file:', e)
          }
        }
      }
    }
  }
})

onUnmounted(() => {
  adminStore.hideSaveButton()
})

async function handleSave() {
  if (characterFormRef.value) {
    await handleSubmit(characterFormRef.value.form)
  }
}

async function handleSubmit(data: any) {
  try {
    isLoading.value = true
    
    const characterData = {
      name: data.name,
      description: data.description,
      avatar: data.avatar,
      first_mes: data.first_mes || data.greeting,
      greeting: data.first_mes || data.greeting,
      personality: data.personality,
      scenario: data.scenario,
      system_prompt: data.system_prompt,
      creator_notes: data.creator_notes,
      temperature: data.temperature ?? 1,
      character_book: data.character_book || { entries: data.world_info || [] },
      extensions: {
        ...data.extensions,
        regex_scripts: data.regex_scripts || []
      },
      tags: data.tags || []
    }
    
    if (isEdit.value) {
      const id = route.params.id as string
      
      if (sourceFileType.value === 'png' && sourceFile.value) {
        const buffer = await sourceFile.value.arrayBuffer()
        
        const dataToWrite = {
          spec: 'chara_card_v2',
          spec_version: '2.0',
          data: {
            ...characterData,
            avatar: undefined
          }
        }
        
        const pngBlob = await writePngChunks(buffer, dataToWrite)
        const pngFile = new File([pngBlob], `${id}.png`, { type: 'image/png' })
        await charactersApi.importFiles([pngFile], id)
      } else {
        const jsonBlob = new Blob([JSON.stringify(characterData, null, 2)], { type: 'application/json' })
        const jsonFile = new File([jsonBlob], `${id}.json`, { type: 'application/json' })
        await charactersApi.importFiles([jsonFile], id)
      }
      
      await adminStore.loadCharacters()
    } else {
      await adminStore.createCharacter({ data: characterData })
    }
    alert('保存成功')
    router.push('/admin/characters')
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  } finally {
    isLoading.value = false
  }
}

function handleCancel() {
  router.push('/admin/characters')
}

async function loadFromSource(silent: boolean = false) {
  if (!sourceUrl.value) {
    if (!silent) {
      alert('没有可用的源文件 URL')
    }
    return
  }
  
  isLoadingSource.value = true
  try {
    const response = await fetch(sourceUrl.value)
    
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`)
    }
    
    const contentType = response.headers.get('Content-Type') || ''
    const url = sourceUrl.value.toLowerCase()
    
    if (contentType.includes('image/') || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg')) {
      sourceFileType.value = 'png'
      const buffer = await response.arrayBuffer()
      
      const mimeType = contentType || 'image/png'
      const filename = url.split('/').pop() || 'character.png'
      sourceFile.value = new Blob([buffer], { type: mimeType })
      
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
          const normalized = normalizeCharacterData(charData)
          if (normalized && !Array.isArray(normalized)) {
            applyCharacterData(normalized)
            if (!silent) {
              alert('已从源文件加载数据')
            }
          } else if (!silent) {
            alert('无法解析角色数据')
          }
        } catch {
          if (!silent) {
            alert('解析角色数据失败')
          }
        }
      } else {
        applyCharacterData({
          data: {
            name: filename.replace(/\.[^/.]+$/, ''),
            description: '',
            avatar: '',
            first_mes: '',
            personality: '',
            scenario: '',
            system_prompt: '',
            creator_notes: '',
            temperature: 1,
            character_book: { entries: [] },
            regex_scripts: []
          }
        })
        if (!silent) {
          alert('已加载图片，但没有嵌入角色数据')
        }
      }
    } else {
      sourceFileType.value = 'json'
      const text = await response.text()
      let data
      
      if (text.trim().startsWith('{') && text.includes('\n')) {
        const lines = text.trim().split('\n')
        try {
          data = JSON.parse(lines[0])
        } catch {
          data = JSON.parse(text)
        }
      } else {
        data = JSON.parse(text)
      }
      
      const normalized = normalizeCharacterData(data)
      if (normalized && !Array.isArray(normalized)) {
        applyCharacterData(normalized)
        if (!silent) {
          alert('已从源文件加载数据')
        }
      } else if (Array.isArray(normalized)) {
        if (!silent) {
          alert('源文件包含多个角色，无法加载')
        }
      } else if (!silent) {
        alert('无法解析角色数据')
      }
    }
  } catch (e: any) {
    console.error('Failed to load from source:', e)
    if (!silent) {
      alert('加载源文件失败: ' + e.message)
    }
  } finally {
    isLoadingSource.value = false
  }
}

function applyCharacterData(data: any) {
  const charData = data.data || data
  
  formData.value = {
    name: charData.name || '',
    description: charData.description || '',
    avatar: charData.avatar || '',
    first_mes: charData.first_mes || charData.greeting || '',
    greeting: charData.first_mes || charData.greeting || '',
    personality: charData.personality || '',
    scenario: charData.scenario || '',
    system_prompt: charData.system_prompt || '',
    creator_notes: charData.creator_notes || '',
    temperature: charData.temperature ?? 1,
    character_book: charData.character_book || { entries: charData.world_info || [] },
    extensions: charData.extensions || {},
    regex_scripts: charData.extensions?.regex_scripts || charData.regex_scripts || [],
    shared: formData.value.shared,
    tags: charData.tags || []
  }
}

function openSourceUrl() {
  if (sourceUrl.value) {
    window.open(sourceUrl.value, '_blank')
  }
}
</script>
