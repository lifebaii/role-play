<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div class="chat-card rounded-xl border border-theme-border w-full max-w-lg flex flex-col shadow-2xl overflow-hidden" style="max-height: min(85vh, calc(var(--vh, 1vh) * 85));">
      <div class="p-4 border-b border-theme-border flex justify-between items-center bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-[var(--theme-secondary)]/15 text-theme-text-accent rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-theme-text-primary">{{ editingData ? '编辑预设' : '新建预设' }}</h3>
            <p class="text-xs text-theme-text-secondary">Preset Editor</p>
          </div>
        </div>
        <button @click="close" class="text-theme-text-secondary hover:text-theme-text-primary p-1 rounded-md hover:bg-[var(--theme-card-hover)]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <label class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5">预设名称</label>
          <input v-model="localData.name" type="text"
            class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all"
            placeholder="例如：破限、角色扮演增强">
        </div>

        <div>
          <label class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5 flex justify-between">
            <span>预设内容</span>
            <span class="text-[10px] font-normal normal-case bg-[var(--theme-card-hover)] px-1.5 rounded text-theme-text-secondary">{{ (localData.prompt || '').length }} 字符</span>
          </label>
          <textarea v-model="localData.prompt" rows="10"
            class="w-full chat-input-field border border-theme-border rounded-xl px-4 py-3 text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none font-mono text-sm shadow-inner leading-relaxed resize-y min-h-[200px]"
            placeholder="输入预设内容..."></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5">排序顺序</label>
            <input v-model.number="localData.order" type="number"
              class="w-full chat-input-field border border-theme-border rounded-xl px-4 py-2.5 text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all"
              placeholder="100">
            <p class="text-[10px] text-theme-text-secondary mt-1">数字越小越靠前</p>
          </div>
          <div class="flex items-end">
            <label class="flex items-center space-x-2 cursor-pointer p-3 rounded-xl border transition-all select-none shadow-sm active:scale-95 w-full"
              :class="localData.enabled ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/30 text-theme-text-accent' : 'chat-card border-theme-border text-theme-text-secondary hover:border-[var(--theme-primary)]/30'">
              <input type="checkbox" v-model="localData.enabled" class="hidden">
              <div class="w-4 h-4 rounded flex items-center justify-center border transition-colors"
                :class="localData.enabled ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)]' : 'bg-[var(--theme-input-bg)] border-theme-border'">
                <svg v-if="localData.enabled" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span class="text-xs font-bold">启用预设</span>
            </label>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-theme-border flex justify-end space-x-3 bg-gradient-to-r from-[var(--theme-gradient-start)]/5 to-[var(--theme-gradient-end)]/5 flex-shrink-0">
        <button @click="close"
          class="px-5 py-2.5 chat-card hover:bg-[var(--theme-card-hover)] text-theme-text-primary border border-theme-border rounded-xl transition-all shadow-sm font-medium text-sm">
          取消
        </button>
        <button @click="handleSave"
          class="px-6 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] text-white rounded-xl transition-all shadow-md hover:shadow-lg font-bold text-sm flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          保存预设
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'

interface PresetData {
  name: string
  prompt: string
  enabled: boolean
  order: number
}

const props = defineProps<{
  visible: boolean
  editingData?: PresetData | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: PresetData): void
}>()

const localData = reactive<PresetData>({
  name: '',
  prompt: '',
  enabled: true,
  order: 100
})

watch(() => props.editingData, (newData) => {
  if (newData) {
    localData.name = newData.name || ''
    localData.prompt = newData.prompt || ''
    localData.enabled = newData.enabled ?? true
    localData.order = newData.order ?? 100
  } else {
    resetData()
  }
}, { immediate: true })

watch(() => props.visible, (visible) => {
  if (!visible && !props.editingData) {
    resetData()
  }
})

function resetData() {
  localData.name = ''
  localData.prompt = ''
  localData.enabled = true
  localData.order = 100
}

function close() {
  emit('update:visible', false)
}

function handleSave() {
  const data: PresetData = {
    name: localData.name,
    prompt: localData.prompt,
    enabled: localData.enabled,
    order: localData.order
  }
  emit('save', data)
  close()
}
</script>
