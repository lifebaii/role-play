<template>
  <div v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div
        class="chat-card rounded-2xl border border-theme-border w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
      <div
          class="p-4 md:p-5 border-b border-theme-border flex justify-between items-center bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10 backdrop-blur-sm flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-[var(--theme-primary)]/15 text-theme-text-accent rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z">
              </path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-theme-text-primary leading-tight">编辑角色图片</h3>
            <p class="text-xs text-theme-text-secondary">Character Image Editor</p>
          </div>
        </div>
        <button @click="handleClose"
            class="text-theme-text-secondary hover:text-theme-text-primary hover:bg-[var(--theme-card-hover)] p-2 rounded-full transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[var(--theme-bg-start)]/30">
        <div class="text-center">
          <div 
              class="relative w-48 h-48 mx-auto rounded-xl border-2 border-dashed border-theme-border overflow-hidden bg-[var(--theme-card-hover)] flex items-center justify-center"
              :class="{ 'border-[var(--theme-primary)]': selectedFile || currentImage }"
          >
            <img 
                v-if="previewUrl" 
                :src="previewUrl" 
                class="w-full h-full object-cover"
                alt="预览图片"
            />
            <div v-else class="text-center p-4">
              <svg class="w-12 h-12 mx-auto text-theme-text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z">
                </path>
              </svg>
              <p class="text-sm text-theme-text-secondary">暂无图片</p>
            </div>
            
            <div v-if="isLoading" class="absolute inset-0 bg-black/50 flex items-center justify-center">
              <svg class="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-center gap-2 text-sm text-theme-text-secondary">
            <span class="px-2 py-1 rounded-lg text-xs font-medium"
                :class="sourceType === 'image' ? 'bg-[var(--theme-primary)]/10 text-theme-text-accent' : 'bg-[var(--theme-card-hover)]'">
              {{ sourceType === 'image' ? '图片源文件' : 'JSON 源文件' }}
            </span>
          </div>

          <div class="flex flex-col sm:flex-row gap-2">
            <label 
                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] transition-all cursor-pointer font-medium text-sm active:scale-95"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
              {{ sourceType === 'image' ? '替换图片' : '上传图片' }}
              <input 
                  type="file" 
                  accept="image/*"
                  class="hidden"
                  @change="handleFileSelect"
              />
            </label>
            
            <button 
                v-if="selectedFile"
                @click="clearSelection"
                class="px-4 py-3 text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] border border-[var(--theme-danger)]/30 rounded-xl transition-all font-medium text-sm active:scale-95"
            >
              清除选择
            </button>
          </div>

          <p v-if="selectedFile" class="text-xs text-center text-theme-text-secondary">
            已选择: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
          </p>

          <div class="bg-[var(--theme-card-hover)] rounded-xl p-3 text-xs text-theme-text-secondary space-y-1">
            <p class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-[var(--theme-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              图片将自动转换为 PNG 格式
            </p>
            <p class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-[var(--theme-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              角色数据将嵌入图片保存
            </p>
          </div>
        </div>
      </div>

      <div
          class="p-4 md:p-5 border-t border-theme-border flex justify-end space-x-3 bg-gradient-to-r from-[var(--theme-gradient-start)]/5 to-[var(--theme-gradient-end)]/5 backdrop-blur-sm flex-shrink-0">
        <button @click="handleClose"
            class="px-5 py-2.5 chat-card hover:bg-[var(--theme-card-hover)] text-theme-text-primary border border-theme-border rounded-xl transition-all shadow-sm font-medium text-sm active:scale-95">
          取消
        </button>
        <button @click="handleSave"
            :disabled="!selectedFile || isSaving"
            class="px-6 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] text-white rounded-xl transition-all shadow-md hover:shadow-lg font-bold text-sm active:scale-95 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
          <svg v-if="isSaving" class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {{ isSaving ? '保存中...' : '保存图片' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { getCharacterSourceType, getCharacterBlob } from '@/utils/localFriendStorage'

const props = defineProps<{
  visible: boolean
  characterId?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', file: File): void
}>()

const sourceType = ref<'image' | 'json'>('json')
const currentImage = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)

watch(() => props.visible, async (newVisible) => {
  if (newVisible && props.characterId) {
    await loadCurrentImage()
  } else if (!newVisible) {
    resetState()
  }
})

async function loadCurrentImage() {
  if (!props.characterId) return
  
  isLoading.value = true
  try {
    sourceType.value = await getCharacterSourceType(props.characterId)
    
    if (sourceType.value === 'image') {
      const blob = await getCharacterBlob(props.characterId)
      if (blob) {
        currentImage.value = URL.createObjectURL(blob)
        previewUrl.value = currentImage.value
      }
    }
  } catch (error) {
    console.error('加载角色图片失败:', error)
  } finally {
    isLoading.value = false
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (file) {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }
    
    selectedFile.value = file
    
    if (previewUrl.value && previewUrl.value !== currentImage.value) {
      URL.revokeObjectURL(previewUrl.value)
    }
    previewUrl.value = URL.createObjectURL(file)
  }
  
  input.value = ''
}

function clearSelection() {
  selectedFile.value = null
  
  if (previewUrl.value && previewUrl.value !== currentImage.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  
  previewUrl.value = currentImage.value
}

async function convertImageToPng(file: File): Promise<File> {
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
          const pngFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.png'), { type: 'image/png' })
          resolve(pngFile)
        } else {
          reject(new Error('Failed to convert image to PNG'))
        }
      }, 'image/png')
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

async function handleSave() {
  if (!selectedFile.value || !props.characterId) return
  
  isSaving.value = true
  try {
    let fileToSave = selectedFile.value
    
    // 如果图片不是 PNG，转换为 PNG
    if (selectedFile.value.type !== 'image/png') {
      fileToSave = await convertImageToPng(selectedFile.value)
    }
    
    emit('save', fileToSave)
    emit('update:visible', false)
  } catch (error) {
    console.error('保存角色图片失败:', error)
    alert('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}

function resetState() {
  if (currentImage.value) {
    URL.revokeObjectURL(currentImage.value)
  }
  if (previewUrl.value && previewUrl.value !== currentImage.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  
  currentImage.value = null
  selectedFile.value = null
  previewUrl.value = null
  sourceType.value = 'json'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>
