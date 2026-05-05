<template>
  <div
    class="fixed lg:relative w-72 chat-sidebar border-r border-theme-border flex flex-col z-30 transition-all duration-300 lg:translate-x-0 shadow-2xl"
    style="height: var(--app-height, 100vh); height: calc(var(--vh, 1vh) * 100);"
    :class="modelValue ? 'translate-x-0' : '-translate-x-full'">
    <div class="h-14 px-2 sm:px-4 border-b border-theme-border flex items-center justify-between bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10 flex-shrink-0">
      <h1 @click="$emit('openAbout')" class="text-lg sm:text-xl font-bold gradient-text cursor-pointer hover:opacity-80 transition-opacity">ROLE PLAY</h1>
      <div class="flex items-center gap-1 sm:gap-2">
        <button @click="handleToggleColorMode" class="p-1.5 sm:p-2 rounded-xl hover:bg-[var(--theme-primary)]/10 transition-all text-theme-text-accent" :title="colorModeTitle">
          <svg v-if="currentColorMode === 'light'" class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          <svg v-else-if="currentColorMode === 'dark'" class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
          <svg v-else class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </button>
        <button @click="$emit('update:modelValue', false)" class="lg:hidden p-1.5 sm:p-2 text-theme-text-secondary hover:bg-[var(--theme-primary)]/10 rounded-full transition-all">
          <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 overscroll-contain" data-scrollable="true" style="-webkit-overflow-scrolling: touch;">
      <div>
        <div class="flex items-center justify-between px-1 mb-3">
          <div class="flex items-center gap-2">
            <button 
              @click="userStore.loadFriends()" 
              :disabled="userStore.isLoadingFriends"
              class="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider hover:text-theme-text-accent transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              好友列表
            </button>
            <div v-if="userStore.isLoadingFriends" class="w-3 h-3">
              <div class="w-3 h-3 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <label class="text-xs font-medium text-theme-text-accent hover:text-[var(--theme-primary-dark)] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--theme-primary)]/10 transition-all cursor-pointer">
              <input type="file" accept=".json,.png" multiple class="hidden" @change="handleImportUserCharacter" />
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              导入
            </label>
            <button
              @click="$emit('openCreateCharacter')"
              class="text-xs font-medium text-theme-text-accent hover:text-[var(--theme-primary-dark)] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--theme-primary)]/10 transition-all"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              创建
            </button>
            <button
              v-if="showAuthEntry"
              @click="$emit('openFriendSelector')"
              class="text-xs font-medium text-theme-text-accent hover:text-[var(--theme-primary-dark)] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--theme-primary)]/10 transition-all"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              添加
            </button>
          </div>
        </div>
        
        <div v-if="friendCharacters.length > 0" class="space-y-2">
          <div
            v-for="(character, index) in friendCharacters"
            :key="character.id || index"
            class="p-3 rounded-xl cursor-pointer transition-all duration-200 relative"
            :class="chatStore.currentCharacter?.role_play?.id === character.role_play?.id 
              ? 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] shadow-lg shadow-[var(--theme-primary)]/25 scale-[1.02] active' 
              : 'character-item hover:shadow-md hover:scale-[1.01]'"
            @click="selectCharacter(character)"
          >
            <div class="flex items-center gap-3">
              <div class="relative flex-shrink-0">
                <AvatarImage
                  :src="getCharacterAvatar(character)"
                  :name="getCharacterName(character)"
                  size="md"
                  rounded="lg"
                  :gradient="character.isUserCreated ? 'primary' : 'secondary'"
                  class="shadow-lg"
                />
                <span
                    v-if="chatStore.isCharacterStreaming(character.role_play?.id || character.id)"
                    class="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-[var(--theme-success-light)] to-[var(--theme-success)] rounded-full border-2 border-[var(--theme-card-bg)] animate-ping"
                  ></span>
                  <span
                    v-if="chatStore.isCharacterStreaming(character.role_play?.id || character.id)"
                    class="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-[var(--theme-success-light)] to-[var(--theme-success)] rounded-full border-2 border-[var(--theme-card-bg)] animate-pulse"
                  ></span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <div :class="['font-semibold truncate', chatStore.currentCharacter?.role_play?.id === character.role_play?.id ? 'text-white' : 'text-theme-text-primary']">{{ getCharacterName(character) }}</div>
                  <svg v-if="character.role_play?.originalId" :class="['w-3.5 h-3.5 flex-shrink-0', chatStore.currentCharacter?.role_play?.id === character.role_play?.id ? 'text-white/80' : 'text-[var(--theme-accent)]']" fill="currentColor" viewBox="0 0 20 20" title="来自分享"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                  <svg v-else-if="character.shared" :class="['w-3.5 h-3.5 flex-shrink-0', chatStore.currentCharacter?.role_play?.id === character.role_play?.id ? 'text-white/80' : 'text-[var(--theme-success)]']" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="已分享"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                </div>
                <div :class="['text-xs truncate', chatStore.currentCharacter?.role_play?.id === character.role_play?.id ? 'text-white/80' : 'text-theme-text-secondary']">
                  <template v-if="chatStore.isCharacterStreaming(character.role_play?.id || character.id)">
                    <span class="text-[var(--theme-success-light)]">回复中...</span>
                  </template>
                  <template v-else>{{ getCharacterDescription(character) || '暂无描述' }}</template>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="px-2 mb-3">
          <div class="text-center py-6 text-sm text-theme-text-secondary chat-card rounded-xl border border-dashed border-theme-border p-4">
            <svg class="w-8 h-8 mx-auto mb-2 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            暂无好友，点击上方按钮添加
          </div>
        </div>
      </div>
    </div>
    
    <div class="border-t border-theme-border flex-shrink-0"></div>
    
    <div v-if="userStore.user" class="p-3 bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10 flex-shrink-0">
      <div class="flex items-center gap-3">
        <div class="relative">
          <img
            :src="userStore.user.avatarUrl"
            :alt="userStore.user.name"
            class="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] shadow-lg cursor-pointer hover:ring-2 hover:ring-[var(--theme-primary)] hover:ring-offset-2 transition-all duration-300 hover:scale-105"
            @click="$emit('openUserSettings')"
          />
          <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--theme-success)] rounded-full border-2 border-[var(--theme-card-bg)]"></div>
        </div>
        <div class="flex-1 min-w-0 cursor-pointer" @click="$emit('openUserSettings')">
          <div class="font-semibold text-theme-text-primary truncate hover:text-theme-text-accent transition-colors">
            {{ chatStore.userName || userStore.user.name }}
          </div>
          <div class="text-xs text-theme-text-secondary">
            {{ userStore.user.name }}
          </div>
        </div>
        <button
          @click="handleLogout"
          class="p-2 text-theme-text-secondary hover:text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] rounded-xl transition-all duration-200"
          title="退出登录"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>
        <button
          @click="$emit('openUserDataSettings')"
          class="p-2 text-theme-text-secondary hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 rounded-xl transition-all duration-200"
          title="本地用户数据设置"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-else class="p-3 bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10 flex-shrink-0">
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--theme-secondary)] to-[var(--theme-accent)] shadow-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0 cursor-pointer" @click="$emit('openUserSettings')">
          <div class="font-semibold text-theme-text-primary truncate">
            <template v-if="chatStore.userName">
              {{ chatStore.userName }}
            </template>
            <template v-else>
              <span class="text-theme-text-accent">点击设置称呼</span>
            </template>
          </div>
          <div class="text-xs text-theme-text-secondary">
            未登录
          </div>
        </div>
        <button
          v-if="showAuthEntry"
          @click="userStore.requireLogin()"
          class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          登录
        </button>
        <button
          @click="$emit('openUserDataSettings')"
          class="p-2 text-theme-text-secondary hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 rounded-xl transition-all duration-200"
          title="本地用户数据设置"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import type { Character } from '@/types'
import { getAvatarUrl, preloadAvatars, getCharacterDisplayName, getCharacterDisplayDescription, useAvatar } from '@/composables/useAvatar'
import { clearCharacterAvatarCache, getFriendAvatar } from '@/utils/localFriendStorage'
import { eventBus } from '@/utils/eventBus'
import { config } from '@/utils/config'
import AvatarImage from '@/components/AvatarImage.vue'
import { toggleColorMode, getColorMode, type ColorMode } from '@/utils/theme'
import { useDialog } from '@/composables/useDialog'

const { showConfirm } = useDialog()

const props = defineProps<{
  modelValue: boolean
  friendCharacters: any[]
  avatarUpdateTrigger?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'openCreateCharacter'): void
  (e: 'openFriendSelector'): void
  (e: 'openUserSettings'): void
  (e: 'openUserDataSettings'): void
  (e: 'editCharacter', character: Character): void
  (e: 'selectCharacter', character: any): void
  (e: 'importCharacter', event: Event): void
  (e: 'openAbout'): void
}>()

const chatStore = useChatStore()
const userStore = useUserStore()
const avatarMap = ref(new Map<string, string>())
const showAuthEntry = config.showAuthEntry
const currentColorMode = ref<ColorMode>(getColorMode())

const colorModeTitle = computed(() => {
  switch (currentColorMode.value) {
    case 'light': return '亮色模式（点击切换）'
    case 'dark': return '暗色模式（点击切换）'
    default: return '跟随系统（点击切换）'
  }
})

function handleToggleColorMode() {
  currentColorMode.value = toggleColorMode()
}

async function loadAvatarForCharacter(character: any) {
  const key = character.role_play?.id || character.id
  if (!key) return
  
  if (character.role_play?.id) {
    try {
      const url = await getFriendAvatar(character)
      if (url) {
        avatarMap.value.set(key, url)
      }
    } catch (e) {
      console.error('Failed to load avatar:', e)
    }
  } else if (character.avatar) {
    avatarMap.value.set(key, character.avatar)
  }
}

watch(() => props.friendCharacters, (friends) => {
  if (friends && friends.length > 0) {
    for (const friend of friends) {
      loadAvatarForCharacter(friend)
    }
  }
}, { immediate: true })

watch(() => props.avatarUpdateTrigger, (characterId) => {
  if (characterId) {
    clearCharacterAvatarCache(characterId)
    avatarMap.value.delete(characterId)
    const character = props.friendCharacters.find(c => 
      c.role_play?.id === characterId || c.id === characterId
    )
    if (character) {
      loadAvatarForCharacter(character)
    }
  }
})

function getCharacterAvatar(character: any): string | undefined {
  if (character.thumbnailUrl) {
    return character.thumbnailUrl
  }
  const key = character.role_play?.id || character.id
  if (key && avatarMap.value.has(key)) {
    return avatarMap.value.get(key)
  }
  return character.avatar
}

function getCharacterName(character: any): string {
  return getCharacterDisplayName(character)
}

function getCharacterDescription(character: any): string {
  return getCharacterDisplayDescription(character)
}

function selectCharacter(character: any) {
  emit('selectCharacter', character)
  emit('update:modelValue', false)
}

async function handleLogout() {
  const confirmed = await showConfirm('确定要退出登录吗？')
  if (confirmed) {
    userStore.logout()
  }
}

function handleUserLogout() {
  // store 已经处理了状态清除，这里确保 UI 同步
}

onMounted(() => {
  eventBus.on('user-logout', handleUserLogout)
})

onUnmounted(() => {
  eventBus.off('user-logout', handleUserLogout)
})

function handleImportUserCharacter(event: Event) {
  emit('importCharacter', event)
}
</script>
