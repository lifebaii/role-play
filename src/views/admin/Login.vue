<template>
  <div class="min-h-screen bg-[var(--theme-bg-start)] flex items-center justify-center p-4">
    <div class="chat-card rounded-2xl p-8 w-full max-w-md border border-theme-border shadow-2xl">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--theme-primary)]/25">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h1 class="text-2xl font-bold gradient-text mb-2">管理员登录</h1>
        <p class="text-theme-text-secondary text-sm">请输入管理员密码以访问后台</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-theme-text-primary mb-2">管理员密码</label>
          <input
            v-model="password"
            type="password"
            class="w-full px-4 py-3 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all duration-200"
            placeholder="请输入管理员密码"
            required
          />
        </div>

        <div v-if="error" class="p-3 rounded-xl bg-[var(--theme-danger-bg)] border border-[var(--theme-danger)]/30 text-[var(--theme-danger)] text-sm">
          {{ error }}
        </div>

        <button
          type="submit"
          class="w-full py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:opacity-50 text-base font-medium shadow-lg shadow-[var(--theme-primary)]/25 transition-all duration-200"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            登录中...
          </span>
          <span v-else>登录</span>
        </button>
      </form>

      <div class="mt-6 text-center">
        <router-link to="/chat" class="text-sm text-theme-text-accent hover:text-[var(--theme-primary-dark)] transition-colors">
          ← 返回聊天
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const adminStore = useAdminStore()
const password = ref('')
const isLoading = ref(false)
const error = ref('')

async function handleLogin() {
  try {
    isLoading.value = true
    error.value = ''
    await adminStore.login(password.value)
    router.push('/admin')
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally {
    isLoading.value = false
  }
}
</script>
