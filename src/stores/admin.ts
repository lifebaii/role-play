import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Model, Character, AdminSettings } from '@/types'
import { adminApi, charactersApi, modelsApi } from '@/api'
import { eventBus } from '@/utils/eventBus'

// 辅助函数
function getCharacterId(character: any): string {
  return character?.role_play?.id || character?.id || ''
}

export const useAdminStore = defineStore('admin', () => {
  // 初始化时检查本地 token，直接设置状态，避免等待
  const tokenExists = !!localStorage.getItem('admin_token')
  const isLoggedIn = ref(tokenExists)
  const isLoading = ref(false)
  const hasVerified = ref(tokenExists)  // 添加标志，避免重复验证，有 token 就先认为已验证

  // 监听管理员登录过期事件
  const handleAdminLogout = () => {
    logout()
  };

  // 添加事件监听器
  const initEventListeners = () => {
    eventBus.on('admin-logout', handleAdminLogout);
  };

  // 初始化时添加监听
  if (typeof window !== 'undefined') {
    initEventListeners();
  }
  const models = ref<Model[]>([])
  const globalDefaultModel = ref<string>('')
  const characters = ref<Character[]>([])
  const charactersTotal = ref(0)
  const charactersPage = ref(1)
  const charactersPageSize = ref(10)
  const charactersTotalPages = ref(1)
  const settings = ref<AdminSettings>({
    registrationEnabled: true,
    defaultQuota: 100,
    githubAuthEnabled: false,
    gitSyncEnabled: false,
    newUserQuota: 100,
    signinMinQuota: 1,
    signinMaxQuota: 10,
    chatQuotaCost: 1,
    suggestionQuotaCost: 0.5,
    maxUserCharacters: 5,
    maxCharacterSize: 1048576,
  })
  // 添加缺失的状态
  const saveButtonVisible = ref(false)
  const saveButtonLoading = ref(false)
  let saveCallback: (() => Promise<void>) | null = null

  async function login(password: string): Promise<boolean> {
    isLoading.value = true
    try {
      const result = await adminApi.login(password)
      localStorage.setItem('admin_token', result.token)
      isLoggedIn.value = true
      hasVerified.value = true  // 登录成功即认为已验证
      return true
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function verify(): Promise<boolean> {
    try {
      await adminApi.verify()
      isLoggedIn.value = true
      hasVerified.value = true  // 标记已验证
      return true
    } catch (error) {
      console.error('Verify failed:', error)
      logout()
      return false
    }
  }

  // 添加 checkAuth 函数
  async function checkAuth(): Promise<boolean> {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      isLoggedIn.value = false
      hasVerified.value = false
      return false
    }
    
    if (hasVerified.value) {
      return true  // 已验证过，直接跳过API
    }
    
    try {
      await verify()
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  async function loadModels(): Promise<void> {
    try {
      const result = await modelsApi.list()
      models.value = result.models || []
      globalDefaultModel.value = result.global_default_model || ''
    } catch (error) {
      console.error('Failed to load models:', error)
      models.value = []
    }
  }

  async function saveModels(modelList: Model[], globalDefault?: string): Promise<void> {
    try {
      const result = await modelsApi.update(modelList, globalDefault)
      models.value = result.models || []
      globalDefaultModel.value = result.global_default_model || ''
    } catch (error) {
      console.error('Failed to save models:', error)
      throw error
    }
  }

  async function loadUniqueModels(): Promise<{ id: string; name: string; is_default: boolean; providers: { id: string; name: string }[] }[]> {
    try {
      const result = await modelsApi.listUniqueAdmin()
      return result.models || []
    } catch (error) {
      console.error('Failed to load unique models:', error)
      return []
    }
  }

  async function testModel(params: { modelId?: string; apiKey?: string; apiUrl?: string; provider?: string }): Promise<boolean> {
    try {
      await modelsApi.test(params)
      return true
    } catch (error) {
      console.error('Failed to test model:', error)
      return false
    }
  }

  async function testSingleModel(params: { model_id: string; model: string }) {
    try {
      return await modelsApi.testSingle(params)
    } catch (error: any) {
      console.error('Failed to test single model:', error)
      throw { message: error.message, duration: error.duration || 0 }
    }
  }

  async function testAllModels(params: { modelId: string; modelIds: string[]; concurrency?: number }) {
    try {
      const result = await modelsApi.testAll(params)
      return result.results
    } catch (error) {
      console.error('Failed to test all models:', error)
      throw error
    }
  }

  async function fetchModelList(params: { modelId?: string; apiKey?: string; apiUrl?: string; provider?: string }): Promise<{ id: string; name: string }[]> {
    try {
      const result = await modelsApi.listModels(params)
      return result.models || []
    } catch (error) {
      console.error('Failed to fetch model list:', error)
      throw error
    }
  }

  async function deleteModel(modelId: string): Promise<void> {
    try {
      await modelsApi.delete(modelId)
      models.value = models.value.filter(m => m.id !== modelId)
    } catch (error) {
      console.error('Failed to delete model:', error)
      throw error
    }
  }

  async function loadCharacters(params?: { source?: 'admin' | 'user'; page?: number; pageSize?: number; search?: string; sortBy?: string }): Promise<void> {
    try {
      const result = await charactersApi.listAdmin(params)
      characters.value = result.characters || []
      charactersTotal.value = result.total || 0
      charactersPage.value = result.page || 1
      charactersPageSize.value = result.pageSize || 10
      charactersTotalPages.value = result.totalPages || 1
    } catch (error) {
      console.error('Failed to load characters:', error)
      characters.value = []
      charactersTotal.value = 0
      charactersPage.value = 1
      charactersTotalPages.value = 1
    }
  }

  async function loadCharacterDetail(id: string): Promise<Character | null> {
    try {
      return await charactersApi.getAdmin(id)
    } catch (error) {
      console.error('Failed to load character detail:', error)
      return null
    }
  }

  async function createCharacter(data: Partial<Character>): Promise<Character | null> {
    try {
      const newCharacter = await charactersApi.create(data)
      await loadCharacters()
      return newCharacter
    } catch (error) {
      console.error('Failed to create character:', error)
      return null
    }
  }

  async function updateCharacter(id: string, data: Partial<Character>): Promise<Character | null> {
    try {
      const updatedCharacter = await charactersApi.update(id, data)
      await loadCharacters()
      return updatedCharacter
    } catch (error) {
      console.error('Failed to update character:', error)
      return null
    }
  }

  async function toggleCharacterShared(character: any): Promise<void> {
    try {
      const id = getCharacterId(character)
      const isShared = character?.role_play?.shared || character?.shared || false
      const newShared = !isShared
      
      const response = await charactersApi.toggleShared(id, newShared)
      
      if (response?.success) {
        const index = characters.value.findIndex(c => getCharacterId(c) === id)
        if (index !== -1) {
          const char = characters.value[index]
          if (char.role_play) {
            char.role_play.shared = response.shared
          } else {
            char.shared = response.shared
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle character shared:', error)
    }
  }

  async function deleteCharacter(id: string): Promise<any> {
    try {
      const result = await charactersApi.delete(id)
      await loadCharacters()
      return result
    } catch (error) {
      console.error('Failed to delete character:', error)
      throw error
    }
  }

  async function batchDeleteCharacters(ids: string[]): Promise<{ deleted: number; failed: Array<{ id: string; error: string }>; warnings: string[] }> {
    try {
      const result = await charactersApi.batchDelete(ids)
      await loadCharacters()
      return {
        deleted: result.deleted,
        failed: result.failed,
        warnings: result.warnings
      }
    } catch (error) {
      console.error('Failed to batch delete characters:', error)
      throw error
    }
  }

  async function batchToggleCharactersShared(ids: string[], shared: boolean): Promise<{ updated: number; failed: Array<{ id: string; error: string }> }> {
    try {
      const result = await charactersApi.batchUpdateShared(ids, shared)
      
      for (const id of ids) {
        const index = characters.value.findIndex(c => getCharacterId(c) === id)
        if (index !== -1) {
          const char = characters.value[index]
          if (char.role_play) {
            char.role_play.shared = shared
          } else {
            char.shared = shared
          }
        }
      }
      
      return {
        updated: result.updated,
        failed: result.failed
      }
    } catch (error) {
      console.error('Failed to batch toggle characters shared:', error)
      throw error
    }
  }

  async function importCharacters(): Promise<void> {
    await loadCharacters()
  }

  async function getSettings(): Promise<AdminSettings> {
    try {
      const result = await adminApi.getSettings()
      settings.value = { ...settings.value, ...result }
      return result
    } catch (error) {
      console.error('Failed to get settings:', error)
      throw error
    }
  }

  async function updateSettings(newSettings: Partial<AdminSettings>): Promise<void> {
    try {
      const result = await adminApi.updateSettings(newSettings)
      settings.value = { ...settings.value, ...result }
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  }

  async function loadSettings(): Promise<AdminSettings> {
    return getSettings()
  }

  async function saveSettings(newSettings: Partial<AdminSettings>): Promise<void> {
    return updateSettings(newSettings)
  }

  function logout(): void {
    isLoggedIn.value = false
    hasVerified.value = false
    localStorage.removeItem('admin_token')
    console.log('[Admin] Logged out')
  }

  // 添加保存按钮相关函数
  function showSaveButton(callback: () => Promise<void>): void {
    saveButtonVisible.value = true
    saveCallback = callback
  }

  function hideSaveButton(): void {
    saveButtonVisible.value = false
    saveCallback = null
  }

  async function triggerSave(): Promise<void> {
    if (saveCallback) {
      saveButtonLoading.value = true
      try {
        await saveCallback()
      } finally {
        saveButtonLoading.value = false
      }
    }
  }

  return {
    isLoggedIn,
    isLoading,
    models,
    globalDefaultModel,
    characters,
    charactersTotal,
    charactersPage,
    charactersPageSize,
    charactersTotalPages,
    settings,
    saveButtonVisible,
    saveButtonLoading,
    login,
    verify,
    checkAuth,
    loadModels,
    saveModels,
    loadUniqueModels,
    testModel,
    testSingleModel,
    testAllModels,
    fetchModelList,
    deleteModel,
    loadCharacters,
    loadCharacterDetail,
    createCharacter,
    updateCharacter,
    toggleCharacterShared,
    deleteCharacter,
    batchDeleteCharacters,
    batchToggleCharactersShared,
    importCharacters,
    getSettings,
    updateSettings,
    loadSettings,
    saveSettings,
    logout,
    showSaveButton,
    hideSaveButton,
    triggerSave,
  }
})
