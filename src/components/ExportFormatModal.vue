<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click.self="$emit('update:visible', false)">
    <div class="chat-card rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-theme-border">
      <div class="p-4 sm:p-6 border-b border-theme-border bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10">
        <h2 class="text-lg sm:text-xl font-bold gradient-text flex items-center gap-2">
          <span class="w-7 h-7 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-lg flex items-center justify-center text-white text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </span>
          选择导出格式
        </h2>
      </div>
      
      <div class="p-4 sm:p-6 space-y-3">
        <button
          @click="selectFormat('image')"
          class="w-full flex items-center gap-3 p-4 rounded-xl border border-theme-border hover:bg-[var(--theme-card-hover)] transition-all duration-200 text-left group"
        >
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--theme-accent)]/20 to-[var(--theme-accent)]/10 flex items-center justify-center flex-shrink-0 group-hover:from-[var(--theme-accent)]/30 group-hover:to-[var(--theme-accent)]/20">
            <svg class="w-5 h-5 text-[var(--theme-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-theme-text-primary">导出为图片</div>
            <div class="text-xs text-theme-text-secondary">{{ imageDescription }}</div>
          </div>
        </button>
        
        <button
          @click="selectFormat('json')"
          class="w-full flex items-center gap-3 p-4 rounded-xl border border-theme-border hover:bg-[var(--theme-card-hover)] transition-all duration-200 text-left group"
        >
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--theme-primary)]/20 to-[var(--theme-primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:from-[var(--theme-primary)]/30 group-hover:to-[var(--theme-primary)]/20">
            <svg class="w-5 h-5 text-[var(--theme-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-theme-text-primary">导出为 JSON</div>
            <div class="text-xs text-theme-text-secondary">{{ jsonDescription }}</div>
          </div>
        </button>
      </div>
      
      <div class="p-4 border-t border-theme-border">
        <button
          @click="$emit('update:visible', false)"
          class="w-full px-4 py-2.5 chat-card text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] transition-all duration-200 font-medium border border-theme-border text-sm"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  sourceType: 'image' | 'json'
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', format: 'image' | 'json'): void
}>()

const imageDescription = computed(() => {
  return props.sourceType === 'image' 
    ? '下载原始图片文件' 
    : '生成包含角色数据的 PNG 图片'
})

const jsonDescription = computed(() => {
  return props.sourceType === 'image' 
    ? '解析图片中的角色数据并导出' 
    : '下载原始 JSON 文件'
})

function selectFormat(format: 'image' | 'json') {
  emit('select', format)
  emit('update:visible', false)
}
</script>
