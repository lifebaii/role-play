<template>
  <div class="p-4 sm:p-8 pb-8">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--theme-accent)] to-[var(--theme-accent-light)] flex items-center justify-center shadow-lg shadow-[var(--theme-accent)]/25">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-theme-text-primary">模型配置</h1>
        <p class="text-sm text-theme-text-secondary">管理 AI 模型提供商和 API</p>
      </div>
    </div>

    <div class="chat-card rounded-2xl p-4 sm:p-6 border border-theme-border shadow-lg shadow-[var(--theme-primary)]/5 mb-6">
      <label class="block text-sm font-medium text-theme-text-primary mb-2">全局默认模型</label>
      <select
        v-model="globalDefaultModel"
        class="w-full px-4 py-2.5 select-field border border-theme-border rounded-xl text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all"
      >
        <option value="">-- 请选择默认模型 --</option>
        <option v-for="m in uniqueModels" :key="m.id" :value="m.id">
          {{ m.name }} (由 {{ m.providers.map(p => p.name).join('、') }} 提供)
        </option>
      </select>
      <p v-if="uniqueModels.length === 0" class="mt-2 text-sm text-theme-text-secondary">
        请先在下方选择至少一个可用模型
      </p>
    </div>

    <div class="chat-card rounded-2xl p-4 sm:p-6 border border-theme-border shadow-lg shadow-[var(--theme-primary)]/5">

      <div v-for="(model, index) in models" :key="model.id" class="mb-6 pb-6 border-b border-theme-border last:border-0 last:mb-0 last:pb-0">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-semibold text-theme-text-primary">
            {{ model.name || '未命名' }}
          </h3>
          <div class="flex gap-2">
            <button
              @click="copyModelItem(index)"
              class="px-3 py-1.5 bg-[var(--theme-primary)]/10 text-theme-text-accent rounded-lg text-sm hover:bg-[var(--theme-primary)]/20 transition-all font-medium"
              :disabled="isCopying === index"
            >
              {{ isCopying === index ? '拷贝中...' : '📋 拷贝' }}
            </button>
            <button
              @click="deleteModelItem(index)"
              class="px-3 py-1.5 bg-[var(--theme-danger-bg)] text-[var(--theme-danger)] rounded-lg text-sm hover:opacity-80 transition-all font-medium"
              :disabled="isDeleting === index"
            >
              {{ isDeleting === index ? '删除中...' : '🗑️ 删除' }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-1">提供商名称</label>
            <input
              v-model="model.name"
              type="text"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="如 DeepSeek、Claude"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-1">API 类型</label>
            <select
              v-model="model.provider"
              class="w-full px-4 py-2.5 select-field border border-theme-border rounded-xl text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:outline-none transition-all"
              @change="handleProviderChange(index)"
            >
              <option value="openai">OpenAI 兼容（GPT、DeepSeek 等）</option>
              <option value="anthropic">Anthropic (Claude)</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-theme-text-primary mb-1">API URL</label>
            <input
              v-model="model.api_url"
              type="text"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-theme-text-primary mb-1">API Key</label>
            <div class="flex gap-2">
              <input
                :type="showApiKey[index] ? 'text' : 'password'"
                v-model="model.api_key"
                class="flex-1 px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
                placeholder="sk-..."
              />
              <button
                @click="toggleApiKey(index)"
                class="px-4 py-2.5 chat-card border border-theme-border text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] transition-all"
                :title="showApiKey[index] ? '隐藏' : '显示'"
              >
                {{ showApiKey[index] ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="sm:col-span-2">
            <button
              @click="fetchModels(index)"
              class="px-4 py-2 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:opacity-50 text-sm font-medium shadow-md transition-all"
              :disabled="!model.api_key || fetchingIndex === index"
            >
              {{ fetchingIndex === index ? '获取中...' : '获取模型列表' }}
            </button>
          </div>

          <div v-if="model.available_models && model.available_models.length > 0" class="sm:col-span-2">
            <div class="mt-3 p-4 bg-[var(--theme-card-hover)] rounded-xl border border-theme-border">
              <div class="mb-3 space-y-2">
                <input
                  v-model="modelSearch[index]"
                  type="text"
                  placeholder="搜索模型..."
                  class="w-full px-3 py-2 chat-input-field border border-theme-border rounded-lg text-theme-text-primary text-sm placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
                  @input="filterModels(index)"
                />
                <div class="flex gap-2 flex-wrap items-center">
                  <button
                    @click="selectAllModels(index)"
                    class="px-3 py-1 text-xs bg-[var(--theme-primary)]/10 text-theme-text-accent rounded-lg hover:bg-[var(--theme-primary)]/20 transition-all font-medium"
                  >
                    全选
                  </button>
                  <button
                    @click="invertSelection(index)"
                    class="px-3 py-1 text-xs chat-card border border-theme-border text-theme-text-secondary rounded-lg hover:bg-[var(--theme-card-hover)] transition-all font-medium"
                  >
                    反选
                  </button>
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-theme-text-secondary">并发数:</span>
                    <input
                      v-model.number="testConcurrency[index]"
                      type="number"
                      min="1"
                      max="20"
                      class="w-16 px-2 py-1 chat-input-field border border-theme-border rounded-lg text-theme-text-primary text-sm"
                    />
                  </div>
                  <button
                    @click="testAllModels(index)"
                    class="px-3 py-1 text-xs bg-gradient-to-r from-[var(--theme-success)] to-[var(--theme-success-light)] text-white rounded-lg hover:opacity-90 transition-all font-medium disabled:opacity-50"
                    :disabled="testingAllIndex === index || !model.available_models || model.available_models.length === 0"
                  >
                    {{ testingAllIndex === index ? `测试中... ${testedCount[index] || 0}/${getFilteredModels(index).length || 0}` : '🧪 测试所有模型' }}
                  </button>
                </div>
              </div>
              <div class="max-h-96 overflow-y-auto border border-theme-border rounded-xl">
                <div
                  v-for="m in getFilteredModels(index)"
                  :key="m.id"
                  class="px-3 py-2 border-b last:border-b-0 border-theme-border transition-colors"
                  :class="{
                    'bg-green-50 dark:bg-green-900/20': testResults[model.id]?.[m.id]?.success,
                    'bg-red-50 dark:bg-red-900/20': testResults[model.id]?.[m.id]?.success === false,
                    'bg-blue-50 dark:bg-blue-900/20': (testingAllIndex === index || testingModels[model.id]?.[m.id]) && !testResults[model.id]?.[m.id],
                    'hover:bg-[var(--theme-card-hover)]': !testResults[model.id]?.[m.id] && !(testingAllIndex === index || testingModels[model.id]?.[m.id])
                  }"
                >
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        :checked="isModelSelected(index, m.id)"
                        @change="toggleModel(index, m.id)"
                        class="rounded border-theme-border w-4 h-4 text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
                      />
                      <span class="text-sm text-theme-text-primary">{{ m.name }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div v-if="testResults[model.id] && testResults[model.id][m.id]" class="text-sm">
                        <span v-if="testResults[model.id][m.id].success" class="text-green-500">
                          ✓ {{ testResults[model.id][m.id].duration }}ms
                        </span>
                        <span v-else class="text-red-500" :title="testResults[model.id][m.id].error">
                          ✗ {{ testResults[model.id][m.id].error?.substring(0, 30) }}{{ testResults[model.id][m.id].error?.length > 30 ? '...' : '' }}
                        </span>
                      </div>
                      <div v-else-if="(testingAllIndex === index || testingModels[model.id]?.[m.id])" class="text-sm text-theme-text-secondary">
                        <span class="animate-pulse">...</span>
                      </div>
                      <button
                        @click="openMappingModal(index, m.id)"
                        class="px-2 py-0.5 text-xs bg-[var(--theme-primary)]/10 text-theme-text-accent rounded hover:bg-[var(--theme-primary)]/20 transition-all"
                      >
                        添加别名
                      </button>
                      <button
                        @click="testSingleModel(index, m.id)"
                        class="px-2 py-0.5 text-xs bg-[var(--theme-accent)]/10 text-theme-text-accent rounded hover:bg-[var(--theme-accent)]/20 transition-all"
                        :disabled="testingModels[model.id]?.[m.id]"
                      >
                        测试
                      </button>
                    </div>
                  </div>
                  
                  <!-- 显示该模型的所有别名 -->
                  <div v-if="model.model_id_mapping && model.model_id_mapping[m.id] && model.model_id_mapping[m.id].length > 0" class="ml-6 space-y-1">
                    <div
                      v-for="alias in model.model_id_mapping[m.id]"
                      :key="alias"
                      class="flex items-center justify-between gap-2 text-xs"
                    >
                      <div class="flex items-center gap-1">
                        <span class="text-theme-text-secondary">别名：</span>
                        <span
                          class="text-theme-text-accent cursor-pointer hover:underline"
                          @click="editModelAlias(index, m.id, alias)"
                        >
                          {{ alias }}
                        </span>
                        <span class="text-theme-text-secondary">→</span>
                        <span class="text-theme-text-primary">{{ m.id }}</span>
                      </div>
                      <button
                        @click="removeModelAlias(index, m.id, alias)"
                        class="px-1.5 py-0.5 text-[var(--theme-danger)] hover:text-[var(--theme-danger)] rounded hover:bg-[var(--theme-danger-bg)] transition-all"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="getFilteredModels(index).length === 0" class="px-3 py-4 text-center text-theme-text-secondary">
                  没有找到匹配的模型
                </div>
              </div>
              <div class="mt-2 text-sm text-theme-text-secondary">
                已选择 {{ getSelectedCount(index) }} 个模型
              </div>
            </div>
            
            <!-- 模型别名概览 -->
            <div class="mt-4 p-4 bg-[var(--theme-card-hover)] rounded-xl border border-theme-border">
              <div class="flex justify-between items-center mb-3">
                <h4 class="text-sm font-medium text-theme-text-primary">所有模型别名概览</h4>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(aliases, originalModelId) in model.model_id_mapping"
                  :key="originalModelId"
                >
                  <div
                    v-for="alias in aliases"
                    :key="alias"
                    class="flex items-center justify-between gap-2 px-3 py-2 bg-[var(--theme-card)] rounded-lg border border-theme-border"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="text-sm text-theme-text-accent cursor-pointer hover:underline"
                        @click="editModelAlias(index, originalModelId, alias)"
                      >
                        {{ alias }}
                      </span>
                      <span class="text-theme-text-secondary">→</span>
                      <span class="text-sm text-theme-text-primary">{{ originalModelId }}</span>
                    </div>
                    <button
                      @click="removeModelAlias(index, originalModelId, alias)"
                      class="px-2 py-1 text-xs text-[var(--theme-danger)] hover:text-[var(--theme-danger)] rounded hover:bg-[var(--theme-danger-bg)] transition-all"
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div v-if="!model.model_id_mapping || Object.values(model.model_id_mapping).flat().length === 0" class="text-sm text-theme-text-secondary text-center py-2">
                  暂无别名配置，请在模型列表中点击「添加别名」按钮配置
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="h-32"></div>

    <div class="fixed bottom-0 left-0 right-0 chat-overlay border-t border-theme-border p-4 shadow-lg z-50">
      <div class="max-w-6xl mx-auto flex flex-wrap gap-3 justify-center">
        <button
          @click="addNewModel"
          class="px-6 py-3 bg-gradient-to-r from-[var(--theme-success)] to-[var(--theme-success-light)] text-white rounded-xl hover:opacity-90 shadow-md hover:shadow-lg transition-all font-medium"
        >
          ➕ 新建模型提供商
        </button>
        <button
          @click="saveModels"
          class="px-6 py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:opacity-50 shadow-md hover:shadow-lg transition-all font-medium"
          :disabled="isSaving"
        >
          {{ isSaving ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </div>

    <!-- 添加模型别名模态框 -->
    <div v-if="mappingModal.show" class="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-[99999] p-4">
      <div class="chat-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-theme-border">
        <div class="p-4 sm:p-6 border-b border-theme-border bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)]">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-theme-text-primary">{{ mappingModal.isEdit ? '编辑模型别名' : '添加模型别名' }}</h3>
          </div>
        </div>
        
        <div class="p-4 sm:p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">原始模型</label>
            <input
              type="text"
              :value="mappingModal.originalModelId"
              readonly
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-secondary bg-[var(--theme-card-hover)]"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">新别名</label>
            <input
              v-model="mappingModal.newAlias"
              type="text"
              class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
              placeholder="请输入新的别名"
              @keydown.enter="saveModelMapping"
            />
            <p class="text-xs text-theme-text-secondary mt-1">这个别名会映射到上面的原始模型</p>
          </div>
        </div>
        
        <div class="p-4 border-t border-theme-border flex gap-3">
          <button
            @click="mappingModal.show = false"
            class="flex-1 px-4 py-2.5 chat-card text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] transition-all duration-200 font-medium border border-theme-border text-sm"
          >
            取消
          </button>
          <button
            @click="saveModelMapping"
            class="flex-1 px-4 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium text-sm"
            :disabled="!mappingModal.newAlias"
          >
            {{ mappingModal.isEdit ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useAdminStore } from '@/stores/admin'
import type { Model } from '@/types'
import { useDialog } from '@/composables/useDialog'

const adminStore = useAdminStore()
const { showDangerConfirm, showSuccessAlert, showErrorAlert, showAlert } = useDialog()
const models = ref<Model[]>([])
const uniqueModels = ref<{ id: string; name: string; providers: { id: string; name: string }[] }[]>([])
const globalDefaultModel = ref<string>('')
const isSaving = ref(false)
const isDeleting = ref<number | null>(null)
const isCopying = ref<number | null>(null)
const testingId = ref<string | null>(null)
const testingAllIndex = ref<number | null>(null)
const fetchingIndex = ref<number | null>(null)
const modelSearch = reactive({})
const showApiKey = reactive({})
const testResults = reactive({})
const testedCount = reactive({})
const testConcurrency = reactive({})
const testingModels = reactive({})
const mappingModal = reactive({
  show: false,
  modelIndex: 0,
  originalModelId: '',
  newAlias: '',
  oldAlias: '',
  isEdit: false
})

onMounted(async () => {
  await adminStore.loadModels()
  models.value = JSON.parse(JSON.stringify(adminStore.models))
  globalDefaultModel.value = adminStore.globalDefaultModel

  models.value.forEach((model, index) => {
    modelSearch[index] = ''
    showApiKey[index] = false
    testConcurrency[index] = 5
    // 确保每个模型都有 model_id_mapping 字段
    if (!model.model_id_mapping) {
      model.model_id_mapping = {}
    }
    
    // 如果有可用模型列表，清理已选择的模型和默认模型
    if (model.available_models && model.available_models.length > 0) {
      const availableModelIds = new Set(model.available_models.map(m => m.id))
      
      // 清理已选择的模型
      if (model.selected_models) {
        model.selected_models = model.selected_models.filter(id => availableModelIds.has(id))
      } else {
        model.selected_models = []
      }
      
      // 清理默认模型
      if (model.default_model && !availableModelIds.has(model.default_model)) {
        model.default_model = ''
      }
    }
  })

  await loadUniqueModels()
})

async function loadUniqueModels() {
  try {
    uniqueModels.value = await adminStore.loadUniqueModels()
  } catch (e: any) {
    console.error('加载去重模型列表失败:', e)
  }
}

function addNewModel() {
  const newId = 'model_' + Date.now()
  const newModel: Model = {
    id: newId,
    name: '',
    provider: 'openai',
    api_key: '',
    api_url: 'https://api.openai.com/v1',
    default_model: '',
    is_default: models.value.length === 0,
    available_models: [],
    selected_models: [],
    model_id_mapping: {}
  }

  models.value.push(newModel)
  const newIndex = models.value.length - 1
  modelSearch[newIndex] = ''
  showApiKey[newIndex] = false
  testConcurrency[newIndex] = 5
}

function openMappingModal(index: number, originalModelId: string) {
  mappingModal.modelIndex = index
  mappingModal.originalModelId = originalModelId
  mappingModal.newAlias = ''
  mappingModal.oldAlias = ''
  mappingModal.isEdit = false
  mappingModal.show = true
}

function editModelAlias(index: number, originalModelId: string, oldAlias: string) {
  mappingModal.modelIndex = index
  mappingModal.originalModelId = originalModelId
  mappingModal.newAlias = oldAlias
  mappingModal.oldAlias = oldAlias
  mappingModal.isEdit = true
  mappingModal.show = true
}

function saveModelMapping() {
  const model = models.value[mappingModal.modelIndex]
  if (!model.model_id_mapping) {
    model.model_id_mapping = {}
  }
  
  if (!model.model_id_mapping[mappingModal.originalModelId]) {
    model.model_id_mapping[mappingModal.originalModelId] = []
  }
  
  if (mappingModal.isEdit) {
    // 编辑模式：替换旧别名为新别名
    if (mappingModal.oldAlias && mappingModal.newAlias) {
      const idx = model.model_id_mapping[mappingModal.originalModelId].indexOf(mappingModal.oldAlias)
      if (idx !== -1) {
        // 检查新别名是否已存在（除了旧的）
        const otherAliases = model.model_id_mapping[mappingModal.originalModelId].filter(a => a !== mappingModal.oldAlias)
        if (!otherAliases.includes(mappingModal.newAlias)) {
          model.model_id_mapping[mappingModal.originalModelId][idx] = mappingModal.newAlias
        }
      }
    }
  } else {
    // 添加模式：添加新别名
    if (mappingModal.newAlias && !model.model_id_mapping[mappingModal.originalModelId].includes(mappingModal.newAlias)) {
      model.model_id_mapping[mappingModal.originalModelId].push(mappingModal.newAlias)
    }
  }
  
  mappingModal.show = false
}

function removeModelAlias(index: number, originalModelId: string, alias: string) {
  const model = models.value[index]
  if (model.model_id_mapping && model.model_id_mapping[originalModelId]) {
    const idx = model.model_id_mapping[originalModelId].indexOf(alias)
    if (idx !== -1) {
      model.model_id_mapping[originalModelId].splice(idx, 1)
      // 如果该模型没有别名了，删除这个键
      if (model.model_id_mapping[originalModelId].length === 0) {
        delete model.model_id_mapping[originalModelId]
      }
    }
  }
}

function copyModelItem(index: number) {
  const originalModel = models.value[index]
  const newId = 'model_' + Date.now()

  const copiedModel: Model = {
    ...JSON.parse(JSON.stringify(originalModel)),
    id: newId,
    name: originalModel.name ? originalModel.name + ' (副本)' : '未命名 (副本)',
    is_default: false,
    model_id_mapping: JSON.parse(JSON.stringify(originalModel.model_id_mapping || {}))
  }

  models.value.push(copiedModel)
  const newIndex = models.value.length - 1
  modelSearch[newIndex] = ''
  showApiKey[newIndex] = false
  testConcurrency[newIndex] = testConcurrency[index] || 5
}

async function deleteModelItem(index: number) {
  const model = models.value[index]
  const confirmed = await showDangerConfirm(`确定要删除模型提供商 "${model.name || '未命名'}" 吗？`)
  if (!confirmed) {
    return
  }

  isDeleting.value = index
  try {
    await adminStore.deleteModel(model.id)
    models.value.splice(index, 1)
    if (testResults[model.id]) {
      delete testResults[model.id]
    }
  } catch (e: any) {
    await showErrorAlert('删除失败: ' + e.message)
  } finally {
    isDeleting.value = null
  }
}

function toggleApiKey(index: number) {
  showApiKey[index] = !showApiKey[index]
}

function handleDefaultChange(index: number) {
  if (models.value[index].is_default) {
    models.value.forEach((m, i) => {
      if (i !== index) m.is_default = false
    })
  }
}

function handleProviderChange(index: number) {
  const model = models.value[index]
  if (model.provider === 'openai') {
    model.api_url = 'https://api.openai.com/v1'
  } else if (model.provider === 'anthropic') {
    model.api_url = 'https://api.anthropic.com'
  }
}

async function fetchModels(index: number) {
  const model = models.value[index]
  if (!model.api_key) return

  fetchingIndex.value = index
  try {
    const modelList = await adminStore.fetchModelList({
      apiKey: model.api_key,
      apiUrl: model.api_url,
      provider: model.provider
    })
    models.value[index].available_models = modelList
    
    if (!models.value[index].selected_models) {
      models.value[index].selected_models = []
    } else {
      // 从已选择的模型中移除不再在新列表中的模型
      const availableModelIds = new Set(modelList.map(m => m.id))
      models.value[index].selected_models = models.value[index].selected_models.filter(
        id => availableModelIds.has(id)
      )
      
      // 检查默认模型是否还在可用列表中，如果不在就清空
      if (models.value[index].default_model && !availableModelIds.has(models.value[index].default_model)) {
        models.value[index].default_model = ''
      }
      
      // 如果默认模型存在但不在已选择列表中，添加进去
      if (models.value[index].default_model && !models.value[index].selected_models.includes(models.value[index].default_model)) {
        models.value[index].selected_models.push(models.value[index].default_model)
      }
    }
    
    if (testResults[model.id]) {
      delete testResults[model.id]
    }
  } catch (e: any) {
    await showErrorAlert('获取模型列表失败: ' + e.message)
  } finally {
    fetchingIndex.value = null
  }
}

function getFilteredModels(index: number): { id: string; name: string }[] {
  const model = models.value[index]
  if (!model.available_models) return []

  const search = modelSearch[index]?.toLowerCase() || ''
  return model.available_models.filter(m => m.name.toLowerCase().includes(search))
}

function filterModels(index: number) {}

function isModelSelected(index: number, modelId: string): boolean {
  const model = models.value[index]
  return model.selected_models?.includes(modelId) || false
}

function toggleModel(index: number, modelId: string) {
  const model = models.value[index]
  if (!model.selected_models) {
    model.selected_models = []
  }

  const idx = model.selected_models.indexOf(modelId)
  if (idx === -1) {
    model.selected_models.push(modelId)
  } else {
    model.selected_models.splice(idx, 1)
  }

  loadUniqueModels()
}

function getSelectedCount(index: number): number {
  return models.value[index].selected_models?.length || 0
}

function selectAllModels(index: number) {
  const model = models.value[index]
  if (!model.available_models) return
  model.selected_models = model.available_models.map(m => m.id)
}

function invertSelection(index: number) {
  const model = models.value[index]
  if (!model.available_models) return
  if (!model.selected_models) model.selected_models = []

  const selectedSet = new Set(model.selected_models)
  model.selected_models = model.available_models
    .map(m => m.id)
    .filter(id => !selectedSet.has(id))
}

async function saveModels() {
  try {
    isSaving.value = true
    await adminStore.saveModels(models.value, globalDefaultModel.value)
    await showSuccessAlert('保存成功')
  } catch (e: any) {
    await showErrorAlert('保存失败: ' + e.message)
  } finally {
    isSaving.value = false
  }
}

async function testModel(id: string) {
  const model = models.value.find(m => m.id === id)
  if (!model) return
  
  testingId.value = id
  try {
    const success = await adminStore.testModel({
      apiKey: model.api_key,
      apiUrl: model.api_url,
      provider: model.provider
    })
    await showAlert(success ? '连接成功' : '连接失败')
  } finally {
    testingId.value = null
  }
}

async function testSingleModel(providerIndex: number, modelId: string) {
  const providerModel = models.value[providerIndex]
  if (!providerModel) return

  if (!testingModels[providerModel.id]) {
    testingModels[providerModel.id] = {}
  }
  testingModels[providerModel.id][modelId] = true

  try {
    const result = await adminStore.testSingleModel({
      model_id: providerModel.id,
      model: modelId
    })

    if (!testResults[providerModel.id]) {
      testResults[providerModel.id] = {}
    }
    testResults[providerModel.id][modelId] = {
      success: true,
      duration: result.duration
    }
  } catch (e: any) {
    if (!testResults[providerModel.id]) {
      testResults[providerModel.id] = {}
    }
    testResults[providerModel.id][modelId] = {
      success: false,
      error: e.message,
      duration: e.duration || 0
    }
  } finally {
    testingModels[providerModel.id][modelId] = false
  }
}

async function testAllModels(providerIndex: number) {
  const model = models.value[providerIndex]
  if (!model.available_models || model.available_models.length === 0) {
    return
  }

  testingAllIndex.value = providerIndex
  testedCount[providerIndex] = 0
  testResults[model.id] = {}
  if (!testingModels[model.id]) {
    testingModels[model.id] = {}
  }

  const concurrency = testConcurrency[providerIndex] || 5
  const modelIds = getFilteredModels(providerIndex).map(m => m.id)

  async function concurrencyControl() {
    const executing: Promise<void>[] = []
    const results: { modelId: string; success: boolean; error?: string; duration: number }[] = []
    let index = 0

    async function next() {
      if (index >= modelIds.length) return
      const mid = modelIds[index++]

      testingModels[model.id][mid] = true

      try {
        const result = await adminStore.testSingleModel({
          model_id: model.id,
          model: mid
        })
        testResults[model.id][mid] = {
          success: true,
          duration: result.duration
        }
        results.push({
          modelId: mid,
          success: true,
          duration: result.duration
        })
      } catch (e: any) {
        testResults[model.id][mid] = {
          success: false,
          error: e.message,
          duration: e.duration || 0
        }
        results.push({
          modelId: mid,
          success: false,
          error: e.message,
          duration: e.duration || 0
        })
      } finally {
        testingModels[model.id][mid] = false
        testedCount[providerIndex]++
        await next()
      }
    }

    for (let i = 0; i < concurrency; i++) {
      executing.push(next())
    }

    await Promise.all(executing)
    return results
  }

  try {
    const results = await concurrencyControl()
    const successCount = results.filter(r => r.success).length
    await showAlert(`测试完成: ${successCount}/${results.length} 成功`)
  } catch (e: any) {
    await showErrorAlert('测试失败: ' + e.message)
  } finally {
    testingAllIndex.value = null
  }
}
</script>
