import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Model, Character, CharactersResponse, AdminSettings } from '@/types'
import { adminApi, charactersApi, modelsApi, presetsApi, regexApi, worldInfoApi } from '@/api'
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
  const characters = ref<Character[]>([])
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
    models.value = []
  }

  async function saveModel(): Promise<void> {
  }

  async function loadUniqueModels(): Promise<void> {
    models.value = []
  }

  async function testModel(): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Not available in pure web mode' }
  }

  async function loadModelList(): Promise<{ id: string; name: string }[]> {
    return []
  }

  async function deleteModel(): Promise<void> {
  }

  async function loadCharacters(): Promise<void> {
    try {
      const result = await charactersApi.listAdmin()
      characters.value = result
    } catch (error) {
      console.error('Failed to load characters:', error)
      characters.value = []
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
      
      // 更新本地列表中的角色数据
      if (response?.character) {
        const index = characters.value.findIndex(c => getCharacterId(c) === id)
        if (index !== -1) {
          characters.value[index] = response.character
        }
      }
    } catch (error) {
      console.error('Failed to toggle character shared:', error)
    }
  }

  async function deleteCharacter(id: string): Promise<void> {
    try {
      await charactersApi.delete(id)
      await loadCharacters()
    } catch (error) {
      console.error('Failed to delete character:', error)
    }
  }

  async function importCharacters(): Promise<void> {
    await loadCharacters()
  }

  async function getSettings(): Promise<void> {
  }

  async function updateSettings(): Promise<void> {
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
    characters,
    settings,
    saveButtonVisible,
    saveButtonLoading,
    login,
    verify,
    checkAuth,
    loadModels,
    saveModel,
    loadUniqueModels,
    testModel,
    loadModelList,
    deleteModel,
    loadCharacters,
    loadCharacterDetail,
    createCharacter,
    updateCharacter,
    toggleCharacterShared,
    deleteCharacter,
    importCharacters,
    getSettings,
    updateSettings,
    logout,
    showSaveButton,
    hideSaveButton,
    triggerSave,
  }
})
