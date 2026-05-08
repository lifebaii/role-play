<template>
  <div class="friends-container flex flex-col h-screen bg-[var(--theme-bg-start)]">
    <!-- 顶部导航栏 -->
    <div class="border-b border-theme-border bg-[var(--theme-card-bg)]/50 backdrop-blur-sm" style="padding-top: var(--safe-area-inset-top);">
      <div class="h-14 px-4 flex items-center gap-3">
        <button
          @click="$router.push('/chat')"
          class="p-2 -ml-2 text-theme-text-secondary hover:bg-[var(--theme-primary)]/10 rounded-xl transition-all"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-lg font-bold gradient-text">我的好友</h1>
        <div class="flex-1"></div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="p-3 sm:p-4 border-b border-theme-border">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索好友..."
          class="w-full pl-10 pr-4 py-2.5 chat-input-field border border-theme-border rounded-xl focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
          @input="debounceSearch"
        />
        <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
          <svg class="w-5 h-5 text-[var(--theme-primary)] animate-spin" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 好友列表 -->
    <div class="flex-1 overflow-hidden">
      <CharacterSelectorList
        :characters="friends"
        :is-loading="isLoading"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total="total"
        :page-size="pageSize"
        :action-character-id="actionCharacterId"
        :show-add-button="false"
        :show-friend-status="false"
        :show-like-count="false"
        :show-tags="false"
        :show-action="true"
        empty-text="暂无好友"
        empty-subtext="去添加一些角色吧"
        @page-change="loadPage"
        @page-size-change="handlePageSizeChange"
        @select="handleSelectCharacter"
        @action="handleRemoveFriend"
      >
        <template #action="{ character }">
          <button
            @click.stop="handleRemoveFriend(character)"
            class="w-8 h-8 rounded-full border border-[var(--theme-danger)]/30 flex items-center justify-center hover:bg-[var(--theme-danger)]/10 hover:border-[var(--theme-danger)] transition-colors group"
            :title="'删除好友'"
          >
            <svg class="w-4 h-4 text-[var(--theme-danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </template>
      </CharacterSelectorList>
    </div>

    <!-- 删除确认对话框 -->
    <Dialog
      v-model:visible="showRemoveConfirm"
      title="删除好友"
      confirm-text="删除"
      cancel-text="取消"
      confirm-type="danger"
      @confirm="confirmRemoveFriend"
    >
      <p class="text-theme-text-secondary">确定要删除「{{ characterToRemove?.name }}」吗？</p>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userApi, type FriendsResponse } from '@/api'
import type { Character } from '@/types'
import CharacterSelectorList from '@/components/CharacterSelectorList.vue'
import Dialog from '@/components/Dialog.vue'

const router = useRouter()
const userStore = useUserStore()

const friends = ref<Character[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(1)
const isLoading = ref(false)
const isSearching = ref(false)
const actionCharacterId = ref<string | null>(null)
const showRemoveConfirm = ref(false)
const characterToRemove = ref<Character | null>(null)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const loadPage = async (pageNum: number) => {
  if (pageNum < 1 || (totalPages.value > 0 && pageNum > totalPages.value) || isLoading.value) return

  currentPage.value = pageNum
  await loadFriends()
}

const handlePageSizeChange = (newPageSize: number) => {
  pageSize.value = newPageSize
  currentPage.value = 1
  loadFriends()
}

const loadFriends = async () => {
  isLoading.value = true
  try {
    const params: { page?: number; pageSize?: number; search?: string } = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    let data: FriendsResponse
    if (userStore.isLoggedIn()) {
      data = await userApi.getFriends(params)
    } else {
      // 未登录时使用本地好友
      const localFriends = userStore.friendCharacters
      const startIndex = (currentPage.value - 1) * pageSize.value
      const paginatedFriends = localFriends.slice(startIndex, startIndex + pageSize.value)
      
      // 转换格式适配Character类型
      friends.value = paginatedFriends.map(f => ({
        id: f.role_play?.id,
        name: f.data?.name,
        description: f.data?.description,
        avatar: f.data?.avatar,
        data: f.data,
        role_play: f.role_play
      }))
      
      total.value = localFriends.length
      totalPages.value = Math.ceil(total.value / pageSize.value)
      return
    }

    // 转换好友数据格式适配Character类型
    friends.value = data.friends.map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      avatar: f.avatar,
      originalId: f.originalId,
      shared: f.shared
    }))
    
    total.value = data.total
    currentPage.value = data.page
    totalPages.value = data.totalPages
  } catch (error) {
    console.error('Failed to load friends:', error)
    friends.value = []
    total.value = 0
    totalPages.value = 1
  } finally {
    isLoading.value = false
  }
}

const debounceSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  isSearching.value = true
  
  searchTimeout = setTimeout(async () => {
    currentPage.value = 1
    await loadFriends()
    isSearching.value = false
  }, 300)
}

const handleSelectCharacter = (character: Character) => {
  // 这里可以处理选择好友后的操作，比如跳转到聊天页面
  router.push('/chat')
}

const handleRemoveFriend = (character: Character) => {
  characterToRemove.value = character
  showRemoveConfirm.value = true
}

const confirmRemoveFriend = async () => {
  if (!characterToRemove.value) return

  const characterId = characterToRemove.value.id || characterToRemove.value.role_play?.id
  if (!characterId) return

  actionCharacterId.value = characterId
  try {
    await userStore.removeFriend(characterId)
    // 重新加载好友列表
    await loadFriends()
  } catch (error) {
    console.error('Failed to remove friend:', error)
  } finally {
    actionCharacterId.value = null
    showRemoveConfirm.value = false
    characterToRemove.value = null
  }
}

onMounted(() => {
  loadFriends()
})

// 监听好友列表变化
watch(() => userStore.friendCharacters, () => {
  if (!userStore.isLoggedIn()) {
    loadFriends()
  }
}, { deep: true })
</script>
