<template>
  <div class="p-4 sm:p-8">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center shadow-lg shadow-[var(--theme-primary)]/25">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
        </svg>
      </div>
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-theme-text-primary">仪表盘</h1>
        <p class="text-sm text-theme-text-secondary">系统概览与快速操作</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div class="chat-card rounded-2xl p-4 sm:p-6 border border-theme-border shadow-lg shadow-[var(--theme-primary)]/5 hover:shadow-xl hover:shadow-[var(--theme-primary)]/10 transition-all duration-300 group">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-primary-light)] flex items-center justify-center shadow-lg shadow-[var(--theme-primary)]/25 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <div class="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] animate-pulse"></div>
        </div>
        <div class="text-3xl font-bold gradient-text mb-1">{{ stats.characters }}</div>
        <div class="text-theme-text-secondary text-sm">角色数量</div>
      </div>

      <div class="chat-card rounded-2xl p-4 sm:p-6 border border-theme-border shadow-lg shadow-[var(--theme-secondary)]/5 hover:shadow-xl hover:shadow-[var(--theme-secondary)]/10 transition-all duration-300 group">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--theme-secondary)] to-[var(--theme-secondary-light)] flex items-center justify-center shadow-lg shadow-[var(--theme-secondary)]/25 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div class="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--theme-secondary)] to-[var(--theme-accent)] animate-pulse"></div>
        </div>
        <div class="text-3xl font-bold gradient-text mb-1">{{ stats.models }}</div>
        <div class="text-theme-text-secondary text-sm">模型配置</div>
      </div>

      <div class="chat-card rounded-2xl p-4 sm:p-6 border border-theme-border shadow-lg shadow-[var(--theme-accent)]/5 hover:shadow-xl hover:shadow-[var(--theme-accent)]/10 transition-all duration-300 group sm:col-span-2 lg:col-span-1">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
               :class="stats.configured ? 'bg-gradient-to-br from-[var(--theme-success-light)] to-[var(--theme-success)] shadow-[var(--theme-success)]/25' : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/25'">
            <svg v-if="stats.configured" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <svg v-else class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div class="w-2 h-2 rounded-full animate-pulse"
               :class="stats.configured ? 'bg-[var(--theme-success)]' : 'bg-amber-400'"></div>
        </div>
        <div class="text-3xl font-bold mb-1"
             :class="stats.configured ? 'text-[var(--theme-success)]' : 'text-amber-500'">
          {{ stats.configured ? '已配置' : '未配置' }}
        </div>
        <div class="text-theme-text-secondary text-sm">API 状态</div>
      </div>
    </div>

    <div class="mt-6 sm:mt-8 chat-card rounded-2xl p-4 sm:p-6 border border-theme-border shadow-lg shadow-[var(--theme-primary)]/5">
      <h2 class="text-lg font-semibold text-theme-text-primary mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-theme-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
        快速操作
      </h2>
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <router-link
          to="/admin/characters/new"
          class="px-5 py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] text-center font-medium shadow-lg shadow-[var(--theme-primary)]/25 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          创建角色
        </router-link>
        <router-link
          to="/admin/models"
          class="px-5 py-3 chat-card text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] text-center font-medium border border-theme-border transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          配置模型
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()

const stats = ref({
  characters: 0,
  models: 0,
  configured: false
})

onMounted(async () => {
  await adminStore.loadCharacters()
  await adminStore.loadModels()

  stats.value.characters = adminStore.characters.length
  stats.value.models = adminStore.models.length
  stats.value.configured = adminStore.models.some(m => m.api_key && m.api_key !== '***')
})
</script>
