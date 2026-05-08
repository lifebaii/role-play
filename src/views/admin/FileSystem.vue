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
        <p class="text-sm text-theme-text-secondary">浏览和管理服务器文件</p>
      </div>
    </div>

    <!-- 面包屑导航 -->
    <div class="flex items-center gap-2 mb-4 p-3 chat-card rounded-xl border border-theme-border overflow-x-auto">
      <button 
        @click="navigateTo('/')"
        class="px-3 py-1.5 rounded-lg hover:bg-[var(--theme-primary)]/10 text-theme-text-primary flex items-center gap-1.5 transition-all flex-shrink-0"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
        根目录
      </button>
      <template v-for="(part, index) in breadcrumbs" :key="index">
        <span class="text-theme-text-secondary flex-shrink-0">/</span>
        <button 
          @click="navigateTo(part.path)"
          class="px-3 py-1.5 rounded-lg hover:bg-[var(--theme-primary)]/10 text-theme-text-primary transition-all flex-shrink-0"
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
      <!-- 操作栏 -->
      <div class="flex flex-wrap gap-2 mb-4 p-3 chat-card rounded-xl border border-theme-border">
        <button 
          @click="showCreateFileDialog = true"
          class="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-dark)] transition-all flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          新建文件
        </button>
        <button 
          @click="showCreateFolderDialog = true"
          class="px-4 py-2 chat-card text-theme-text-primary rounded-lg hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
          </svg>
          新建文件夹
        </button>
        <button 
          @click="loadPath(currentPath)"
          class="px-4 py-2 chat-card text-theme-text-primary rounded-lg hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          刷新
        </button>
        
        <!-- 批量操作按钮 -->
        <template v-if="selectedFiles.length > 0">
          <div class="flex items-center gap-2 ml-4 pl-4 border-l border-theme-border">
            <span class="text-sm text-theme-text-secondary">已选 {{ selectedFiles.length }} 项</span>
            <button 
              @click="clearSelection"
              class="px-2 py-1 text-xs text-theme-text-secondary hover:text-[var(--theme-primary)] transition-all"
            >
              取消选择
            </button>
            <button 
              @click="batchCopyToClipboard"
              class="px-3 py-1.5 chat-card text-theme-text-primary rounded hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all text-sm flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              批量复制
            </button>
            <button 
              @click="showBatchMoveDialog = true"
              class="px-3 py-1.5 chat-card text-theme-text-primary rounded hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all text-sm flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
              批量移动
            </button>
            <button 
              @click="showBatchDeleteDialog = true"
              class="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-sm flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              批量删除
            </button>
          </div>
        </template>
        
        <div v-if="clipboardItem" class="ml-auto flex items-center gap-2 text-theme-text-secondary">
          <span class="text-sm">
            {{ clipboardAction === 'copy' ? '已复制' : '已剪切' }}: {{ clipboardItem.name }}
          </span>
          <button 
            @click="clearClipboard"
            class="text-sm px-2 py-1 hover:bg-[var(--theme-primary)]/10 rounded transition-all"
          >
            取消
          </button>
        </div>
      </div>

      <div class="chat-card rounded-2xl border border-theme-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-[var(--theme-card-hover)]/50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-theme-text-primary w-12">
                  <input 
                    type="checkbox" 
                    v-model="selectAll"
                    @change="toggleSelectAll"
                    class="w-4 h-4 rounded border-gray-300"
                  >
                </th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-theme-text-primary">名称</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-theme-text-primary w-24">类型</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-theme-text-primary w-32">大小</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-theme-text-primary w-48">修改时间</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-theme-text-primary w-48">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-theme-border">
              <!-- 返回上一级 -->
              <tr 
                v-if="currentPath !== '/'"
                @click="navigateToParent"
                class="cursor-pointer hover:bg-[var(--theme-primary)]/5 transition-colors"
              >
                <td class="px-4 py-3"></td>
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
                <td class="px-4 py-3"></td>
              </tr>
              <!-- 文件列表 -->
              <tr 
                v-for="file in directoryData.files" 
                :key="file.name"
                :class="{'bg-[var(--theme-primary)]/10': selectedFiles.includes(getFilePath(file))}"
              >
                <td class="px-4 py-3">
                  <input 
                    type="checkbox" 
                    v-model="selectedFiles" 
                    :value="getFilePath(file)"
                    class="w-4 h-4 rounded border-gray-300"
                  >
                </td>
                <td 
                  class="px-4 py-3 cursor-pointer"
                  @click="file.accessible && handleFileClick(file)"
                >
                  <div class="flex items-center gap-3">
                    <svg v-if="!file.accessible && file.isDirectory" class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1" v-if="file.accessible">
                    <button 
                      @click.stop="viewAttributes(file)"
                      class="p-2 text-theme-text-secondary hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 rounded-lg transition-all"
                      title="属性"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </button>
                    <button 
                      @click.stop="renameFile(file)"
                      class="p-2 text-theme-text-secondary hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 rounded-lg transition-all"
                      title="重命名"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button 
                      @click.stop="copyFile(file)"
                      class="p-2 text-theme-text-secondary hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 rounded-lg transition-all"
                      title="复制"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </button>
                    <button 
                      @click.stop="cutFile(file)"
                      class="p-2 text-theme-text-secondary hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 rounded-lg transition-all"
                      title="剪切"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path>
                      </svg>
                    </button>
                    <button 
                      @click.stop="deleteFile(file)"
                      class="p-2 text-theme-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="删除"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 粘贴按钮 -->
      <div v-if="clipboardItem" class="mt-4 flex justify-end">
        <button 
          @click="pasteItem"
          class="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-dark)] transition-all flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          粘贴到当前目录
        </button>
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
                class="text-sm px-3 py-1 rounded hover:bg-[var(--theme-primary)]/10 text-theme-text-secondary transition-all disabled:opacity-50"
              >
                格式化
              </button>
              <button 
                @click="resetContent"
                :disabled="!isDirty"
                class="text-sm px-3 py-1 rounded hover:bg-[var(--theme-primary)]/10 text-theme-text-secondary transition-all disabled:opacity-50"
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

    <!-- 新建文件对话框 -->
    <div v-if="showCreateFileDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="chat-card rounded-2xl border border-theme-border w-full max-w-md p-6">
        <h3 class="text-lg font-semibold text-theme-text-primary mb-4">新建文件</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-theme-text-secondary mb-2">文件名</label>
            <input 
              v-model="newFileName" 
              type="text" 
              class="w-full px-3 py-2 bg-[var(--theme-card-hover)]/50 border border-theme-border rounded-lg text-theme-text-primary focus:outline-none focus:border-[var(--theme-primary)]"
              placeholder="请输入文件名"
              @keyup.enter="confirmCreateFile"
            >
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="showCreateFileDialog = false; newFileName = ''"
            class="px-4 py-2 chat-card text-theme-text-primary rounded-lg hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all"
          >
            取消
          </button>
          <button 
            @click="confirmCreateFile"
            :disabled="!newFileName"
            class="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-dark)] transition-all disabled:opacity-50"
          >
            创建
          </button>
        </div>
      </div>
    </div>

    <!-- 新建文件夹对话框 -->
    <div v-if="showCreateFolderDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="chat-card rounded-2xl border border-theme-border w-full max-w-md p-6">
        <h3 class="text-lg font-semibold text-theme-text-primary mb-4">新建文件夹</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-theme-text-secondary mb-2">文件夹名</label>
            <input 
              v-model="newFolderName" 
              type="text" 
              class="w-full px-3 py-2 bg-[var(--theme-card-hover)]/50 border border-theme-border rounded-lg text-theme-text-primary focus:outline-none focus:border-[var(--theme-primary)]"
              placeholder="请输入文件夹名"
              @keyup.enter="confirmCreateFolder"
            >
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="showCreateFolderDialog = false; newFolderName = ''"
            class="px-4 py-2 chat-card text-theme-text-primary rounded-lg hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all"
          >
            取消
          </button>
          <button 
            @click="confirmCreateFolder"
            :disabled="!newFolderName"
            class="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-dark)] transition-all disabled:opacity-50"
          >
            创建
          </button>
        </div>
      </div>
    </div>

    <!-- 重命名对话框 -->
    <div v-if="showRenameDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="chat-card rounded-2xl border border-theme-border w-full max-w-md p-6">
        <h3 class="text-lg font-semibold text-theme-text-primary mb-4">重命名</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-theme-text-secondary mb-2">新名称</label>
            <input 
              v-model="newName" 
              type="text" 
              class="w-full px-3 py-2 bg-[var(--theme-card-hover)]/50 border border-theme-border rounded-lg text-theme-text-primary focus:outline-none focus:border-[var(--theme-primary)]"
              @keyup.enter="confirmRename"
            >
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="showRenameDialog = false; newName = ''"
            class="px-4 py-2 chat-card text-theme-text-primary rounded-lg hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all"
          >
            取消
          </button>
          <button 
            @click="confirmRename"
            :disabled="!newName"
            class="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-dark)] transition-all disabled:opacity-50"
          >
            确定
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="chat-card rounded-2xl border border-theme-border w-full max-w-md p-6">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-theme-text-primary">确认删除</h3>
            <p class="text-theme-text-secondary mt-1">
              确定要删除 <span class="font-medium text-theme-text-primary">{{ deleteItem?.name }}</span> 吗？
              <span v-if="deleteItem?.isDirectory" class="block text-sm text-orange-500 mt-1">此操作将删除文件夹及其所有内容。</span>
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <button 
            @click="showDeleteDialog = false; deleteItem = null"
            class="px-4 py-2 chat-card text-theme-text-primary rounded-lg hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all"
          >
            取消
          </button>
          <button 
            @click="confirmDelete"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 文件属性对话框 -->
    <div v-if="showAttributesDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="chat-card rounded-2xl border border-theme-border w-full max-w-lg p-6">
        <h3 class="text-lg font-semibold text-theme-text-primary mb-4">属性</h3>
        <div class="space-y-3" v-if="fileAttributes">
          <div class="flex justify-between py-2 border-b border-theme-border">
            <span class="text-theme-text-secondary">名称</span>
            <span class="text-theme-text-primary font-medium">{{ fileAttributes.name }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-theme-border">
            <span class="text-theme-text-secondary">路径</span>
            <span class="text-theme-text-primary font-mono text-sm">{{ fileAttributes.path }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-theme-border">
            <span class="text-theme-text-secondary">类型</span>
            <span class="text-theme-text-primary">{{ fileAttributes.isDirectory ? '目录' : '文件' }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-theme-border">
            <span class="text-theme-text-secondary">大小</span>
            <div class="flex items-center gap-2">
              <span class="text-theme-text-primary">{{ formatSize(fileAttributes.size) }}</span>
            </div>
          </div>
          <!-- 文件夹统计信息 -->
          <template v-if="fileAttributes.isDirectory">
            <div class="flex justify-between py-2 border-b border-theme-border">
              <span class="text-theme-text-secondary">总大小</span>
              <div class="flex items-center gap-2">
                <span class="text-theme-text-primary">{{ folderSize ? formatSize(folderSize) : '-' }}</span>
                <button 
                  @click="getFolderSize"
                  :disabled="loadingFolderSize"
                  class="px-2 py-1 text-xs bg-[var(--theme-primary)] text-white rounded hover:bg-[var(--theme-primary-dark)] transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  <svg v-if="loadingFolderSize" class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  {{ loadingFolderSize ? '计算中...' : '计算' }}
                </button>
              </div>
            </div>
            <div class="flex justify-between py-2 border-b border-theme-border">
              <span class="text-theme-text-secondary">文件/文件夹数量</span>
              <div class="flex items-center gap-2">
                <span v-if="folderCount" class="text-theme-text-primary">
                  文件: {{ folderCount.fileCount }} / 文件夹: {{ folderCount.folderCount }}
                  <span class="text-theme-text-secondary">(总计 {{ folderCount.totalCount }})</span>
                </span>
                <span v-else class="text-theme-text-secondary">-</span>
                <button 
                  @click="getFolderCount"
                  :disabled="loadingFolderCount"
                  class="px-2 py-1 text-xs bg-[var(--theme-primary)] text-white rounded hover:bg-[var(--theme-primary-dark)] transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  <svg v-if="loadingFolderCount" class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  {{ loadingFolderCount ? '计算中...' : '统计' }}
                </button>
              </div>
            </div>
          </template>
          <div class="flex justify-between py-2 border-b border-theme-border">
            <span class="text-theme-text-secondary">创建时间</span>
            <span class="text-theme-text-primary">{{ formatDate(fileAttributes.createdAt) }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-theme-border">
            <span class="text-theme-text-secondary">修改时间</span>
            <span class="text-theme-text-primary">{{ formatDate(fileAttributes.modifiedAt) }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-theme-border">
            <span class="text-theme-text-secondary">访问时间</span>
            <span class="text-theme-text-primary">{{ formatDate(fileAttributes.accessedAt) }}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-theme-text-secondary">权限</span>
            <span class="text-theme-text-primary font-mono">{{ fileAttributes.mode }}</span>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="showAttributesDialog = false; fileAttributes = null; folderSize = null; folderCount = null"
            class="px-4 py-2 chat-card text-theme-text-primary rounded-lg hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </div>

    <!-- 批量删除确认对话框 -->
    <div v-if="showBatchDeleteDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="chat-card rounded-2xl border border-theme-border w-full max-w-md p-6">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-theme-text-primary">确认批量删除</h3>
            <p class="text-theme-text-secondary mt-1">
              确定要删除选中的 {{ selectedFiles.length }} 项吗？
              <span class="block text-sm text-orange-500 mt-1">此操作不可恢复！</span>
            </p>
          </div>
        </div>
        <!-- 选中项预览 -->
        <div class="mb-4 max-h-40 overflow-y-auto bg-[var(--theme-card-hover)]/30 rounded-lg p-3">
          <div class="text-xs text-theme-text-secondary mb-2">选中项：</div>
          <div v-for="file in selectedFilesPreview" :key="file" class="text-sm text-theme-text-primary truncate py-0.5">
            {{ file }}
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <button 
            @click="showBatchDeleteDialog = false"
            class="px-4 py-2 chat-card text-theme-text-primary rounded-lg hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all"
          >
            取消
          </button>
          <button 
            @click="confirmBatchDelete"
            :disabled="loadingBatch"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="loadingBatch" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {{ loadingBatch ? '删除中...' : '删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 批量移动对话框 -->
    <div v-if="showBatchMoveDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="chat-card rounded-2xl border border-theme-border w-full max-w-md p-6">
        <h3 class="text-lg font-semibold text-theme-text-primary mb-4">批量移动</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-theme-text-secondary mb-2">目标路径</label>
            <div class="flex gap-2">
              <input 
                v-model="batchDestinationPath" 
                type="text" 
                class="flex-1 px-3 py-2 bg-[var(--theme-card-hover)]/50 border border-theme-border rounded-lg text-theme-text-primary focus:outline-none focus:border-[var(--theme-primary)] font-mono text-sm"
                placeholder="/path/to/destination"
              >
              <button 
                @click="batchDestinationPath = currentPath"
                class="px-3 py-2 chat-card text-theme-text-primary rounded hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all text-sm"
              >
                当前
              </button>
            </div>
          </div>
          <!-- 选中项预览 -->
          <div class="max-h-40 overflow-y-auto bg-[var(--theme-card-hover)]/30 rounded-lg p-3">
            <div class="text-xs text-theme-text-secondary mb-2">将移动 {{ selectedFiles.length }} 项：</div>
            <div v-for="file in selectedFilesPreview" :key="file" class="text-sm text-theme-text-primary truncate py-0.5">
              {{ file }}
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="showBatchMoveDialog = false; batchDestinationPath = ''"
            class="px-4 py-2 chat-card text-theme-text-primary rounded-lg hover:bg-[var(--theme-card-hover)] border border-theme-border transition-all"
          >
            取消
          </button>
          <button 
            @click="confirmBatchMove"
            :disabled="!batchDestinationPath || loadingBatch"
            class="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-dark)] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="loadingBatch" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {{ loadingBatch ? '移动中...' : '移动' }}
          </button>
        </div>
      </div>
    </div>
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
const selectedFiles = ref<string[]>([])

// 对话框状态
const showCreateFileDialog = ref(false)
const showCreateFolderDialog = ref(false)
const showRenameDialog = ref(false)
const showDeleteDialog = ref(false)
const showAttributesDialog = ref(false)

// 对话框数据
const newFileName = ref('')
const newFolderName = ref('')
const newName = ref('')
const deleteItem = ref<any>(null)
const fileAttributes = ref<any>(null)
const renameItem = ref<any>(null)

// 文件夹统计
const folderSize = ref<number | null>(null)
const folderCount = ref<{ fileCount: number; folderCount: number; totalCount: number } | null>(null)
const loadingFolderSize = ref(false)
const loadingFolderCount = ref(false)

// 批量操作
const selectAll = ref(false)
const showBatchDeleteDialog = ref(false)
const showBatchMoveDialog = ref(false)
const batchDestinationPath = ref('')
const loadingBatch = ref(false)

// 剪贴板
const clipboardItem = ref<any>(null)
const clipboardAction = ref<'copy' | 'move' | null>(null)
const batchClipboardItems = ref<string[]>([])

// 计算属性
const selectedFilesPreview = computed(() => {
  const files = directoryData.value?.files || []
  return selectedFiles.value.map(path => {
    const file = files.find((f: any) => getFilePath(f) === path)
    return file ? file.name : path
  })
})

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
  selectedFiles.value = []

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

function getFilePath(file: any): string {
  if (currentPath.value === '/') {
    return '/' + file.name
  } else if (currentPath.value.endsWith('/')) {
    return currentPath.value + file.name
  } else {
    return currentPath.value + '/' + file.name
  }
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

// 新建文件
async function confirmCreateFile() {
  if (!newFileName.value) return
  
  const filePath = currentPath.value === '/' ? `/${newFileName.value}` : `${currentPath.value}/${newFileName.value}`
  
  try {
    await adminApiClient.createFile(filePath)
    showCreateFileDialog.value = false
    newFileName.value = ''
    await loadPath(currentPath.value)
  } catch (err: any) {
    alert(err.message || '创建失败')
  }
}

// 新建文件夹
async function confirmCreateFolder() {
  if (!newFolderName.value) return
  
  const folderPath = currentPath.value === '/' ? `/${newFolderName.value}` : `${currentPath.value}/${newFolderName.value}`
  
  try {
    await adminApiClient.createFolder(folderPath)
    showCreateFolderDialog.value = false
    newFolderName.value = ''
    await loadPath(currentPath.value)
  } catch (err: any) {
    alert(err.message || '创建失败')
  }
}

// 重命名
function renameFile(file: any) {
  renameItem.value = file
  newName.value = file.name
  showRenameDialog.value = true
}

async function confirmRename() {
  if (!newName.value || !renameItem.value) return
  
  const oldPath = getFilePath(renameItem.value)
  const newPath = currentPath.value === '/' ? `/${newName.value}` : `${currentPath.value}/${newName.value}`
  
  try {
    await adminApiClient.renameFile(oldPath, newPath)
    showRenameDialog.value = false
    newName.value = ''
    renameItem.value = null
    await loadPath(currentPath.value)
  } catch (err: any) {
    alert(err.message || '重命名失败')
  }
}

// 删除
function deleteFile(file: any) {
  deleteItem.value = file
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deleteItem.value) return
  
  const filePath = getFilePath(deleteItem.value)
  
  try {
    await adminApiClient.deleteFile(filePath)
    showDeleteDialog.value = false
    deleteItem.value = null
    await loadPath(currentPath.value)
  } catch (err: any) {
    alert(err.message || '删除失败')
  }
}

// 复制/剪切/粘贴
function copyFile(file: any) {
  clipboardItem.value = { ...file, path: getFilePath(file) }
  clipboardAction.value = 'copy'
}

function cutFile(file: any) {
  clipboardItem.value = { ...file, path: getFilePath(file) }
  clipboardAction.value = 'move'
}

function clearClipboard() {
  clipboardItem.value = null
  clipboardAction.value = null
}

async function pasteItem() {
  if (!clipboardItem.value || !clipboardAction.value) return
  
  const destPath = currentPath.value === '/' 
    ? `/${clipboardItem.value.name}` 
    : `${currentPath.value}/${clipboardItem.value.name}`
  
  try {
    if (clipboardAction.value === 'copy') {
      await adminApiClient.copyFile(clipboardItem.value.path, destPath)
    } else {
      await adminApiClient.moveFile(clipboardItem.value.path, destPath)
    }
    clearClipboard()
    await loadPath(currentPath.value)
  } catch (err: any) {
    alert(err.message || '操作失败')
  }
}

// 查看属性
async function viewAttributes(file: any) {
  const filePath = getFilePath(file)
  
  try {
    const attrs = await adminApiClient.getFileAttributes(filePath)
    fileAttributes.value = attrs
    // 重置统计信息
    folderSize.value = null
    folderCount.value = null
    showAttributesDialog.value = true
  } catch (err: any) {
    alert(err.message || '获取属性失败')
  }
}

// 获取文件夹大小
async function getFolderSize() {
  if (!fileAttributes.value?.path) return
  
  loadingFolderSize.value = true
  try {
    const result = await adminApiClient.getFolderSize(fileAttributes.value.path)
    folderSize.value = result.size
  } catch (err: any) {
    alert(err.message || '获取文件夹大小失败')
  } finally {
    loadingFolderSize.value = false
  }
}

// 获取文件夹文件数量
async function getFolderCount() {
  if (!fileAttributes.value?.path) return
  
  loadingFolderCount.value = true
  try {
    const result = await adminApiClient.getFolderCount(fileAttributes.value.path)
    folderCount.value = {
      fileCount: result.fileCount,
      folderCount: result.folderCount,
      totalCount: result.totalCount
    }
  } catch (err: any) {
    alert(err.message || '获取文件数量失败')
  } finally {
    loadingFolderCount.value = false
  }
}

// 批量操作
function toggleSelectAll() {
  if (!directoryData.value?.files) return
  
  const accessibleFiles = directoryData.value.files.filter((f: any) => f.accessible)
  
  if (selectAll.value) {
    selectedFiles.value = accessibleFiles.map((f: any) => getFilePath(f))
  } else {
    selectedFiles.value = []
  }
}

function clearSelection() {
  selectedFiles.value = []
  selectAll.value = false
}

function batchCopyToClipboard() {
  batchClipboardItems.value = [...selectedFiles.value]
  clipboardAction.value = 'copy'
  
  // 临时修改剪贴板项显示
  clipboardItem.value = {
    name: `${selectedFiles.value.length} 个文件/文件夹`
  }
}

async function confirmBatchDelete() {
  if (selectedFiles.value.length === 0) return
  
  loadingBatch.value = true
  try {
    const result = await adminApiClient.batchDelete(selectedFiles.value)
    showBatchDeleteDialog.value = false
    clearSelection()
    
    if (result.results?.failed?.length > 0) {
      alert(`删除完成：成功 ${result.results.success.length} 项，失败 ${result.results.failed.length} 项`)
    }
    
    await loadPath(currentPath.value)
  } catch (err: any) {
    alert(err.message || '批量删除失败')
  } finally {
    loadingBatch.value = false
  }
}

async function confirmBatchMove() {
  if (selectedFiles.value.length === 0 || !batchDestinationPath.value) return
  
  loadingBatch.value = true
  try {
    const result = await adminApiClient.batchMove(selectedFiles.value, batchDestinationPath.value)
    showBatchMoveDialog.value = false
    batchDestinationPath.value = ''
    clearSelection()
    
    if (result.results?.failed?.length > 0) {
      alert(`移动完成：成功 ${result.results.success.length} 项，失败 ${result.results.failed.length} 项`)
    }
    
    await loadPath(currentPath.value)
  } catch (err: any) {
    alert(err.message || '批量移动失败')
  } finally {
    loadingBatch.value = false
  }
}
</script>

<style scoped>
/* 保持原有样式 */
</style>
