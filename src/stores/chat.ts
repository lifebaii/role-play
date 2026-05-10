import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Character, Message, CustomModelConfig, SyncStatus } from '@/types'
import { getChatHistory, saveChatHistory, clearChatHistory, exportChatHistory, importChatHistory } from '@/utils/db'
import { useUserStore } from './user'
import { useUserDataStore } from './userData'
import { buildContext } from '@/utils/contextBuilder'
import { streamChat } from '@/utils/llmClient'
import { getLocalFriends, isLocalFriend, getLocalFriend, pinFriendToTop } from '@/utils/localFriendStorage'
import { modelsApi, v1Api, chatSyncApi } from '@/api'
import { generateId } from '@/utils/uuid'

function useCustomModelConfig(): CustomModelConfig {
  try {
    const useCustomModel = localStorage.getItem('role_play_use_custom_model') === 'true'
    if (useCustomModel) {
      const config = JSON.parse(localStorage.getItem('role_play_custom_model_config') || '{}')
      return {
        provider: config.provider || 'openai',
        api_key: config.api_key || '',
        api_url: config.api_url || '',
        default_model: config.default_model || '',
      }
    }
  } catch {}
  
  const apiUrl = localStorage.getItem('role_play_api_url') || ''
  const apiKey = localStorage.getItem('role_play_api_key') || ''
  const defaultModel = localStorage.getItem('role_play_default_model') || ''
  
  return {
    provider: 'openai',
    api_key: apiKey,
    api_url: apiUrl,
    default_model: defaultModel,
  }
}

function flattenCharacter(character: any): Character {
  if (character.data) {
    const data = character.data
    return {
      ...data,
      id: character.role_play?.id || character.id,
      role_play: character.role_play,
      data: character.data,
      character_book: { entries: data.character_book?.entries || [] },
      regex_scripts: data.extensions?.regex_scripts || data.regex_scripts || []
    }
  }
  return {
    ...character,
    character_book: { entries: character.character_book?.entries || [] },
    regex_scripts: character.extensions?.regex_scripts || character.regex_scripts || []
  }
}

interface StreamContext {
  characterId: string
  characterName: string
  characterAvatar?: string
  messages: Message[]
  streamingContent: string
  abortController: AbortController
  startTime: number
  timerInterval: ReturnType<typeof setInterval> | null
  currentWaitTime: string
}

interface CharacterSuggestionsState {
  suggestions: string[]
  showSuggestions: boolean
  isGeneratingSuggestions: boolean
  lastSuggestionsMessagesSnapshot: string
}

interface SuggestionsState {
  [characterId: string]: CharacterSuggestionsState
}

export const useChatStore = defineStore('chat', () => {
  const characters = ref<Character[]>([])
  const userCharacters = ref<Character[]>([])
  const sharedCharacters = ref<Character[]>([])
  const localCharacters = ref<Character[]>([])
  
  try {
    const cached = localStorage.getItem('characters_list')
    if (cached) {
      characters.value = JSON.parse(cached)
    }
  } catch {
    characters.value = []
  }
  
  try {
    const cached = localStorage.getItem('shared_characters_list')
    if (cached) {
      const parsed = JSON.parse(cached)
      sharedCharacters.value = parsed.characters || []
    }
  } catch {
    sharedCharacters.value = []
  }
  
  try {
    const cached = localStorage.getItem('local_characters_list')
    if (cached) {
      localCharacters.value = JSON.parse(cached)
    }
  } catch {
    localCharacters.value = []
  }
  
  const currentCharacter = ref<Character | null>(null)
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const isUpdatingInBackground = ref(false)
  const isUpdatingCharactersList = ref(false)
  const isUpdatingUserCharactersList = ref(false)
  const isUpdatingSharedCharactersList = ref(false)
  const error = ref<string | null>(null)
  const streamingContent = ref('')
  const currentWaitTime = ref('0.0')
  const userStore = useUserStore()
  const userName = computed(() => userStore.effectiveUserName)
  const lastCharacterId = ref(localStorage.getItem('role_play_last_character_id') || '')
  const uniqueModels = ref<{ id: string; name: string; is_default: boolean; providers: { id: string; name: string }[] }[]>([])
  
try {
  const cachedModels = localStorage.getItem('role_play_unique_models')
  if (cachedModels) {
    uniqueModels.value = JSON.parse(cachedModels)
  }
} catch {
  uniqueModels.value = []
}

const globalDefaultModel = ref('')
  const selectedModel = ref(localStorage.getItem('role_play_selected_model') || '')
  const lastSelectedModel = ref('')
  
  const useCustomModel = ref(localStorage.getItem('role_play_use_custom_model') === 'true')
  const customModelConfig = ref<CustomModelConfig | null>(null)
  
  try {
    const savedConfig = localStorage.getItem('role_play_custom_model_config')
    if (savedConfig) {
      customModelConfig.value = JSON.parse(savedConfig)
    }
  } catch (e) {
    console.error('Failed to load custom model config:', e)
  }

  const backgroundStreams = ref<Map<string, StreamContext>>(new Map())
  const characterSuggestionsState = ref<SuggestionsState>({})

  // 当前激活的建议状态
  const suggestions = ref<string[]>([])
  const showSuggestions = ref(false)
  const isGeneratingSuggestions = ref(false)
  const lastSuggestionsMessagesSnapshot = ref('')
  
  // 滚动位置存储（从 localStorage 加载）
  const scrollPositions = ref<Map<string, number>>(new Map())
  
  // 初始化时从 localStorage 加载滚动位置
  try {
    const savedPositions = localStorage.getItem('role_play_scroll_positions')
    if (savedPositions) {
      const positionsObj = JSON.parse(savedPositions)
      const positionsMap = new Map<string, number>()
      for (const [key, value] of Object.entries(positionsObj)) {
        positionsMap.set(key, value as number)
      }
      scrollPositions.value = positionsMap
    }
  } catch (e) {
    console.error('Failed to load scroll positions from localStorage:', e)
  }
  
  // 建议请求的取消控制器
  let suggestionsAbortController: AbortController | null = null
  let currentGeneratingCharacterId: string | null = null

  const isStreaming = computed(() => {
    if (!currentCharacter.value) return false
    return backgroundStreams.value.has(currentCharacter.value.id)
  })

  const hasMessages = computed(() => messages.value.length > 0)
  
  const isAnonymous = computed(() => userStore.isAnonymous)
  
  const canUseBuiltInModel = computed(() => !userStore.isAnonymous)
  
  const mustUseCustomModel = computed(() => userStore.isAnonymous && !useCustomModel.value)

  function setSelectedModel(modelId: string) {
    selectedModel.value = modelId
    localStorage.setItem('role_play_selected_model', modelId)
    lastSelectedModel.value = modelId
  }

  function setUseCustomModel(use: boolean) {
    useCustomModel.value = use
    localStorage.setItem('role_play_use_custom_model', use.toString())
  }

  function setCustomModelConfig(config: CustomModelConfig | null) {
    customModelConfig.value = config
    if (config) {
      localStorage.setItem('role_play_custom_model_config', JSON.stringify(config))
    } else {
      localStorage.removeItem('role_play_custom_model_config')
    }
  }

  function setLastCharacterId(id: string) {
    lastCharacterId.value = id
    localStorage.setItem('role_play_last_character_id', id)
  }

  function setCurrentCharacter(character: Character | null) {
    currentCharacter.value = character
  }

  // 保存当前角色的建议状态
  function saveCurrentSuggestionsState() {
    if (!currentCharacter.value) return
    const charId = currentCharacter.value.role_play?.id || currentCharacter.value.id
    if (!charId) return
    characterSuggestionsState.value[charId] = {
      suggestions: [...suggestions.value],
      showSuggestions: showSuggestions.value,
      isGeneratingSuggestions: isGeneratingSuggestions.value,
      lastSuggestionsMessagesSnapshot: lastSuggestionsMessagesSnapshot.value
    }
  }

  // 恢复角色的建议状态
  function restoreSuggestionsState(characterId: string) {
    const savedState = characterSuggestionsState.value[characterId]
    if (savedState) {
      suggestions.value = [...savedState.suggestions]
      showSuggestions.value = savedState.showSuggestions
      // 恢复时不应该显示正在加载状态
      isGeneratingSuggestions.value = false
      lastSuggestionsMessagesSnapshot.value = savedState.lastSuggestionsMessagesSnapshot
    } else {
      // 没有保存的状态，重置为默认
      suggestions.value = []
      showSuggestions.value = false
      isGeneratingSuggestions.value = false
      lastSuggestionsMessagesSnapshot.value = ''
    }
  }

  // 取消建议请求
  function cancelSuggestions() {
    if (suggestionsAbortController) {
      suggestionsAbortController.abort()
      suggestionsAbortController = null
    }
    // 清除当前正在生成的角色ID
    if (currentGeneratingCharacterId) {
      // 保存该角色的状态，清除正在生成标志
      const savedState = characterSuggestionsState.value[currentGeneratingCharacterId]
      if (savedState) {
        characterSuggestionsState.value[currentGeneratingCharacterId] = {
          ...savedState,
          isGeneratingSuggestions: false
        }
      }
      currentGeneratingCharacterId = null
    }
    isGeneratingSuggestions.value = false
  }

  // 设置建议的取消控制器（供外部使用）
  function setSuggestionsAbortController(controller: AbortController, characterId: string) {
    suggestionsAbortController = controller
    currentGeneratingCharacterId = characterId
  }

  // 保存滚动位置
  function saveScrollPosition(characterId: string, scrollTop: number) {
    const newMap = new Map(scrollPositions.value).set(characterId, scrollTop)
    scrollPositions.value = newMap
    
    // 同步到 localStorage
    try {
      const positionsObj: Record<string, number> = {}
      newMap.forEach((value, key) => {
        positionsObj[key] = value
      })
      localStorage.setItem('role_play_scroll_positions', JSON.stringify(positionsObj))
    } catch (e) {
      console.error('Failed to save scroll positions to localStorage:', e)
    }
  }

  // 获取滚动位置
  function getScrollPosition(characterId: string): number | undefined {
    return scrollPositions.value.get(characterId)
  }

  // 清除滚动位置
  function clearScrollPosition(characterId: string) {
    const newMap = new Map(scrollPositions.value)
    newMap.delete(characterId)
    scrollPositions.value = newMap
    
    // 同步到 localStorage
    try {
      const positionsObj: Record<string, number> = {}
      newMap.forEach((value, key) => {
        positionsObj[key] = value
      })
      localStorage.setItem('role_play_scroll_positions', JSON.stringify(positionsObj))
    } catch (e) {
      console.error('Failed to save scroll positions to localStorage:', e)
    }
  }

  function isJailbreakEnabled(): boolean {
    return presets.value.some(p => p.name === '破限' && p.enabled)
  }

  let syncRafId: number | null = null
  let syncPendingId: string | null = null

  function syncStreamToView(characterId: string) {
    if (!currentCharacter.value || currentCharacter.value.id !== characterId) return

    syncPendingId = characterId

    if (syncRafId !== null) return

    syncRafId = requestAnimationFrame(() => {
      syncRafId = null
      const cid = syncPendingId
      syncPendingId = null
      if (!cid) return

      const ctx = backgroundStreams.value.get(cid)
      if (ctx) {
        messages.value = [...ctx.messages]
        streamingContent.value = ctx.streamingContent
        currentWaitTime.value = ctx.currentWaitTime
      } else {
        streamingContent.value = ''
        currentWaitTime.value = '0.0'
      }
    })
  }

  function startTimerFor(ctx: StreamContext) {
    if (ctx.timerInterval) clearInterval(ctx.timerInterval)
    ctx.startTime = Date.now()
    ctx.currentWaitTime = '0.0'
    ctx.timerInterval = setInterval(() => {
      const now = Date.now()
      ctx.currentWaitTime = ((now - ctx.startTime) / 1000).toFixed(1)
      if (currentCharacter.value?.id === ctx.characterId) {
        currentWaitTime.value = ctx.currentWaitTime
      }
    }, 100)
  }

  function stopTimerFor(ctx: StreamContext) {
    if (ctx.timerInterval) {
      clearInterval(ctx.timerInterval)
      ctx.timerInterval = null
    }
  }

  async function loadLocalCharacters() {
    try {
      const friends = await getLocalFriends()
      localCharacters.value = friends
      localStorage.setItem('local_characters_list', JSON.stringify(friends))
    } catch (e) {
      console.error('Failed to load local friends:', e)
      localCharacters.value = []
    }
  }

  async function loadCharacters() {
    const cachedCharacters = localStorage.getItem('characters_list')
    if (cachedCharacters) {
      try {
        const parsed = JSON.parse(cachedCharacters)
        characters.value = parsed
      } catch (e) {
        console.error('解析缓存角色列表失败:', e)
      }
    }
    
    isUpdatingCharactersList.value = true
    try {
      const localChars = await getLocalFriends()
      characters.value = localChars
    } catch (e: any) {
      error.value = e.message
    } finally {
      isUpdatingCharactersList.value = false
    }
  }

  async function loadUserCharacters(_userId: string) {
    const localChars = await getLocalFriends()
    userCharacters.value = localChars
  }

  async function loadSharedCharacters() {
    sharedCharacters.value = []
    isUpdatingSharedCharactersList.value = false
  }

  async function createUserCharacter(_userId: string, character: Partial<Character>) {
    const { saveLocalFriend } = await import('@/utils/localFriendStorage')
    const newChar = await saveLocalFriend(character as any)
    userCharacters.value = await getLocalFriends()
    return newChar
  }

  async function updateUserCharacter(_userId: string, charId: string, data: Partial<Character>) {
    const { updateLocalFriendData } = await import('@/utils/localFriendStorage')
    await updateLocalFriendData(charId, data)
    userCharacters.value = await getLocalFriends()
    const updated = userCharacters.value.find(c => c.id === charId)
    return updated || null
  }

  async function deleteUserCharacter(_userId: string, charId: string) {
    const { removeLocalFriend } = await import('@/utils/localFriendStorage')
    await removeLocalFriend(charId)
    userCharacters.value = userCharacters.value.filter(c => c.id !== charId)
  }

  async function buildLocalContext(history: { role: string; content: string }[], userMessage: string) {
    const userDataStore = useUserDataStore()
    if (!userDataStore.isLoaded) {
      await userDataStore.load()
    }
    
    return buildContext({
      character: currentCharacter.value!,
      history,
      userMessage,
      userName: userName.value,
      userWorldInfo: userDataStore.enabledWorldInfo,
      userPresets: userDataStore.enabledPresets,
      userRegexScripts: userDataStore.enabledRegexScripts
    })
  }

  async function loadModels(forceRefresh = false) {
    if (userStore.isAnonymous) {
      uniqueModels.value = []
      globalDefaultModel.value = ''
      return
    }
    
    if (!forceRefresh && uniqueModels.value.length > 0) {
      return
    }
    
    try {
      const result = await modelsApi.listUnique()
      uniqueModels.value = result.models || []
      
      localStorage.setItem('role_play_unique_models', JSON.stringify(result.models))
      
      const defaultModel = result.models?.find((m: any) => m.is_default)
      globalDefaultModel.value = defaultModel?.id || ''

      const availableModelIds = uniqueModels.value.map(m => m.id)
      if (selectedModel.value && !availableModelIds.includes(selectedModel.value)) {
        selectedModel.value = globalDefaultModel.value || ''
        if (selectedModel.value) {
          localStorage.setItem('role_play_selected_model', selectedModel.value)
        } else {
          localStorage.removeItem('role_play_selected_model')
        }
      }

      if (!selectedModel.value && globalDefaultModel.value) {
        selectedModel.value = globalDefaultModel.value
        localStorage.setItem('role_play_selected_model', selectedModel.value)
      }
    } catch (e: any) {
      console.error('Failed to load models:', e)
    }
  }

  async function selectCharacter(character: Character) {
    const flatCharacter = flattenCharacter(character)
    const characterId = flatCharacter.role_play?.id || flatCharacter.id
    
    // 1. 取消当前正在生成的建议请求
    cancelSuggestions()
    
    // 2. 保存当前角色的建议状态
    saveCurrentSuggestionsState()
    
    isLoading.value = true
    error.value = null
    
    messages.value = []
    streamingContent.value = ''
    currentWaitTime.value = '0.0'
    
    // 3. 恢复新角色的建议状态
    if (characterId) {
      restoreSuggestionsState(characterId)
    }

    try {
      let fullCharacter: Character | null = null
      
      const charId2 = flatCharacter.role_play?.id || characterId
      
      if (await isLocalFriend(charId2)) {
        fullCharacter = await getLocalFriend(charId2)
      } else {
        fullCharacter = flatCharacter
      }
      
      if (fullCharacter) {
        currentCharacter.value = flattenCharacter(fullCharacter)
      } else {
        currentCharacter.value = flatCharacter
      }
    } catch (e) {
      console.error('Failed to load character:', e)
      currentCharacter.value = flatCharacter
    }

    setLastCharacterId(currentCharacter.value.id)

    const activeStream = backgroundStreams.value.get(currentCharacter.value.id)
    if (activeStream) {
      messages.value = [...activeStream.messages]
      streamingContent.value = activeStream.streamingContent
      currentWaitTime.value = activeStream.currentWaitTime
    } else {
      streamingContent.value = ''
      currentWaitTime.value = '0.0'

      const history = await getChatHistory(currentCharacter.value.id)

    const filteredHistory = history.filter(msg => {
      const content = msg.content || ''
      return !content.includes('[测试内容]') && !content.includes('STA2N')
    }).map(msg => ({
      ...msg,
      id: (msg as any).id || generateId()
    }))

    messages.value = [...filteredHistory]

    if (currentCharacter.value.first_mes && messages.value.length === 0) {
      const greetingMessage: Message = {
        id: generateId(),
        role: 'assistant',
        name: currentCharacter.value.name,
        content: currentCharacter.value.first_mes,
        isGreeting: true,
        avatar: currentCharacter.value.avatar
      }
      messages.value = [greetingMessage]
    }
    }
    isLoading.value = false
  }
  
  async function updateCharacterInBackground(characterId: string) {
    if (await isLocalFriend(characterId)) return
    
    isUpdatingInBackground.value = true
    try {
      let fullCharacter: Character | null = null
      
      if (await isLocalFriend(characterId)) {
        fullCharacter = await getLocalFriend(characterId)
      }
      
      if (!fullCharacter) {
        isUpdatingInBackground.value = false
        return
      }
      
      if (currentCharacter.value?.id === characterId) {
        currentCharacter.value = fullCharacter
      }
      
      const history = await getChatHistory(characterId)
    const filteredHistory = history.filter(msg => {
      const content = msg.content || ''
      return !content.includes('[测试内容]') && !content.includes('STA2N')
    }).map(msg => ({
      ...msg,
      id: (msg as any).id || generateId()
    }))

    if (currentCharacter.value?.id === characterId) {
      messages.value = [...filteredHistory]

      if (currentCharacter.value.first_mes && messages.value.length === 0) {
        const greetingMessage: Message = {
          id: generateId(),
          role: 'assistant',
          name: currentCharacter.value.name,
          content: currentCharacter.value.first_mes,
          isGreeting: true,
          avatar: currentCharacter.value.avatar
        }
        messages.value = [greetingMessage]
      }
    }
    } catch (e) {
      console.error('后台更新角色数据失败:', e)
    } finally {
      isUpdatingInBackground.value = false
    }
  }

  async function executeStream(
    characterId: string,
    characterName: string,
    characterAvatar: string | undefined,
    userMessageContent: string,
    historyForApi: { role: string; content: string }[],
    existingMessages: Message[]
  ) {
    if (backgroundStreams.value.has(characterId)) return

    const ctx: StreamContext = {
      characterId,
      characterName,
      characterAvatar,
      messages: [...existingMessages],
      streamingContent: '',
      abortController: new AbortController(),
      startTime: Date.now(),
      timerInterval: null,
      currentWaitTime: '0.0'
    }

    backgroundStreams.value = new Map(backgroundStreams.value).set(characterId, ctx)
    startTimerFor(ctx)
    syncStreamToView(characterId)

    try {
      let currentContent = ''

      const contextResult = await buildLocalContext(historyForApi, userMessageContent)

      if (useCustomModel.value && customModelConfig.value) {
        const asyncIterator = streamChat(
          customModelConfig.value,
          contextResult.messages,
          { temperature: contextResult.temperature },
          ctx.abortController.signal
        )

        for await (const chunk of asyncIterator) {
          if (chunk) {
            currentContent += chunk
            ctx.streamingContent = currentContent
            const lastIdx = ctx.messages.length - 1
            if (lastIdx >= 0) {
              ctx.messages = [
                ...ctx.messages.slice(0, lastIdx),
                { ...ctx.messages[lastIdx], content: currentContent }
              ]
            }
            syncStreamToView(characterId)
          }
        }
      } else {
        if (userStore.isAnonymous) {
          error.value = '匿名用户只能使用自定义模型，请先配置您的 API Key'
          ctx.messages = ctx.messages.slice(0, -1)
          syncStreamToView(characterId)
          stopTimerFor(ctx)
          const newMap = new Map(backgroundStreams.value)
          newMap.delete(characterId)
          backgroundStreams.value = newMap
          return
        }
        
        let modelToUse = selectedModel.value
        if (!modelToUse) {
          modelToUse = globalDefaultModel.value
        }

        const asyncIterator = v1Api.chatCompletions(
          {
            messages: contextResult.messages.map((m: any) => ({
              role: m.role,
              content: m.content,
              name: m.name
            })),
            temperature: contextResult.temperature,
            model: modelToUse,
            stream: true,
            mode: 'chat'
          },
          ctx.abortController.signal
        )

        for await (const chunk of asyncIterator) {
          if (chunk) {
            currentContent += chunk
            ctx.streamingContent = currentContent
            const lastIdx = ctx.messages.length - 1
            if (lastIdx >= 0) {
              ctx.messages = [
                ...ctx.messages.slice(0, lastIdx),
                { ...ctx.messages[lastIdx], content: currentContent }
              ]
            }
            syncStreamToView(characterId)
          }
        }
      }

      const msgIndex = ctx.messages.length - 1
      if (msgIndex !== -1) {
        ctx.messages = [
          ...ctx.messages.slice(0, msgIndex),
          { ...ctx.messages[msgIndex], content: currentContent }
        ]
      }

      if (!currentContent) {
        ctx.messages = ctx.messages.slice(0, -1)
        syncStreamToView(characterId)
        return
      }

      const messagesToSave = ctx.messages.filter(m => {
        if (m.role === 'system') return false
        const content = m.content || ''
        if (content.includes('[测试内容]') || content.includes('STA2N')) return false
        return true
      })
      await saveChatHistory(characterId, messagesToSave)

      syncStreamToView(characterId)
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message === 'The operation was aborted.') {
        if (!ctx.streamingContent) {
          ctx.messages = ctx.messages.slice(0, -1)
        } else {
          const msgIndex = ctx.messages.length - 1
          if (msgIndex !== -1) {
            ctx.messages = [
              ...ctx.messages.slice(0, msgIndex),
              { ...ctx.messages[msgIndex], content: ctx.streamingContent }
            ]
          }
          const messagesToSave = ctx.messages.filter(m => {
            if (m.role === 'system') return false
            const content = m.content || ''
            if (content.includes('[测试内容]') || content.includes('STA2N')) return false
            return true
          })
          await saveChatHistory(characterId, messagesToSave)
        }
        syncStreamToView(characterId)
      } else {
        ctx.messages = ctx.messages.slice(0, -1)
        
        if (currentCharacter.value?.id === characterId) {
          error.value = e.message
        }
        
        const messagesToSave = ctx.messages.filter(m => {
          if (m.role === 'system') return false
          const content = m.content || ''
          if (content.includes('[测试内容]') || content.includes('STA2N')) return false
          return true
        })
        await saveChatHistory(characterId, messagesToSave)
        
        syncStreamToView(characterId)
      }
    } finally {
      stopTimerFor(ctx)
      if (currentCharacter.value?.id === characterId) {
        messages.value = [...ctx.messages]
        streamingContent.value = ''
        currentWaitTime.value = '0.0'
      }
      const newMap = new Map(backgroundStreams.value)
      newMap.delete(characterId)
      backgroundStreams.value = newMap
    }
  }

  async function sendMessage(content: string): Promise<boolean> {
    if (!currentCharacter.value) return false
    const characterId = currentCharacter.value.id
    if (backgroundStreams.value.has(characterId)) return false
    
    // 提前验证配置
    if (userStore.isAnonymous && !useCustomModel.value) {
      error.value = '匿名用户只能使用自定义模型，请先配置您的 API Key'
      return false
    }
    
    if (useCustomModel.value) {
      const config = customModelConfig.value
      if (!config?.api_url || !config?.api_key || !config?.default_model) {
        error.value = '请先完成自定义模型配置（API地址、API密钥、模型名称）'
        return false
      }
    }

    pinFriendToTop(characterId)

    // 立即添加用户消息和空的助手消息
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      isSelf: true
    }

    error.value = null

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      name: currentCharacter.value.name,
      content: '',
      avatar: currentCharacter.value.avatar
    }

    const allMessages = [...messages.value, userMessage, assistantMessage]

    messages.value = [...allMessages]

    // 立即保存到历史记录，只保存有内容的消息（此时只有用户消息有内容）
    const messagesToSave = messages.value.filter(m => {
      if (m.role === 'system') return false
      const msgContent = m.content || ''
      if (!msgContent.trim()) return false
      return !msgContent.includes('[测试内容]') && !msgContent.includes('STA2N')
    })
    await saveChatHistory(characterId, messagesToSave)

    const historyForApi = messages.value
      .slice(0, -2)
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }))

    // 异步执行流式响应，不等待
    executeStream(
      characterId,
      currentCharacter.value.name,
      currentCharacter.value.avatar,
      content,
      historyForApi,
      allMessages
    ).catch(console.error)
    
    return true
  }

  function deleteMessage(index: number) {
    if (index < 0 || index >= messages.value.length) return

    const newMessages = [...messages.value]
    newMessages.splice(index, 1)
    messages.value = newMessages

    if (currentCharacter.value) {
      const messagesToSave = messages.value.filter(m => {
        if (m.role === 'system') return false
        const content = m.content || ''
        return !content.includes('[测试内容]') && !content.includes('STA2N')
      })
      saveChatHistory(currentCharacter.value.id, messagesToSave)
    }
  }

  function editMessage(index: number, newContent: string) {
    if (index < 0 || index >= messages.value.length) return

    const newMessages = [...messages.value]
    newMessages[index] = { ...newMessages[index], content: newContent }
    messages.value = newMessages

    if (currentCharacter.value) {
      const messagesToSave = messages.value.filter(m => {
        if (m.role === 'system') return false
        const content = m.content || ''
        return !content.includes('[测试内容]') && !content.includes('STA2N')
      })
      saveChatHistory(currentCharacter.value.id, messagesToSave)
    }
  }

  async function regenerateFrom(userMessageIndex: number): Promise<boolean> {
    if (!currentCharacter.value) return false
    const characterId = currentCharacter.value.id
    if (backgroundStreams.value.has(characterId)) return false
    if (userMessageIndex < 0 || userMessageIndex >= messages.value.length) return false
    if (messages.value[userMessageIndex].role !== 'user') return false

    if (userStore.isAnonymous && !useCustomModel.value) {
      error.value = '匿名用户只能使用自定义模型，请先配置您的 API Key'
      return false
    }
    
    if (useCustomModel.value) {
      const config = customModelConfig.value
      if (!config?.api_url || !config?.api_key || !config?.default_model) {
        error.value = '请先完成自定义模型配置（API地址、API密钥、模型名称）'
        return false
      }
    }

    pinFriendToTop(characterId)

    const userMessage = messages.value[userMessageIndex]

    const historyForApi = messages.value
      .slice(0, userMessageIndex)
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }))

    const newMessages = [...messages.value.slice(0, userMessageIndex + 1)]

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      name: currentCharacter.value.name,
      content: '',
      avatar: currentCharacter.value.avatar
    }
    newMessages.push(assistantMessage)

    messages.value = [...newMessages]
    error.value = null

    await executeStream(
      characterId,
      currentCharacter.value.name,
      currentCharacter.value.avatar,
      userMessage.content,
      historyForApi,
      newMessages
    )
    return true
  }

  function abortStream(characterId?: string) {
    const targetId = characterId || currentCharacter.value?.id
    if (!targetId) return

    const ctx = backgroundStreams.value.get(targetId)
    if (ctx) {
      ctx.abortController.abort()
    }

    if (currentCharacter.value?.id === targetId) {
      error.value = '已终止'
    }
  }

  function isCharacterStreaming(characterId: string): boolean {
    return backgroundStreams.value.has(characterId)
  }

  async function clearHistory() {
    if (!currentCharacter.value) return

    const characterId = currentCharacter.value.id
    if (backgroundStreams.value.has(characterId)) {
      abortStream(characterId)
    }

    await clearChatHistory(characterId)
    messages.value = []

    if (currentCharacter.value.first_mes) {
      messages.value = [{
        id: generateId(),
        role: 'assistant',
        name: currentCharacter.value.name,
        content: currentCharacter.value.first_mes,
        isGreeting: true,
        avatar: currentCharacter.value.avatar
      }]
    }
  }

  async function clearCharacterHistory(characterId: string) {
    if (backgroundStreams.value.has(characterId)) {
      abortStream(characterId)
    }
    await clearChatHistory(characterId)
    
    if (currentCharacter.value?.id === characterId) {
      messages.value = []
    }
  }

  async function exportChat() {
    if (!currentCharacter.value) return
    const content = await exportChatHistory(currentCharacter.value.id)
    const blob = new Blob([content], { type: 'application/jsonl' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentCharacter.value.name}_chat.jsonl`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importChat(file: File) {
    if (!currentCharacter.value) return
    const content = await file.text()
    const count = await importChatHistory(currentCharacter.value.id, content)
    const history = await getChatHistory(currentCharacter.value.id)
    messages.value = history
    return count
  }

  const syncStatus = ref<SyncStatus | null>(null)
  const isSyncing = ref(false)
  const syncError = ref<string | null>(null)

  async function uploadChatSync() {
    if (!currentCharacter.value) {
      throw new Error('请先选择角色')
    }
    
    if (userStore.isAnonymous) {
      throw new Error('请先登录后再使用同步功能')
    }
    
    isSyncing.value = true
    syncError.value = null
    
    try {
      const history = await getChatHistory(currentCharacter.value.id)
      const result = await chatSyncApi.upload(
        currentCharacter.value.id,
        currentCharacter.value.name || '',
        history
      )
      
      await loadSyncStatus()
      
      return result
    } catch (e: any) {
      syncError.value = e.message
      throw e
    } finally {
      isSyncing.value = false
    }
  }

  async function downloadChatSync(syncCode: string) {
    if (userStore.isAnonymous) {
      throw new Error('请先登录后再使用同步功能')
    }
    
    if (!currentCharacter.value) {
      throw new Error('请先选择角色')
    }
    
    isSyncing.value = true
    syncError.value = null
    
    try {
      const result = await chatSyncApi.download(syncCode)
      
      if (result.messages && result.messages.length > 0) {
        await saveChatHistory(currentCharacter.value.id, result.messages)
        messages.value = result.messages
      }
      
      await loadSyncStatus()
      return result
    } catch (e: any) {
      syncError.value = e.message
      throw e
    } finally {
      isSyncing.value = false
    }
  }

  async function loadSyncStatus() {
    if (userStore.isAnonymous) {
      syncStatus.value = null
      return
    }
    
    if (!currentCharacter.value?.id) {
      syncStatus.value = null
      return
    }
    
    try {
      syncStatus.value = await chatSyncApi.getStatus(currentCharacter.value.id)
    } catch (e: any) {
      console.error('Failed to load sync status:', e)
    }
  }

  async function cancelChatSync() {
    if (!currentCharacter.value?.id) {
      throw new Error('请先选择角色')
    }
    
    try {
      await chatSyncApi.cancel(currentCharacter.value.id)
      await loadSyncStatus()
    } catch (e) {
      throw e
    }
  }

  return {
    characters,
    userCharacters,
    sharedCharacters,
    localCharacters,
    currentCharacter,
    setCurrentCharacter,
    messages,
    isLoading,
    isUpdatingInBackground,
    isUpdatingCharactersList,
    isUpdatingUserCharactersList,
    isUpdatingSharedCharactersList,
    isStreaming,
    error,
    hasMessages,
    streamingContent,
    currentWaitTime,
    userName,
    lastCharacterId,
    setLastCharacterId,
    uniqueModels,
    globalDefaultModel,
    selectedModel,
    setSelectedModel,
    useCustomModel,
    setUseCustomModel,
    customModelConfig,
    setCustomModelConfig,
    backgroundStreams,
    isAnonymous,
    canUseBuiltInModel,
    mustUseCustomModel,
    // 建议相关状态
    suggestions,
    showSuggestions,
    isGeneratingSuggestions,
    lastSuggestionsMessagesSnapshot,
    saveCurrentSuggestionsState,
    restoreSuggestionsState,
    cancelSuggestions,
    setSuggestionsAbortController,
    saveScrollPosition,
    getScrollPosition,
    clearScrollPosition,
    loadLocalCharacters,
    loadCharacters,
    loadUserCharacters,
    loadSharedCharacters,
    createUserCharacter,
    updateUserCharacter,
    deleteUserCharacter,
    buildLocalContext,
    loadModels,
    selectCharacter,
    updateCharacterInBackground,
    sendMessage,
    deleteMessage,
    editMessage,
    regenerateFrom,
    abortStream,
    isCharacterStreaming,
    clearHistory,
    clearCharacterHistory,
    exportChat,
    importChat,
    syncStatus,
    isSyncing,
    syncError,
    uploadChatSync,
    downloadChatSync,
    loadSyncStatus,
    cancelChatSync
  }
})
