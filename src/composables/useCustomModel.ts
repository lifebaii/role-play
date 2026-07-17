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
  const selectedConfigId = ref<string | null>(null)
  const isFetchingModels = ref(false)
  const fetchModelsError = ref('')
  const isLoadingBuiltinModels = ref(false)
  const pendingSwitchToBuiltin = ref(false)
  let initializePromise: Promise<void> | null = null

  const customModelConfigs = computed(() => modelConfigStore.configList)
  const activeCustomModelConfig = computed(() => modelConfigStore.activeConfig)
  const activeCustomModelConfigId = computed(() => modelConfigStore.activeConfigId || '')
  const availableCustomModels = computed(() => {
    const activeId = modelConfigStore.activeConfigId
    if (!activeId) return []
    return (modelConfigStore.modelLists[activeId] || []).map(model => model.id)
  })

  function toChatConfig(config: ModelConfig | null): CustomModelConfig | null {
    if (!config) return null
    return {
      provider: config.provider,
      api_url: config.api_url,
      api_key: config.api_key,
      default_model: config.default_model,
    }
  }

  function syncActiveConfigToChat() {
    chatStore.setCustomModelConfig(toChatConfig(modelConfigStore.activeConfig))
  }

  function isConfigComplete(config: ModelConfig | null) {
    return Boolean(config?.api_url && config?.api_key && config?.default_model)
  }

  function createEmptyConfig(name?: string) {
    const config = modelConfigStore.addConfig(name ? { name } : undefined)
    modelConfigStore.setActive(config.id)
    selectedConfigId.value = config.id
    syncActiveConfigToChat()
    return config
  }

  async function initializeCustomModelConfigs() {
    if (!initializePromise) {
      initializePromise = (async () => {
        await modelConfigStore.load()

        if (modelConfigStore.configs.length === 0) {
          const legacyConfig = chatStore.customModelConfig
          if (legacyConfig && (legacyConfig.api_url || legacyConfig.api_key || legacyConfig.default_model)) {
            const migrated = modelConfigStore.addConfig({
              name: legacyConfig.default_model || legacyConfig.api_url || '默认配置',
              provider: legacyConfig.provider === 'anthropic' || legacyConfig.provider === 'kobold'
                ? legacyConfig.provider
                : 'openai',
              api_url: legacyConfig.api_url || '',
              api_key: legacyConfig.api_key || '',
              default_model: legacyConfig.default_model || '',
            })
            modelConfigStore.setActive(migrated.id)
          } else {
            createEmptyConfig()
          }
        } else if (!modelConfigStore.activeConfigId && modelConfigStore.activeConfig) {
          modelConfigStore.setActive(modelConfigStore.activeConfig.id)
        }

        selectedConfigId.value = modelConfigStore.activeConfigId
        syncActiveConfigToChat()
      })()
    }
    return initializePromise
  }

  async function promptForIncompleteConfig() {
    await initializeCustomModelConfigs()
    if (!isConfigComplete(modelConfigStore.activeConfig)) {
      selectedConfigId.value = modelConfigStore.activeConfigId
      showCustomModelConfig.value = true
    }
  }

  async function ensureActiveConfig() {
    await initializeCustomModelConfigs()
    return modelConfigStore.activeConfig || createEmptyConfig()
  }

  async function updateCustomModelConfig(field: string, value: string) {
    const activeConfig = await ensureActiveConfig()
    const update: Partial<ModelConfig> = { [field]: value }
    modelConfigStore.updateConfig(activeConfig.id, update)
    syncActiveConfigToChat()
    fetchModelsError.value = ''
  }

  async function createCustomModelConfig() {
    await initializeCustomModelConfigs()
    const config = createEmptyConfig(`配置 ${modelConfigStore.configs.length + 1}`)
    fetchModelsError.value = ''
    return config
  }

  async function selectCustomModelConfig(id: string) {
    await initializeCustomModelConfigs()
    if (!modelConfigStore.configs.some(config => config.id === id)) return
    setActiveConfig(id)
  }

  async function deleteCustomModelConfig(id: string) {
    await initializeCustomModelConfigs()
    if (!modelConfigStore.removeConfig(id)) return
    if (modelConfigStore.configs.length === 0) createEmptyConfig()
    selectedConfigId.value = modelConfigStore.activeConfigId
    syncActiveConfigToChat()
    fetchModelsError.value = ''
  }

  async function fetchCustomModels(configId?: string) {
    await initializeCustomModelConfigs()
    const targetId = configId || modelConfigStore.activeConfigId
    const targetConfig = modelConfigStore.configs.find(config => config.id === targetId)
    if (!targetConfig?.api_url || !targetConfig.api_key) {
      fetchModelsError.value = '请先填写 API 地址和 API Key'
      return
    }

    isFetchingModels.value = true
    fetchModelsError.value = ''
    try {
      const models = await modelConfigStore.refreshModelList(targetConfig.id)
      if (!targetConfig.default_model && models[0]) {
        modelConfigStore.updateConfig(targetConfig.id, { default_model: models[0].id })
      }
      if (targetConfig.id === modelConfigStore.activeConfigId) syncActiveConfigToChat()
    } catch (error: any) {
      fetchModelsError.value = error?.message || '获取模型列表失败，请检查配置'
    } finally {
      isFetchingModels.value = false
    }
  }

  function setActiveConfig(configId: string) {
    if (!modelConfigStore.configs.some(config => config.id === configId)) return
    modelConfigStore.setActive(configId)
    selectedConfigId.value = configId
    chatStore.setUseCustomModel(true)
    fetchModelsError.value = ''
    syncActiveConfigToChat()
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
    if (target.value === 'custom') {
      chatStore.setUseCustomModel(true)
      pendingSwitchToBuiltin.value = false
      if (!isConfigComplete(modelConfigStore.activeConfig)) showCustomModelConfig.value = true
      return
    }
    if (!userStore.isLoggedIn()) {
      pendingSwitchToBuiltin.value = true
      userStore.requireLogin()
      target.value = 'custom'
      return
    }
    await switchToBuiltinModel()
  }

  watch(() => userStore.user, async newUser => {
    if (newUser && pendingSwitchToBuiltin.value) {
      pendingSwitchToBuiltin.value = false
      await switchToBuiltinModel()
    }
  })

  watch(
    () => modelConfigStore.activeConfig,
    () => syncActiveConfigToChat(),
    { deep: true },
  )

  return {
    showCustomModelConfig,
    selectedConfigId,
    customModelConfigs,
    activeCustomModelConfig,
    activeCustomModelConfigId,
    availableCustomModels,
    isFetchingModels,
    fetchModelsError,
    isLoadingBuiltinModels,
    pendingSwitchToBuiltin,
    modelConfigStore,
    fetchCustomModels,
    updateCustomModelConfig,
    createCustomModelConfig,
    selectCustomModelConfig,
    deleteCustomModelConfig,
    handleServiceSelect,
    switchToBuiltinModel,
    setActiveConfig,
    initializeCustomModelConfigs,
    promptForIncompleteConfig,
    loadCustomModelsFromStorage: initializeCustomModelConfigs,
  }
}
