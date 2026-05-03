<template>
  <div class="absolute bottom-0 left-0 right-0 z-20 p-2 sm:p-4 chat-input-area" style="padding-bottom: max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem));">
    <div v-if="showSuggestions && suggestions.length > 0" class="mb-2 sm:mb-4 p-2 sm:p-4 bg-[var(--theme-bg-start)]/70 rounded-2xl border border-theme-border" style="backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);">
      <div class="text-xs font-semibold text-theme-text-secondary mb-2 sm:mb-3 uppercase tracking-wider flex items-center justify-between">
        <div class="flex items-center gap-1.5 sm:gap-2">
          <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          建议回复
        </div>
        <button
          @click.stop="$emit('refreshSuggestions')"
          :disabled="isGeneratingSuggestions"
          class="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--theme-primary)]/10 transition-all text-theme-text-accent disabled:opacity-50"
          title="刷新建议"
        >
          <div v-if="isGeneratingSuggestions" class="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <svg v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>
      <div class="space-y-1 sm:space-y-2">
        <button
          v-for="(suggestion, index) in suggestions"
          :key="index"
          @click="$emit('sendSuggestion', suggestion)"
          class="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-sm text-theme-text-primary hover:bg-[var(--theme-primary)]/10 rounded-xl transition-all duration-200 flex items-center gap-2 sm:gap-3 group"
        >
          <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-text-accent opacity-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          {{ suggestion }}
        </button>
      </div>
    </div>
    <form @submit.prevent="handleSubmit" class="flex gap-2 sm:gap-3">
      <input
        v-model="inputText"
        type="text"
        placeholder="输入消息..."
        class="flex-1 min-w-0 px-3 py-2 sm:px-5 sm:py-3 rounded-2xl border-2 chat-input-field shadow-lg transition-all duration-200"
        :disabled="isStreaming"
      />
      <button
        v-if="isStreaming"
        type="button"
        @click="$emit('stop')"
        class="chat-btn chat-btn-stop rounded-2xl flex-shrink-0 font-semibold transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center btn-fixed"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6h12v12H6z"/>
        </svg>
      </button>
      <template v-else>
        <button
          type="button"
          @click="$emit('fetchSuggestions')"
          :disabled="isGeneratingSuggestions"
          class="chat-btn rounded-2xl flex-shrink-0 font-semibold flex items-center justify-center gap-2 transition-all duration-200 btn-fixed"
          :class="autoFetchSuggestions && suggestions.length > 0 ? 'chat-btn-success' : ''"
        >
          <div v-if="isGeneratingSuggestions" class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </button>

        <button
          type="submit"
          class="chat-btn rounded-2xl flex-shrink-0 font-semibold transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center btn-fixed"
          :disabled="!inputText.trim() || isGeneratingSuggestions"
        >
          <svg class="w-5 h-5" style="transform: rotate(90deg)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>
      </template>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isStreaming: boolean
  showSuggestions: boolean
  suggestions: string[]
  isGeneratingSuggestions: boolean
  autoFetchSuggestions: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', text: string): void
  (e: 'stop'): void
  (e: 'fetchSuggestions'): void
  (e: 'refreshSuggestions'): void
  (e: 'sendSuggestion', suggestion: string): void
}>()

const inputText = ref('')

function handleSubmit() {
  if (!inputText.value.trim()) return
  emit('submit', inputText.value)
  inputText.value = ''
}
</script>

<style scoped>
.btn-fixed {
  width: 44px;
  height: 44px;
}

@media (min-width: 640px) {
  .btn-fixed {
    width: 52px;
    height: 52px;
  }
}

.chat-btn {
  background: transparent;
  color: var(--theme-primary);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 2px solid var(--theme-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chat-btn:hover:not(:disabled) {
  color: var(--theme-primary-dark);
  border-color: var(--theme-primary-dark);
}

.chat-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-btn-success {
  color: var(--theme-success);
  border-color: var(--theme-success);
}

.chat-btn-success:hover:not(:disabled) {
  color: var(--theme-success-light);
  border-color: var(--theme-success-light);
}

.chat-btn-stop {
  background: transparent;
  color: var(--theme-danger);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 2px solid var(--theme-danger);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chat-btn-stop:hover {
  color: var(--theme-danger-light);
  border-color: var(--theme-danger-light);
}
</style>
