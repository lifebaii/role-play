<template>
  <div class="p-4 sm:p-8">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--theme-accent)] to-[var(--theme-accent-dark)] flex items-center justify-center shadow-lg shadow-[var(--theme-accent)]/25">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-theme-text-primary">正则脚本</h1>
          <p class="text-sm text-theme-text-secondary">管理文本替换和格式化规则</p>
        </div>
      </div>
      <button
        @click="addScript"
        class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建脚本
      </button>
    </div>

    <div class="space-y-4">
      <div v-if="scripts.length === 0" class="text-center py-16">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center">
          <svg class="w-8 h-8 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <p class="text-theme-text-primary font-medium mb-1">暂无正则脚本</p>
        <p class="text-sm text-theme-text-secondary">点击"新建脚本"开始创建</p>
      </div>

      <draggable
        v-model="scripts"
        item-key="scriptName"
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <input
                  v-model="element.scriptName"
                  type="text"
                  class="w-full pl-10 pr-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
                  placeholder="脚本名称"
                />
              </div>
              <button
                @click="removeScript(index)"
                class="p-2 text-theme-text-secondary hover:text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] rounded-lg transition-all"
                title="删除脚本"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div class="p-4 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-theme-text-secondary mb-1.5">正则表达式</label>
                  <input
                    v-model="element.findRegex"
                    type="text"
                    class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary text-sm placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all font-mono"
                    placeholder="/pattern/flags"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-theme-text-secondary mb-1.5">替换内容</label>
                  <input
                    v-model="element.replaceString"
                    type="text"
                    class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary text-sm placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all font-mono"
                    placeholder="$1"
                  />
                </div>
              </div>
              <div class="flex flex-wrap gap-3">
                <label class="flex items-center gap-2 px-3 py-2 bg-[var(--theme-card-hover)] rounded-lg border border-theme-border cursor-pointer hover:bg-[var(--theme-primary)]/5 transition-colors">
                  <input type="checkbox" v-model="element.trimStrings" class="rounded border-theme-border w-4 h-4 text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]" />
                  <span class="text-sm text-theme-text-primary">裁剪字符串</span>
                </label>
                <label class="flex items-center gap-2 px-3 py-2 bg-[var(--theme-card-hover)] rounded-lg border border-theme-border cursor-pointer hover:bg-[var(--theme-primary)]/5 transition-colors">
                  <input type="checkbox" v-model="element.placement" class="rounded border-theme-border w-4 h-4 text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]" />
                  <span class="text-sm text-theme-text-primary">仅 AI 输出</span>
                </label>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <div v-if="scripts.length > 0" class="mt-6 flex items-center justify-between">
      <p class="text-sm text-theme-text-secondary">共 {{ scripts.length }} 个脚本</p>
      <button
        @click="saveScripts"
        :disabled="isSaving"
        class="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:opacity-50 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
      >
        <svg v-if="isSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ isSaving ? '保存中...' : '保存所有脚本' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import type { RegexScript } from '@/types'
import { regexApi } from '@/api'

const scripts = ref<RegexScript[]>([])
const isSaving = ref(false)

async function loadScripts() {
  try {
    scripts.value = await regexApi.list()
  } catch (e) {
    console.error('Failed to load regex scripts:', e)
  }
}

async function saveScripts() {
  try {
    isSaving.value = true
    await regexApi.update(scripts.value)
    alert('保存成功')
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  } finally {
    isSaving.value = false
  }
}

function addScript() {
  scripts.value.push({
    scriptName: '',
    findRegex: '',
    replaceString: '',
    trimStrings: false,
    placement: false,
    enabled: true
  })
}

function removeScript(index: number) {
  if (confirm('确定要删除这个脚本吗？')) {
    scripts.value.splice(index, 1)
  }
}

onMounted(() => {
  loadScripts()
})
</script>
