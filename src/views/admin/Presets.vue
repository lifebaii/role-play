<template>
  <div class="p-4 sm:p-8">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--theme-secondary)] to-[var(--theme-accent)] flex items-center justify-center shadow-lg shadow-[var(--theme-secondary)]/25">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-theme-text-primary">预设管理</h1>
          <p class="text-sm text-theme-text-secondary">管理系统提示词预设</p>
        </div>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <label class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 chat-card border border-theme-border text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] cursor-pointer transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          导入
          <input type="file" accept=".json" class="hidden" @change="handleImport" />
        </label>
        <button
          @click="addPreset"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建预设
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div v-if="presets.length === 0" class="text-center py-16">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center">
          <svg class="w-8 h-8 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-theme-text-primary font-medium mb-1">暂无预设</p>
        <p class="text-sm text-theme-text-secondary">点击"新建预设"开始创建</p>
      </div>

      <draggable
        v-model="presets"
        item-key="name"
        class="space-y-4"
        ghost-class="opacity-50"
        animation="200"
      >
        <template #item="{ element, index }">
          <div
            class="chat-card rounded-xl border border-theme-border shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <div class="flex items-center gap-3 p-4 border-b border-theme-border">
              <div class="drag-handle flex-shrink-0 w-8 h-8 flex items-center justify-center text-theme-text-secondary hover:text-[var(--theme-primary)] cursor-grab active:cursor-grabbing">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
              </div>
              <label class="flex items-center gap-2 cursor-pointer group">
                <div class="relative">
                  <input
                    type="checkbox"
                    v-model="element.enabled"
                    class="sr-only peer"
                  />
                  <div class="w-5 h-5 rounded border-2 border-theme-border bg-[var(--theme-input-bg)] peer-checked:bg-[var(--theme-primary)] peer-checked:border-[var(--theme-primary)] transition-all flex items-center justify-center">
                    <svg v-if="element.enabled" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span class="text-xs text-theme-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  {{ element.enabled ? '已启用' : '已禁用' }}
                </span>
              </label>
              <div class="flex-1 relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <input
                  v-model="element.name"
                  type="text"
                  class="w-full pl-10 pr-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
                  placeholder="预设名称"
                />
              </div>
              <button
                @click="removePreset(index)"
                class="p-2 text-theme-text-secondary hover:text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] rounded-lg transition-all"
                title="删除预设"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div class="p-4">
              <label class="block text-xs font-medium text-theme-text-secondary mb-2">预设内容</label>
              <textarea
                v-model="element.prompt"
                rows="4"
                class="w-full px-4 py-3 chat-input-field border border-theme-border rounded-xl text-theme-text-primary text-sm placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all resize-y min-h-[120px] font-mono"
                placeholder="输入预设内容..."
              ></textarea>
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-theme-text-secondary">{{ (element.prompt || '').length }} 字符</span>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <div v-if="presets.length > 0" class="mt-6 flex items-center justify-between">
      <p class="text-sm text-theme-text-secondary">共 {{ presets.length }} 个预设</p>
      <button
        @click="savePresets"
        :disabled="isSaving"
        class="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:opacity-50 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
      >
        <svg v-if="isSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        {{ isSaving ? '保存中...' : '保存所有预设' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import type { Preset } from '@/types'
import { presetsApi } from '@/api'

const presets = ref<Preset[]>([])
const isSaving = ref(false)

async function loadPresets() {
  try {
    presets.value = await presetsApi.list()
  } catch (e) {
    console.error('Failed to load presets:', e)
  }
}

async function savePresets() {
  try {
    isSaving.value = true
    await presetsApi.update(presets.value)
    alert('保存成功')
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  } finally {
    isSaving.value = false
  }
}

function addPreset() {
  presets.value.push({
    name: '',
    prompt: '',
    enabled: true
  })
}

function removePreset(index: number) {
  if (confirm('确定要删除这个预设吗？')) {
    presets.value.splice(index, 1)
  }
}

async function handleImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    let data = JSON.parse(text)

    if (!Array.isArray(data)) {
      data = [data]
    }

    await presetsApi.import({ presets: data })
    await loadPresets()
    alert(`成功导入 ${data.length} 个预设`)
  } catch (err: any) {
    alert('导入失败: ' + err.message)
  }

  ;(event.target as HTMLInputElement).value = ''
}

onMounted(() => {
  loadPresets()
})
</script>
