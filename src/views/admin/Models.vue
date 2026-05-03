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
              class="w-full px-4 py-2.5 select-field border border-theme-border rounded-xl text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all"
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
                <div class="flex gap-2">
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
                </div>
              </div>
              <div class="max-h-48 overflow-y-auto border border-theme-border rounded-xl">
                <div
                  v-for="m in getFilteredModels(index)"
                  :key="m.id"
                  class="flex items-center gap-2 px-3 py-2 hover:bg-[var(--theme-card-hover)] border-b last:border-b-0 border-theme-border transition-colors"
                >
                  <input
                    type="checkbox"
                    :checked="isModelSelected(index, m.id)"
                    @change="toggleModel(index, m.id)"
                    class="rounded border-theme-border w-4 h-4 text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
                  />
                  <span class="text-sm text-theme-text-primary">{{ m.name }}</span>
                </div>
                <div v-if="getFilteredModels(index).length === 0" class="px-3 py-4 text-center text-theme-text-secondary">
                  没有找到匹配的模型
                </div>
              </div>
              <div class="mt-2 text-sm text-theme-text-secondary">
                已选择 {{ getSelectedCount(index) }} 个模型
              </div>
            </div>
          </div>

          <div class="sm:col-span-2">
            <button
              @click="testModel(model.id)"
              class="w-full sm:w-auto px-4 py-2 chat-card border border-theme-border text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] disabled:opacity-50 font-medium transition-all"
              :disabled="testingId === model.id"
            >
              {{ testingId === model.id ? '测试中...' : '测试连接' }}
            </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useAdminStore } from '@/stores/admin'
import type { Model } from '@/types'

const adminStore = useAdminStore()
const models = ref<Model[]>([])
const uniqueModels = ref<{ id: string; name: string; providers: { id: string; name: string }[] }[]>([])
const globalDefaultModel = ref<string>('')
const isSaving = ref(false)
const isDeleting = ref<number | null>(null)
const isCopying = ref<number | null>(null)
const testingId = ref<string | null>(null)
const fetchingIndex = ref<number | null>(null)
const modelSearch = reactive<Record<number, string>>({})
const showApiKey = reactive<Record<number, boolean>>({})

onMounted(async () => {
  await adminStore.loadModels()
  models.value = JSON.parse(JSON.stringify(adminStore.models))
  globalDefaultModel.value = adminStore.globalDefaultModel

  models.value.forEach((_, index) => {
    modelSearch[index] = ''
    showApiKey[index] = false
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
    selected_models: []
  }

  models.value.push(newModel)
  const newIndex = models.value.length - 1
  modelSearch[newIndex] = ''
  showApiKey[newIndex] = true
}

function copyModelItem(index: number) {
  const originalModel = models.value[index]
  const newId = 'model_' + Date.now()

  const copiedModel: Model = {
    ...JSON.parse(JSON.stringify(originalModel)),
    id: newId,
    name: originalModel.name ? originalModel.name + ' (副本)' : '未命名 (副本)',
    is_default: false
  }

  models.value.push(copiedModel)
  const newIndex = models.value.length - 1
  modelSearch[newIndex] = ''
  showApiKey[newIndex] = true
}

async function deleteModelItem(index: number) {
  const model = models.value[index]
  if (!confirm(`确定要删除模型提供商 "${model.name || '未命名'}" 吗？`)) {
    return
  }

  isDeleting.value = index
  try {
    await adminStore.deleteModel(model.id)
    models.value.splice(index, 1)
  } catch (e: any) {
    alert('删除失败: ' + e.message)
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
    const modelList = await adminStore.fetchModelList(model.id)
    models.value[index].available_models = modelList
    if (!models.value[index].selected_models) {
      models.value[index].selected_models = []
    }
    if (models.value[index].default_model && !models.value[index].selected_models.includes(models.value[index].default_model)) {
      models.value[index].selected_models.push(models.value[index].default_model)
    }
  } catch (e: any) {
    alert('获取模型列表失败: ' + e.message)
  } finally {
    fetchingIndex.value = null
  }
}

function getFilteredModels(index: number): { id: string; name: string }[] {
  const model = models.value[index]
  if (!model.available_models) return []

  const search = modelSearch[index]?.toLowerCase() || ''
  return model.available_models.filter(m =>
    m.name.toLowerCase().includes(search)
  )
}

function filterModels(index: number) {
}

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
    alert('保存成功')
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  } finally {
    isSaving.value = false
  }
}

async function testModel(id: string) {
  testingId.value = id
  try {
    const success = await adminStore.testModel(id)
    alert(success ? '连接成功' : '连接失败')
  } finally {
    testingId.value = null
  }
}
</script>
