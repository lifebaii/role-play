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
        <p class="text-sm text-theme-text-secondary">浏览和查看服务器文件</p>
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
                class="hover:bg-[var(--theme-primary)]/5 cursor-pointer transition-colors"
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
                @click="handleFileClick(file)"
                class="hover:bg-[var(--theme-primary)]/5 cursor-pointer transition-colors"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <svg v-if="file.isDirectory" class="w-5 h-5 text-[var(--theme-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                    </svg>
                    <svg v-else class="w-5 h-5 text-theme-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span class="text-theme-text-primary">{{ file.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded-full text-xs" 
                        :class="file.isDirectory ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]' : 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]'">
                    {{ file.isDirectory ? '目录' : '文件' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-theme-text-secondary">{{ formatSize(file.size) }}</td>
                <td class="px-4 py-3 text-right text-theme-text-secondary">{{ formatDate(file.modifiedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- 文件视图 -->
    <template v-else-if="fileData">
      <div class="space-y-4">
        <!-- 文件信息 -->
        <div class="chat-card rounded-2xl p-4 border border-theme-border">
          <div class="flex items-start justify-between">
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
                </div>
              </div>
            </div>
            <div class="flex gap-2">
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
                @click="navigateToParent"
                class="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-dark)] transition-all flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                返回
              </button>
            </div>
          </div>
        </div>

        <!-- 文件内容 -->
        <div class="chat-card rounded-2xl border border-theme-border overflow-hidden">
          <div class="p-4 border-b border-theme-border bg-[var(--theme-card-hover)]/30">
            <h4 class="text-sm font-medium text-theme-text-secondary">文件内容</h4>
          </div>
          <pre class="p-4 overflow-x-auto text-sm text-theme-text-primary bg-[var(--theme-bg-start)]"><code>{{ fileData.content }}</code></pre>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminApiClient } from '@/api'

const route = useRoute()
const router = useRouter()

const currentPath = ref('/')
const loading = ref(false)
const error = ref<string | null>(null)
const directoryData = ref<any>(null)
const fileData = ref<any>(null)

const breadcrumbs = computed(() => {
  if (currentPath.value === '/') return []
  const parts = currentPath.value.split('/').filter(Boolean)
  let path = ''
  return parts.map(part => {
    path += '/' + part
    return { name: part, path }
  })
})

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

  try {
    const data = await adminApiClient.get('/admin/filesystem', { path })
    
    if (data.type === 'directory') {
      directoryData.value = data
    } else {
      fileData.value = data
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
  const parentPath = currentPath.value.substring(0, currentPath.value.lastIndexOf('/')) || '/'
  loadPath(parentPath)
}

function handleFileClick(file: any) {
  if (file.isDirectory) {
    const newPath = currentPath.value === '/' ? '/' + file.name : currentPath.value + '/' + file.name
    loadPath(newPath)
  } else {
    const newPath = currentPath.value === '/' ? '/' + file.name : currentPath.value + '/' + file.name
    loadPath(newPath)
  }
}

function downloadFile() {
  if (!fileData.value) return
  const token = localStorage.getItem('admin_token')
  const url = `${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/filesystem/raw?path=${encodeURIComponent(fileData.value.path)}&t=${Date.now()}`
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

onMounted(() => {
  loadPath('/')
})
</script>
