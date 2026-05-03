<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click.self="$emit('update:visible', false)">
    <div class="chat-card rounded-3xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl border border-theme-border" style="max-height: min(80vh, calc(var(--vh, 1vh) * 80));">
      <div class="p-3 sm:p-6 border-b border-theme-border flex items-center justify-between bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10">
        <h2 class="text-base sm:text-xl font-bold gradient-text flex items-center gap-2">
          <div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
            </svg>
          </div>
          切换主题
        </h2>
        <button @click="$emit('update:visible', false)" class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-[var(--theme-card-hover)] text-theme-text-secondary hover:text-theme-text-primary transition-all duration-200">
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-3 sm:p-6 overscroll-contain" data-scrollable="true" style="-webkit-overflow-scrolling: touch;">
        <div class="theme-selector-grid">
          <div 
            v-for="theme in themes" 
            :key="theme.id"
            class="theme-option"
            :class="{ selected: currentThemeId === theme.id }"
            @click="$emit('selectTheme', theme.id)"
          >
            <div 
              class="theme-preview"
              :style="{
                background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientMiddle}, ${theme.colors.gradientEnd})`
              }"
            ></div>
            <div class="theme-name">{{ theme.name }}</div>
            <div v-if="theme.description" class="theme-description">{{ theme.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Theme } from '@/utils/theme'

defineProps<{
  visible: boolean
  themes: Theme[]
  currentThemeId: string
}>()

defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'selectTheme', themeId: string): void
}>()
</script>

<style scoped>
.theme-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.theme-option {
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid var(--theme-border);
  transition: all 0.2s;
}

.theme-option:hover {
  border-color: var(--theme-primary);
  transform: translateY(-2px);
}

.theme-option.selected {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px var(--theme-primary);
}

.theme-preview {
  height: 80px;
  width: 100%;
}

.theme-name {
  padding: 8px 12px 4px;
  font-weight: 600;
  font-size: 14px;
  color: var(--theme-text-primary);
}

.theme-description {
  padding: 0 12px 8px;
  font-size: 12px;
  color: var(--theme-text-secondary);
}
</style>
