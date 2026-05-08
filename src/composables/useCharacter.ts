import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { useDialog } from '@/composables/useDialog'
import type { Character } from '@/types'
import { isLocalFriend, getLocalFriend, importRawFile, createLocalFriend, updateLocalFriendData, updateLocalFriendShared, removeLocalFriend, updateLocalFriendId, getCharacterBlob, sortFriendsByMeta, updateFriendMetaShared, convertToLocalFriend, getFriendMetaById, convertToLocalFriendWithNewId } from '@/utils/localFriendStorage';
import { charactersApi } from '@/api'
import { readPngChunks, decodeBase64Utf8, normalizeCharacterData } from '@/utils/characterImport'
import { debugPrintFile, debugPrintBlob } from '@/utils/debugCharacterFile'

export function useCharacter() {
  const chatStore = useChatStore()
  const userStore = useUserStore()
  const { showDangerConfirm, showConfirm, showAlert, showMultiButtonConfirm } = useDialog()
  
  const showCreateCharacterModal = ref(false)
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
    shared: false,
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    originalUserId: null as string | null,
    thumbnailUrl: null as string | null,
    sourceUrl: null as string | null
  })
  
  const displayMeta = computed(() => {
    return {
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
      shared: false,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      originalUserId: null,
      thumbnailUrl: null,
      sourceUrl: null
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
  
  async function saveCharacter(data: any): Promise<{ success: boolean, message?: string }> {
    if (!data.name.trim()) return { success: false, message: '角色名称不能为空' }
    
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
        closeCreateCharacterModal()
      }
      
      return { success: true, message: '保存成功' }
    } catch (error: any) {
      throw new Error('保存角色失败: ' + error.message)
    } finally {
      isSavingCharacter.value = false
    }
  }
  
  function getApiCharacterId(): string | null {
    return editingCharacter.value?.role_play?.id || editingCharacter.value?.id || null
  }

  async function editUserCharacter(character: Character) {
    if (!character.id) return
    
    const charId = character.role_play?.id || character.id
    
    // 从 friend_meta 中获取 shared 状态
    const friendMeta = getFriendMetaById(charId)
    
    // 编辑模式：数据来自本地，立即显示
    // 元数据仅用于控制UI（图标、按钮状态）
    editingCharacter.value = character
    editingCharacterMeta.value = {
      shared: character.role_play?.shared || character.shared || friendMeta?.shared || false,
      likeCount: character.likeCount || 0,
      commentCount: character.commentCount || 0,
      isLiked: character.liked || false,
      originalUserId: null,
      thumbnailUrl: character.thumbnailUrl || null,
      sourceUrl: character.sourceUrl || null
    }
    isViewOnlyMode.value = false
    isLoadingCharacterDetail.value = false
    isLoadingMeta.value = true
    isOnlineFriend.value = !!friendMeta && friendMeta.addType === 'add'
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
        const metaId = getApiCharacterId()
        if (!metaId) {
          console.log('[Character] No API character ID available')
          existsOnServer.value = false
          isOwnerOfCharacter.value = false
          return
        }
        const meta = await charactersApi.getCharacterMeta(metaId)
        if (meta) {
          editingCharacterMeta.value.shared = meta.shared || false
          editingCharacterMeta.value.likeCount = meta.likeCount || 0
          editingCharacterMeta.value.commentCount = meta.commentCount || 0
          editingCharacterMeta.value.isLiked = meta.isLiked || false
          editingCharacterMeta.value.originalUserId = meta.originalUserId || null
          editingCharacterMeta.value.thumbnailUrl = meta.thumbnailUrl || null
          editingCharacterMeta.value.sourceUrl = meta.sourceUrl || null
          
          // 更新 friend_meta 中的 shared 状态
          updateFriendMetaShared(charId, meta.shared || false)
          
          existsOnServer.value = meta.exists
          isOwnerOfCharacter.value = meta.isOwner
          
          if (!meta.exists && isOnlineFriend.value) {
            console.log('[Character] Character deleted by owner, asking user for confirmation')
            
            const confirmed = await showConfirm(
              '该角色已被原作者删除。是否将其转为本地私密角色？\n\n转换后将生成新的角色ID，聊天记录也会一并迁移。',
              '角色已删除'
            )
            
            if (confirmed) {
              const newId = await convertToLocalFriendWithNewId(charId)
              if (newId) {
                isOnlineFriend.value = false
                existsOnServer.value = false
                
                await showAlert('角色已转为本地私密角色。', '提示')
                
                const updatedCharacter = await getLocalFriend(newId)
                if (updatedCharacter) {
                  await editUserCharacter(updatedCharacter)
                } else {
                  closeCreateCharacterModal()
                }
              }
            } else {
              closeCreateCharacterModal()
            }
          }
        }
      } catch (e: any) {
        console.log('[Character] Failed to get meta, character may not exist on server')
        existsOnServer.value = false
        isOwnerOfCharacter.value = false
        throw new Error(e.message || '获取角色信息失败')
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
    
    // 从 friend_meta 中获取 shared 状态
    const friendMeta = getFriendMetaById(charId)
    
    editingCharacter.value = character
    editingCharacterMeta.value = {
      shared: character.role_play?.shared || character.shared || friendMeta?.shared || false,
      likeCount: character.likeCount || 0,
      commentCount: character.commentCount || 0,
      isLiked: character.liked || false,
      originalUserId: null,
      thumbnailUrl: character.thumbnailUrl || null,
      sourceUrl: character.sourceUrl || null
    }
    isViewOnlyMode.value = true
    isLoadingCharacterDetail.value = false
    isLoadingMeta.value = true
    isLoadingViewData.value = true
    isOnlineFriend.value = !!friendMeta && friendMeta.addType === 'add'
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
        const metaId = getApiCharacterId()
        if (!metaId) {
          console.log('[Character] No API character ID available')
          return
        }
        const meta = await charactersApi.getCharacterMeta(metaId)
        if (meta) {
          editingCharacterMeta.value.shared = meta.shared || false
          editingCharacterMeta.value.likeCount = meta.likeCount || 0
          editingCharacterMeta.value.commentCount = meta.commentCount || 0
          editingCharacterMeta.value.isLiked = meta.isLiked || false
          editingCharacterMeta.value.thumbnailUrl = meta.thumbnailUrl || null
          editingCharacterMeta.value.sourceUrl = meta.sourceUrl || null
          
          // 更新 friend_meta 中的 shared 状态
          updateFriendMetaShared(charId, meta.shared || false)
          
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
            } catch (e: any) {
              console.log('[Character] Failed to get character detail')
              throw new Error(e.message || '获取角色详情失败')
            }
          }
        }
      } catch (e: any) {
        console.log('[Character] Failed to get meta, character may not exist on server')
        throw new Error(e.message || '获取角色信息失败')
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
      isDeletingCharacter.value = true
      
      // 如果角色在服务器上存在且用户是所有者，显示多按钮确认
      if (existsOnServer.value && isOwnerOfCharacter.value) {
        const result = await showMultiButtonConfirm(
          '确定要删除这个角色吗？删除后聊天记录也会一并删除。',
          '删除角色',
          [
            { text: '取消', value: 'cancel' },
            { text: '删除(本地)', value: 'local' },
            { text: '删除(本地+服务器)', value: 'both', variant: 'danger' }
          ],
          'danger'
        )
        
        if (result === 'cancel' || !result) {
          isDeletingCharacter.value = false
          return
        }
        
        // 如果需要删除服务器上的角色，先删除服务器的
        // 删除服务器角色时，使用根级别的 id（服务器 ID），而不是 role_play.id（本地 ID）
        if (result === 'both' && userStore.user?.id) {
          const serverCharId = editingCharacter.value?.id || charId
          await charactersApi.deleteUserCharacter(serverCharId)
        }
        
        // 删除本地角色
        if (await isLocalFriend(charId)) {
          await removeLocalFriend(charId)
          await userStore.loadLocalFriends()
        } else if (userStore.user?.id) {
          await chatStore.deleteUserCharacter(userStore.user.id, editingCharacter.value?.id || charId)
          userStore.loadFriends()
        }
      } else {
        // 普通删除确认
        const confirmed = await showDangerConfirm('确定要删除这个角色吗？删除后聊天记录也会一并删除。')
        if (!confirmed) {
          isDeletingCharacter.value = false
          return
        }
        
        // 删除本地角色
        if (await isLocalFriend(charId)) {
          await removeLocalFriend(charId)
          await userStore.loadLocalFriends()
        } else if (userStore.user?.id) {
          await chatStore.deleteUserCharacter(userStore.user.id, editingCharacter.value?.id || charId)
          userStore.loadFriends()
        }
      }
      
      const currentId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id
      if (currentId === charId) {
        chatStore.setCurrentCharacter(null)
      }
      // 删除成功，设置状态为 false，让 CharacterModal 通过 watch 关闭弹框
      isDeletingCharacter.value = false
    } catch (error) {
      console.error('Failed to delete character:', error)
      isDeletingCharacter.value = false
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
    const likeCharId = getApiCharacterId()
    console.log('[handleToggleLikeInEdit] likeCharId:', likeCharId, 'shared:', editingCharacterMeta.value.shared, 'editingCharacter.id:', editingCharacter.value?.id, 'editingCharacter.role_play?.id:', editingCharacter.value?.role_play?.id)
    if (!likeCharId) {
      console.log('[handleToggleLikeInEdit] No likeCharId, returning early')
      return
    }

    console.log('[handleToggleLikeInEdit] Calling API with likeCharId:', likeCharId)
    isLikingInEdit.value = true
    try {
      const result = await charactersApi.toggleLike(likeCharId)
      console.log('[handleToggleLikeInEdit] API result:', result)
      
      editingCharacterMeta.value.likeCount = result.likeCount
      editingCharacterMeta.value.isLiked = result.liked
      
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
      // 添加时间戳禁用缓存
      const url = new URL(sourceUrl, window.location.origin)
      url.searchParams.set('t', Date.now().toString())
      
      const response = await fetch(url.toString(), { cache: 'no-store' })
      
      if (!response.ok) {
        throw new Error(`获取角色数据失败: ${response.status}`)
      }
      
      const contentType = response.headers.get('Content-Type') || ''
      const urlStr = sourceUrl.toLowerCase()
      
      // 克隆响应以避免读取两次
      const responseForDebug = response.clone()
      const blob = await responseForDebug.blob()
      const fileName = urlStr.split('/').pop() || 'character'
      
      // 添加调试打印
      await debugPrintBlob(blob, fileName, '从服务器下载角色')
      
      if (contentType.includes('image/') || urlStr.endsWith('.png') || urlStr.endsWith('.jpg') || urlStr.endsWith('.jpeg')) {
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
    } catch (e: any) {
      console.error('Failed to load from source:', e)
      throw new Error(e.message || '下载角色数据失败')
    }
  }
  
  async function loadOriginalCharacterData() {
    const charId = editingCharacter.value?.role_play?.id || editingCharacter.value?.id
    if (!charId) return
    
    isLoadingOriginal.value = true
    try {
      const originalCharacter = await getLocalFriend(charId)
      
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

    for (const file of Array.from(files)) {
      await debugPrintFile(file, '用户导入角色')
    }
    
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
  
  const isUpdatingToServer = ref(false)
  const isUpdatingFromServer = ref(false)
  const isDeletingCharacter = ref(false)
  
  async function updateToServer(data: any): Promise<boolean> {
    const charId = editingCharacter.value?.role_play?.id || editingCharacter.value?.id
    const userId = userStore.user?.id

    if (!charId || !userId) {
      throw new Error('无法获取角色或用户信息')
    }

    isUpdatingToServer.value = true
    try {
      // 获取角色 blob
      const blob = await getCharacterBlob(charId)
      if (!blob) {
        throw new Error('无法获取角色数据')
      }

      const characterName = data.name || editingCharacter.value?.data?.name || editingCharacter.value?.name || 'character'
      const isImage = blob.type.startsWith('image/')
      const fileName = isImage ? `${characterName}.png` : `${characterName}.json`
      const file = new File([blob], fileName, { type: blob.type })
      
      await debugPrintFile(file, '更新到服务器')

      // 使用 import-files 接口上传
      const result = await charactersApi.importFiles([file], charId, true)

      if (!result.success || result.imported === 0) {
        throw new Error(result.failedFiles?.[0]?.error || '上传失败')
      }

      return true
    } catch (error: any) {
      console.error('[UpdateToServer] Failed:', error)
      throw new Error('更新到服务器失败: ' + error.message)
    } finally {
      isUpdatingToServer.value = false
    }
  }
  
  async function updateFromServer(): Promise<{ success: boolean, message?: string }> {
    const charId = editingCharacter.value?.role_play?.id || editingCharacter.value?.id
    const sourceUrl = editingCharacterMeta.value.sourceUrl

    if (!charId) {
      throw new Error('无法获取角色信息')
    }

    isUpdatingFromServer.value = true
    try {
      // 如果有 sourceUrl，优先从 sourceUrl 下载
      if (sourceUrl) {
        const sourceData = await loadCharacterFromSource(
          sourceUrl,
          null // fileType 自动检测
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
          return { success: true, message: '角色数据已下载，请点击保存按钮保存' }
        }
      }

      // 如果没有 sourceUrl 或加载失败，回退到原来的方式
      const result = await charactersApi.getCharacterDetail(charId)

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

      return { success: true, message: '角色数据已下载，请点击保存按钮保存' }
    } catch (error: any) {
      console.error('[UpdateFromServer] Failed:', error)
      throw new Error('从服务器更新失败: ' + error.message)
    } finally {
      isUpdatingFromServer.value = false
    }
  }
  
  return {
    showCreateCharacterModal,
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
    isUpdatingToServer,
    isUpdatingFromServer,
    isDeletingCharacter,
    selectCharacter,
    openCreateCharacterModal,
    closeCreateCharacterModal,
    saveCharacter,
    editUserCharacter,
    handleViewCharacter,
    deleteUserCharacter,
    handleDeleteFromEdit,
    handleToggleLike,
    handleToggleLikeInEdit,
    loadOriginalCharacterData,
    loadLikedCharacters,
    handleImportUserCharacter,
    updateToServer,
    updateFromServer
  }
}
