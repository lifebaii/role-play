import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import type { Character } from '@/types'
import { isLocalFriend, getLocalFriend, importRawFile, createLocalFriend, updateLocalFriendData, updateLocalFriendShared, removeLocalFriend } from '@/utils/localFriendStorage'

export function useCharacter() {
  const chatStore = useChatStore()
  const userStore = useUserStore()
  
  const showCreateCharacterModal = ref(false)
  const showDeleteCharacterConfirm = ref(false)
  const isLoadingCharacterDetail = ref(false)
  const isSavingCharacter = ref(false)
  const isImportingCharacter = ref(false)
  const editingCharacter = ref<Character | null>(null)
  const isLoadingMeta = ref(false)
  const isLiking = ref(false)
  const isLikingInEdit = ref(false)
  const isLoadingOriginal = ref(false)
  
  const editingCharacterMeta = ref({
    originalId: null as string | null,
    shared: false,
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    originalMeta: null as {
      originalId: string | null
      shared: boolean
      likeCount: number
      commentCount: number
      isLiked: boolean
    } | null
  })
  
  const displayMeta = computed(() => {
    if (editingCharacterMeta.value.originalMeta) {
      return editingCharacterMeta.value.originalMeta
    }
    return {
      originalId: editingCharacterMeta.value.originalId,
      shared: editingCharacterMeta.value.shared,
      likeCount: editingCharacterMeta.value.likeCount,
      commentCount: editingCharacterMeta.value.commentCount,
      isLiked: editingCharacterMeta.value.isLiked
    }
  })
  
  const isViewOnlyMode = ref(false)
  const likedCharacterIds = ref<string[]>([])
  
  const newCharacterData = ref({
    name: '',
    description: '',
    avatar: '',
    first_mes: '',
    personality: '',
    scenario: '',
    system_prompt: '',
    creator_notes: '',
    temperature: 1,
    character_book: { entries: [] as any[] },
    regex_scripts: [] as any[],
    tags: [] as string[]
  })
  
  const friendCharacters = computed(() => {
    const result = [...userStore.friendCharacters]
    const friendOrder = chatStore.getFriendOrder()
    if (friendOrder.length > 0) {
      result.sort((a, b) => {
        const aIndex = friendOrder.indexOf(a.id)
        const bIndex = friendOrder.indexOf(b.id)
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex
        }
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        return 0
      })
    }
    return result
  })
  
  const isCurrentCharacterFriend = computed(() => {
    if (!chatStore.currentCharacter) return false
    const friends = userStore.friendCharacters || []
    return friends.some(f => f.id === chatStore.currentCharacter.id)
  })
  
  const isCurrentCharacterUserOwned = computed(() => {
    if (!chatStore.currentCharacter) return false
    return userStore.friendCharacters.some(c => c.id === chatStore.currentCharacter.id && c.isUserCreated)
  })
  
  const isCurrentCharacterLocal = computed(() => {
    if (!chatStore.currentCharacter) return false
    return !!chatStore.currentCharacter.role_play?.id
  })
  
  function selectCharacter(character: any) {
    chatStore.selectCharacter(character)
  }
  
  function openCreateCharacterModal() {
    editingCharacter.value = null
    isViewOnlyMode.value = false
    editingCharacterMeta.value = {
      originalId: null,
      shared: false,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      originalMeta: null
    }
    newCharacterData.value = {
      name: '',
      description: '',
      avatar: '',
      first_mes: '',
      personality: '',
      scenario: '',
      system_prompt: '',
      creator_notes: '',
      temperature: 1,
      character_book: { entries: [] },
      regex_scripts: [],
      tags: []
    }
    showCreateCharacterModal.value = true
  }
  
  function closeCreateCharacterModal() {
    showCreateCharacterModal.value = false
  }
  
  async function saveCharacter(data: any) {
    if (!data.name.trim()) return
    
    isSavingCharacter.value = true
    try {
      const characterData = {
      name: data.name,
      description: data.description,
      avatar: data.avatar,
      personality: data.personality,
      scenario: data.scenario,
      first_mes: data.first_mes,
      temperature: data.temperature || 1,
      character_book: { entries: data.character_book?.entries || [] },
      extensions: {
        ...data.extensions,
        regex_scripts: data.regex_scripts || []
      },
      creator_notes: data.creator_notes || '',
      system_prompt: data.system_prompt || '',
      tags: data.tags || []
    }
      
      const isLoggedIn = userStore.isLoggedIn()
      
      if (editingCharacter.value) {
        const editId = editingCharacter.value.role_play?.id || editingCharacter.value.id
        
        if (await isLocalFriend(editId)) {
          await updateLocalFriendData(editId, characterData)
          await userStore.loadLocalFriends()
        } else if (isLoggedIn && userStore.user?.id) {
          await chatStore.updateUserCharacter(userStore.user.id, editingCharacter.value.id, characterData)
        }
        
        const currentId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id
        if (currentId === editId) {
          await chatStore.selectCharacter(editingCharacter.value)
        }
      } else {
        const newFriend = await createLocalFriend(characterData, editingCharacterMeta.value.shared)
        await userStore.loadLocalFriends()
      }
      
      closeCreateCharacterModal()
    } catch (error: any) {
      throw new Error('保存角色失败: ' + error.message)
    } finally {
      isSavingCharacter.value = false
    }
  }
  
  async function editUserCharacter(character: Character) {
    if (!character.id) return
    
    editingCharacter.value = character
    editingCharacterMeta.value = {
      originalId: null,
      shared: false,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      originalMeta: null
    }
    isViewOnlyMode.value = false
    isLoadingCharacterDetail.value = true
    isLoadingMeta.value = true
    showCreateCharacterModal.value = true
    
    try {
      let fullCharacter: Character | null = null
      
      const charId = character.role_play?.id || character.id
      
      if (await isLocalFriend(charId)) {
        fullCharacter = await getLocalFriend(charId)
      }
      
      isLoadingMeta.value = false
      
      if (fullCharacter) {
        editingCharacter.value = fullCharacter
        const charData = fullCharacter.data || fullCharacter
        newCharacterData.value = {
          name: charData.name || '',
          description: charData.description || '',
          avatar: charData.avatar || '',
          first_mes: charData.first_mes || '',
          personality: charData.personality || '',
          scenario: charData.scenario || '',
          system_prompt: charData.system_prompt || '',
          creator_notes: charData.creator_notes || '',
          temperature: charData.temperature || 1,
          character_book: { entries: charData.character_book?.entries || [] },
          extensions: charData.extensions || {},
          regex_scripts: charData.extensions?.regex_scripts || [],
          tags: charData.tags || []
        }
        if (fullCharacter.role_play?.shared !== undefined) {
          editingCharacterMeta.value.shared = fullCharacter.role_play.shared
        }
      }
      
      isLoadingCharacterDetail.value = false
    } catch (error) {
      console.error('获取角色详情失败:', error)
      closeCreateCharacterModal()
      throw new Error('获取角色详情失败，请重试')
    }
  }
  
  async function handleViewCharacter(character: any) {
    if (!character.id) return
    
    editingCharacter.value = character
    editingCharacterMeta.value = {
      originalId: null,
      shared: false,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      originalMeta: null
    }
    isViewOnlyMode.value = true
    isLoadingCharacterDetail.value = true
    isLoadingMeta.value = true
    showCreateCharacterModal.value = true
    
    try {
      let fullCharacter: any
      
      const charId = character.role_play?.id || character.id
      
      if (await isLocalFriend(charId)) {
        fullCharacter = await getLocalFriend(charId)
        isLoadingMeta.value = false
      } else {
        fullCharacter = character
        isLoadingMeta.value = false
      }
      
      if (fullCharacter) {
        editingCharacter.value = fullCharacter
        const charData = fullCharacter.data || fullCharacter
        newCharacterData.value = {
          name: charData.name || '',
          description: charData.description || '',
          avatar: charData.avatar || '',
          first_mes: charData.first_mes || '',
          personality: charData.personality || '',
          scenario: charData.scenario || '',
          system_prompt: charData.system_prompt || '',
          creator_notes: charData.creator_notes || '',
          temperature: charData.temperature || 1,
          character_book: { entries: charData.character_book?.entries || [] },
          extensions: charData.extensions || {},
          regex_scripts: charData.extensions?.regex_scripts || [],
          tags: charData.tags || []
        }
        if (fullCharacter.role_play?.shared !== undefined) {
          editingCharacterMeta.value.shared = fullCharacter.role_play.shared
        }
      }
      
      isLoadingCharacterDetail.value = false
    } catch (error) {
      console.error('获取角色详情失败:', error)
      closeCreateCharacterModal()
      throw new Error('获取角色详情失败，请重试')
    }
  }
  
  async function deleteUserCharacter(character: any) {
    if (!confirm(`确定要删除角色 "${character.name || character.data?.name}" 吗？`)) return
    
    try {
      const charId = character.role_play?.id || character.id
      
      if (await isLocalFriend(charId)) {
        await removeLocalFriend(charId)
        await userStore.loadLocalFriends()
      } else if (userStore.user?.id) {
        await chatStore.deleteUserCharacter(userStore.user.id, character.id)
        userStore.loadFriends()
      }
      
      const currentId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id
      if (currentId === charId) {
        chatStore.setCurrentCharacter(null)
      }
    } catch (error) {
      console.error('Failed to delete character:', error)
      throw new Error('删除角色失败')
    }
  }
  
  async function handleDeleteFromEdit() {
    const charId = editingCharacter.value?.role_play?.id || editingCharacter.value?.id || newCharacterData.value?.id
    
    if (!charId) {
      throw new Error('无法获取角色信息，删除失败')
    }
    
    try {
      if (await isLocalFriend(charId)) {
        await removeLocalFriend(charId)
        await userStore.loadLocalFriends()
      } else if (userStore.user?.id) {
        await chatStore.deleteUserCharacter(userStore.user.id, editingCharacter.value?.id || charId)
        userStore.loadFriends()
      }
      
      const currentId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id
      if (currentId === charId) {
        chatStore.setCurrentCharacter(null)
      }
      closeCreateCharacterModal()
    } catch (error) {
      console.error('Failed to delete character:', error)
      throw new Error('删除角色失败')
    }
  }
  
  function confirmDeleteCharacter() {
    showDeleteCharacterConfirm.value = true
  }
  
  async function handleDeleteCharacter() {
    if (!chatStore.currentCharacter) return
    
    try {
      const characterId = chatStore.currentCharacter.role_play?.id || chatStore.currentCharacter.id
      
      if (await isLocalFriend(characterId)) {
        await removeLocalFriend(characterId)
        await userStore.loadLocalFriends()
      } else if (userStore.user?.id) {
        await chatStore.deleteUserCharacter(userStore.user.id, chatStore.currentCharacter.id)
        userStore.loadFriends()
      }
      
      chatStore.setCurrentCharacter(null)
      showDeleteCharacterConfirm.value = false
    } catch (error) {
      console.error('Failed to delete character:', error)
      throw new Error('删除角色失败')
    }
  }
  
  async function handleToggleLike() {
    const character = chatStore.currentCharacter
    if (!character || !character.id) return

    const charId = character.role_play?.id || character.id
    if (await isLocalFriend(charId)) return

    isLiking.value = true
    try {
      const isLiked = !likedCharacterIds.value.includes(character.id)
      
      if (isLiked) {
        if (!likedCharacterIds.value.includes(character.id)) {
          likedCharacterIds.value.push(character.id)
        }
      } else {
        likedCharacterIds.value = likedCharacterIds.value.filter(id => id !== character.id)
      }
      
      if (chatStore.currentCharacter) {
        chatStore.currentCharacter.likeCount = isLiked 
          ? (chatStore.currentCharacter.likeCount || 0) + 1 
          : Math.max(0, (chatStore.currentCharacter.likeCount || 0) - 1)
      }
    } catch (e) {
      console.error('Failed to toggle like:', e)
    } finally {
      isLiking.value = false
    }
  }
  
  async function handleToggleLikeInEdit() {
    const likeCharId = editingCharacterMeta.value.originalId || (editingCharacterMeta.value.shared ? editingCharacter.value?.id : null)
    if (!likeCharId) return

    if (await isLocalFriend(likeCharId)) return

    isLikingInEdit.value = true
    try {
      const isLiked = !likedCharacterIds.value.includes(likeCharId)
      
      if (editingCharacterMeta.value.originalMeta) {
        editingCharacterMeta.value.originalMeta.likeCount = isLiked 
          ? (editingCharacterMeta.value.originalMeta.likeCount || 0) + 1 
          : Math.max(0, (editingCharacterMeta.value.originalMeta.likeCount || 0) - 1)
        editingCharacterMeta.value.originalMeta.isLiked = isLiked
      } else {
        editingCharacterMeta.value.likeCount = isLiked 
          ? (editingCharacterMeta.value.likeCount || 0) + 1 
          : Math.max(0, (editingCharacterMeta.value.likeCount || 0) - 1)
        editingCharacterMeta.value.isLiked = isLiked
      }
      
      if (isLiked) {
        if (!likedCharacterIds.value.includes(likeCharId)) {
          likedCharacterIds.value.push(likeCharId)
        }
      } else {
        likedCharacterIds.value = likedCharacterIds.value.filter(id => id !== likeCharId)
      }
    } catch (e: any) {
      console.error('Failed to toggle like:', e)
    } finally {
      isLikingInEdit.value = false
    }
  }
  
  async function loadOriginalCharacterData() {
    if (!editingCharacterMeta.value.originalId) return
    
    isLoadingOriginal.value = true
    try {
      const originalCharacter = await getLocalFriend(editingCharacterMeta.value.originalId)
      
      if (originalCharacter) {
        newCharacterData.value = {
        name: originalCharacter.name || '',
        description: originalCharacter.description || '',
        avatar: originalCharacter.avatar || '',
        first_mes: originalCharacter.first_mes || '',
        personality: originalCharacter.personality || '',
        scenario: originalCharacter.scenario || '',
        system_prompt: originalCharacter.system_prompt || '',
        creator_notes: originalCharacter.creator_notes || '',
        temperature: originalCharacter.temperature ?? 1,
        character_book: { entries: originalCharacter.character_book?.entries || [] },
        extensions: originalCharacter.extensions || {},
        regex_scripts: originalCharacter.extensions?.regex_scripts || [],
        tags: originalCharacter.tags || []
      }
      }
      
      return '最新角色数据已加载，需要手动保存'
    } catch (e: any) {
      console.error('Failed to load original character:', e)
      throw new Error(e.message || '加载原角色数据失败')
    } finally {
      isLoadingOriginal.value = false
    }
  }
  
  async function loadLikedCharacters() {
    likedCharacterIds.value = []
  }
  
  async function handleImportUserCharacter(event: Event) {
    const files = (event.target as HTMLInputElement).files
    if (!files || files.length === 0) return

    console.log(`[Import] Starting import, files count: ${files.length}`)
    isImportingCharacter.value = true

    try {
      let successCount = 0
      let failCount = 0

      for (const file of Array.from(files)) {
        try {
          await importRawFile(file)
          successCount++
        } catch (e) {
          console.error('[Import] Failed to import file:', e)
          failCount++
        }
      }

      await userStore.loadLocalFriends()

      console.log(`[Import] Import completed, success: ${successCount}, failed: ${failCount}`)
      return { successCount, failCount }
    } catch (error: any) {
      console.error('[Import] Import failed:', error)
      throw new Error('导入失败: ' + error.message)
    } finally {
      isImportingCharacter.value = false
      ;(event.target as HTMLInputElement).value = ''
    }
  }
  
  const isUpdatingShared = ref(false)
  
  async function handleUpdateShared(value: boolean) {
    if (!editingCharacter.value) return
    
    const editId = editingCharacter.value.role_play?.id || editingCharacter.value.id
    
    if (await isLocalFriend(editId)) {
      isUpdatingShared.value = true
      try {
        await updateLocalFriendShared(editId, value)
        editingCharacterMeta.value.shared = value
        await userStore.loadLocalFriends()
      } catch (e: any) {
        console.error('Failed to update shared:', e)
        throw new Error(e.message || '更新分享状态失败')
      } finally {
        isUpdatingShared.value = false
      }
      return
    }
    
    if (!userStore.user?.id) return
    
    isUpdatingShared.value = true
    try {
      await updateLocalFriendShared(editingCharacter.value.id, value)
      editingCharacterMeta.value.shared = value
      await userStore.loadLocalFriends()
    } catch (e: any) {
      console.error('Failed to update shared:', e)
      throw new Error(e.message || '更新分享状态失败')
    } finally {
      isUpdatingShared.value = false
    }
  }
  
  return {
    showCreateCharacterModal,
    showDeleteCharacterConfirm,
    isLoadingCharacterDetail,
    isSavingCharacter,
    isImportingCharacter,
    editingCharacter,
    editingCharacterMeta,
    displayMeta,
    isLoadingMeta,
    isViewOnlyMode,
    newCharacterData,
    likedCharacterIds,
    isLiking,
    isLikingInEdit,
    isLoadingOriginal,
    isUpdatingShared,
    friendCharacters,
    isCurrentCharacterFriend,
    isCurrentCharacterUserOwned,
    isCurrentCharacterLocal,
    selectCharacter,
    openCreateCharacterModal,
    closeCreateCharacterModal,
    saveCharacter,
    editUserCharacter,
    handleViewCharacter,
    deleteUserCharacter,
    handleDeleteFromEdit,
    confirmDeleteCharacter,
    handleDeleteCharacter,
    handleToggleLike,
    handleToggleLikeInEdit,
    handleUpdateShared,
    loadOriginalCharacterData,
    loadLikedCharacters,
    handleImportUserCharacter
  }
}
