<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50 p-4" @click.self="close">
    <div class="chat-card rounded-2xl max-w-2xl w-full overflow-hidden flex flex-col shadow-2xl border border-theme-border" style="max-height: min(85vh, calc(var(--vh, 1vh) * 85));">
      <div class="p-3 sm:p-6 border-b border-theme-border flex items-center justify-between bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10">
        <h2 class="text-base sm:text-xl font-bold gradient-text flex items-center gap-2">
          <span class="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-md sm:rounded-lg flex items-center justify-center text-white text-xs sm:text-sm shadow-lg">+</span>
          添加好友
        </h2>
        <button @click="close" class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-[var(--theme-card-hover)] text-theme-text-secondary hover:text-theme-text-primary transition-colors duration-200">
          <span class="text-base sm:text-lg">×</span>
        </button>
      </div>
      
      <div class="p-3 sm:p-4 border-b border-theme-border">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索角色名称..."
            class="w-full pl-10 pr-4 py-2.5 chat-input-field border border-theme-border rounded-xl focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
          />
          <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
            <svg class="w-5 h-5 text-[var(--theme-primary)] animate-spin" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-3 sm:p-4 overscroll-contain" data-scrollable="true" style="-webkit-overflow-scrolling: touch;">
        <div v-if="isLoading" class="text-center py-12">
          <div class="w-16 h-16 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-theme-text-secondary animate-spin" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          <p class="text-theme-text-secondary">加载中...</p>
        </div>
        
        <div v-else-if="characters.length === 0" class="text-center py-12">
          <div class="w-16 h-16 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p class="text-theme-text-secondary mb-2">暂无角色</p>
          <p class="text-sm text-theme-text-secondary/70">
            请先在管理员页面添加角色
          </p>
        </div>
        
        <div v-else class="grid grid-cols-1 gap-3">
          <div
            v-for="character in characters"
            :key="character.id"
            class="flex items-center gap-3 p-3 character-item border border-theme-border rounded-xl hover:border-[var(--theme-primary)] transition-colors cursor-pointer"
            :class="{ 'pointer-events-none opacity-75': actionCharacterId === character.id }"
            @click="viewCharacterDetail(character)"
          >
            <div 
              class="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg"
              :class="character.isOfficial === false ? 'bg-gradient-to-br from-[var(--theme-secondary)] to-[var(--theme-accent)]' : 'bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)]'"
            >
              <img v-if="character.id" :src="`/api/characters/${character.id}/avatar`" class="w-full h-full object-cover" />
              <span v-else class="text-lg font-bold text-white">{{ (character.name || '?').charAt(0) }}</span>
            </div>
            <div class="flex-1 min-w-0">
                <div class="font-medium text-theme-text-primary truncate">{{ character.name }}</div>
                <div class="flex gap-1 mt-1 items-center overflow-x-auto scrollbar-hide">
                  <span v-if="character.likeCount" class="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-secondary)]/10 text-theme-text-accent border border-[var(--theme-primary)]/20 flex items-center gap-1 flex-shrink-0">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                    </svg>
                    {{ character.likeCount }}
                  </span>
                  <span 
                    v-for="(tag, index) in character.tags" 
                    :key="index"
                    class="text-xs px-2 py-1 rounded-full font-medium bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-secondary)]/10 text-theme-text-accent border border-[var(--theme-primary)]/20 flex-shrink-0 whitespace-nowrap"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            <div class="flex-shrink-0 flex items-center gap-2">
              <div v-if="actionCharacterId === character.id" class="w-6 h-6 flex items-center justify-center">
                <svg class="w-5 h-5 text-[var(--theme-primary)] animate-spin" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
              <div
                v-else-if="character.isFriend"
                class="w-6 h-6 rounded-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center"
                title="已添加"
              >
                <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div
                v-else
                class="w-6 h-6 rounded-full border-2 border-theme-border flex items-center justify-center hover:border-[var(--theme-primary)] hover:bg-[var(--theme-primary)] transition-colors group"
                @click.stop="toggleFriend(character)"
              >
                <svg class="w-3 h-3 text-theme-text-secondary group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="totalPages > 1" class="mt-4 flex items-center justify-center gap-2">
          <button
            @click="loadPage(currentPage - 1)"
            :disabled="currentPage === 1 || isLoading"
            class="px-3 py-1.5 rounded-lg border border-theme-border text-theme-text-secondary hover:bg-[var(--theme-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <span class="text-sm text-theme-text-secondary">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            @click="loadPage(currentPage + 1)"
            :disabled="currentPage === totalPages || isLoading"
            class="px-3 py-1.5 rounded-lg border border-theme-border text-theme-text-secondary hover:bg-[var(--theme-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
        
        <div v-if="total > 0" class="mt-3 text-center text-sm text-theme-text-secondary">
          共 {{ total }} 个角色
        </div>
      </div>
      
      <div class="p-4 border-t border-theme-border">
        <button
          @click="close"
          class="w-full px-4 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] text-white rounded-xl font-medium shadow-lg shadow-[var(--theme-primary)]/25 transition-all duration-200"
        >
          完成
        </button>
      </div>
    </div>
    
    <div 
      v-if="toastMessage" 
      class="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg shadow-lg transition-all duration-300"
      :class="toastType === 'success' ? 'bg-[var(--theme-success)] text-white' : 'bg-[var(--theme-danger)] text-white'"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { charactersApi } from '@/api'
import type { Character, CharactersResponse } from '@/types'
import { getLocalFriends } from '@/utils/localFriendStorage'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'view-character', character: Character): void
}>()

const userStore = useUserStore()

const characters = ref<Character[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)
const totalPages = ref(1)
const isLoading = ref(false)
const isSearching = ref(false)

const actionCharacterId = ref<string | null>(null)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

const localFriendIds = ref<Set<string>>(new Set())

const updateLocalFriendIds = async () => {
  const localFriends = await getLocalFriends()
  localFriendIds.value = new Set(localFriends.map(f => f.role_play?.id).filter(Boolean))
}

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = message
  toastType.value = type
  setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}

const getTags = (notes: string | undefined) => {
  if (!notes) return []
  return notes.split(/\s+/).filter(tag => tag.trim())
}

const toggleFriend = async (character: Character) => {
  if (character.isFriend) {
    return
  }
  
  const characterId = character.role_play?.id || character.id
  if (!characterId) {
    showToast('角色ID无效', 'error')
    return
  }
  
  actionCharacterId.value = characterId
  try {
    await userStore.addOnlineFriendCharacter(characterId)
    character.isFriend = true
    await userStore.loadLocalFriends()
    showToast('添加成功', 'success')
  } catch (error: any) {
    showToast(error.message || '操作失败', 'error')
  } finally {
    actionCharacterId.value = null
  }
}

const viewCharacterDetail = (character: Character) => {
  emit('view-character', character)
}

const close = () => {
  emit('update:visible', false)
}

const loadPage = async (pageNum: number) => {
  if (pageNum < 1 || pageNum > totalPages.value || isLoading.value) return
  
  currentPage.value = pageNum
  await fetchCharacters()
}

const debounceSearch = (() => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return async (query: string) => {
    if (timer) clearTimeout(timer)
    
    isSearching.value = true
    
    timer = setTimeout(async () => {
      currentPage.value = 1
      await fetchCharacters()
      isSearching.value = false
    }, 300)
  }
})()

const fetchCharacters = async () => {
  isLoading.value = true
  try {
    await updateLocalFriendIds()
    
    const params: Record<string, string> = {
      page: currentPage.value.toString(),
      pageSize: pageSize.toString()
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    
    if (userStore.user) {
      params.userId = userStore.user.id
    }
    
    if (localFriendIds.value.size > 0) {
      params.friendIds = JSON.stringify(Array.from(localFriendIds.value))
    }
    
    const response = await charactersApi.getSharedCharacters(params)
    
    characters.value = response.characters.map((item: any) => {
      const char = item.character || {}
      const metaData = item.data || {}
      return {
        ...char,
        likeCount: metaData.likeCount || 0,
        liked: metaData.liked || false,
        isOfficial: metaData.isOfficial || false,
        isFriend: metaData.isFriend || false,
        shared: metaData.shared || false
      }
    })
    total.value = response.total
    currentPage.value = response.page
    totalPages.value = response.totalPages
    
    localStorage.setItem('friend_selector_all', JSON.stringify({
      characters: characters.value,
      total: total.value,
      page: currentPage.value,
      totalPages: totalPages.value
    }))
  } catch (error) {
    console.error('Failed to fetch characters:', error)
    characters.value = []
    total.value = 0
    totalPages.value = 1
  } finally {
    isLoading.value = false
  }
}

watch(searchQuery, (query) => {
  debounceSearch(query)
})

watch(() => props.visible, async (visible) => {
  if (visible) {
    searchQuery.value = ''
    currentPage.value = 1
    
    await fetchCharacters()
  }
})
</script>
