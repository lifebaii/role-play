<template>
  <div class="min-h-screen bg-[var(--theme-bg-start)]">
    <div v-if="userStore.isAuthenticating" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="flex flex-col items-center gap-4">
        <div class="w-16 h-16 border-4 border-theme-primary/30 border-t-theme-primary rounded-full animate-spin"></div>
        <p class="text-theme-text-secondary text-sm">正在验证...</p>
      </div>
    </div>
    <router-view v-else />
    <AuthNotification />
    <DialogContainer />
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { clearAvatarCache } from '@/composables/useAvatar'
import AuthNotification from '@/components/AuthNotification.vue'
import DialogContainer from '@/components/DialogContainer.vue'

const userStore = useUserStore()

onUnmounted(() => {
  clearAvatarCache()
})
</script>
