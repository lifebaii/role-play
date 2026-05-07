<template>
  <div class="p-4 sm:p-8">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center shadow-lg shadow-[var(--theme-primary)]/25">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
        </svg>
      </div>
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-theme-text-primary">文件系统</h1>
        <p class="text-sm text-theme-text-secondary">浏览和编辑服务器文件</p>
      </div>
    </div>

    <!-- 面包屑导航 -->
    <div class="flex items-center gap-2 mb-4 p-3 chat-card rounded-xl border border-theme-border">
      <button 
        @click="navigateTo('/')"
        class="px-3 py-1.5 rounded-lg hover:bg-[var(--theme-primary)]/10 text-theme-text-primary flex items-center gap-1.5 transition-all"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
        根目录
      </button>
      <template v-for="(part, index) in breadcrumbs" :key="index">
        <span class="text-theme-text-secondary">/</span>
        <button 
          @click="navigateTo(part.path)"
          class="px-3 py-1.5 rounded-lg hover:bg-[var(--theme-primary)]/10 text-theme-text-primary transition-all"
        >
          {{ part.name }}
        </button>
      </template>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-4 border-[var(--theme-primary)] border-t-transparent"></div>
    </div>

    <!-- 错误显示 -->
    <div v-else-if="error" class="chat-card rounded-xl p-6 border border-red-500/30 bg-red-500/5">
      <div class="flex items-start gap-3">
        <svg class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <h3 class="font-semibold text-red-500">错误</h3>
          <p class="text-theme-text-secondary">{{ error }}</p>
        </div>
      </div>
      <button 
        @click="loadPath(currentPath)"
        class="mt-4 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all"
      >
        重试
      </button>
    </div>

    <!-- 目录视图 -->
    <template v-else-if="directoryData">
      <div class="chat-card rounded-2xl border border-theme-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-[var(--theme-card-hover)]/50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-theme-text-primary">名称</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-theme-text-primary w-24">类型</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-theme-text-primary w-32">大小</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-theme-text-primary w-48">修改时间</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-theme-border">
              <!-- 返回上一级 -->
              <tr 
                v-if="currentPath !== '/'"
                @click="navigateToParent"
                class="file-row-parent"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    <span class="text-theme-text-primary">..</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-theme-text-secondary">目录</td>
                <td class="px-4 py-3 text-right text-theme-text-secondary">-</td>
                <td class="px-4 py-3 text-right text-theme-text-secondary">-</td>
              </tr>
              <!-- 文件列表 -->
              <tr 
                v-for="file in directoryData.files" 
                :key="file.name"
                @click="file.accessible && handleFileClick(file)"
                :class="file.accessible ? 'file-row-accessible' : 'file-row-inaccessible'"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <svg v-if="!file.accessible && file.isDirectory" class="w-5 h-5 text-[var(--theme-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                    </svg>
                    <svg v-else-if="file.accessible && file.isDirectory" class="w-5 h-5 text-[var(--theme-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                    </svg>
                    <svg v-else-if="file.accessible && file.isFile" class="w-5 h-5 text-theme-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <svg v-else class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-theme-text-primary">{{ file.name }}</span>
                    <span v-if="!file.accessible" class="text-xs text-red-500 ml-2" :title="file.error">(无法访问)</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded-full text-xs" 
                        :class="getTypeBadgeClass(file)">
                    {{ file.accessible ? (file.isDirectory ? '目录' : '文件') : '无权限' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-theme-text-secondary">{{ file.accessible ? formatSize(file.size) : '-' }}</td>
                <td class="px-4 py-3 text-right text-theme-text-secondary">{{ file.accessible && file.modifiedAt ? formatDate(file.modifiedAt) : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- 文件编辑视图 -->
    <template v-else-if="fileData">
      <div class="space-y-4">
        <!-- 文件信息和操作栏 -->
        <div class="chat-card rounded-2xl p-4 border border-theme-border">
          <div class="flex items-start justify-between flex-wrap gap-4">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--theme-accent)] to-[var(--theme-accent-light)] flex items-center justify-center shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-theme-text-primary">{{ fileData.name }}</h3>
                <div class="flex items-center gap-4 mt-1 text-sm text-theme-text-secondary">
                  <span>{{ formatSize(fileData.size) }}</span>
                  <span>·</span>
                  <span>{{ formatDate(fileData.modifiedAt) }}</span>
                  <span v-if="isJsonFile" class="text-blue-500">(JSON)</span>
                </div>
              </div>
            </div>
            <div class="flex gap-2 flex-wrap">
              <button 
                @click="navigateToParent"
                class="px-4 py-2 chat-card text-theme-text-primary rounded-lg hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                返回
              </button>
              <button 
                @click="downloadFile"
                class="px-4 py-2 chat-card text-theme-text-primary rounded-lg hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                下载
              </button>
              <button 
                @click="saveFile"
                :disabled="saving"
                class="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-dark)] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>

        <!-- JSON错误提示 -->
        <div v-if="jsonError" class="chat-card rounded-xl p-4 border border-red-500/30 bg-red-500/5">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="flex-1">
              <h4 class="font-semibold text-red-500 text-sm">JSON格式错误</h4>
              <p class="text-red-600 text-sm mt-1">{{ jsonError }}</p>
            </div>
          </div>
        </div>

        <!-- 文件内容编辑 -->
        <div class="chat-card rounded-2xl border border-theme-border overflow-hidden">
          <div class="p-4 border-b border-theme-border bg-[var(--theme-card-hover)]/30 flex items-center justify-between">
            <h4 class="text-sm font-medium text-theme-text-secondary">
              编辑内容
              <span v-if="isDirty" class="text-orange-500 ml-2">(已修改)</span>
            </h4>
            <div class="flex items-center gap-2">
              <button 
                v-if="isJsonFile"
                @click="formatJson"
                :disabled="jsonError"
                class="text-xs px-3 py-1 rounded hover:bg-[var(--theme-primary)]/10 text-theme-text-secondary transition-all disabled:opacity-50"
              >
                格式化
              </button>
              <button 
                @click="resetContent"
                :disabled="!isDirty"
                class="text-xs px-3 py-1 rounded hover:bg-[var(--theme-primary)]/10 text-theme-text-secondary transition-all disabled:opacity-50"
              >
                重置
              </button>
            </div>
          </div>
          <textarea
            v-model="editContent"
            @input="handleContentChange"
            class="w-full min-h-[400px] p-4 bg-[var(--theme-bg-start)] text-theme-text-primary font-mono text-sm resize-vertical focus:outline-none"
            spellcheck="false"
          ></textarea>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { adminApiClient } from '@/api'

const STORAGE_KEY = 'admin-filesystem-last-path'

const currentPath = ref('/')
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const directoryData = ref<any>(null)
const fileData = ref<any>(null)
const editContent = ref('')
const originalContent = ref('')
const jsonError = ref<string | null>(null)

const isDirty = computed(() => editContent.value !== originalContent.value)

const isJsonFile = computed(() => {
  if (!fileData.value?.name) return false
  return fileData.value.name.toLowerCase().endsWith('.json')
})

const breadcrumbs = computed(() => {
  if (currentPath.value === '/' || !currentPath.value) return []
  // 处理 Windows 驱动器路径（如 C:\）和普通路径
  const parts = currentPath.value.split('/').filter(Boolean);
  let path = '';
  return parts.map((part, index) => {
    // 对于 Windows 驱动器，保持原样
    if (index === 0 && (part.endsWith(':') || part.endsWith(':\\'))) {
      path = '/' + part;
    } else {
      path = path ? path + '/' + part : '/' + part;
    }
    return { name: part, path };
  });
})

// 从本地存储读取上次打开的路径
onMounted(() => {
  try {
    const savedPath = localStorage.getItem(STORAGE_KEY)
    if (savedPath) {
      loadPath(savedPath)
    } else {
      loadPath('/')
    }
  } catch {
    loadPath('/')
  }
})

// 监听当前路径变化，保存到本地存储
watch(currentPath, (newPath) => {
  try {
    localStorage.setItem(STORAGE_KEY, newPath)
  } catch {
    // 忽略存储错误
  }
})

function getTypeBadgeClass(file: any): string {
  if (!file.accessible) {
    return 'bg-gray-200 text-gray-500'
  }
  if (file.isDirectory) {
    return 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
  }
  return 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]'
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function loadPath(path: string) {
  loading.value = true
  error.value = null
  directoryData.value = null
  fileData.value = null
  editContent.value = ''
  originalContent.value = ''
  jsonError.value = null

  try {
    const data = await adminApiClient.get('/admin/filesystem', { path })
    
    if (data.type === 'directory') {
      directoryData.value = data
    } else {
      fileData.value = data
      editContent.value = data.content || ''
      originalContent.value = data.content || ''
    }
    
    currentPath.value = data.path
  } catch (err: any) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function navigateTo(path: string) {
  loadPath(path)
}

function navigateToParent() {
  if (currentPath.value === '/') return
  
  // 处理 Windows 驱动器情况（如 /C:）
  const parts = currentPath.value.split('/').filter(Boolean);
  if (parts.length === 1) {
    loadPath('/');
    return;
  }
  
  // 普通情况：去掉最后一个路径部分
  const parentPath = currentPath.value.substring(0, currentPath.value.lastIndexOf('/')) || '/';
  loadPath(parentPath);
}

function handleFileClick(file: any) {
  if (!file.accessible) return
  
  let newPath;
  if (currentPath.value === '/') {
    newPath = '/' + file.name;
  } else if (currentPath.value.endsWith('/')) {
    newPath = currentPath.value + file.name;
  } else {
    newPath = currentPath.value + '/' + file.name;
  }
  loadPath(newPath);
}

function handleContentChange() {
  // 只对JSON文件进行校验
  if (isJsonFile.value) {
    validateJson()
  }
}

function validateJson() {
  if (!isJsonFile.value) {
    jsonError.value = null
    return true
  }
  
  try {
    JSON.parse(editContent.value)
    jsonError.value = null
    return true
  } catch (e: any) {
    jsonError.value = e.message
    return false
  }
}

function formatJson() {
  if (!isJsonFile.value) return
  
  try {
    const parsed = JSON.parse(editContent.value)
    editContent.value = JSON.stringify(parsed, null, 2)
    jsonError.value = null
  } catch (e: any) {
    jsonError.value = e.message
  }
}

function resetContent() {
  editContent.value = originalContent.value
  if (isJsonFile.value) {
    validateJson()
  }
}

async function saveFile() {
  if (!fileData.value) return
  
  // JSON文件必须合法才能保存
  if (isJsonFile.value && !validateJson()) {
    return
  }
  
  saving.value = true
  try {
    await adminApiClient.put('/admin/filesystem', {
      path: fileData.value.path,
      content: editContent.value
    })
    originalContent.value = editContent.value
    // 重新加载文件信息
    await loadPath(fileData.value.path)
  } catch (err: any) {
    error.value = err.message || '保存失败'
  } finally {
    saving.value = false
  }
}

function downloadFile() {
  if (!fileData.value) return
  const token = localStorage.getItem('admin_token')
  const url = `/api/admin/filesystem/raw?path=${encodeURIComponent(fileData.value.path)}&t=${Date.now()}`
  const a = document.createElement('a')
  a.href = url
  a.download = fileData.value.name
  if (token) {
    a.setAttribute('Authorization', `Bearer ${token}`)
    // 需要通过 fetch 下载
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileData.value.name
      a.click()
      window.URL.revokeObjectURL(url)
    })
  } else {
    a.click()
  }
}
</script>

<style scoped>
.file-row-parent {
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-row-parent:hover {
  background-color: rgba(var(--theme-primary), 0.05);
}

.file-row-accessible {
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-row-accessible:hover {
  background-color: rgba(var(--theme-primary), 0.05);
}

.file-row-inaccessible {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
