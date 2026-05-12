import { computed, ref, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { useModelConfigStore, type ModelConfig } from '@/stores/modelConfig'
import type { CustomModelConfig } from '@/types'

export function useCustomModel() {
  const chatStore = useChatStore()
  const userStore = useUserStore()
  const modelConfigStore = useModelConfigStore()
  
  const showCustomModelConfig = ref(false)
  const isFetchingModels = ref(false)
  const availableCustomModels = ref<string[]>([])
  const fetchModelsError = ref<string>('')
  const isLoadingBuiltinModels = ref(false)
  const pendingSwitchToBuiltin = ref(false)
  let initializePromise: Promise<void> | null = null

  const customModelConfigs = computed(() => modelConfigStore.configList)
  const activeCustomModelConfig = computed(() => modelConfigStore.activeConfig)
  const activeCustomModelConfigId = computed(() => modelConfigStore.activeConfig?.id || '')

  function toChatConfig(config: ModelConfig | null): CustomModelConfig | null {
    if (!config) return null
    return {
      provider: config.provider,
      api_url: config.api_url,
      api_key: config.api_key,
      default_model: config.default_model
    }
  }

  function hasCustomModelConfig(config: CustomModelConfig | null) {
    return Boolean(config?.api_url || config?.api_key || config?.default_model)
  }

  function normalizeProvider(provider?: string): ModelConfig['provider'] {
    if (provider === 'anthropic' || provider === 'openai-compatible' || provider === 'kobold') {
      return provider
    }
    return 'openai'
  }

  function getConfigName(config?: Partial<CustomModelConfig>) {
    return config?.default_model || config?.api_url || '默认配置'
  }

  function syncActiveConfigToChat() {
    chatStore.setCustomModelConfig(toChatConfig(modelConfigStore.activeConfig))
  }

  function createEmptyConfig(name = '默认配置') {
    const config = modelConfigStore.addConfig({ name })
    modelConfigStore.setActive(config.id)
    syncActiveConfigToChat()
    return config
  }

  async function initializeCustomModelConfigs() {
    if (!initializePromise) {
      initializePromise = (async () => {
        await modelConfigStore.load()

        if (modelConfigStore.configs.length === 0) {
          const legacyConfig = chatStore.customModelConfig

          if (hasCustomModelConfig(legacyConfig)) {
            const migratedConfig = modelConfigStore.addConfig({
              name: getConfigName(legacyConfig || undefined),
              provider: normalizeProvider(legacyConfig?.provider),
              api_url: legacyConfig?.api_url || '',
              api_key: legacyConfig?.api_key || '',
              default_model: legacyConfig?.default_model || ''
            })
            modelConfigStore.setActive(migratedConfig.id)
          }
        } else if (!modelConfigStore.activeConfigId && modelConfigStore.activeConfig) {
          modelConfigStore.setActive(modelConfigStore.activeConfig.id)
        }

        syncActiveConfigToChat()
        loadCustomModelsFromStorage()
      })()
    }

    return initializePromise
  }
  
  function getCustomModelsStorageKey() {
    if (!chatStore.customModelConfig?.api_url || !chatStore.customModelConfig?.api_key) {
      return null
    }
    const configHash = btoa(chatStore.customModelConfig.api_url + '|' + chatStore.customModelConfig.api_key.slice(-8))
    return `role_play_custom_models_${configHash}`
  }
  
  function saveCustomModelsToStorage() {
    const storageKey = getCustomModelsStorageKey()
    if (storageKey && availableCustomModels.value.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(availableCustomModels.value))
    }
  }
  
  function loadCustomModelsFromStorage() {
    const storageKey = getCustomModelsStorageKey()
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const models = JSON.parse(saved)
          if (Array.isArray(models)) {
            availableCustomModels.value = models
            return true
          }
        }
      } catch (e) {
        console.error('加载保存的模型列表失败:', e)
      }
    }
    availableCustomModels.value = []
    return false
  }
  
  async function fetchCustomModels() {
    await initializeCustomModelConfigs()

    if (!chatStore.customModelConfig?.api_url || !chatStore.customModelConfig?.api_key) {
      fetchModelsError.value = '请先填写 API 地址和 API Key'
      return
    }

    isFetchingModels.value = true
    fetchModelsError.value = ''
    
    try {
      const provider = chatStore.customModelConfig.provider || 'openai'
      
      if (provider === 'anthropic') {
        availableCustomModels.value = [
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307'
        ]
      } else {
        let baseUrl = chatStore.customModelConfig.api_url
        if (!baseUrl.endsWith('/')) baseUrl += '/'
        
        const response = await fetch(`${baseUrl}models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${chatStore.customModelConfig.api_key}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`获取模型列表失败: ${response.status} ${errorText}`)
        }
        
        const data = await response.json()
        
        if (data.data && Array.isArray(data.data)) {
          availableCustomModels.value = data.data
            .map((model: any) => model.id)
            .filter((id: string) => id)
        } else {
          throw new Error('返回数据格式不正确')
        }
      }
      
      saveCustomModelsToStorage()
      
      if (availableCustomModels.value.length > 0) {
        const currentModel = chatStore.customModelConfig?.default_model
        if (!currentModel) {
          await updateCustomModelConfig('default_model', availableCustomModels.value[0])
        }
      }
      
    } catch (error: any) {
      fetchModelsError.value = error.message || '获取模型列表失败，请检查配置'
      console.error('获取模型列表失败:', error)
    } finally {
      isFetchingModels.value = false
    }
  }
  
  async function ensureActiveConfig() {
    await initializeCustomModelConfigs()

    if (modelConfigStore.activeConfig) {
      return modelConfigStore.activeConfig
    }

    return createEmptyConfig()
  }

  async function updateCustomModelConfig(field: string, value: string) {
    const activeConfig = await ensureActiveConfig()
    const updateData = {
      [field]: value
    } as Partial<ModelConfig>

    if (field === 'provider') {
      updateData.provider = normalizeProvider(value)
      updateData.api_url = value === 'anthropic'
        ? 'https://api.anthropic.com' 
        : 'https://api.openai.com/v1'
    }

    modelConfigStore.updateConfig(activeConfig.id, updateData)
    syncActiveConfigToChat()

    if (field === 'api_url' || field === 'api_key' || field === 'provider') {
      loadCustomModelsFromStorage()
    }
  }

  async function createCustomModelConfig() {
    await initializeCustomModelConfigs()
    const config = modelConfigStore.addConfig({ name: `配置 ${modelConfigStore.configs.length + 1}` })
    modelConfigStore.setActive(config.id)
    fetchModelsError.value = ''
    syncActiveConfigToChat()
    loadCustomModelsFromStorage()
  }

  async function selectCustomModelConfig(id: string) {
    await initializeCustomModelConfigs()
    if (!id || !modelConfigStore.configs.some(config => config.id === id)) return

    modelConfigStore.setActive(id)
    fetchModelsError.value = ''
    syncActiveConfigToChat()
    loadCustomModelsFromStorage()
  }

  async function deleteCustomModelConfig(id: string) {
    await initializeCustomModelConfigs()
    if (!id) return

    modelConfigStore.removeConfig(id)

    if (modelConfigStore.configs.length === 0) {
      createEmptyConfig()
    } else if (modelConfigStore.activeConfig) {
      modelConfigStore.setActive(modelConfigStore.activeConfig.id)
    }

    fetchModelsError.value = ''
    syncActiveConfigToChat()
    loadCustomModelsFromStorage()
  }
  
  async function switchToBuiltinModel() {
    chatStore.setUseCustomModel(false)
    
    isLoadingBuiltinModels.value = true
    try {
      await chatStore.loadModels(true)
    } finally {
      isLoadingBuiltinModels.value = false
    }
  }
  
  async function handleServiceSelect(event: Event) {
    const target = event.target as HTMLSelectElement
    const value = target.value
    
    if (value === 'custom') {
      if (!chatStore.customModelConfig?.api_key || !chatStore.customModelConfig?.api_url) {
        showCustomModelConfig.value = true
      }
      chatStore.setUseCustomModel(true)
      pendingSwitchToBuiltin.value = false
    } else {
      if (!userStore.isLoggedIn()) {
        pendingSwitchToBuiltin.value = true
        userStore.requireLogin()
        target.value = 'custom'
        return
      }
      await switchToBuiltinModel()
    }
  }
  
  watch(() => userStore.user, async (newUser) => {
    if (newUser && pendingSwitchToBuiltin.value) {
      pendingSwitchToBuiltin.value = false
      await switchToBuiltinModel()
    }
  })
  
  watch(() => chatStore.customModelConfig, (newConfig) => {
    if (newConfig?.api_url && newConfig?.api_key) {
      loadCustomModelsFromStorage()
    }
  }, { deep: true })

  watch(
    () => modelConfigStore.activeConfig,
    () => {
      syncActiveConfigToChat()
    },
    { deep: true }
  )

  initializeCustomModelConfigs().catch(error => {
    console.error('初始化自定义模型配置失败:', error)
  })
  
  return {
    showCustomModelConfig,
    customModelConfigs,
    activeCustomModelConfig,
    activeCustomModelConfigId,
    isFetchingModels,
    availableCustomModels,
    fetchModelsError,
    isLoadingBuiltinModels,
    fetchCustomModels,
    updateCustomModelConfig,
    createCustomModelConfig,
    selectCustomModelConfig,
    deleteCustomModelConfig,
    handleServiceSelect,
    loadCustomModelsFromStorage
  }
}
