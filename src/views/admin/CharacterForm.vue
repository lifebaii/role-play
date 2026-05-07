<template>
  <div class="min-h-screen bg-[var(--theme-bg-start)] py-6 sm:py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <div v-if="isEdit" class="mb-4 flex flex-wrap gap-2 items-center">
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
        
        <div class="flex items-center gap-2 ml-auto">
          <select
            v-model="selectedModelId"
            class="px-3 py-2 bg-[var(--theme-card-hover)] border border-theme-border rounded-xl text-theme-text-primary text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
          >
            <option value="">选择模型</option>
            <option v-for="model in availableModels" :key="model.id" :value="model.id">
              {{ model.name }}
            </option>
          </select>
          
          <button
            @click="showOptimizeModal = true"
            :disabled="isOptimizing"
            class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="isOptimizing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {{ isOptimizing ? '优化中...' : '优化角色数据' }}
          </button>
        </div>
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
    
    <div
      v-if="showOptimizeModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="showOptimizeModal = false"
    >
      <div class="chat-card rounded-2xl shadow-2xl max-w-md w-full p-6 border border-theme-border">
        <h3 class="text-lg font-semibold text-theme-text-primary mb-4">选择优化方案</h3>
        <div class="space-y-2">
          <button
            v-for="preset in optimizationPresets"
            :key="preset.name"
            @click="handleOptimize(preset)"
            class="w-full px-4 py-3 text-left bg-[var(--theme-card-hover)] border border-theme-border rounded-xl hover:border-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 transition-all duration-200"
          >
            <span class="font-medium text-theme-text-primary">{{ preset.name }}</span>
          </button>
        </div>
        <button
          @click="showOptimizeModal = false"
          class="mt-4 w-full px-4 py-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { extractCharacterFromPng, normalizeCharacterData, writePngChunks } from '@/utils/characterImport'
import { charactersApi, modelsApi, adminApi, optimizationPresetsApi, type OptimizationPreset } from '@/api'
import CharacterForm from '@/components/CharacterForm.vue'
import { useDialog } from '@/composables/useDialog'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const { showSuccessAlert, showErrorAlert, showAlert } = useDialog()

const isEdit = computed(() => !!route.params.id)
const isLoading = ref(false)
const isLoadingSource = ref(false)
const characterFormRef = ref<InstanceType<typeof CharacterForm> | null>(null)

const sourceUrl = ref<string | null>(null)
const sourceFileType = ref<'json' | 'png' | null>(null)
const sourceFile = ref<File | Blob | null>(null)
const sourceJsonData = ref<any | null>(null)

const availableModels = ref<{ id: string; name: string }[]>([])
const selectedModelId = ref<string>('')
const showOptimizeModal = ref(false)
const isOptimizing = ref(false)

const optimizationPresets = ref<OptimizationPreset[]>([])

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
  
  try {
    const result = await modelsApi.listUniqueAdmin()
    availableModels.value = result.models || []
    
    const savedModelId = localStorage.getItem('admin_optimize_model_id')
    if (savedModelId && availableModels.value.some(m => m.id === savedModelId)) {
      selectedModelId.value = savedModelId
    }
    
    // 加载优化预设
    try {
      optimizationPresets.value = await optimizationPresetsApi.list()
    } catch (err) {
      console.error('Failed to load optimization presets:', err)
    }
  } catch (e) {
    console.error('Failed to load models:', e)
  }
  
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
        } else if (sourceFileType.value === 'json') {
          try {
            const { blob } = await charactersApi.getRaw(characterId)
            const text = await blob.text()
            sourceJsonData.value = JSON.parse(text)
          } catch (e) {
            console.error('Failed to load raw JSON file:', e)
          }
        }
      }
    }
  }
})

onUnmounted(() => {
  adminStore.hideSaveButton()
})

watch(selectedModelId, (newId) => {
  if (newId) {
    localStorage.setItem('admin_optimize_model_id', newId)
  }
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
    
    const removeRolePlay = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj
      const { role_play, ...rest } = obj
      return rest
    }
    
    if (isEdit.value) {
      const id = route.params.id as string
      
      if (sourceFileType.value === 'png' && sourceFile.value) {
        const buffer = await sourceFile.value.arrayBuffer()
        const { data: cardData } = await extractCharacterFromPng(buffer)
        
        const dataToWrite = removeRolePlay({
          ...cardData,
          data: {
            ...removeRolePlay(cardData.data || {}),
            ...characterData
          }
        })
        
        const pngBlob = await writePngChunks(buffer, dataToWrite)
        const pngFile = new File([pngBlob], `${id}.png`, { type: 'image/png' })
        await charactersApi.importFilesAdmin([pngFile], id)
      } else {
        const originalData = sourceJsonData.value || {}
        
        const dataToWrite = removeRolePlay({
          ...originalData,
          data: {
            ...removeRolePlay(originalData.data || {}),
            ...characterData
          }
        })
        
        const jsonBlob = new Blob([JSON.stringify(dataToWrite, null, 2)], { type: 'application/json' })
        const jsonFile = new File([jsonBlob], `${id}.json`, { type: 'application/json' })
        await charactersApi.importFilesAdmin([jsonFile], id)
      }
      
      await adminStore.loadCharacters()
    } else {
      if (characterData.avatar && characterData.avatar.startsWith('data:image')) {
        const base64Data = characterData.avatar.split(',')[1]
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const imageBuffer = bytes.buffer
        
        const dataToWrite = removeRolePlay({
          spec: 'chara_card_v2',
          spec_version: '2.0',
          data: {
            ...characterData,
            avatar: undefined
          }
        })
        
        const pngBlob = await writePngChunks(imageBuffer, dataToWrite)
        const pngFile = new File([pngBlob], `${characterData.name || 'character'}.png`, { type: 'image/png' })
        await charactersApi.importFilesAdmin([pngFile])
      } else {
        const dataToWrite = removeRolePlay({
          spec: 'chara_card_v2',
          spec_version: '2.0',
          data: characterData
        })
        
        const jsonBlob = new Blob([JSON.stringify(dataToWrite, null, 2)], { type: 'application/json' })
        const jsonFile = new File([jsonBlob], `${characterData.name || 'character'}.json`, { type: 'application/json' })
        await charactersApi.importFilesAdmin([jsonFile])
      }
    }
    await showSuccessAlert('保存成功')
    router.push('/admin/characters')
  } catch (e: any) {
    await showErrorAlert('保存失败: ' + e.message)
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
      await showErrorAlert('没有可用的源文件 URL')
    }
    return
  }
  
  isLoadingSource.value = true
  try {
    const response = await fetch(sourceUrl.value, { cache: 'no-store' })
    
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
      
      const result = await extractCharacterFromPng(buffer)
      
      if (result.success && result.data) {
        applyCharacterData(result.data)
        if (!silent) {
          await showSuccessAlert('已从源文件加载数据')
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
          if (result.error) {
            await showAlert('已加载图片，但没有嵌入角色数据')
          } else {
            await showErrorAlert(result.error || '无法解析角色数据')
          }
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
          await showSuccessAlert('已从源文件加载数据')
        }
      } else if (Array.isArray(normalized)) {
        if (!silent) {
          await showErrorAlert('源文件包含多个角色，无法加载')
        }
      } else if (!silent) {
        await showErrorAlert('无法解析角色数据')
      }
    }
  } catch (e: any) {
    console.error('Failed to load from source:', e)
    if (!silent) {
      await showErrorAlert('加载源文件失败: ' + e.message)
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

async function handleOptimize(preset: typeof optimizationPresets[0]) {
  // 优先使用选择的模型，没选择才用预设配置的模型
  const modelToUse = selectedModelId.value || preset.model_id
  
  showOptimizeModal.value = false
  isOptimizing.value = true
  
  let lastAccumulatedContent = ''
  let hasPartialResult = false
  
  try {
    for await (const chunk of adminApi.optimizeCharacterStream({
      characterData: formData.value,
      optimizationType: preset,
      modelId: modelToUse
    })) {
      if (chunk.content) {
        lastAccumulatedContent += chunk.content
      }
      if (chunk.accumulated) {
        lastAccumulatedContent = chunk.accumulated
      }
      if (chunk.partialResult) {
        hasPartialResult = true
      }
    }
    
    let jsonStr = lastAccumulatedContent.trim()
    
    if (jsonStr.startsWith('```')) {
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim()
      }
    }
    
    if (!jsonStr.startsWith('{')) {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }
    }
    
    const optimizedData = JSON.parse(jsonStr)
    
    formData.value = {
      ...formData.value,
      ...optimizedData,
      character_book: optimizedData.character_book || formData.value.character_book || { entries: [] },
      regex_scripts: optimizedData.regex_scripts || formData.value.regex_scripts || [],
      tags: optimizedData.tags || formData.value.tags || []
    }
    
    if (hasPartialResult) {
      await showAlert('优化过程中遇到问题，但已保存部分结果！')
    } else {
      await showSuccessAlert('优化成功！')
    }
  } catch (e: any) {
    console.error('Optimization failed:', e)
    
    // 如果有部分结果，尝试解析并应用
    if (lastAccumulatedContent) {
      try {
        let jsonStr = lastAccumulatedContent.trim()
        
        if (jsonStr.startsWith('```')) {
          const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim()
          }
        }
        
        if (!jsonStr.startsWith('{')) {
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            jsonStr = jsonMatch[0]
          }
        }
        
        const optimizedData = JSON.parse(jsonStr)
        
        formData.value = {
          ...formData.value,
          ...optimizedData,
          character_book: optimizedData.character_book || formData.value.character_book || { entries: [] },
          regex_scripts: optimizedData.regex_scripts || formData.value.regex_scripts || [],
          tags: optimizedData.tags || formData.value.tags || []
        }
        
        await showAlert('优化失败，但已保存部分结果！错误: ' + (e.message || '未知错误'))
        return
      } catch (parseError) {
        console.error('Failed to parse partial result:', parseError)
      }
    }
    
    await showErrorAlert('优化失败: ' + (e.message || '未知错误'))
  } finally {
    isOptimizing.value = false
  }
}
</script>
