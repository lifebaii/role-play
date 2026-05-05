<template>
  <Teleport to="body">
    <Transition name="notification">
      <div v-if="showNotification" class="fixed top-4 right-4 z-50 max-w-sm">
        <div :class="notificationClass" class="rounded-lg shadow-lg p-4">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <svg :class="iconClass" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPath"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 :class="titleClass" class="text-sm font-medium">{{ notificationTitle }}</h3>
              <p :class="messageClass" class="text-sm mt-1">{{ notificationMessage }}</p>
            </div>
            <button @click="close" :class="closeClass" class="flex-shrink-0">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { eventBus } from '@/utils/eventBus'
import { useRouter } from 'vue-router'

type NotificationType = 'auth' | 'error'

const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<NotificationType>('auth')
const router = useRouter()

let timeoutId: number | null = null

const notificationTitle = computed(() => {
  return notificationType.value === 'auth' ? '会话已过期' : '请求错误'
})

const notificationClass = computed(() => {
  return notificationType.value === 'auth' 
    ? 'bg-red-50 border border-red-200' 
    : 'bg-orange-50 border border-orange-200'
})

const iconClass = computed(() => {
  return notificationType.value === 'auth' ? 'text-red-500' : 'text-orange-500'
})

const titleClass = computed(() => {
  return notificationType.value === 'auth' ? 'text-red-800' : 'text-orange-800'
})

const messageClass = computed(() => {
  return notificationType.value === 'auth' ? 'text-red-600' : 'text-orange-600'
})

const closeClass = computed(() => {
  return notificationType.value === 'auth' ? 'text-red-400 hover:text-red-600' : 'text-orange-400 hover:text-orange-600'
})

const iconPath = computed(() => {
  return notificationType.value === 'auth' 
    ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' 
    : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
})

const close = () => {
  showNotification.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

const show = (message: string, type: NotificationType = 'auth') => {
  notificationMessage.value = message
  notificationType.value = type
  showNotification.value = true
  
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  
  timeoutId = window.setTimeout(() => {
    close()
  }, 5000)
}

const handleAuthError = (data: { type: string; message: string }) => {
  show(data.message, 'auth')
  
  if (data.type === 'user-first') {
    router.push('/')
  }
}

const handleApiError = (data: { status: number; message: string }) => {
  show(data.message, 'error')
}

onMounted(() => {
  eventBus.on('auth-error', handleAuthError)
  eventBus.on('api-error', handleApiError)
})

onUnmounted(() => {
  eventBus.off('auth-error', handleAuthError)
  eventBus.off('api-error', handleApiError)
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
