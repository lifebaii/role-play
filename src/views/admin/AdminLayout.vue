<template>
  <div class="min-h-screen bg-[var(--theme-bg-start)] flex">
    <div
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
      :class="sidebarOpen ? 'block' : 'hidden'"
      @click="sidebarOpen = false"
    ></div>

    <div
      class="fixed lg:relative w-64 chat-sidebar border-r border-theme-border flex flex-col z-30 transition-all duration-300 lg:translate-x-0 shadow-2xl h-screen"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'">
      <div class="p-4 border-b border-theme-border flex items-center justify-between bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10 flex-shrink-0">
        <router-link to="/chat" class="text-xl font-bold gradient-text hover:opacity-80 transition-opacity">
          Role-Play
        </router-link>
        <button @click="sidebarOpen = false" class="lg:hidden p-2 text-theme-text-secondary hover:bg-[var(--theme-primary)]/10 rounded-xl transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <nav class="p-3 flex-1 space-y-1">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-theme-text-secondary hover:bg-[var(--theme-sidebar-hover)] hover:text-theme-text-primary mb-1 transition-all duration-200 group"
          :class="{ 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white shadow-lg shadow-[var(--theme-primary)]/25 hover:text-white': isActive(item.path) }"
          @click="sidebarOpen = false"
        >
          <span class="text-lg">{{ item.icon }}</span>
          <span class="font-medium text-sm">{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="p-3 border-t border-theme-border">
        <button
          @click="adminStore.logout"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] transition-all duration-200"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          <span class="font-medium text-sm">退出登录</span>
        </button>
      </div>
    </div>

    <div class="flex-1 flex flex-col min-w-0 h-screen">
      <div class="sticky top-0 z-10 lg:hidden h-14 px-4 flex items-center justify-between border-b border-theme-border chat-header">
        <div class="flex items-center gap-3">
          <button
            @click="sidebarOpen = true"
            class="p-2 text-theme-text-secondary hover:text-theme-text-primary hover:bg-[var(--theme-primary)]/10 rounded-xl transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <span class="font-semibold text-theme-text-primary">{{ currentPageTitle }}</span>
        </div>
        <button
          v-if="adminStore.saveButtonVisible"
          @click="adminStore.triggerSave"
          class="px-4 py-1.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:opacity-50 text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
          :disabled="adminStore.saveButtonLoading"
        >
          {{ adminStore.saveButtonLoading ? '保存中...' : '保存' }}
        </button>
      </div>

      <div class="hidden lg:flex sticky top-0 z-10 h-14 px-6 items-center justify-between border-b border-theme-border chat-header">
        <span class="font-semibold text-theme-text-primary">{{ currentPageTitle }}</span>
        <button
          v-if="adminStore.saveButtonVisible"
          @click="adminStore.triggerSave"
          class="px-4 py-1.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:opacity-50 text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
          :disabled="adminStore.saveButtonLoading"
        >
          {{ adminStore.saveButtonLoading ? '保存中...' : '保存' }}
        </button>
      </div>

      <div class="flex-1 overflow-y-auto overflow-x-hidden">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const sidebarOpen = ref(false)

const menuItems = [
  { path: '/admin', name: '仪表盘', icon: '📊' },
  { path: '/admin/characters', name: '角色管理', icon: '👤' },
  { path: '/admin/character-viewer', name: '数据查看器', icon: '🔍' },
  { path: '/admin/presets', name: '预设管理', icon: '📝' },
  { path: '/admin/worldinfo', name: '世界书', icon: '📚' },
  { path: '/admin/regex', name: '正则脚本', icon: '🔤' },
  { path: '/admin/models', name: '模型配置', icon: '🤖' },
  { path: '/admin/settings', name: '系统设置', icon: '⚙️' }
]

function isActive(path: string) {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}

const currentPageTitle = computed(() => {
  const item = menuItems.find(m => isActive(m.path))
  return item?.name || '管理后台'
})
</script>
