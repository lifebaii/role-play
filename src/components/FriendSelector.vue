<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50 p-4" @click.self="close">
    <div class="chat-card rounded-2xl max-w-2xl w-full overflow-hidden flex flex-col shadow-2xl border border-theme-border" style="max-height: min(85vh, calc(var(--vh, 1vh) * 85));">
      <div class="p-3 sm:p-6 border-b border-theme-border flex items-center justify-between bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10">
        <h2 class="text-base sm:text-xl font-bold gradient-text flex items-center gap-2">
          <span class="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-md sm:rounded-lg flex items-center justify-center text-white text-xs sm:text-sm shadow-lg">
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </span>
          添加好友
        </h2>
        <div class="flex items-center gap-2">
          <button
            @click="showUserCharactersModal = true"
            class="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-gradient-to-r from-[var(--theme-secondary)] to-[var(--theme-accent)] hover:from-[var(--theme-secondary-dark)] hover:to-[var(--theme-accent-dark)] text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
          >
            <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="hidden sm:inline">好友召回</span>
          </button>
          <button @click="close" class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-[var(--theme-card-hover)] text-theme-text-secondary hover:text-theme-text-primary transition-colors duration-200">
            <span class="text-base sm:text-lg">×</span>
          </button>
        </div>
      </div>
      
      <div class="p-3 sm:p-4 border-b border-theme-border">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
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
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c00 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <select
              v-model="sortBy"
              class="px-3 py-2 chat-input-field border border-theme-border rounded-xl text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
            >
              <option value="updatedAt">最新更新</option>
              <option value="quota_desc">热度最高</option>
              <option value="likeCount">点赞数</option>
              <option value="commentCount">评论数</option>
              <option value="createdAt">创建日期</option>
              <option value="quota_asc">热度最低</option>
            </select>
          </div>
        </div>
      </div>
      
      <CharacterSelectorList
        :characters="characters"
        :is-loading="isLoading"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total="total"
        :action-character-id="actionCharacterId"
        :show-add-button="true"
        :show-friend-status="true"
        empty-text="暂无角色"
        empty-subtext="请先在管理员页面添加角色"
        friend-status-title="已添加"
        @page-change="loadPage"
        @select="viewCharacterDetail"
        @action="toggleFriend"
      />
    </div>
    
    <div 
      v-if="toastMessage" 
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg shadow-lg transition-all duration-300"
      :class="toastType === 'success' ? 'bg-[var(--theme-success)] text-white' : 'bg-[var(--theme-danger)] text-white'"
    >
      {{ toastMessage }}
    </div>
    
    <UserCharactersModal
      v-model:visible="showUserCharactersModal"
      @view-character="handleViewUserCharacter"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { charactersApi } from '@/api'
import type { Character } from '@/types'
import { getLocalFriends } from '@/utils/localFriendStorage'
import CharacterSelectorList from './CharacterSelectorList.vue'
import UserCharactersModal from './UserCharactersModal.vue'

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
const sortBy = ref<'updatedAt' | 'likeCount' | 'commentCount' | 'createdAt' | 'quota_desc' | 'quota_asc'>('updatedAt')
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)
const totalPages = ref(1)
const isLoading = ref(false)
const isSearching = ref(false)

const actionCharacterId = ref<string | null>(null)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')
const showUserCharactersModal = ref(false)

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

const toggleFriend = async (character: Character) => {
  if (character.isFriend) {
    return
  }
  
  const characterId = character.role_play?.id || character.id
  if (!characterId) {
    showToast('角色ID无效', 'error')
    return
  }
  
  const sourceUrl = character.sourceUrl
  actionCharacterId.value = characterId
  try {
    await userStore.addOnlineFriendCharacter(characterId, sourceUrl, 'add')
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

const handleViewUserCharacter = async (character: Character) => {
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
  return async (_query: string) => {
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
      pageSize: pageSize.toString(),
      sortBy: sortBy.value
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
        shared: metaData.shared || false,
        thumbnailUrl: metaData.thumbnailUrl || null,
        sourceUrl: metaData.sourceUrl || null,
        quota: metaData.quota
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

watch(sortBy, () => {
  currentPage.value = 1
  fetchCharacters()
})

watch(() => props.visible, async (visible) => {
  if (visible) {
    searchQuery.value = ''
    currentPage.value = 1
    
    await fetchCharacters()
  }
})
</script>
