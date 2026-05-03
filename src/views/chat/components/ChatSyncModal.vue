<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="handleClose">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" @click.stop>
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">聊天记录同步</h3>
          <button @click="handleClose" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- 同步状态 -->
        <div v-if="syncStatus" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div class="text-sm text-blue-800 dark:text-blue-200">
            <div class="flex justify-between mb-1">
              <span>总次数：</span>
              <span>{{ syncStatus.remainingTotal }} / {{ syncStatus.totalLimit }}</span>
            </div>
            <div class="flex justify-between">
              <span>今日次数：</span>
              <span>{{ syncStatus.remainingDaily }} / {{ syncStatus.dailyLimit }}</span>
            </div>
          </div>
        </div>

        <!-- 模式切换 -->
        <div class="flex mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            @click="mode = 'upload'"
            :class="[
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
              mode === 'upload'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            ]"
          >
            上传
          </button>
          <button
            @click="mode = 'download'"
            :class="[
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
              mode === 'download'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            ]"
          >
            下载
          </button>
        </div>

        <!-- 上传模式 -->
        <div v-if="mode === 'upload'">
          <div v-if="!uploadResult">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              将上传当前角色 <strong>{{ characterName }}</strong> 的聊天记录到服务器
            </p>
            <button
              @click="handleUpload"
              :disabled="isSyncing || !canSync"
              class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {{ isSyncing ? '上传中...' : '生成同步码' }}
            </button>
          </div>
          
          <div v-else class="text-center">
            <div class="mb-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">同步码</p>
              <div class="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                {{ uploadResult.syncCode }}
              </div>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              请在另一设备输入此同步码下载聊天记录
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-500">
              有效期至：{{ formatTime(uploadResult.expiresAt) }}
            </p>
            <button
              @click="uploadResult = null"
              class="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              重新生成
            </button>
          </div>
        </div>

        <!-- 下载模式 -->
        <div v-else>
          <div class="mb-4">
            <label class="block text-sm text-gray-600 dark:text-gray-400 mb-2">同步码</label>
            <input
              v-model="syncCode"
              type="text"
              placeholder="请输入6位同步码"
              maxlength="6"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            />
          </div>
          <button
            @click="handleDownload"
            :disabled="isSyncing || !syncCode || syncCode.length !== 6"
            class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {{ isSyncing ? '下载中...' : '下载' }}
          </button>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
        </div>

        <!-- 活跃同步 -->
        <div v-if="syncStatus?.activeSync && mode === 'upload'" class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p class="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            您有一个活跃的同步任务
          </p>
          <div class="text-xs text-yellow-700 dark:text-yellow-300">
            <p>同步码：{{ syncStatus.activeSync.syncCode }}</p>
            <p>角色：{{ syncStatus.activeSync.characterName }}</p>
            <p>过期时间：{{ formatTime(syncStatus.activeSync.expiresAt) }}</p>
          </div>
          <button
            @click="handleCancel"
            class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            取消同步
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import type { UploadResult } from '@/types'

const props = defineProps<{
  show: boolean
  characterName: string
}>()

const emit = defineEmits<{
  close: []
}>()

const chatStore = useChatStore()

const mode = ref<'upload' | 'download'>('upload')
const syncCode = ref('')
const uploadResult = ref<UploadResult | null>(null)
const error = ref<string | null>(null)

const syncStatus = computed(() => chatStore.syncStatus)
const isSyncing = computed(() => chatStore.isSyncing)

const canSync = computed(() => {
  if (!syncStatus.value) return false
  return syncStatus.value.remainingTotal > 0 && syncStatus.value.remainingDaily > 0
})

watch(() => props.show, async (newVal) => {
  if (newVal) {
    await chatStore.loadSyncStatus()
    error.value = null
    uploadResult.value = null
    syncCode.value = ''
  }
})

function handleClose() {
  emit('close')
}

async function handleUpload() {
  error.value = null
  try {
    uploadResult.value = await chatStore.uploadChatSync()
  } catch (e: any) {
    error.value = e.message
  }
}

async function handleDownload() {
  error.value = null
  try {
    const result = await chatStore.downloadChatSync(syncCode.value)
    handleClose()
  } catch (e: any) {
    error.value = e.message
  }
}

async function handleCancel() {
  error.value = null
  try {
    await chatStore.cancelChatSync()
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
