<template>
  <div class="absolute bottom-0 w-full z-20 p-2 sm:p-4 chat-input-area" :style="inputAreaStyle">
    <div class="max-w-4xl mx-auto">
      <form @submit.prevent="handleSubmit" class="flex gap-2 sm:gap-3">
        <input
          ref="inputRef"
          v-model="inputText"
          type="text"
          placeholder="输入消息..."
          class="flex-1 min-w-0 px-3 py-2 sm:px-5 sm:py-3 rounded-2xl border-2 chat-input-field shadow-lg transition-all duration-200"
          :disabled="isStreaming"
          :style="{ visibility: isStreaming ? 'hidden' : 'visible' }"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <button
          v-if="isStreaming"
          type="button"
          @click="$emit('stop')"
          class="chat-btn chat-btn-stop rounded-2xl flex-shrink-0 font-semibold transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center btn-fixed"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6h12v12H6z"/>
          </svg>
        </button>
        <template v-else>
          <button
            type="button"
            @click="handleSuggestionButtonClick"
            class="rounded-2xl flex-shrink-0 font-semibold flex items-center justify-center gap-2 transition-all duration-200 btn-fixed"
            :class="isGeneratingSuggestions ? 'chat-btn-stop' : (autoFetchSuggestions && suggestions.length > 0 ? 'chat-btn-success' : 'chat-btn')"
            :title="getSuggestionButtonTitle"
          >
            <div v-if="isGeneratingSuggestions" class="w-5 h-5 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6h12v12H6z"/>
              </svg>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps<{
  isStreaming: boolean
  showSuggestions: boolean
  suggestions: string[]
  isGeneratingSuggestions: boolean
  autoFetchSuggestions: boolean
  sidebarOpen?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', text: string, clearInput: () => void): void
  (e: 'stop'): void
  (e: 'fetchSuggestions'): void
  (e: 'cancelSuggestions'): void
  (e: 'toggleSuggestions'): void
  (e: 'refreshSuggestions'): void
  (e: 'sendSuggestion', suggestion: string): void
}>()

const inputText = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const isInputFocused = ref(false)
const windowWidth = ref(window.innerWidth)

function updateWindowWidth() {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

// Calculate dynamic padding style
const inputAreaStyle = computed(() => {
  let basePadding = 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)'
  if (isInputFocused.value) {
    // For Android, add extra padding when focused
    basePadding = 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem + 8px)'
  }
  
  const isPC = windowWidth.value >= 1024
  const sidebarWidth = 320
  
  const style: Record<string, string> = {
    paddingBottom: basePadding
  }
  
  if (isPC && props.sidebarOpen) {
    style.paddingRight = `${sidebarWidth}px`
  }
  
  return style
})

function handleFocus() {
  isInputFocused.value = true
  // Ensure the input stays in viewport
  setTimeout(() => {
    inputRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 100)
}

function handleBlur() {
  isInputFocused.value = false
}

function handleSubmit() {
  if (!inputText.value.trim()) return
  emit('submit', inputText.value, () => {
    inputText.value = ''
  })
}

function handleSuggestionButtonClick() {
  if (props.isGeneratingSuggestions) {
    emit('cancelSuggestions')
  } else {
    emit('toggleSuggestions')
  }
}

const getSuggestionButtonTitle = computed(() => {
  if (props.isGeneratingSuggestions) {
    return '取消生成'
  } else if (props.showSuggestions) {
    return '隐藏建议回复'
  } else {
    return '显示建议回复'
  }
})
</script>

<style scoped>
.chat-input-area {
  transition: padding-right 300ms ease-in-out;
}

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
