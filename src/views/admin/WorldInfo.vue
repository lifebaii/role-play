<template>
  <div class="p-4 sm:p-8">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--theme-secondary)] to-[var(--theme-secondary-dark)] flex items-center justify-center shadow-lg shadow-[var(--theme-secondary)]/25">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-theme-text-primary">世界书</h1>
          <p class="text-sm text-theme-text-secondary">管理世界设定与知识条目</p>
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
          @click="addEntry"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建条目
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div v-if="entries.length === 0" class="text-center py-16">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center">
          <svg class="w-8 h-8 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p class="text-theme-text-primary font-medium mb-1">暂无世界书条目</p>
        <p class="text-sm text-theme-text-secondary">点击"新建条目"开始创建</p>
      </div>

      <draggable
        v-model="entries"
        item-key="uid"
        class="space-y-4"
        ghost-class="opacity-50"
        animation="200"
      >
        <template #item="{ element, index }">
          <div class="chat-card rounded-xl border border-theme-border shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div class="flex items-center gap-3 p-4 border-b border-theme-border">
              <div class="drag-handle flex-shrink-0 w-8 h-8 flex items-center justify-center text-theme-text-secondary hover:text-[var(--theme-primary)] cursor-grab active:cursor-grabbing">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
              </div>
              <label class="flex items-center gap-2 cursor-pointer group">
                <div class="relative">
                  <input type="checkbox" v-model="element.enabled" class="sr-only peer" />
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <input
                  v-model="element.comment"
                  type="text"
                  class="w-full pl-10 pr-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
                  placeholder="条目名称/备注"
                />
              </div>
              <button
                @click="removeEntry(index)"
                class="p-2 text-theme-text-secondary hover:text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] rounded-lg transition-all"
                title="删除条目"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div class="p-4 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-theme-text-secondary mb-1.5">关键词 (逗号分隔)</label>
                  <input
                    v-model="element.key"
                    type="text"
                    class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary text-sm placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
                    placeholder="如: 魔法, 法术, 咒语"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-theme-text-secondary mb-1.5">关键词匹配方式</label>
                  <select
                    v-model="element.keylogic"
                    class="w-full px-4 py-2.5 select-field border border-theme-border rounded-xl text-theme-text-primary text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all"
                  >
                    <option value="AND">AND - 全部匹配</option>
                    <option value="NOT">NOT - 排除匹配</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-theme-text-secondary mb-1.5">插入位置</label>
                  <select
                    v-model="element.position"
                    class="w-full px-4 py-2.5 select-field border border-theme-border rounded-xl text-theme-text-primary text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all"
                  >
                    <option value="before_char">角色定义之前</option>
                    <option value="after_char">角色定义之后</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-theme-text-secondary mb-1.5">插入顺序 (越小越靠前)</label>
                  <input
                    v-model.number="element.insertion_order"
                    type="number"
                    class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary text-sm placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-theme-text-secondary mb-1.5">内容</label>
                <textarea
                  v-model="element.content"
                  rows="4"
                  class="w-full px-4 py-3 chat-input-field border border-theme-border rounded-xl text-theme-text-primary text-sm placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all resize-y min-h-[100px] font-mono"
                  placeholder="输入世界书条目内容..."
                ></textarea>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-theme-text-secondary">{{ (element.content || '').length }} 字符</span>
                <select
                  v-model="element.selective"
                  class="px-3 py-1.5 select-field border border-theme-border rounded-lg text-theme-text-primary text-xs focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all"
                >
                  <option :value="true">选择性激活</option>
                  <option :value="false">始终激活</option>
                </select>
              </div>
              <div v-if="element.selective" class="pt-3 border-t border-theme-border">
                <label class="block text-xs font-medium text-theme-text-secondary mb-1.5">次要关键词 (逗号分隔)</label>
                <input
                  v-model="element.keysecondary"
                  type="text"
                  class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary text-sm placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
                  placeholder="次要关键词，仅在主关键词匹配时检查"
                />
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <div v-if="entries.length > 0" class="mt-6 flex items-center justify-between">
      <p class="text-sm text-theme-text-secondary">共 {{ entries.length }} 个条目</p>
      <button
        @click="saveEntries"
        :disabled="isSaving"
        class="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:opacity-50 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
      >
        <svg v-if="isSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ isSaving ? '保存中...' : '保存所有条目' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import type { WorldInfoEntry } from '@/types'
import { worldInfoApi } from '@/api'
import { useDialog } from '@/composables/useDialog'

const { showSuccessAlert, showErrorAlert, showDangerConfirm, showAlert } = useDialog()
const entries = ref<WorldInfoEntry[]>([])
const isSaving = ref(false)

async function loadEntries() {
  try {
    entries.value = await worldInfoApi.list()
  } catch (e) {
    console.error('Failed to load world info:', e)
  }
}

async function saveEntries() {
  try {
    isSaving.value = true
    await worldInfoApi.update(entries.value)
    await showSuccessAlert('保存成功')
  } catch (e: any) {
    await showErrorAlert('保存失败: ' + e.message)
  } finally {
    isSaving.value = false
  }
}

function addEntry() {
  entries.value.push({
    uid: Date.now().toString(),
    key: '',
    keysecondary: '',
    comment: '',
    content: '',
    enabled: true,
    position: 'after_char',
    insertion_order: 100,
    selective: false,
    keylogic: 'AND'
  })
}

async function removeEntry(index: number) {
  const confirmed = await showDangerConfirm('确定要删除这个条目吗？')
  if (confirmed) {
    entries.value.splice(index, 1)
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

    await worldInfoApi.import({ entries: data })
    await loadEntries()
    await showAlert(`成功导入 ${data.length} 个条目`)
  } catch (err: any) {
    await showErrorAlert('导入失败: ' + err.message)
  }

  ;(event.target as HTMLInputElement).value = ''
}

onMounted(() => {
  loadEntries()
})
</script>
