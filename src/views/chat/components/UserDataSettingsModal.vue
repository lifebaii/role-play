<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" @click.self="$emit('update:visible', false)">
    <div class="chat-card rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col shadow-2xl border border-theme-border" style="max-height: min(90vh, calc(var(--vh, 1vh) * 90));">
      <div class="p-4 sm:p-6 border-b border-theme-border flex items-center justify-between bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center shadow-lg">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-theme-text-primary">本地用户数据设置</h2>
            <p class="text-xs text-theme-text-secondary">管理你的预设、世界书和正则脚本</p>
          </div>
        </div>
        <button @click="$emit('update:visible', false)" class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-[var(--theme-card-hover)] text-theme-text-secondary hover:text-theme-text-primary transition-all duration-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="border-b border-theme-border flex-shrink-0">
        <div class="flex">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="['flex-1 px-4 py-3 text-sm font-medium transition-all relative', 
              activeTab === tab.key 
                ? 'text-theme-text-accent' 
                : 'text-theme-text-secondary hover:text-theme-text-primary']"
          >
            <div class="flex items-center justify-center gap-2">
              <component :is="tab.icon" class="w-4 h-4" />
              <span>{{ tab.label }}</span>
              <span class="text-xs bg-[var(--theme-card-hover)] px-1.5 py-0.5 rounded-full">{{ tab.count }}</span>
            </div>
            <div v-if="activeTab === tab.key" class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)]"></div>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 sm:p-6">
        <div v-if="activeTab === 'presets'">
          <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-theme-text-secondary">预设会在每次对话时插入到系统提示词中</p>
            <div class="flex gap-2">
              <label class="flex items-center gap-1.5 px-3 py-2 chat-card border border-theme-border rounded-lg hover:bg-[var(--theme-card-hover)] cursor-pointer transition-all text-xs">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导入
                <input type="file" accept=".json" class="hidden" @change="handleImportPresets" />
              </label>
              <button @click="handleExportPresets" class="flex items-center gap-1.5 px-3 py-2 chat-card border border-theme-border rounded-lg hover:bg-[var(--theme-card-hover)] transition-all text-xs">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出
              </button>
              <button @click="openPresetEditor()" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--theme-secondary)] to-[var(--theme-secondary-light)] text-white rounded-lg hover:from-[var(--theme-secondary-dark)] hover:to-[var(--theme-secondary)] transition-all shadow-md font-medium text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                新建
              </button>
            </div>
          </div>

          <div v-if="userDataStore.presets.length === 0" class="text-center py-12">
            <div class="w-16 h-16 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p class="text-theme-text-primary font-medium mb-1">暂无预设</p>
            <p class="text-sm text-theme-text-secondary">点击"新建"开始创建</p>
          </div>

          <draggable v-else v-model="presetsList" item-key="id" class="space-y-3" ghost-class="opacity-50" animation="200" handle=".drag-handle">
            <template #item="{ element, index }">
              <div class="bg-[var(--theme-card-hover)] border border-theme-border rounded-xl p-4">
                <div class="flex items-start gap-3">
                  <div class="drag-handle flex-shrink-0 w-8 h-8 flex items-center justify-center text-theme-text-secondary hover:text-[var(--theme-secondary)] cursor-move">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <input type="checkbox" :checked="element.enabled" @change="togglePreset(element.id)" class="w-4 h-4 rounded border-theme-border bg-[var(--theme-input-bg)] text-[var(--theme-secondary)] focus:ring-[var(--theme-secondary)]" />
                      <span class="font-medium text-theme-text-primary truncate">{{ element.name || '未命名预设' }}</span>
                    </div>
                    <div class="text-xs text-theme-text-secondary line-clamp-2">
                      {{ (element.prompt || '').substring(0, 100) }}{{ (element.prompt || '').length > 100 ? '...' : '' }}
                    </div>
                    <div class="flex gap-2 mt-3">
                      <button @click="openPresetEditor(index)" class="px-3 py-1 text-xs text-theme-text-accent hover:bg-[var(--theme-secondary)]/10 rounded-lg">编辑</button>
                      <button @click="removePreset(element.id)" class="px-3 py-1 text-xs text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] rounded-lg">删除</button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <div v-if="activeTab === 'worldInfo'">
          <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-theme-text-secondary">世界书条目会在对话中根据关键词自动触发</p>
            <div class="flex gap-2">
              <label class="flex items-center gap-1.5 px-3 py-2 chat-card border border-theme-border rounded-lg hover:bg-[var(--theme-card-hover)] cursor-pointer transition-all text-xs">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导入
                <input type="file" accept=".json" class="hidden" @change="handleImportWorldInfo" />
              </label>
              <button @click="handleExportWorldInfo" class="flex items-center gap-1.5 px-3 py-2 chat-card border border-theme-border rounded-lg hover:bg-[var(--theme-card-hover)] transition-all text-xs">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出
              </button>
              <button @click="openWorldInfoEditor()" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-light)] text-white rounded-lg hover:from-[var(--theme-accent-dark)] hover:to-[var(--theme-accent)] transition-all shadow-md font-medium text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                新建
              </button>
            </div>
          </div>

          <div v-if="userDataStore.worldInfo.length === 0" class="text-center py-12">
            <div class="w-16 h-16 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p class="text-theme-text-primary font-medium mb-1">暂无世界书条目</p>
            <p class="text-sm text-theme-text-secondary">点击"新建"开始创建</p>
          </div>

          <draggable v-else v-model="worldInfoList" item-key="id" class="space-y-3" ghost-class="opacity-50" animation="200" handle=".drag-handle">
            <template #item="{ element, index }">
              <div class="bg-[var(--theme-card-hover)] border border-theme-border rounded-xl p-4">
                <div class="flex items-start gap-3">
                  <div class="drag-handle flex-shrink-0 w-8 h-8 flex items-center justify-center text-theme-text-secondary hover:text-[var(--theme-accent)] cursor-move">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <input type="checkbox" :checked="element.enabled" @change="toggleWorldInfo(element.id)" class="w-4 h-4 rounded border-theme-border bg-[var(--theme-input-bg)] text-[var(--theme-accent)] focus:ring-[var(--theme-accent)]" />
                      <span class="font-medium text-theme-text-primary truncate">{{ element.comment || '未命名条目' }}</span>
                      <span v-if="element.constant" class="text-[10px] bg-[var(--theme-success-bg)] text-[var(--theme-success)] px-1.5 py-0.5 rounded">常驻</span>
                    </div>
                    <div class="text-xs text-theme-text-secondary">
                      关键词: {{ Array.isArray(element.keys) ? element.keys.join(', ') : element.keys || '无' }}
                    </div>
                    <div class="flex gap-2 mt-3">
                      <button @click="openWorldInfoEditor(index)" class="px-3 py-1 text-xs text-theme-text-accent hover:bg-[var(--theme-accent)]/10 rounded-lg">编辑</button>
                      <button @click="removeWorldInfo(element.id)" class="px-3 py-1 text-xs text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] rounded-lg">删除</button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <div v-if="activeTab === 'regex'">
          <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-theme-text-secondary">正则脚本会在输出时自动替换匹配的文本</p>
            <div class="flex gap-2">
              <label class="flex items-center gap-1.5 px-3 py-2 chat-card border border-theme-border rounded-lg hover:bg-[var(--theme-card-hover)] cursor-pointer transition-all text-xs">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导入
                <input type="file" accept=".json" class="hidden" @change="handleImportRegex" />
              </label>
              <button @click="handleExportRegex" class="flex items-center gap-1.5 px-3 py-2 chat-card border border-theme-border rounded-lg hover:bg-[var(--theme-card-hover)] transition-all text-xs">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出
              </button>
              <button @click="openRegexEditor()" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--theme-primary-light)] to-[var(--theme-primary)] text-white rounded-lg hover:from-[var(--theme-primary)] hover:to-[var(--theme-primary-dark)] transition-all shadow-md font-medium text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                新建
              </button>
            </div>
          </div>

          <div v-if="userDataStore.regexScripts.length === 0" class="text-center py-12">
            <div class="w-16 h-16 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <p class="text-theme-text-primary font-medium mb-1">暂无正则脚本</p>
            <p class="text-sm text-theme-text-secondary">点击"新建"开始创建</p>
          </div>

          <draggable v-else v-model="regexList" item-key="id" class="space-y-3" ghost-class="opacity-50" animation="200" handle=".drag-handle">
            <template #item="{ element, index }">
              <div class="bg-[var(--theme-card-hover)] border border-theme-border rounded-xl p-4">
                <div class="flex items-start gap-3">
                  <div class="drag-handle flex-shrink-0 w-8 h-8 flex items-center justify-center text-theme-text-secondary hover:text-[var(--theme-primary)] cursor-move">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <input type="checkbox" :checked="element.enabled" @change="toggleRegex(element.id)" class="w-4 h-4 rounded border-theme-border bg-[var(--theme-input-bg)] text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]" />
                      <span class="font-medium text-theme-text-primary truncate">{{ element.name || '未命名脚本' }}</span>
                    </div>
                    <div class="text-xs text-theme-text-secondary font-mono bg-[var(--theme-input-bg)] px-2 py-1 rounded inline-block">
                      {{ element.regex || '无正则表达式' }}
                    </div>
                    <div class="flex gap-2 mt-3">
                      <button @click="openRegexEditor(index)" class="px-3 py-1 text-xs text-theme-text-accent hover:bg-[var(--theme-primary)]/10 rounded-lg">编辑</button>
                      <button @click="removeRegex(element.id)" class="px-3 py-1 text-xs text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] rounded-lg">删除</button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>

      <div class="p-4 sm:p-6 border-t border-theme-border flex justify-between items-center bg-gradient-to-r from-[var(--theme-gradient-start)]/5 to-[var(--theme-gradient-end)]/5 flex-shrink-0">
        <div class="flex gap-2">
          <label class="flex items-center gap-2 px-3 py-2 chat-card border border-theme-border rounded-xl hover:bg-[var(--theme-card-hover)] cursor-pointer transition-all text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            全部导入
            <input type="file" accept=".json" class="hidden" @change="handleImportAll" />
          </label>
          <button @click="handleExportAll" class="flex items-center gap-2 px-3 py-2 chat-card border border-theme-border rounded-xl hover:bg-[var(--theme-card-hover)] transition-all text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            全部导出
          </button>
        </div>
        <button @click="$emit('update:visible', false)" class="px-6 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium text-sm">
          完成
        </button>
      </div>
    </div>

    <WorldInfoEditor
      v-model:visible="showWorldInfoEditor"
      :editing-data="editingWorldInfoData"
      @save="saveWorldInfo"
    />

    <PresetEditor
      v-model:visible="showPresetEditor"
      :editing-data="editingPresetData"
      @save="savePreset"
    />

    <RegexEditor
      v-model:visible="showRegexEditor"
      :editing-data="editingRegexData"
      @save="saveRegex"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import draggable from 'vuedraggable'
import { useUserDataStore, type UserWorldInfo, type UserPreset, type UserRegexScript } from '@/stores/userData'
import WorldInfoEditor from '@/components/WorldInfoEditor.vue'
import PresetEditor from '@/components/PresetEditor.vue'
import RegexEditor from '@/components/RegexEditor.vue'
import { useDialog } from '@/composables/useDialog'

const { showDangerConfirm, showAlert, showErrorAlert } = useDialog()

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const userDataStore = useUserDataStore()

const activeTab = ref<'presets' | 'worldInfo' | 'regex'>('presets')

const PresetIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
])

const WorldInfoIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' })
])

const RegexIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' })
])

const tabs = computed(() => [
  { key: 'presets', label: '预设', count: userDataStore.presets.length, icon: PresetIcon },
  { key: 'worldInfo', label: '世界书', count: userDataStore.worldInfo.length, icon: WorldInfoIcon },
  { key: 'regex', label: '正则', count: userDataStore.regexScripts.length, icon: RegexIcon }
])

const presetsList = computed({
  get: () => userDataStore.presets,
  set: (val) => { userDataStore.presets = val; userDataStore.presets.forEach((p, i) => p.order = i); userDataStore._save(); }
})

const worldInfoList = computed({
  get: () => userDataStore.worldInfo,
  set: (val) => { userDataStore.worldInfo = val; userDataStore._save(); }
})

const regexList = computed({
  get: () => userDataStore.regexScripts,
  set: (val) => { userDataStore.regexScripts = val; userDataStore._save(); }
})

const showPresetEditor = ref(false)
const editingPresetIndex = ref<number | undefined>(undefined)
const editingPresetData = computed(() => 
  editingPresetIndex.value !== undefined ? userDataStore.presets[editingPresetIndex.value] : undefined
)

const showWorldInfoEditor = ref(false)
const editingWorldInfoIndex = ref<number | undefined>(undefined)
const editingWorldInfoData = computed(() => 
  editingWorldInfoIndex.value !== undefined ? userDataStore.worldInfo[editingWorldInfoIndex.value] : undefined
)

const showRegexEditor = ref(false)
const editingRegexIndex = ref<number | undefined>(undefined)
const editingRegexData = computed(() => 
  editingRegexIndex.value !== undefined ? userDataStore.regexScripts[editingRegexIndex.value] : undefined
)

function openPresetEditor(index?: number) {
  editingPresetIndex.value = index
  showPresetEditor.value = true
}

function savePreset(data: any) {
  if (editingPresetIndex.value !== undefined) {
    userDataStore.updatePreset(userDataStore.presets[editingPresetIndex.value].id, data)
  } else {
    userDataStore.addPreset(data)
  }
  editingPresetIndex.value = undefined
}

async function removePreset(id: string) {
  const confirmed = await showDangerConfirm('确定要删除这个预设吗？')
  if (confirmed) {
    userDataStore.removePreset(id)
  }
}

function togglePreset(id: string) {
  userDataStore.togglePreset(id)
}

function openWorldInfoEditor(index?: number) {
  editingWorldInfoIndex.value = index
  showWorldInfoEditor.value = true
}

function saveWorldInfo(data: any) {
  if (editingWorldInfoIndex.value !== undefined) {
    userDataStore.updateWorldInfo(userDataStore.worldInfo[editingWorldInfoIndex.value].id, data)
  } else {
    userDataStore.addWorldInfo(data)
  }
  editingWorldInfoIndex.value = undefined
}

async function removeWorldInfo(id: string) {
  const confirmed = await showDangerConfirm('确定要删除这个世界书条目吗？')
  if (confirmed) {
    userDataStore.removeWorldInfo(id)
  }
}

function toggleWorldInfo(id: string) {
  userDataStore.toggleWorldInfo(id)
}

function openRegexEditor(index?: number) {
  editingRegexIndex.value = index
  showRegexEditor.value = true
}

function saveRegex(data: any) {
  if (editingRegexIndex.value !== undefined) {
    userDataStore.updateRegexScript(userDataStore.regexScripts[editingRegexIndex.value].id, data)
  } else {
    userDataStore.addRegexScript(data)
  }
  editingRegexIndex.value = undefined
}

async function removeRegex(id: string) {
  const confirmed = await showDangerConfirm('确定要删除这个正则脚本吗？')
  if (confirmed) {
    userDataStore.removeRegexScript(id)
  }
}

function toggleRegex(id: string) {
  userDataStore.toggleRegexScript(id)
}

function handleImportPresets(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      const presets = Array.isArray(data) ? data : (data.presets || [])
      if (presets.length > 0) {
        userDataStore.presets = presets.map((p: any) => ({
          ...p,
          id: p.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
        }))
        userDataStore._save()
        await showAlert(`成功导入 ${presets.length} 个预设`)
      } else {
        await showErrorAlert('未找到有效的预设数据')
      }
    } catch (err: any) {
      await showErrorAlert('导入失败: ' + err.message)
    }
  }
  reader.readAsText(file)
  ;(event.target as HTMLInputElement).value = ''
}

async function handleExportPresets() {
  if (userDataStore.presets.length === 0) {
    await showErrorAlert('暂无预设可导出')
    return
  }
  const blob = new Blob([JSON.stringify(userDataStore.presets, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'user_presets.json'
  a.click()
  URL.revokeObjectURL(url)
}

function handleImportWorldInfo(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      const worldInfo = Array.isArray(data) ? data : (data.worldInfo || data.world_info || [])
      if (worldInfo.length > 0) {
        userDataStore.worldInfo = worldInfo.map((w: any) => ({
          ...w,
          id: w.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
        }))
        userDataStore._save()
        await showAlert(`成功导入 ${worldInfo.length} 个世界书条目`)
      } else {
        await showErrorAlert('未找到有效的世界书数据')
      }
    } catch (err: any) {
      await showErrorAlert('导入失败: ' + err.message)
    }
  }
  reader.readAsText(file)
  ;(event.target as HTMLInputElement).value = ''
}

async function handleExportWorldInfo() {
  if (userDataStore.worldInfo.length === 0) {
    await showErrorAlert('暂无世界书可导出')
    return
  }
  const blob = new Blob([JSON.stringify(userDataStore.worldInfo, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'user_world_info.json'
  a.click()
  URL.revokeObjectURL(url)
}

function handleImportRegex(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      const regexScripts = Array.isArray(data) ? data : (data.regexScripts || data.regex_scripts || [])
      if (regexScripts.length > 0) {
        userDataStore.regexScripts = regexScripts.map((r: any) => ({
          ...r,
          id: r.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
        }))
        userDataStore._save()
        await showAlert(`成功导入 ${regexScripts.length} 个正则脚本`)
      } else {
        await showErrorAlert('未找到有效的正则脚本数据')
      }
    } catch (err: any) {
      await showErrorAlert('导入失败: ' + err.message)
    }
  }
  reader.readAsText(file)
  ;(event.target as HTMLInputElement).value = ''
}

async function handleExportRegex() {
  if (userDataStore.regexScripts.length === 0) {
    await showErrorAlert('暂无正则脚本可导出')
    return
  }
  const blob = new Blob([JSON.stringify(userDataStore.regexScripts, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'user_regex_scripts.json'
  a.click()
  URL.revokeObjectURL(url)
}

function handleImportAll(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      let importCount = 0
      
      if (data.presets && Array.isArray(data.presets) && data.presets.length > 0) {
        userDataStore.presets = data.presets.map((p: any) => ({
          ...p,
          id: p.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
        }))
        importCount += data.presets.length
      }
      
      if (data.worldInfo && Array.isArray(data.worldInfo) && data.worldInfo.length > 0) {
        userDataStore.worldInfo = data.worldInfo.map((w: any) => ({
          ...w,
          id: w.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
        }))
        importCount += data.worldInfo.length
      }
      
      if (data.regexScripts && Array.isArray(data.regexScripts) && data.regexScripts.length > 0) {
        userDataStore.regexScripts = data.regexScripts.map((r: any) => ({
          ...r,
          id: r.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
        }))
        importCount += data.regexScripts.length
      }
      
      if (importCount > 0) {
        userDataStore._save()
        await showAlert(`成功导入 ${importCount} 条数据`)
      } else {
        await showErrorAlert('未找到有效的数据')
      }
    } catch (err: any) {
      await showErrorAlert('导入失败: ' + err.message)
    }
  }
  reader.readAsText(file)
  ;(event.target as HTMLInputElement).value = ''
}

async function handleExportAll() {
  const total = userDataStore.presets.length + userDataStore.worldInfo.length + userDataStore.regexScripts.length
  if (total === 0) {
    await showErrorAlert('暂无数据可导出')
    return
  }
  const data = {
    presets: userDataStore.presets,
    worldInfo: userDataStore.worldInfo,
    regexScripts: userDataStore.regexScripts
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'user_data.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>
