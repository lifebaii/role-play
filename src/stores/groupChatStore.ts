import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbSet, dbGet } from '@/utils/db'
import { fileSet, fileGet, fileDelete, getAllKeys, FILES_STORE_NAME } from '@/utils/db'

export interface GroupChat {
  id: string
  name: string
  members: string[]
  avatar_url: string
  allow_self_responses: boolean
  activation_strategy: number
  generation_mode: number
  disabled_members: string[]
  fav: boolean
  chat_id: string
  chats: string[]
  auto_mode_delay: number
  created_at: number
  updated_at: number
}

export interface GroupChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  name?: string
  character_id?: string
  timestamp: number
}

const GROUPS_KEY = 'groups'
const GROUP_CHAT_PREFIX = 'group_chat_'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

async function loadGroups(): Promise<GroupChat[]> {
  const data = await dbGet<GroupChat[]>(GROUPS_KEY)
  return data || []
}

async function saveGroups(groups: GroupChat[]): Promise<void> {
  await dbSet(GROUPS_KEY, groups)
}

async function loadGroupChat(chatId: string): Promise<GroupChatMessage[]> {
  const data = await dbGet<GroupChatMessage[]>(`${GROUP_CHAT_PREFIX}${chatId}`)
  return data || []
}

async function saveGroupChat(chatId: string, messages: GroupChatMessage[]): Promise<void> {
  await dbSet(`${GROUP_CHAT_PREFIX}${chatId}`, messages)
}

export const useGroupChatStore = defineStore('groupChat', () => {
  const groups = ref<GroupChat[]>([])
  const activeGroupId = ref<string | null>(null)
  const currentMessages = ref<GroupChatMessage[]>([])
  const isLoaded = ref(false)

  const activeGroup = computed(() => {
    if (!activeGroupId.value) return null
    return groups.value.find(g => g.id === activeGroupId.value) || null
  })

  const groupList = computed(() =>
    groups.value.map(g => ({
      id: g.id,
      name: g.name,
      memberCount: g.members.length,
      fav: g.fav,
      updated_at: g.updated_at,
    }))
  )

  async function load() {
    if (isLoaded.value) return
    groups.value = await loadGroups()
    isLoaded.value = true
  }

  function _saveGroups() {
    saveGroups(groups.value)
  }

  async function createGroup(data?: Partial<GroupChat>): Promise<GroupChat> {
    const chatId = generateId()
    const now = Date.now()
    const newGroup: GroupChat = {
      id: generateId(),
      name: 'New Group',
      members: [],
      avatar_url: '',
      allow_self_responses: false,
      activation_strategy: 1,
      generation_mode: 0,
      disabled_members: [],
      fav: false,
      chat_id: chatId,
      chats: [chatId],
      auto_mode_delay: 5,
      created_at: now,
      updated_at: now,
      ...data,
    }
    groups.value.push(newGroup)
    _saveGroups()
    return newGroup
  }

  async function updateGroup(id: string, data: Partial<GroupChat>): Promise<boolean> {
    const index = groups.value.findIndex(g => g.id === id)
    if (index !== -1) {
      groups.value[index] = { ...groups.value[index], ...data, updated_at: Date.now() }
      _saveGroups()
      return true
    }
    return false
  }

  async function deleteGroup(id: string): Promise<boolean> {
    const index = groups.value.findIndex(g => g.id === id)
    if (index !== -1) {
      const group = groups.value[index]
      for (const chatId of group.chats) {
        await dbSet(`${GROUP_CHAT_PREFIX}${chatId}`, null)
      }
      groups.value.splice(index, 1)
      if (activeGroupId.value === id) {
        activeGroupId.value = null
        currentMessages.value = []
      }
      _saveGroups()
      return true
    }
    return false
  }

  async function openGroupChat(groupId: string): Promise<void> {
    const group = groups.value.find(g => g.id === groupId)
    if (!group) return

    activeGroupId.value = groupId
    currentMessages.value = await loadGroupChat(group.chat_id)
  }

  async function addMessageToGroup(message: GroupChatMessage): Promise<void> {
    if (!activeGroupId.value) return
    const group = activeGroup.value
    if (!group) return

    currentMessages.value.push(message)
    await saveGroupChat(group.chat_id, currentMessages.value)

    group.updated_at = Date.now()
    _saveGroups()
  }

  async function saveCurrentMessages(): Promise<void> {
    if (!activeGroup.value) return
    await saveGroupChat(activeGroup.value.chat_id, currentMessages.value)
  }

  function addMember(groupId: string, characterId: string): void {
    const group = groups.value.find(g => g.id === groupId)
    if (group && !group.members.includes(characterId)) {
      group.members.push(characterId)
      group.updated_at = Date.now()
      _saveGroups()
    }
  }

  function removeMember(groupId: string, characterId: string): void {
    const group = groups.value.find(g => g.id === groupId)
    if (group) {
      group.members = group.members.filter(m => m !== characterId)
      group.disabled_members = group.disabled_members.filter(m => m !== characterId)
      group.updated_at = Date.now()
      _saveGroups()
    }
  }

  function toggleMember(groupId: string, characterId: string): void {
    const group = groups.value.find(g => g.id === groupId)
    if (group) {
      if (group.disabled_members.includes(characterId)) {
        group.disabled_members = group.disabled_members.filter(m => m !== characterId)
      } else {
        group.disabled_members.push(characterId)
      }
      _saveGroups()
    }
  }

  function toggleFavorite(groupId: string): void {
    const group = groups.value.find(g => g.id === groupId)
    if (group) {
      group.fav = !group.fav
      _saveGroups()
    }
  }

  function importGroups(data: GroupChat[]): void {
    for (const group of data) {
      groups.value.push({
        ...group,
        id: generateId(),
      })
    }
    _saveGroups()
  }

  function exportGroups(): GroupChat[] {
    return [...groups.value]
  }

  return {
    groups,
    activeGroupId,
    activeGroup,
    groupList,
    currentMessages,
    isLoaded,
    load,
    createGroup,
    updateGroup,
    deleteGroup,
    openGroupChat,
    addMessageToGroup,
    saveCurrentMessages,
    addMember,
    removeMember,
    toggleMember,
    toggleFavorite,
    importGroups,
    exportGroups,
  }
})
