import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { useDialog } from '@/composables/useDialog'
import type { Character } from '@/types'
import { isLocalFriend, getLocalFriend, importRawFile, createLocalFriend, updateLocalFriendData, updateLocalFriendShared, removeLocalFriend, updateLocalFriendId, getCharacterBlob, sortFriendsByMeta } from '@/utils/localFriendStorage'
import { charactersApi } from '@/api'
import { readPngChunks, decodeBase64Utf8, normalizeCharacterData } from '@/utils/characterImport'

export function useCharacter() {
  const chatStore = useChatStore()
  const userStore = useUserStore()
  const { showDangerConfirm } = useDialog()
  
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
  const isLoadingSource = ref(false)
  const isLoadingViewData = ref(false)
  
  const editingCharacterMeta = ref({
    originalId: null as string | null,
    shared: false,
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    originalUserId: null as string | null,
    thumbnailUrl: null as string | null,
    sourceUrl: null as string | null,
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
  const isOnlineFriend = ref(false)
  const existsOnServer = ref(false)
  const isOwnerOfCharacter = ref(false)
  
  const showCommentSection = computed(() => {
    if (!userStore.isLoggedIn()) return false
    if (editingCharacterMeta.value.originalId) return true
    if (editingCharacterMeta.value.shared) return true
    return false
  })
  
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
    return sortFriendsByMeta(result)
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
      originalUserId: null,
      thumbnailUrl: null,
      sourceUrl: null,
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
    
    const charId = character.role_play?.id || character.id
    
    // 编辑模式：数据来自本地，立即显示
    // 元数据仅用于控制UI（图标、按钮状态）
    editingCharacter.value = character
    editingCharacterMeta.value = {
      originalId: character.role_play?.originalId || character.originalId || null,
      shared: character.role_play?.shared || character.shared || false,
      likeCount: character.likeCount || 0,
      commentCount: character.commentCount || 0,
      isLiked: character.liked || false,
      originalUserId: null,
      thumbnailUrl: character.thumbnailUrl || null,
      sourceUrl: character.sourceUrl || null,
      originalMeta: null
    }
    isViewOnlyMode.value = false
    isLoadingCharacterDetail.value = false
    isLoadingMeta.value = true
    isOnlineFriend.value = !!(character.role_play?.originalId || character.originalId)
    existsOnServer.value = false
    isOwnerOfCharacter.value = false
    showCreateCharacterModal.value = true
    
    // 立即设置表单数据（来自本地）
    const charData = character.data || character
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
    
    // 异步获取元数据（仅用于UI控制）
    if (userStore.isLoggedIn()) {
      try {
        const meta = await charactersApi.getCharacterMeta(charId)
        if (meta) {
          editingCharacterMeta.value.shared = meta.shared || false
          editingCharacterMeta.value.likeCount = meta.likeCount || 0
          editingCharacterMeta.value.commentCount = meta.commentCount || 0
          editingCharacterMeta.value.isLiked = meta.isLiked || false
          editingCharacterMeta.value.originalUserId = meta.originalUserId || null
          editingCharacterMeta.value.originalId = meta.originalId || null
          editingCharacterMeta.value.thumbnailUrl = meta.thumbnailUrl || null
          editingCharacterMeta.value.sourceUrl = meta.sourceUrl || null
          
          existsOnServer.value = meta.exists
          isOwnerOfCharacter.value = meta.isOwner
          
          if (meta.originalId) {
            isOnlineFriend.value = true
            if (meta.originalMeta) {
              editingCharacterMeta.value.originalMeta = meta.originalMeta
            }
          }
        }
      } catch (e) {
        console.log('[Character] Failed to get meta, character may not exist on server')
        existsOnServer.value = false
        isOwnerOfCharacter.value = false
      } finally {
        isLoadingMeta.value = false
      }
    } else {
      isLoadingMeta.value = false
    }
  }
  
  async function handleViewCharacter(character: any) {
    if (!character.id) return
    
    const charId = character.role_play?.id || character.id
    
    editingCharacter.value = character
    editingCharacterMeta.value = {
      originalId: character.role_play?.originalId || character.originalId || null,
      shared: character.role_play?.shared || character.shared || false,
      likeCount: character.likeCount || 0,
      commentCount: character.commentCount || 0,
      isLiked: character.liked || false,
      originalUserId: null,
      thumbnailUrl: character.thumbnailUrl || null,
      sourceUrl: character.sourceUrl || null,
      originalMeta: null
    }
    isViewOnlyMode.value = true
    isLoadingCharacterDetail.value = false
    isLoadingMeta.value = true
    isLoadingViewData.value = true
    isOnlineFriend.value = !!(character.role_play?.originalId || character.originalId)
    showCreateCharacterModal.value = true
    
    const charData = character.data || character
    const hasLocalData = charData.name || charData.description || charData.first_mes
    
    if (hasLocalData) {
      newCharacterData.value = {
        name: charData.name || '',
        description: charData.description || '',
        avatar: charData.avatar || character.thumbnailUrl || '',
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
      isLoadingViewData.value = false
    } else {
      newCharacterData.value = {
        name: character.name || character.character?.name || '加载中...',
        description: character.description || character.character?.description || '',
        avatar: character.thumbnailUrl || character.avatar || '',
        first_mes: '',
        personality: '',
        scenario: '',
        system_prompt: '',
        creator_notes: '',
        temperature: 1,
        character_book: { entries: [] },
        extensions: {},
        regex_scripts: [],
        tags: []
      }
    }
    
    if (userStore.isLoggedIn()) {
      try {
        const meta = await charactersApi.getCharacterMeta(charId)
        if (meta) {
          editingCharacterMeta.value.shared = meta.shared || false
          editingCharacterMeta.value.likeCount = meta.likeCount || 0
          editingCharacterMeta.value.commentCount = meta.commentCount || 0
          editingCharacterMeta.value.isLiked = meta.isLiked || false
          editingCharacterMeta.value.originalId = meta.originalId || null
          editingCharacterMeta.value.thumbnailUrl = meta.thumbnailUrl || null
          editingCharacterMeta.value.sourceUrl = meta.sourceUrl || null
          
          if (meta.originalId) {
            isOnlineFriend.value = true
            if (meta.originalMeta) {
              editingCharacterMeta.value.originalMeta = meta.originalMeta
            }
          }
          
          if (meta.sourceUrl) {
            isLoadingSource.value = true
            try {
              const sourceData = await loadCharacterFromSource(
                meta.sourceUrl,
                meta.file_type as 'json' | 'png' | null
              )
              
              if (sourceData) {
                const sourceCharData = sourceData.data || sourceData
                newCharacterData.value = {
                  name: sourceCharData.name || '',
                  description: sourceCharData.description || '',
                  avatar: sourceCharData.avatar || '',
                  first_mes: sourceCharData.first_mes || sourceCharData.greeting || '',
                  personality: sourceCharData.personality || '',
                  scenario: sourceCharData.scenario || '',
                  system_prompt: sourceCharData.system_prompt || '',
                  creator_notes: sourceCharData.creator_notes || '',
                  temperature: sourceCharData.temperature ?? 1,
                  character_book: { entries: sourceCharData.character_book?.entries || [] },
                  extensions: sourceCharData.extensions || {},
                  regex_scripts: sourceCharData.extensions?.regex_scripts || [],
                  tags: sourceCharData.tags || []
                }
              }
            } finally {
              isLoadingSource.value = false
            }
          } else if (!hasLocalData) {
            try {
              const detail = await charactersApi.getCharacterDetail(charId)
              if (detail.character) {
                const serverData = detail.character.data || detail.character
                newCharacterData.value = {
                  name: serverData.name || '',
                  description: serverData.description || '',
                  avatar: serverData.avatar || '',
                  first_mes: serverData.first_mes || '',
                  personality: serverData.personality || '',
                  scenario: serverData.scenario || '',
                  system_prompt: serverData.system_prompt || '',
                  creator_notes: serverData.creator_notes || '',
                  temperature: serverData.temperature ?? 1,
                  character_book: { entries: serverData.character_book?.entries || [] },
                  extensions: serverData.extensions || {},
                  regex_scripts: serverData.extensions?.regex_scripts || [],
                  tags: serverData.tags || []
                }
              }
            } catch (e) {
              console.log('[Character] Failed to get character detail')
            }
          }
        }
      } catch (e) {
        console.log('[Character] Failed to get meta, character may not exist on server')
      } finally {
        isLoadingMeta.value = false
        isLoadingViewData.value = false
      }
    } else {
      isLoadingMeta.value = false
      isLoadingViewData.value = false
    }
  }
  
  async function deleteUserCharacter(character: any) {
    const confirmed = await showDangerConfirm(`确定要删除角色 "${character.name || character.data?.name}" 吗？`)
    if (!confirmed) return
    
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

    isLiking.value = true
    try {
      const result = await charactersApi.toggleLike(charId)
      
      if (result.liked) {
        if (!likedCharacterIds.value.includes(charId)) {
          likedCharacterIds.value.push(charId)
        }
      } else {
        likedCharacterIds.value = likedCharacterIds.value.filter(id => id !== charId)
      }
      
      if (chatStore.currentCharacter) {
        chatStore.currentCharacter.likeCount = result.likeCount
      }
    } catch (e: any) {
      console.error('Failed to toggle like:', e)
    } finally {
      isLiking.value = false
    }
  }
  
  async function handleToggleLikeInEdit() {
    const likeCharId = editingCharacterMeta.value.originalId || (editingCharacterMeta.value.shared ? (editingCharacter.value?.role_play?.id || editingCharacter.value?.id) : null)
    console.log('[handleToggleLikeInEdit] likeCharId:', likeCharId, 'originalId:', editingCharacterMeta.value.originalId, 'shared:', editingCharacterMeta.value.shared, 'editingCharacter.id:', editingCharacter.value?.id, 'editingCharacter.role_play?.id:', editingCharacter.value?.role_play?.id)
    if (!likeCharId) {
      console.log('[handleToggleLikeInEdit] No likeCharId, returning early')
      return
    }

    console.log('[handleToggleLikeInEdit] Calling API with likeCharId:', likeCharId)
    isLikingInEdit.value = true
    try {
      const result = await charactersApi.toggleLike(likeCharId)
      console.log('[handleToggleLikeInEdit] API result:', result)
      
      if (editingCharacterMeta.value.originalMeta) {
        editingCharacterMeta.value.originalMeta.likeCount = result.likeCount
        editingCharacterMeta.value.originalMeta.isLiked = result.liked
      } else {
        editingCharacterMeta.value.likeCount = result.likeCount
        editingCharacterMeta.value.isLiked = result.liked
      }
      
      if (result.liked) {
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
  
  async function loadCharacterFromSource(
    sourceUrl: string,
    fileType: 'json' | 'png' | null
  ): Promise<any | null> {
    try {
      const response = await fetch(sourceUrl)
      
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`)
      }
      
      const contentType = response.headers.get('Content-Type') || ''
      const url = sourceUrl.toLowerCase()
      
      if (contentType.includes('image/') || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg')) {
        const buffer = await response.arrayBuffer()
        const chunks = await readPngChunks(buffer)
        
        let rawDataStr = chunks['chara'] || chunks['character'] || ''
        
        if (!rawDataStr) {
          for (const key of Object.keys(chunks)) {
            try {
              const parsed = JSON.parse(chunks[key])
              if (parsed.spec || parsed.data) {
                rawDataStr = chunks[key]
                break
              }
            } catch {
              continue
            }
          }
        }
        
        if (rawDataStr) {
          try {
            const charData = JSON.parse(decodeBase64Utf8(rawDataStr))
            const normalized = normalizeCharacterData(charData)
            if (normalized && !Array.isArray(normalized)) {
              return normalized
            }
          } catch {
            return null
          }
        }
      } else {
        const text = await response.text()
        let data
        
        if (text.trim().startsWith('{') && text.includes('\n')) {
          const lines = text.trim().split('\n')
          try {
            data = JSON.parse(lines[0])
          } catch {
            data = JSON.parse(text)
          }
        } else {
          data = JSON.parse(text)
        }
        
        const normalized = normalizeCharacterData(data)
        if (normalized && !Array.isArray(normalized)) {
          return normalized
        }
      }
      
      return null
    } catch (e) {
      console.error('Failed to load from source:', e)
      return null
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
  
  const isUploadingToServer = ref(false)
  const isUpdatingToServer = ref(false)
  const isUpdatingFromServer = ref(false)
  
  async function uploadToServer(data: any): Promise<boolean> {
    const charId = editingCharacter.value?.role_play?.id || editingCharacter.value?.id
    const userId = userStore.user?.id
    
    if (!charId || !userId) {
      throw new Error('无法获取角色或用户信息')
    }
    
    isUploadingToServer.value = true
    try {
      const blob = await getCharacterBlob(charId)
      if (!blob) {
        throw new Error('无法获取角色数据')
      }
      
      const characterName = data.name || editingCharacter.value?.data?.name || editingCharacter.value?.name || 'character'
      const isImage = blob.type.startsWith('image/')
      const fileName = isImage ? `${characterName}.png` : `${characterName}.json`
      const file = new File([blob], fileName, { type: blob.type })
      
      const result = await charactersApi.importFiles([file])
      
      if (!result.success || result.imported === 0) {
        throw new Error(result.failedFiles?.[0]?.error || '上传失败')
      }
      
      const newCharId = result.characters?.[0]?.role_play?.id || result.characters?.[0]?.id
      
      if (newCharId && newCharId !== charId) {
        await updateLocalFriendId(charId, newCharId)
        await userStore.loadLocalFriends()
        
        if (editingCharacter.value?.role_play) {
          editingCharacter.value.role_play.id = newCharId
        } else if (editingCharacter.value) {
          editingCharacter.value.id = newCharId
        }
      }
      
      existsOnServer.value = true
      isOwnerOfCharacter.value = true
      editingCharacterMeta.value.shared = true
      
      return true
    } catch (error: any) {
      console.error('[UploadToServer] Failed:', error)
      throw new Error('上传到服务器失败: ' + error.message)
    } finally {
      isUploadingToServer.value = false
    }
  }
  
  async function updateToServer(data: any): Promise<boolean> {
    const charId = editingCharacter.value?.role_play?.id || editingCharacter.value?.id
    const userId = userStore.user?.id
    
    if (!charId || !userId) {
      throw new Error('无法获取角色或用户信息')
    }
    
    isUpdatingToServer.value = true
    try {
      const characterData = {
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        first_mes: data.first_mes,
        personality: data.personality,
        scenario: data.scenario,
        system_prompt: data.system_prompt,
        creator_notes: data.creator_notes,
        temperature: data.temperature,
        character_book: data.character_book,
        extensions: {
          ...data.extensions,
          regex_scripts: data.regex_scripts
        },
        tags: data.tags
      }
      
      await charactersApi.updateUserCharacterData(userId, charId, characterData)
      
      return true
    } catch (error: any) {
      console.error('[UpdateToServer] Failed:', error)
      throw new Error('更新到服务器失败: ' + error.message)
    } finally {
      isUpdatingToServer.value = false
    }
  }
  
  async function updateFromServer(): Promise<boolean> {
    const charId = editingCharacter.value?.role_play?.id || editingCharacter.value?.id
    const originalId = editingCharacterMeta.value.originalId
    
    if (!charId) {
      throw new Error('无法获取角色信息')
    }
    
    isUpdatingFromServer.value = true
    try {
      const targetId = originalId || charId
      const result = await charactersApi.getCharacterDetail(targetId)
      
      if (!result.character) {
        throw new Error('服务器上未找到角色数据')
      }
      
      const serverData = result.character.data || result.character
      
      newCharacterData.value = {
        name: serverData.name || '',
        description: serverData.description || '',
        avatar: serverData.avatar || '',
        first_mes: serverData.first_mes || '',
        personality: serverData.personality || '',
        scenario: serverData.scenario || '',
        system_prompt: serverData.system_prompt || '',
        creator_notes: serverData.creator_notes || '',
        temperature: serverData.temperature ?? 1,
        character_book: { entries: serverData.character_book?.entries || [] },
        extensions: serverData.extensions || {},
        regex_scripts: serverData.extensions?.regex_scripts || [],
        tags: serverData.tags || []
      }
      
      editingCharacterMeta.value.shared = result.characterMeta.shared
      
      return true
    } catch (error: any) {
      console.error('[UpdateFromServer] Failed:', error)
      throw new Error('从服务器更新失败: ' + error.message)
    } finally {
      isUpdatingFromServer.value = false
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
    isOnlineFriend,
    existsOnServer,
    isOwnerOfCharacter,
    showCommentSection,
    newCharacterData,
    likedCharacterIds,
    isLiking,
    isLikingInEdit,
    isLoadingOriginal,
    isLoadingSource,
    isLoadingViewData,
    friendCharacters,
    isCurrentCharacterFriend,
    isCurrentCharacterUserOwned,
    isCurrentCharacterLocal,
    isUploadingToServer,
    isUpdatingToServer,
    isUpdatingFromServer,
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
    loadOriginalCharacterData,
    loadLikedCharacters,
    handleImportUserCharacter,
    uploadToServer,
    updateToServer,
    updateFromServer
  }
}
