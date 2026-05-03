<template>
  <Teleport to="body">
    <Transition name="notification">
      <div v-if="showNotification" class="fixed top-4 right-4 z-50 max-w-sm">
        <div class="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-medium text-red-800">会话已过期</h3>
              <p class="text-sm text-red-600 mt-1">{{ notificationMessage }}</p>
            </div>
            <button @click="close" class="flex-shrink-0 text-red-400 hover:text-red-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { eventBus } from '@/utils/eventBus'
import { useRouter } from 'vue-router'

const showNotification = ref(false)
const notificationMessage = ref('')
const router = useRouter()

let timeoutId: number | null = null

const close = () => {
  showNotification.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

const show = (message: string) => {
  notificationMessage.value = message
  showNotification.value = true
  
  // 5秒后自动关闭
  timeoutId = window.setTimeout(() => {
    close()
  }, 5000)
}

const handleAuthError = (data: { type: string; message: string }) => {
  show(data.message)
  
  // 根据类型跳转到相应的登录页面
  if (data.type === 'user-first') {
    router.push('/')
  }
}

onMounted(() => {
  eventBus.on('auth-error', handleAuthError)
})

onUnmounted(() => {
  eventBus.off('auth-error', handleAuthError)
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
