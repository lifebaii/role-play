<template>
  <div class="p-4 sm:p-8">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-primary-dark)] flex items-center justify-center shadow-lg shadow-[var(--theme-primary)]/25">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-theme-text-primary">系统设置</h1>
        <p class="text-sm text-theme-text-secondary">配置系统参数和额度规则</p>
      </div>
    </div>

    <div class="space-y-6">
      <div class="chat-card rounded-2xl p-4 sm:p-6 border border-theme-border shadow-lg shadow-[var(--theme-primary)]/5">
        <h2 class="text-lg font-semibold text-theme-text-primary mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-theme-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          额度设置
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">新用户初始额度</label>
            <input
              v-model.number="settings.newUserQuota"
              type="number"
              min="0"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="100"
            />
            <p class="mt-1.5 text-xs text-theme-text-secondary">新用户注册时获得的对话额度数量</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">签到最低额度</label>
            <input
              v-model.number="settings.signinMinQuota"
              type="number"
              min="0"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="1"
            />
            <p class="mt-1.5 text-xs text-theme-text-secondary">每日签到随机获得的最低额度</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">签到最高额度</label>
            <input
              v-model.number="settings.signinMaxQuota"
              type="number"
              min="0"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="10"
            />
            <p class="mt-1.5 text-xs text-theme-text-secondary">每日签到随机获得的最高额度</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">对话额度消耗</label>
            <input
              v-model.number="settings.chatQuotaCost"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="1"
            />
            <p class="mt-1.5 text-xs text-theme-text-secondary">每次对话消耗的额度数量</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">建议额度消耗</label>
            <input
              v-model.number="settings.suggestionQuotaCost"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="0.5"
            />
            <p class="mt-1.5 text-xs text-theme-text-secondary">每次使用建议功能消耗的额度数量</p>
          </div>
        </div>
      </div>

      <div class="chat-card rounded-2xl p-4 sm:p-6 border border-theme-border shadow-lg shadow-[var(--theme-primary)]/5">
        <h2 class="text-lg font-semibold text-theme-text-primary mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-theme-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          用户限制
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">最大用户角色数量</label>
            <div class="flex items-center gap-4">
              <input
                v-model.number="settings.maxUserCharacters"
                type="range"
                min="1"
                max="100"
                step="1"
                class="flex-1 h-2 bg-[var(--theme-input-bg)] rounded-lg appearance-none cursor-pointer accent-[var(--theme-primary)]"
              />
              <input
                v-model.number="settings.maxUserCharacters"
                type="number"
                min="1"
                max="100"
                class="w-20 px-3 py-1.5 chat-input-field border border-theme-border rounded-lg text-center text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)]"
              />
            </div>
            <p class="mt-1.5 text-xs text-theme-text-secondary">每个用户最多可拥有的角色数量 (1-100)</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">角色数据大小限制 (字节)</label>
            <input
              v-model.number="settings.maxCharacterSize"
              type="number"
              min="1024"
              max="104857600"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="1048576"
            />
            <p class="mt-1.5 text-xs text-theme-text-secondary">单个角色数据的最大字节数 (1KB-100MB)，当前: {{ formatSize(settings.maxCharacterSize) }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">每个用户在每个角色的最大评论数</label>
            <input
              v-model.number="settings.maxCommentsPerUserPerCharacter"
              type="number"
              min="1"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="5"
            />
            <p class="mt-1.5 text-xs text-theme-text-secondary">每个用户在每个角色下最多可以发表的评论数量</p>
          </div>
        </div>
      </div>

      <div class="chat-card rounded-2xl p-4 sm:p-6 border border-theme-border shadow-lg shadow-[var(--theme-primary)]/5">
        <h2 class="text-lg font-semibold text-theme-text-primary mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-theme-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          聊天同步设置
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">总同步次数上限</label>
            <input
              v-model.number="settings.chatSyncTotalLimit"
              type="number"
              min="0"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="10"
            />
            <p class="mt-1.5 text-xs text-theme-text-secondary">每个用户总共可以进行的同步次数</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">每日同步次数上限</label>
            <input
              v-model.number="settings.chatSyncDailyLimit"
              type="number"
              min="0"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="3"
            />
            <p class="mt-1.5 text-xs text-theme-text-secondary">每个用户每天可以进行的同步次数</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <button
          @click="saveSettings"
          :disabled="isSaving"
          class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:opacity-50 shadow-md hover:shadow-lg transition-all font-medium"
        >
          <svg v-if="isSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ isSaving ? '保存中...' : '保存设置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import type { AdminSettings } from '@/types'
import { useDialog } from '@/composables/useDialog'

const adminStore = useAdminStore()
const { showSuccessAlert, showErrorAlert } = useDialog()
const isSaving = ref(false)

const settings = ref<AdminSettings>({
  newUserQuota: 100,
  signinMinQuota: 1,
  signinMaxQuota: 10,
  chatQuotaCost: 1,
  suggestionQuotaCost: 0.5,
  maxUserCharacters: 5,
  maxCharacterSize: 1048576,
  maxCommentsPerUserPerCharacter: 5,
  chatSyncTotalLimit: 10,
  chatSyncDailyLimit: 3
})

function formatSize(bytes: number | undefined): string {
  if (bytes === undefined) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

onMounted(async () => {
  try {
    const data = await adminStore.loadSettings()
    if (data) {
      settings.value = { ...settings.value, ...data }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
})

async function saveSettings() {
  try {
    isSaving.value = true
    await adminStore.saveSettings(settings.value)
    await showSuccessAlert('设置已保存')
  } catch (e: any) {
    await showErrorAlert('保存失败: ' + e.message)
  } finally {
    isSaving.value = false
  }
}
</script>
