<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div class="chat-card rounded-xl border border-theme-border w-full max-w-lg flex flex-col shadow-2xl overflow-hidden" style="max-height: min(85vh, calc(var(--vh, 1vh) * 85));">
      <div class="p-4 border-b border-theme-border flex justify-between items-center bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10 flex-shrink-0">
        <h3 class="text-lg font-bold text-theme-text-primary">{{ editingData ? '编辑正则脚本' : '新建正则脚本' }}</h3>
        <button @click="close" class="text-theme-text-secondary hover:text-theme-text-primary p-1 rounded-md hover:bg-[var(--theme-card-hover)]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <label class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5">脚本名称</label>
          <input v-model="localData.name" type="text"
            class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all"
            placeholder="例如：去除多余空行">
        </div>

        <div>
          <label class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5">正则表达式 (Regex)</label>
          <input v-model="localData.regex" type="text"
            class="w-full chat-input-field border border-theme-border rounded-xl px-4 py-2.5 text-theme-text-primary font-mono text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all"
            placeholder="pattern">
        </div>

        <div>
          <label class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5">替换内容 (Replacement)</label>
          <textarea v-model="localData.replacement" rows="6"
            class="w-full chat-input-field border border-theme-border rounded-xl px-4 py-2.5 text-theme-text-primary font-mono text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all resize-y min-h-[120px]"
            placeholder="支持 $1, $2 等捕获组引用"></textarea>
        </div>

        <div class="border border-theme-border rounded-xl chat-card overflow-hidden">
          <details class="group">
            <summary class="flex items-center justify-between p-4 cursor-pointer bg-[var(--theme-card-hover)] hover:bg-[var(--theme-sidebar-hover)] transition-colors select-none">
              <span class="text-sm font-bold text-theme-text-primary flex items-center">
                <svg class="w-4 h-4 mr-2 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                </svg>
                高级选项 (生效位置、深度、模式)
              </span>
              <svg class="w-5 h-5 text-theme-text-secondary group-open:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </summary>
            <div class="p-5 border-t border-theme-border space-y-5 bg-[var(--theme-bg-start)]/30">
              <div>
                <label class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-2">生效位置</label>
                <div class="flex gap-3">
                  <label v-for="(label, val) in {1: 'User (用户)', 2: 'AI (角色)'}" :key="val"
                    :class="['flex-1 flex items-center space-x-2 cursor-pointer p-2 rounded-xl border transition-all select-none',
                               localData.placement && localData.placement.includes(Number(val)) ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/30 text-theme-text-accent' : 'chat-card border-theme-border text-theme-text-secondary hover:border-[var(--theme-primary)]/30']">
                    <input type="checkbox"
                      :checked="localData.placement && localData.placement.includes(Number(val))"
                      @change="togglePlacement(Number(val))" class="hidden">
                    <div class="w-4 h-4 rounded flex items-center justify-center border"
                      :class="localData.placement && localData.placement.includes(Number(val)) ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)]' : 'bg-[var(--theme-input-bg)] border-theme-border'">
                      <svg v-if="localData.placement && localData.placement.includes(Number(val))" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span class="text-xs font-bold">{{ label }}</span>
                  </label>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <label v-for="(label, key) in {markdownOnly: '仅 Markdown', promptOnly: '仅 Prompt'}" :key="key"
                  :class="['flex items-center space-x-2 cursor-pointer p-2 rounded-xl border transition-all select-none',
                             localData[key] ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/30 text-theme-text-accent' : 'chat-card border-theme-border text-theme-text-secondary hover:border-[var(--theme-primary)]/30']">
                  <input type="checkbox" v-model="localData[key]" class="hidden">
                  <div class="w-4 h-4 rounded flex items-center justify-center border"
                    :class="localData[key] ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)]' : 'bg-[var(--theme-input-bg)] border-theme-border'">
                    <svg v-if="localData[key]" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span class="text-xs font-bold">{{ label }}</span>
                </label>
              </div>

              <div class="grid grid-cols-2 gap-4 pt-2 border-t border-theme-border">
                <div>
                  <label class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5">最小深度</label>
                  <input v-model.number="localData.minDepth" type="number"
                    class="w-full chat-input-field border border-theme-border rounded-xl px-3 py-2 text-sm text-theme-text-primary focus:ring-4 focus:ring-[var(--theme-primary)]/10 focus:border-[var(--theme-primary)] focus:outline-none transition-all"
                    placeholder="无限制">
                </div>
                <div>
                  <label class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5">最大深度</label>
                  <input v-model.number="localData.maxDepth" type="number"
                    class="w-full chat-input-field border border-theme-border rounded-xl px-3 py-2 text-sm text-theme-text-primary focus:ring-4 focus:ring-[var(--theme-primary)]/10 focus:border-[var(--theme-primary)] focus:outline-none transition-all"
                    placeholder="无限制">
                </div>
              </div>
            </div>
          </details>
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
          保存脚本
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'

const props = defineProps<{
  visible: boolean
  editingData?: any
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: any): void
}>()

const localData = reactive({
  name: '',
  regex: '',
  replacement: '',
  flags: 'g',
  promptOnly: false,
  markdownOnly: false,
  placement: [1, 2] as number[],
  minDepth: undefined as number | undefined,
  maxDepth: undefined as number | undefined
})

watch(() => props.editingData, (newData) => {
  if (newData) {
    localData.name = newData.name || newData.scriptName || ''
    localData.regex = newData.regex || newData.findRegex || ''
    localData.replacement = newData.replacement || newData.replaceString || ''
    localData.flags = newData.flags || 'g'
    localData.promptOnly = newData.promptOnly || false
    localData.markdownOnly = newData.markdownOnly || false
    localData.placement = newData.placement ? [...newData.placement] : [1, 2]
    localData.minDepth = newData.minDepth
    localData.maxDepth = newData.maxDepth
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
  localData.regex = ''
  localData.replacement = ''
  localData.flags = 'g'
  localData.promptOnly = false
  localData.markdownOnly = false
  localData.placement = [1, 2]
  localData.minDepth = undefined
  localData.maxDepth = undefined
}

function togglePlacement(val: number) {
  const idx = localData.placement.indexOf(val)
  if (idx === -1) {
    localData.placement.push(val)
  } else {
    localData.placement.splice(idx, 1)
  }
}

function close() {
  emit('update:visible', false)
}

function handleSave() {
  const data = {
    name: localData.name,
    regex: localData.regex,
    replacement: localData.replacement,
    flags: localData.flags,
    promptOnly: localData.promptOnly,
    markdownOnly: localData.markdownOnly,
    placement: [...localData.placement],
    minDepth: localData.minDepth,
    maxDepth: localData.maxDepth
  }
  emit('save', data)
  close()
}
</script>
