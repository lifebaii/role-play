import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbSet, dbGet } from '@/utils/db'
import { fetchModelList, testConnection } from '@/utils/llmClient'
import type { ModelInfo } from '@/utils/llmClient'

export interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'openai-compatible' | 'kobold'
  api_url: string
  api_key: string
  default_model: string
  temperature: number
  max_tokens: number
  top_p?: number
  top_k?: number
  frequency_penalty?: number
  presence_penalty?: number
  repetition_penalty?: number
  min_p?: number
  top_a?: number
  context_size?: number
  stop_sequences?: string[]
  is_default?: boolean
}

const STORAGE_KEY = 'model_configs'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function getDefaultConfig(): Omit<ModelConfig, 'id'> {
  return {
    name: '',
    provider: 'openai',
    api_url: '',
    api_key: '',
    default_model: '',
    temperature: 1,
    max_tokens: 4096,
    top_p: 1,
    context_size: 128000,
    stop_sequences: [],
    is_default: false,
  }
}

async function loadConfigs(): Promise<ModelConfig[]> {
  const data = await dbGet<ModelConfig[]>(STORAGE_KEY)
  return data || []
}

async function saveConfigs(configs: ModelConfig[]): Promise<void> {
  await dbSet(STORAGE_KEY, configs)
}

export const useModelConfigStore = defineStore('modelConfig', () => {
  const configs = ref<ModelConfig[]>([])
  const activeConfigId = ref<string | null>(null)
  const modelLists = ref<Record<string, ModelInfo[]>>({})
  const isLoaded = ref(false)

  const activeConfig = computed(() => {
    if (activeConfigId.value) {
      const found = configs.value.find(c => c.id === activeConfigId.value)
      if (found) return found
    }
    const defaultConfig = configs.value.find(c => c.is_default)
    return defaultConfig || configs.value[0] || null
  })

  const configList = computed(() =>
    configs.value.map(c => ({
      id: c.id,
      name: c.name || c.default_model || c.api_url,
      provider: c.provider,
      is_default: c.is_default,
    }))
  )

  async function load() {
    if (isLoaded.value) return
    configs.value = await loadConfigs()
    const savedActiveId = localStorage.getItem('active_model_config_id')
    if (savedActiveId && configs.value.find(c => c.id === savedActiveId)) {
      activeConfigId.value = savedActiveId
    }
    isLoaded.value = true
  }

  function _save() {
    saveConfigs(configs.value)
  }

  function addConfig(data?: Partial<ModelConfig>): ModelConfig {
    const newConfig: ModelConfig = {
      id: generateId(),
      ...getDefaultConfig(),
      ...data,
    }
    if (configs.value.length === 0) {
      newConfig.is_default = true
    }
    configs.value.push(newConfig)
    _save()
    return newConfig
  }

  function updateConfig(id: string, data: Partial<ModelConfig>): boolean {
    const index = configs.value.findIndex(c => c.id === id)
    if (index !== -1) {
      configs.value[index] = { ...configs.value[index], ...data }
      _save()
      return true
    }
    return false
  }

  function removeConfig(id: string): boolean {
    const index = configs.value.findIndex(c => c.id === id)
    if (index !== -1) {
      const wasDefault = configs.value[index].is_default
      configs.value.splice(index, 1)
      if (wasDefault && configs.value.length > 0) {
        configs.value[0].is_default = true
      }
      if (activeConfigId.value === id) {
        activeConfigId.value = configs.value[0]?.id || null
      }
      _save()
      return true
    }
    return false
  }

  function setDefault(id: string): void {
    configs.value.forEach(c => c.is_default = c.id === id)
    _save()
  }

  function setActive(id: string): void {
    activeConfigId.value = id
    localStorage.setItem('active_model_config_id', id)
  }

  async function refreshModelList(configId: string): Promise<ModelInfo[]> {
    const config = configs.value.find(c => c.id === configId)
    if (!config) return []

    const models = await fetchModelList(config)
    modelLists.value[configId] = models
    return models
  }

  async function testConfig(configId: string): Promise<{ success: boolean; message: string }> {
    const config = configs.value.find(c => c.id === configId)
    if (!config) return { success: false, message: '配置不存在' }
    return testConnection(config)
  }

  function duplicateConfig(id: string): ModelConfig | null {
    const source = configs.value.find(c => c.id === id)
    if (!source) return null

    const newConfig: ModelConfig = {
      ...source,
      id: generateId(),
      name: `${source.name} (副本)`,
      is_default: false,
    }
    configs.value.push(newConfig)
    _save()
    return newConfig
  }

  function importConfigs(data: ModelConfig[]): void {
    for (const config of data) {
      configs.value.push({
        ...config,
        id: generateId(),
        is_default: false,
      })
    }
    _save()
  }

  function exportConfigs(): ModelConfig[] {
    return configs.value.map(c => ({ ...c }))
  }

  return {
    configs,
    activeConfigId,
    activeConfig,
    configList,
    modelLists,
    isLoaded,
    load,
    addConfig,
    updateConfig,
    removeConfig,
    setDefault,
    setActive,
    refreshModelList,
    testConfig,
    duplicateConfig,
    importConfigs,
    exportConfigs,
  }
})
