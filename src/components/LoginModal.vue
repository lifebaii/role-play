<template>
  <div 
    v-if="visible" 
    class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" 
    @click.self="handleClose"
    @keydown.esc="handleClose"
  >
    <div class="chat-card rounded-2xl p-6 sm:p-8 w-full max-w-md border border-theme-border shadow-2xl">
      <div class="text-center mb-6 sm:mb-8">
        <div class="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-theme-primary to-theme-secondary rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-theme-primary/25">
          <span class="text-2xl sm:text-3xl">💬</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-bold text-theme-text-primary mb-1 sm:mb-2">Role-Play</h2>
        <p class="text-theme-text-secondary text-sm sm:text-base">使用 GitHub 账号登录</p>
      </div>

      <button
        @click="redirectToGitHub"
        class="w-full py-3 sm:py-4 bg-theme-card-hover hover:bg-theme-sidebar-hover text-theme-text-primary rounded-xl font-medium flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 border border-theme-border hover:border-theme-primary"
        :disabled="isLoading"
      >
        <svg v-if="!isLoading" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.34-3.369-1.34-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531-1.03 1.531-1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.113-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.578 9.578 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.295 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/>
        </svg>
        <svg v-else class="w-5 h-5 animate-spin" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <span class="text-sm sm:text-base">{{ isLoading ? '登录中...' : '使用 GitHub 登录' }}</span>
      </button>

      <p class="mt-4 sm:mt-6 text-center text-theme-text-secondary text-xs sm:text-sm">
        首次登录将自动注册账号
      </p>

      <button
        @click="handleClose"
        class="mt-4 w-full py-2 text-theme-text-secondary hover:text-theme-text-primary text-sm transition-colors"
      >
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const userStore = useUserStore()
const isLoading = ref(false)

const handleClose = () => {
  if (!isLoading.value) {
    emit('update:visible', false)
  }
}

const redirectToGitHub = () => {
  isLoading.value = true
  window.location.href = '/api/auth/github'
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    isLoading.value = false
  }
})
</script>
