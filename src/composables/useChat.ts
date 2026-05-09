import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { useUserDataStore } from '@/stores/userData'
import { useDialog } from '@/composables/useDialog'
import { compileRegexScripts } from '@/utils/regexUtils'
import { renderMessage } from '@/utils/messageRenderer'

export interface CompiledRegexScript {
  regex: RegExp
  replacement: string
  placement: number[]
  promptOnly: boolean
  markdownOnly: boolean
  name: string
}

export function useChat(globalRegex: any[] = []) {
  const chatStore = useChatStore()
  const userStore = useUserStore()
  const userDataStore = useUserDataStore()
  const { showConfirm, showDangerConfirm, showErrorAlert } = useDialog()
  
  const messagesContainer = ref<HTMLElement | null>(null)
  const editingIndex = ref(-1)
  const editContent = ref('')
  const inputText = ref('')
  const showSuggestions = ref(false)
  const suggestions = ref<string[]>([])
  const isGeneratingSuggestions = ref(false)
  let lastSuggestionsMessagesSnapshot: string = ''
  
  const autoFetchSuggestions = ref(localStorage.getItem('role_play_auto_suggestions') === 'true')
  
  const messages = computed(() => chatStore.messages)
  
  const compiledRegexScripts = computed<CompiledRegexScript[]>(() => {
    const globalRegexList = globalRegex || []
    const charRegexList = chatStore.currentCharacter?.regex_scripts || []
    const userRegexList = userDataStore.enabledRegexScripts || []
    return compileRegexScripts(globalRegexList, charRegexList, userRegexList)
  })

  function scrollToBottom() {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }

  function getMessageContent(message: any, index: number) {
    if (message.role === 'assistant' && 
        chatStore.isStreaming && 
        index === chatStore.messages.length - 1) {
      return chatStore.streamingContent || message.content
    }
    return message.content
  }

  function renderMarkdown(content: string, role: string = 'assistant') {
    return renderMessage({
      content,
      role: role as 'user' | 'assistant',
      userName: chatStore.userName || '用户',
      compiledRegexScripts: compiledRegexScripts.value,
      isStreaming: chatStore.isStreaming
    });
  }

  async function handleSubmit() {
    if (!inputText.value.trim()) return
    
    if (!userStore.user?.userName) {
      return { needUserName: true }
    }
    
    const text = inputText.value
    inputText.value = ''
    await chatStore.sendMessage(text)
    return { needUserName: false }
  }

  function copyMessage(content: string) {
    navigator.clipboard.writeText(content)
  }

  function startEdit(index: number, content: string) {
    editingIndex.value = index
    editContent.value = content
  }

  function cancelEdit() {
    editingIndex.value = -1
    editContent.value = ''
  }

  function saveEdit(index: number) {
    chatStore.editMessage(index, editContent.value)
    cancelEdit()
    suggestions.value = []
    lastSuggestionsMessagesSnapshot = ''
    showSuggestions.value = false
  }

  async function deleteMessage(index: number) {
    const confirmed = await showDangerConfirm('确定要删除这条消息吗？')
    if (confirmed) {
      chatStore.deleteMessage(index)
      suggestions.value = []
      lastSuggestionsMessagesSnapshot = ''
      showSuggestions.value = false
    }
  }

  function regenerateMessage(index: number) {
    chatStore.regenerateFrom(index)
    suggestions.value = []
    lastSuggestionsMessagesSnapshot = ''
    showSuggestions.value = false
  }

  function regenerateFromAssistant(index: number) {
    if (index > 0 && chatStore.messages[index - 1].role === 'user') {
      chatStore.regenerateFrom(index - 1)
      suggestions.value = []
      lastSuggestionsMessagesSnapshot = ''
      showSuggestions.value = false
    }
  }

  function regenerateUserMessage(index: number) {
    const msg = chatStore.messages[index]
    if (!msg || msg.role !== 'user') return
    chatStore.regenerateFrom(index)
  }

  async function regenerateGreeting() {
    if (!chatStore.currentCharacter) return
    
    try {
      const response = await chatApi.generateGreeting(chatStore.currentCharacter.id)
      const first_mesIndex = chatStore.messages.findIndex(m => m.isGreeting)
      
      if (first_mesIndex !== -1) {
        chatStore.editMessage(first_mesIndex, response.first_mes)
      }
    } catch (e: any) {
      throw new Error('生成开场白失败: ' + e.message)
    }
  }

  async function confirmClearHistory() {
    const confirmed = await showDangerConfirm('确定要清空聊天记录吗？')
    if (confirmed) {
      chatStore.clearHistory()
    }
  }

  async function handleExportChat() {
    try {
      await chatStore.exportChat()
    } catch (e: any) {
      throw new Error('导出失败: ' + e.message)
    }
  }

  async function handleImportChat(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return 0
    
    try {
      const count = await chatStore.importChat(file)
      return count
    } catch (e: any) {
      throw new Error('导入失败: ' + e.message)
    } finally {
      ;(event.target as HTMLInputElement).value = ''
    }
  }

  async function fetchSuggestions(options: { autoShow?: boolean, force?: boolean } = {}) {
    if (isGeneratingSuggestions.value) return
    
    const { autoShow = true, force = false } = options
    
    const currentMessagesSnapshot = JSON.stringify(chatStore.messages.slice(-6))
    if (!force && suggestions.value.length > 0 && lastSuggestionsMessagesSnapshot === currentMessagesSnapshot) {
      if (autoShow) {
        showSuggestions.value = true
      }
      return
    }
    
    isGeneratingSuggestions.value = true
    if (autoShow) {
      showSuggestions.value = false
    }
    
    try {
      const model = chatStore.selectedModel || chatStore.globalDefaultModel
      const customModelConfig = chatStore.useCustomModel ? chatStore.customModelConfig : undefined
      
      let token = localStorage.getItem('user_token')
      if (!token) {
        token = localStorage.getItem('admin_token')
      }
      
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          character_id: chatStore.currentCharacter?.id,
          history: chatStore.messages,
          user_name: chatStore.userName,
          model: model,
          custom_model_config: customModelConfig
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        if (data.error === 'Insufficient quota') {
          setTimeout(() => {
            showErrorAlert('对话额度不足，请签到获取更多额度或联系管理员')
          }, 100)
        }
        return
      }
      
      suggestions.value = data.suggestions || []
      if (autoShow) {
        showSuggestions.value = suggestions.value.length > 0
      }
      lastSuggestionsMessagesSnapshot = JSON.stringify(chatStore.messages.slice(-6))
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      isGeneratingSuggestions.value = false
    }
  }

  function sendSuggestion(suggestion: string) {
    inputText.value = suggestion
    handleSubmit()
    showSuggestions.value = false
  }

  function toggleAutoSuggestions() {
    autoFetchSuggestions.value = !autoFetchSuggestions.value
    localStorage.setItem('role_play_auto_suggestions', autoFetchSuggestions.value.toString())
  }

  watch(() => messages.value.length, () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  })

  let previousIsStreaming = chatStore.isStreaming
  watch(() => chatStore.isStreaming, (isStreaming) => {
    if (previousIsStreaming && !isStreaming && autoFetchSuggestions.value) {
      setTimeout(() => {
        if (chatStore.error) return
        
        const lastMessage = chatStore.messages[chatStore.messages.length - 1]
        if (lastMessage && lastMessage.role === 'assistant') {
          const content = lastMessage.content || ''
          if (!content.trim() || content.startsWith('[Error:')) {
            return
          }
        }
        
        fetchSuggestions({ autoShow: false })
      }, 300)
    }
    previousIsStreaming = isStreaming
  })

  return {
    messagesContainer,
    editingIndex,
    editContent,
    inputText,
    showSuggestions,
    suggestions,
    isGeneratingSuggestions,
    autoFetchSuggestions,
    messages,
    compiledRegexScripts,
    scrollToBottom,
    getMessageContent,
    renderMarkdown,
    handleSubmit,
    copyMessage,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteMessage,
    regenerateMessage,
    regenerateFromAssistant,
    regenerateUserMessage,
    regenerateGreeting,
    confirmClearHistory,
    handleExportChat,
    handleImportChat,
    fetchSuggestions,
    sendSuggestion,
    toggleAutoSuggestions
  }
}
