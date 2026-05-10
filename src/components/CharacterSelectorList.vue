<template>
  <div class="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4" data-scrollable="true" style="-webkit-overflow-scrolling: touch;">
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
      <p class="text-theme-text-secondary mb-2">{{ emptyText }}</p>
      <p v-if="emptySubtext" class="text-sm text-theme-text-secondary/70">
        {{ emptySubtext }}
      </p>
    </div>
    
    <div v-else class="grid grid-cols-1 gap-3">
      <div
        v-for="character in characters"
        :key="getCharacterId(character)"
        class="flex items-center gap-3 p-3 character-item border border-theme-border rounded-xl hover:border-[var(--theme-primary)] transition-colors cursor-pointer"
        :class="{ 'pointer-events-none opacity-75': actionCharacterId === getCharacterId(character) }"
        @click="$emit('select', character)"
      >
        <div class="relative flex-shrink-0">
          <AvatarImage
            :src="getCharacterAvatar(character)"
            :name="getCharacterName(character)"
            size="md"
            rounded="lg"
            :gradient="getCharacterIsOfficial(character) ? 'primary' : 'secondary'"
            class="shadow-lg"
          />
          <div
            v-if="hasQuota(character)"
            class="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white rounded-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] shadow-md border-2 border-[var(--theme-card-bg)]"
          >
            {{ getCharacterQuota(character) }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-theme-text-primary truncate">{{ getCharacterName(character) }}</div>
          <div v-if="showTags || showLikeCount" class="flex gap-1 mt-1 items-center overflow-x-auto scrollbar-hide">
            <span v-if="showLikeCount && getCharacterLikeCount(character)" class="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-secondary)]/10 text-theme-text-accent border border-[var(--theme-primary)]/20 flex items-center gap-1 flex-shrink-0">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
              </svg>
              {{ getCharacterLikeCount(character) }}
            </span>
            <span 
              v-if="showTags"
              v-for="(tag, index) in getCharacterTags(character)" 
              :key="index"
              class="text-xs px-2 py-1 rounded-full font-medium bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-secondary)]/10 text-theme-text-accent border border-[var(--theme-primary)]/20 flex-shrink-0 whitespace-nowrap"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        <div v-if="showAction" class="flex-shrink-0 flex items-center gap-2">
          <div v-if="actionCharacterId === getCharacterId(character)" class="w-6 h-6 flex items-center justify-center">
            <svg class="w-5 h-5 text-[var(--theme-primary)] animate-spin" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          <div
            v-else-if="showFriendStatus && getCharacterIsFriend(character)"
            class="w-6 h-6 rounded-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center"
            :title="friendStatusTitle"
          >
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div
            v-else-if="showAddButton"
            class="w-6 h-6 rounded-full border-2 border-theme-border flex items-center justify-center hover:border-[var(--theme-primary)] hover:bg-[var(--theme-primary)] transition-colors group"
            @click.stop="$emit('action', character)"
          >
            <svg class="w-3 h-3 text-theme-text-secondary group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <slot name="action" :character="character"></slot>
        </div>
      </div>
    </div>
    
    <div class="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm text-theme-text-secondary">每页</span>
        <select
          :value="localPageSize"
          @change="handlePageSizeChange"
          class="px-3 py-1.5 chat-input-field border border-theme-border rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="text-sm text-theme-text-secondary">条</span>
      </div>
      
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
        <button
          @click="$emit('page-change', currentPage - 1)"
          :disabled="currentPage === 1 || isLoading"
          class="px-3 py-1.5 rounded-lg border border-theme-border text-theme-text-secondary hover:bg-[var(--theme-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          上一页
        </button>
        <span class="text-sm text-theme-text-secondary">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          @click="$emit('page-change', currentPage + 1)"
          :disabled="currentPage === totalPages || isLoading"
          class="px-3 py-1.5 rounded-lg border border-theme-border text-theme-text-secondary hover:bg-[var(--theme-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Character } from '@/types'
import AvatarImage from './AvatarImage.vue'

interface Props {
  characters: Character[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  total: number
  pageSize?: number
  actionCharacterId?: string | null
  showAddButton?: boolean
  showFriendStatus?: boolean
  showLikeCount?: boolean
  showTags?: boolean
  showAction?: boolean
  emptyText?: string
  emptySubtext?: string
  friendStatusTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
  showAddButton: true,
  showFriendStatus: true,
  showLikeCount: true,
  showTags: true,
  showAction: true,
  emptyText: '暂无角色',
  emptySubtext: '',
  friendStatusTitle: '已添加'
})

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'page-size-change', pageSize: number): void
  (e: 'select', character: Character): void
  (e: 'action', character: Character): void
}>()

const localPageSize = ref(props.pageSize.toString())

function handlePageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const newPageSize = parseInt(target.value, 10)
  localPageSize.value = newPageSize.toString()
  emit('page-size-change', newPageSize)
}

function getCharacterId(character: Character): string {
  return character.role_play?.id || character.id || ''
}

function getCharacterName(character: Character): string {
  return character.data?.name || character.name || ''
}

function getCharacterAvatar(character: Character): string | undefined {
  if (character.thumbnailUrl) {
    return character.thumbnailUrl
  }
  if (character.role_play?.id) {
    return `/api/characters/${character.role_play.id}/avatar`
  }
  if (character.id) {
    return `/api/characters/${character.id}/avatar`
  }
  return character.data?.avatar || character.avatar
}

function getCharacterLikeCount(character: Character): number {
  return character.likeCount || 0
}

function getCharacterTags(character: Character): string[] {
  const tags = character.data?.tags || character.tags || []
  if (typeof tags === 'string') {
    return (tags as string).split(/\s+/).filter((tag) => tag.trim())
  }
  return tags as string[]
}

function getCharacterIsFriend(character: Character): boolean {
  return character.isFriend || false
}

function getCharacterIsOfficial(character: Character): boolean {
  return character.isOfficial !== false
}

function hasQuota(character: Character): boolean {
  return typeof character.quota === 'number' && character.quota > 0
}

function getCharacterQuota(character: Character): number {
  return character.quota || 0
}
</script>
