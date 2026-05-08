<template>
  <div class="p-4 sm:p-8">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-primary-dark)] flex items-center justify-center shadow-lg shadow-[var(--theme-primary)]/25">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-theme-text-primary">用户管理</h1>
        <p class="text-sm text-theme-text-secondary">管理系统用户和额度配置</p>
      </div>
    </div>

    <div class="chat-card rounded-2xl p-4 sm:p-6 border border-theme-border shadow-lg shadow-[var(--theme-primary)]/5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-theme-text-primary flex items-center gap-2">
          <svg class="w-5 h-5 text-theme-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          用户列表
          <span class="ml-2 text-sm font-normal text-theme-text-secondary">({{ adminStore.users.length }})</span>
        </h2>
        <button 
          @click="loadUsers" 
          class="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--theme-secondary)]/10 hover:bg-[var(--theme-secondary)]/20 text-[var(--theme-secondary)] rounded-xl transition-all"
        >
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ loading ? '加载中...' : '刷新' }}
        </button>
      </div>

      <div v-if="loading && adminStore.users.length === 0" class="flex items-center justify-center py-12">
        <div class="flex flex-col items-center gap-2">
          <svg class="w-8 h-8 text-[var(--theme-primary)] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="text-theme-text-secondary">加载用户数据中...</span>
        </div>
      </div>

      <div v-else-if="adminStore.users.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
        <svg class="w-16 h-16 text-theme-text-secondary/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p class="text-theme-text-secondary text-lg">暂无用户</p>
        <p class="text-theme-text-secondary/70 text-sm mt-1">系统中还没有注册用户</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="user in adminStore.users" :key="user.id" class="p-4 rounded-xl bg-[var(--theme-bg-start)]/50 border border-theme-border hover:border-[var(--theme-primary)]/30 transition-all">
          <div class="flex items-start gap-4">
            <img 
              :src="user.avatarUrl" 
              :alt="user.name" 
              class="w-12 h-12 rounded-full object-cover flex-shrink-0"
              @error="$event.target.src = '/default-avatar.svg'"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <h3 class="font-semibold text-theme-text-primary truncate">{{ user.name || user.login }}</h3>
                  <p class="text-sm text-theme-text-secondary truncate">@{{ user.login }}</p>
                  <p v-if="user.userName" class="text-sm text-theme-text-accent truncate">昵称: {{ user.userName }}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button
                    @click="openEditQuotaModal(user)"
                    class="p-2 text-theme-text-secondary hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 rounded-lg transition-all"
                    title="修改额度"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    @click="confirmDeleteUser(user)"
                    class="p-2 text-theme-text-secondary hover:text-[var(--theme-danger)] hover:bg-[var(--theme-danger)]/10 rounded-lg transition-all"
                    title="删除用户"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="bg-[var(--theme-bg-start)]/30 rounded-lg p-3">
                  <p class="text-xs text-theme-text-secondary mb-1">剩余额度</p>
                  <p class="text-lg font-semibold text-[var(--theme-primary)]">{{ user.quota }}</p>
                </div>
                <div class="bg-[var(--theme-bg-start)]/30 rounded-lg p-3">
                  <p class="text-xs text-theme-text-secondary mb-1">总对话次数</p>
                  <p class="text-lg font-semibold text-theme-text-primary">{{ user.totalChats }}</p>
                </div>
                <div class="bg-[var(--theme-bg-start)]/30 rounded-lg p-3">
                  <p class="text-xs text-theme-text-secondary mb-1">最后签到</p>
                  <p class="text-sm font-medium text-theme-text-primary">
                    {{ user.lastSigninDate ? formatDate(user.lastSigninDate) : '从未' }}
                  </p>
                </div>
                <div class="bg-[var(--theme-bg-start)]/30 rounded-lg p-3">
                  <p class="text-xs text-theme-text-secondary mb-1">注册时间</p>
                  <p class="text-sm font-medium text-theme-text-primary">
                    {{ formatDate(user.createdAt || '') }}
                  </p>
                </div>
              </div>

              <div v-if="user.chatSyncMeta" class="mt-3 pt-3 border-t border-theme-border">
                <p class="text-xs text-theme-text-secondary mb-2">同步数据</p>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div class="text-center">
                    <p class="text-lg font-semibold text-theme-text-primary">{{ user.chatSyncMeta.syncCount.total }}</p>
                    <p class="text-xs text-theme-text-secondary">总同步</p>
                  </div>
                  <div class="text-center">
                    <p class="text-lg font-semibold text-theme-text-primary">{{ user.chatSyncMeta.syncCount.daily }}</p>
                    <p class="text-xs text-theme-text-secondary">今日同步</p>
                  </div>
                  <div class="text-center">
                    <p class="text-lg font-semibold text-theme-text-primary">{{ user.chatSyncMeta.uploadedSyncs.length }}</p>
                    <p class="text-xs text-theme-text-secondary">上传分享</p>
                  </div>
                  <div class="text-center">
                    <p class="text-lg font-semibold text-[var(--theme-primary)]">{{ user.chatSyncMeta.totalUploadedDownloads || 0 }}</p>
                    <p class="text-xs text-theme-text-secondary">总下载</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改额度对话框 -->
    <Dialog
      :visible="showEditQuotaModal"
      @update:visible="showEditQuotaModal = $event"
      type="prompt"
      title="修改用户额度"
      :message="editingUser ? `用户: ${editingUser.name || editingUser.login}\n当前额度: ${editingUser.quota}` : ''"
      confirm-text="确认修改"
      cancel-text="取消"
      :input-value="newQuota.toString()"
      input-placeholder="输入新的额度数值"
      @confirm="handleQuotaConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { useDialog } from '@/composables/useDialog'
import Dialog from '@/components/Dialog.vue'
import type { User } from '@/types'

const adminStore = useAdminStore()
const { showSuccessAlert, showErrorAlert, showDangerConfirm } = useDialog()

const loading = ref(false)
const showEditQuotaModal = ref(false)
const editingUser = ref<User | null>(null)
const newQuota = ref(0)
const saving = ref(false)

async function loadUsers() {
  loading.value = true
  try {
    await adminStore.loadUsers()
  } catch (e) {
    console.error('Failed to load users:', e)
    await showErrorAlert('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

function openEditQuotaModal(user: User) {
  editingUser.value = user
  newQuota.value = user.quota
  showEditQuotaModal.value = true
}

async function handleQuotaConfirm(value?: string) {
  if (!editingUser.value) return
  
  const quotaValue = parseInt(value || '0', 10)
  if (isNaN(quotaValue) || quotaValue < 0) {
    await showErrorAlert('请输入有效的额度数值')
    return
  }
  
  newQuota.value = quotaValue
  
  saving.value = true
  try {
    await adminStore.updateUserQuota(editingUser.value.id, newQuota.value)
    showEditQuotaModal.value = false
    await showSuccessAlert('额度修改成功')
  } catch (e: any) {
    await showErrorAlert('额度修改失败: ' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

async function confirmDeleteUser(user: User) {
  const confirmed = await showDangerConfirm(
    `确定要删除用户 "${user.name || user.login}" 吗？此操作不可撤销，将同时删除该用户的所有数据。`,
    '删除用户'
  )
  
  if (confirmed) {
    try {
      loading.value = true
      await adminStore.deleteUser(user.id)
      await showSuccessAlert('用户删除成功')
    } catch (e: any) {
      await showErrorAlert('删除失败: ' + (e.message || '未知错误'))
    } finally {
      loading.value = false
    }
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return '未知'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

onMounted(() => {
  loadUsers()
})
</script>
