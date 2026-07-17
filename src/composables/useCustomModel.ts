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
  const fetchModelsError = ref('')
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

  // 迁移旧的 localStorage 配置到新 store
  async function migrateOldConfigIfNeeded() {
    if (hasMigrated.value) return
    
    // 检查是否有旧配置
    const oldUseCustomModel = localStorage.getItem('role_play_use_custom_model') === 'true'
    const oldConfigStr = localStorage.getItem('role_play_custom_model_config')
    
    if (!oldConfigStr) {
      hasMigrated.value = true
      return
    }

    try {
      const oldConfig = JSON.parse(oldConfigStr)
      if (oldConfig && (oldConfig.api_url || oldConfig.api_key)) {
        // 检查是否已经有配置了
        if (modelConfigStore.configs.length === 0) {
          // 创建新配置
          const newConfig = modelConfigStore.addConfig({
            name: '我的配置',
            provider: oldConfig.provider || 'openai',
            api_url: oldConfig.api_url || '',
            api_key: oldConfig.api_key || '',
            default_model: oldConfig.default_model || '',
            is_default: true
          })
          modelConfigStore.setActive(newConfig.id)
        }
        
        // 保持旧的 useCustomModel 设置
        if (oldUseCustomModel) {
          chatStore.setUseCustomModel(true)
        }
      }
    } catch (e) {
      console.error('迁移旧配置失败:', e)
    }
    
    hasMigrated.value = true
  }

  // 加载当前激活配置的模型列表
  async function loadCurrentConfigModels() {
    const activeConfig = modelConfigStore.activeConfig
    if (!activeConfig) {
      availableCustomModels.value = []
      return
    }

    // 先尝试从 store 的缓存中获取
    const cachedModels = modelConfigStore.modelLists[activeConfig.id]
    if (cachedModels && cachedModels.length > 0) {
      availableCustomModels.value = cachedModels.map(m => m.id)
      return
    }

    // 如果没有缓存，尝试从 localStorage 加载旧数据
    if (loadOldModelsFromStorage(activeConfig)) {
      return
    }
  }

  // 从旧的 localStorage 格式加载模型列表
  function loadOldModelsFromStorage(config: ModelConfig): boolean {
    try {
      const configHash = btoa(config.api_url + '|' + config.api_key.slice(-8))
      const storageKey = `role_play_custom_models_${configHash}`
      const saved = localStorage.getItem(storageKey)
      
      if (saved) {
        const models = JSON.parse(saved)
        if (Array.isArray(models)) {
          availableCustomModels.value = models
          // 缓存到 store
          modelConfigStore.modelLists[config.id] = models.map(id => ({ id }))
          return true
        }
      }
    } catch (e) {
      console.error('加载旧模型列表失败:', e)
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
      const models = await modelConfigStore.refreshModelList(targetConfigId)
      const modelIds = models.map(m => m.id)
      
      // 更新可用模型列表
      if (targetConfigId === modelConfigStore.activeConfigId) {
        availableCustomModels.value = modelIds
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

  // 同步当前激活配置到 chatStore（保持向后兼容）
  function syncToChatStore() {
    const activeConfig = modelConfigStore.activeConfig
    if (activeConfig) {
      chatStore.setCustomModelConfig({
        provider: activeConfig.provider,
        api_url: activeConfig.api_url,
        api_key: activeConfig.api_key,
        default_model: activeConfig.default_model
      })
    }
  }

  // 设置激活配置
  function setActiveConfig(configId: string) {
    modelConfigStore.setActive(configId)
    syncToChatStore()
    loadCurrentConfigModels()
  }

  // 添加新配置
  function addConfig() {
    const newConfig = modelConfigStore.addConfig({
      name: `配置 ${modelConfigStore.configs.length + 1}`
    })
    selectedConfigId.value = newConfig.id
    return newConfig
  }

  // 删除配置
  function deleteConfig(configId: string) {
    modelConfigStore.removeConfig(configId)
    if (selectedConfigId.value === configId) {
      selectedConfigId.value = modelConfigStore.configs[0]?.id || null
    }
    syncToChatStore()
    loadCurrentConfigModels()
  }

  // 复制配置
  function duplicateConfig(configId: string) {
    const newConfig = modelConfigStore.duplicateConfig(configId)
    if (newConfig) {
      selectedConfigId.value = newConfig.id
    }
  }

  // 设置默认配置
  function setDefaultConfig(configId: string) {
    modelConfigStore.setDefault(configId)
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
      if (!modelConfigStore.activeConfig?.api_key || !modelConfigStore.activeConfig?.api_url) {
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

  // 监听激活配置变化，同步到 chatStore
  watch(() => modelConfigStore.activeConfigId, () => {
    syncToChatStore()
    loadCurrentConfigModels()
  })

  // 监听配置变化
  watch(() => modelConfigStore.configs, () => {
    syncToChatStore()
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
  
  // 向后兼容：旧的 updateCustomModelConfig 函数
  function updateCustomModelConfig(field: string, value: any) {
    if (modelConfigStore.activeConfigId) {
      updateConfig(modelConfigStore.activeConfigId, { [field]: value })
    }
  }

  // 向后兼容：旧的 loadCustomModelsFromStorage 函数
  async function loadCustomModelsFromStorage() {
    await loadCurrentConfigModels()
  }

  return {
    showCustomModelConfig,
    customModelConfigs,
    activeCustomModelConfig,
    activeCustomModelConfigId,
    isFetchingModels,
    availableCustomModels,
    fetchModelsError,
    isLoadingBuiltinModels,
    pendingSwitchToBuiltin,
    modelConfigStore,
    selectedConfigId,
    fetchCustomModels,
    updateCustomModelConfig,
    createCustomModelConfig,
    selectCustomModelConfig,
    deleteCustomModelConfig,
    handleServiceSelect,
    switchToBuiltinModel,
    initialize,
    loadCustomModelsFromStorage // 向后兼容
  }
}
