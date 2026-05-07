import { ref, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'

export function useCustomModel() {
  const chatStore = useChatStore()
  const userStore = useUserStore()
  
  const showCustomModelConfig = ref(false)
  const isFetchingModels = ref(false)
  const availableCustomModels = ref<string[]>([])
  const fetchModelsError = ref<string>('')
  const isLoadingBuiltinModels = ref(false)
  const pendingSwitchToBuiltin = ref(false)
  
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
    return false
  }
  
  async function fetchCustomModels() {
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
          updateCustomModelConfig('default_model', availableCustomModels.value[0])
        }
      }
      
    } catch (error: any) {
      fetchModelsError.value = error.message || '获取模型列表失败，请检查配置'
      console.error('获取模型列表失败:', error)
    } finally {
      isFetchingModels.value = false
    }
  }
  
  function updateCustomModelConfig(field: string, value: string) {
    const currentConfig = chatStore.customModelConfig || {
      provider: 'openai',
      api_url: '',
      api_key: '',
      default_model: ''
    }
    const newConfig = {
      ...currentConfig,
      [field]: value
    }
    chatStore.setCustomModelConfig(newConfig)
    
    if (field === 'provider') {
      newConfig.api_url = value === 'anthropic' 
        ? 'https://api.anthropic.com' 
        : 'https://api.openai.com/v1'
      chatStore.setCustomModelConfig(newConfig)
    }
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
  
  return {
    showCustomModelConfig,
    isFetchingModels,
    availableCustomModels,
    fetchModelsError,
    isLoadingBuiltinModels,
    fetchCustomModels,
    updateCustomModelConfig,
    handleServiceSelect,
    loadCustomModelsFromStorage
  }
}
