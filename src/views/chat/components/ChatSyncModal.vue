<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="handleClose">
    <div class="chat-card rounded-lg shadow-xl max-w-md w-full mx-4" @click.stop>
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-theme-text-primary">聊天记录同步</h3>
          <button @click="handleClose" class="text-theme-text-secondary hover:text-theme-text-primary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- 同步状态 -->
        <div v-if="syncStatus" class="mb-4 p-3 bg-[var(--theme-primary)]/10 rounded-lg">
          <div class="text-sm text-theme-text-accent">
            <div class="flex justify-between mb-1">
              <span>下载次数：</span>
              <span>{{ syncStatus.remainingTotal }} / {{ syncStatus.totalLimit }}</span>
            </div>
            <div class="flex justify-between">
              <span>今日下载：</span>
              <span>{{ syncStatus.remainingDaily }} / {{ syncStatus.dailyLimit }}</span>
            </div>
          </div>
        </div>

        <!-- 模式切换 -->
        <div class="flex mb-4 bg-[var(--theme-card-hover)] rounded-lg p-1">
          <button
            @click="mode = 'upload'"
            :class="[
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
              mode === 'upload'
                ? 'chat-card text-theme-text-primary shadow'
                : 'text-theme-text-secondary hover:text-theme-text-primary'
            ]"
          >
            上传
          </button>
          <button
            @click="mode = 'download'"
            :class="[
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
              mode === 'download'
                ? 'chat-card text-theme-text-primary shadow'
                : 'text-theme-text-secondary hover:text-theme-text-primary'
            ]"
          >
            下载
          </button>
        </div>

        <!-- 上传模式 -->
        <div v-if="mode === 'upload'">
          <div v-if="!uploadResult">
            <p class="text-sm text-theme-text-secondary mb-4">
              将上传当前角色 <strong class="text-theme-text-primary">{{ characterName }}</strong> 的聊天记录到服务器
            </p>
            <button
              @click="handleUpload"
              :disabled="isSyncing"
              class="w-full py-2 px-4 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:opacity-50 text-white rounded-lg transition-all font-medium"
            >
              {{ isSyncing ? '上传中...' : '生成同步码' }}
            </button>
          </div>
          
          <div v-else class="text-center">
            <div class="mb-4">
              <p class="text-sm text-theme-text-secondary mb-2">同步码</p>
              <div class="flex items-center justify-center gap-2">
                <div class="text-3xl font-mono font-bold text-theme-text-accent tracking-wider">
                  {{ uploadResult.syncCode }}
                </div>
                <button
                  @click="copyToClipboard(uploadResult.syncCode)"
                  class="p-2 rounded-lg hover:bg-[var(--theme-card-hover)] transition-colors"
                  :title="copySuccess ? '已复制' : '复制同步码'"
                >
                  <svg v-if="!copySuccess" class="w-5 h-5 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <svg v-else class="w-5 h-5 text-[var(--theme-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
            <p class="text-sm text-theme-text-secondary mb-4">
              请在另一设备输入此同步码下载聊天记录
            </p>
            <p class="text-xs text-theme-text-secondary">
              有效期至：{{ formatTime(uploadResult.expiresAt) }}
            </p>
            <button
              @click="uploadResult = null"
              class="mt-4 text-sm text-theme-text-accent hover:underline"
            >
              重新生成
            </button>
          </div>
        </div>

        <!-- 下载模式 -->
        <div v-else>
          <div class="mb-4">
            <label class="block text-sm text-theme-text-secondary mb-2">同步码</label>
            <input
              v-model="syncCode"
              type="text"
              placeholder="请输入6位同步码"
              maxlength="6"
              class="w-full px-3 py-2 border border-theme-border rounded-lg chat-input-field text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent uppercase"
            />
          </div>
          <p class="text-xs text-theme-text-secondary mb-4">
            下载的聊天记录将覆盖当前角色 <strong class="text-theme-text-primary">{{ characterName }}</strong> 的聊天记录
          </p>
          <button
            @click="handleDownloadClick"
            :disabled="isSyncing || !syncCode || syncCode.length !== 6 || !canDownload"
            class="w-full py-2 px-4 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:opacity-50 text-white rounded-lg transition-all font-medium"
          >
            {{ isSyncing ? '下载中...' : '下载' }}
          </button>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="mt-4 p-3 bg-[var(--theme-danger-bg)] rounded-lg">
          <p class="text-sm text-danger">{{ error }}</p>
        </div>

        <!-- 活跃同步 -->
        <div v-if="syncStatus?.activeSync && mode === 'upload'" class="mt-4 p-3 bg-[var(--theme-primary)]/10 rounded-lg border border-[var(--theme-primary)]">
          <p class="text-sm text-theme-text-primary mb-2">
            您有一个活跃的同步任务
          </p>
          <div class="text-xs text-theme-text-secondary">
            <div class="flex items-center gap-2">
              <span>同步码：</span>
              <span class="font-mono font-bold text-theme-text-accent">{{ syncStatus.activeSync.syncCode }}</span>
              <button
                @click="copyToClipboard(syncStatus.activeSync.syncCode)"
                class="p-1 rounded hover:bg-[var(--theme-card-hover)] transition-colors"
                :title="copySuccess ? '已复制' : '复制同步码'"
              >
                <svg v-if="!copySuccess" class="w-4 h-4 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <svg v-else class="w-4 h-4 text-[var(--theme-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
            <p>角色：{{ syncStatus.activeSync.characterName }}</p>
            <p>下载次数：{{ syncStatus.activeSync.downloadCount || 0 }} 次</p>
            <p>过期时间：{{ formatTime(syncStatus.activeSync.expiresAt) }}</p>
          </div>
          <button
            @click="handleCancel"
            class="mt-2 text-sm text-danger hover:underline"
          >
            取消同步
          </button>
        </div>
      </div>
    </div>

    <!-- 确认覆盖对话框 -->
    <div v-if="showConfirmDialog" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]" @click.stop>
      <div class="chat-card rounded-lg shadow-xl max-w-sm w-full mx-4" @click.stop>
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--theme-danger)] to-[var(--theme-danger-light)] flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-theme-text-primary">确认覆盖</h3>
          </div>
          <p class="text-sm text-theme-text-secondary mb-6">
            下载的聊天记录将<strong class="text-danger">覆盖</strong>当前角色 <strong class="text-theme-text-primary">{{ characterName }}</strong> 的聊天记录，此操作不可撤销。
          </p>
          <div class="flex gap-3">
            <button
              @click="showConfirmDialog = false"
              class="flex-1 px-4 py-2.5 chat-card text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] transition-all font-medium border border-theme-border text-sm"
            >
              取消
            </button>
            <button
              @click="confirmDownload"
              :disabled="isSyncing"
              class="flex-1 px-4 py-2.5 bg-gradient-to-r from-[var(--theme-danger)] to-[var(--theme-danger-light)] text-white rounded-xl hover:opacity-90 transition-all font-medium text-sm"
            >
              {{ isSyncing ? '下载中...' : '确认覆盖' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useDialog } from '@/composables/useDialog'
import type { UploadResult } from '@/api'

const props = defineProps<{
  show: boolean
  characterName: string
}>()

const emit = defineEmits<{
  close: []
}>()

const chatStore = useChatStore()
const { showSuccessAlert, showErrorAlert } = useDialog()

const mode = ref<'upload' | 'download'>('upload')
const syncCode = ref('')
const uploadResult = ref<UploadResult | null>(null)
const error = ref<string | null>(null)
const showConfirmDialog = ref(false)
const copySuccess = ref(false)

const syncStatus = computed(() => chatStore.syncStatus)
const isSyncing = computed(() => chatStore.isSyncing)

const canDownload = computed(() => {
  if (!syncStatus.value) return false
  return syncStatus.value.remainingTotal > 0 && syncStatus.value.remainingDaily > 0
})

watch(() => props.show, async (newVal) => {
  if (newVal) {
    await chatStore.loadSyncStatus()
    error.value = null
    uploadResult.value = null
    syncCode.value = ''
    showConfirmDialog.value = false
    copySuccess.value = false
  }
})

function handleClose() {
  if (showConfirmDialog.value) {
    showConfirmDialog.value = false
    return
  }
  emit('close')
}

function copyToClipboard(text: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    }).catch(() => {
      fallbackCopy(text)
    })
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-9999px'
  textArea.style.top = '-9999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand('copy')
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
  document.body.removeChild(textArea)
}

async function handleUpload() {
  error.value = null
  try {
    uploadResult.value = await chatStore.uploadChatSync()
  } catch (e: any) {
    error.value = e.message
  }
}

function handleDownloadClick() {
  error.value = null
  
  if (!canDownload.value) {
    error.value = '下载次数已达上限'
    return
  }
  
  showConfirmDialog.value = true
}

async function confirmDownload() {
  error.value = null
  try {
    const result = await chatStore.downloadChatSync(syncCode.value)
    showConfirmDialog.value = false
    handleClose()
    await showSuccessAlert(`成功下载 ${result.messageCount} 条聊天记录`)
  } catch (e: any) {
    error.value = e.message
    showConfirmDialog.value = false
    await showErrorAlert('下载失败: ' + e.message)
  }
}

async function handleCancel() {
  error.value = null
  try {
    await chatStore.cancelChatSync()
    await showSuccessAlert('已取消同步')
  } catch (e: any) {
    error.value = e.message
  }
}

function formatTime(isoString: string) {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
