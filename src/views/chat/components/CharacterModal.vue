<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click.self="$emit('update:visible', false)">
    <div class="chat-card rounded-2xl max-w-2xl w-full overflow-hidden flex flex-col shadow-2xl border border-theme-border" style="max-height: min(90vh, calc(var(--vh, 1vh) * 90));">
      <div class="flex-1 overflow-y-auto overscroll-contain" data-scrollable="true" style="-webkit-overflow-scrolling: touch;">
        <div class="sticky top-0 z-10 p-3 sm:p-6 border-b border-theme-border/50 flex items-center justify-between bg-[var(--theme-card)]/80 backdrop-blur-xl">
          <div class="flex items-center gap-2 sm:gap-3">
            <h2 class="text-base sm:text-xl font-bold gradient-text flex items-center gap-2">
              <template v-if="editingCharacter">
                <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                  <img 
                    v-if="avatarUrl && !avatarError" 
                    :src="avatarUrl" 
                    :alt="characterData?.name || '角色'"
                    class="w-full h-full object-cover"
                    @error="handleAvatarError"
                  />
                  <span v-else class="text-xs sm:text-sm font-bold text-white">{{ characterData?.name?.charAt(0) || '?' }}</span>
                </div>
              </template>
              <template v-else>
                <span class="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-md sm:rounded-lg flex items-center justify-center text-white text-xs sm:text-sm">+</span>
              </template>
              {{ isViewOnlyMode ? '查看角色' : (editingCharacter ? '编辑角色' : '创建角色') }}
            </h2>
            <span
              v-if="editingCharacter && !isLoadingCharacterDetail && !isLoadingMeta"
              :class="[
                'text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-medium inline-flex items-center gap-1',
                characterTypeClass
              ]"
            >
              <svg v-if="editingCharacterMeta.originalId" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
              <svg v-else-if="editingCharacterMeta.shared" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
              {{ characterTypeLabel }}
            </span>
          </div>
          <div class="flex items-center gap-1 sm:gap-2">
            <template v-if="editingCharacterMeta.originalId">
              <button
                @click="$emit('loadOriginal')"
                :disabled="isLoadingOriginal"
                class="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg v-if="isLoadingOriginal" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span class="hidden sm:inline">更新</span>
              </button>
            </template>
            <template v-if="isOnlineFriend">
              <button
                @click="$emit('toggleLike')"
                :disabled="isLikingInEdit"
                class="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="displayMeta.isLiked 
                  ? 'bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-light)] text-white hover:opacity-90' 
                  : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-sidebar-hover)]'"
              >
                <svg v-if="isLikingInEdit" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" :fill="displayMeta.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                </svg>
                <span class="hidden sm:inline">{{ displayMeta.isLiked ? '已点赞' : '点赞' }}</span>
                <span class="text-xs opacity-80">{{ displayMeta.likeCount }}</span>
              </button>
            </template>
            <button @click="$emit('update:visible', false)" class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-[var(--theme-card-hover)] text-theme-text-secondary hover:text-theme-text-primary transition-all duration-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="p-3 sm:p-6">
          <CharacterForm
            ref="characterFormRef"
            :model-value="characterData"
            :character-id="editingCharacter?.role_play?.id || editingCharacter?.id"
            :is-edit="!!editingCharacter"
            :is-user-created="!editingCharacterMeta.originalId"
            :is-online-character="!!editingCharacterMeta.originalId"
            :show-admin-fields="false"
            :view-only="isViewOnlyMode"
            :saving="isSavingCharacter"
            @submit="$emit('save', $event)"
            @cancel="$emit('update:visible', false)"
            @delete="$emit('delete')"
            @image-saved="handleImageSaved"
          />
          
          <CommentSection
            v-if="isOnlineFriend"
            :character-id="editingCharacterMeta.originalId || editingCharacter?.id"
            :show-original-hint="!!editingCharacterMeta.originalId"
          />
        </div>
        
        <div v-if="!isViewOnlyMode" class="sticky bottom-0 flex flex-row justify-between items-center gap-1.5 sm:gap-0 bg-[var(--theme-card)]/80 backdrop-blur-xl border-t border-theme-border/50 px-3 sm:px-6 py-2.5 sm:py-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div v-if="editingCharacter" class="flex gap-1.5 sm:gap-3">
            <button
              type="button"
              @click="characterFormRef?.handleExport()"
              :disabled="!!editingCharacterMeta.originalId"
              :title="editingCharacterMeta.originalId ? '在线添加的角色无法导出' : '导出'"
              :class="editingCharacterMeta.originalId 
                ? 'px-2 py-1.5 sm:px-4 sm:py-2.5 text-theme-text-secondary bg-[var(--theme-card-hover)] rounded-lg sm:rounded-xl transition-all duration-200 font-medium border border-theme-border flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm cursor-not-allowed opacity-50'
                : 'px-2 py-1.5 sm:px-4 sm:py-2.5 text-theme-text-accent hover:bg-[var(--theme-primary)]/10 rounded-lg sm:rounded-xl transition-all duration-200 font-medium border border-[var(--theme-primary)]/20 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span class="hidden sm:inline">导出</span>
            </button>
            <button
              type="button"
              @click="characterFormRef && (characterFormRef.showImageEditor = true)"
              :disabled="characterFormRef?.isSavingImage"
              :title="characterFormRef?.isSavingImage ? '保存中...' : '编辑图片'"
              class="px-2 py-1.5 sm:px-4 sm:py-2.5 text-theme-text-accent hover:bg-[var(--theme-primary)]/10 rounded-lg sm:rounded-xl transition-all duration-200 font-medium border border-[var(--theme-primary)]/20 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="characterFormRef?.isSavingImage" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="hidden sm:inline">{{ characterFormRef?.isSavingImage ? '保存中...' : '编辑图片' }}</span>
            </button>
            <button
              type="button"
              @click="characterFormRef?.handleDelete()"
              title="删除"
              class="px-2 py-1.5 sm:px-4 sm:py-2.5 text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] rounded-lg sm:rounded-xl transition-all duration-200 font-medium border border-[var(--theme-danger)]/30 text-xs sm:text-sm"
            >
              <svg class="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span class="hidden sm:inline">删除</span>
            </button>
            
            <div 
              v-if="!editingCharacterMeta.originalId"
              class="flex items-center gap-2 px-2 py-1.5 sm:px-3 rounded-lg bg-[var(--theme-card-hover)] border border-theme-border"
              :class="{ 'opacity-50': !canToggleShared || isUpdatingShared }"
              @click="handleSharedClick"
            >
              <span class="text-xs sm:text-sm text-theme-text-secondary">
                <template v-if="isLoadingMeta">
                  <svg class="w-3 h-3 animate-spin inline-block mr-1" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  加载中...
                </template>
                <template v-else>分享</template>
              </span>
              <label v-if="!isLoadingMeta" class="relative inline-flex items-center" :class="canToggleShared && !isUpdatingShared ? 'cursor-pointer' : 'cursor-not-allowed'">
                <input
                  :checked="editingCharacterMeta.shared"
                  @change="handleToggleShared"
                  type="checkbox"
                  :disabled="!canToggleShared || isUpdatingShared"
                  class="sr-only peer"
                />
                <div v-if="isUpdatingShared" class="w-9 h-5 flex items-center justify-center">
                  <svg class="w-3 h-3 animate-spin text-theme-primary" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div v-else class="w-9 h-5 bg-[var(--theme-card-hover)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--theme-primary)]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-theme-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--theme-primary)]"></div>
              </label>
            </div>
          </div>
          <div class="flex gap-1.5 sm:gap-4 sm:ml-auto">
            <button
              type="button"
              @click="$emit('update:visible', false)"
              class="px-3 py-1.5 sm:px-6 sm:py-2.5 chat-card text-theme-text-primary rounded-lg sm:rounded-xl hover:bg-[var(--theme-card-hover)] transition-all duration-200 font-medium border border-theme-border text-xs sm:text-sm"
            >
              取消
            </button>
            <button
              type="button"
              :disabled="isSavingCharacter"
              @click="characterFormRef?.handleSubmit()"
              class="px-3 py-1.5 sm:px-6 sm:py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-lg sm:rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              <span v-if="isSavingCharacter" class="flex items-center justify-center gap-1 sm:gap-2">
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span class="hidden sm:inline">保存中...</span>
                <span class="sm:hidden">...</span>
              </span>
              <span v-else>{{ editingCharacter ? '保存' : '创建' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CharacterForm from '@/components/CharacterForm.vue'
import CommentSection from '@/components/CommentSection.vue'
import type { Character } from '@/types'
import { getFriendAvatar, clearCharacterAvatarCache, getCharacterBlob } from '@/utils/localFriendStorage'
import { useUserStore } from '@/stores/user'
import { charactersApi } from '@/api'

const userStore = useUserStore()

interface MetaData {
  originalId: string | null
  shared: boolean
  likeCount: number
  commentCount: number
  isLiked: boolean
  originalMeta: MetaData | null
}

const characterFormRef = ref<InstanceType<typeof CharacterForm> | null>(null)
const localIsUpdatingShared = ref(false)

const isLoggedIn = computed(() => userStore.isLoggedIn())

const props = defineProps<{
  visible: boolean
  editingCharacter: Character | null
  editingCharacterMeta: MetaData
  displayMeta: {
    originalId: string | null
    shared: boolean
    likeCount: number
    commentCount: number
    isLiked: boolean
  }
  isViewOnlyMode: boolean
  isOnlineFriend: boolean
  isLoadingCharacterDetail: boolean
  isLoadingMeta: boolean
  isSavingCharacter: boolean
  isLoadingOriginal: boolean
  isLikingInEdit: boolean
  existsOnServer: boolean
  isOwnerOfCharacter: boolean
  characterData: any
}>()

const isUpdatingShared = computed(() => localIsUpdatingShared.value)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: any): void
  (e: 'delete'): void
  (e: 'loadOriginal'): void
  (e: 'toggleLike'): void
  (e: 'update:shared', value: boolean): void
  (e: 'avatarUpdated', characterId: string): void
}>()

const avatarUrl = ref<string | undefined>(undefined)
const avatarError = ref(false)

async function loadAvatar() {
  if (!props.editingCharacter) {
    avatarUrl.value = undefined
    return
  }
  avatarError.value = false
  try {
    const url = await getFriendAvatar(props.editingCharacter as any)
    avatarUrl.value = url
  } catch (e) {
    console.error('Failed to load avatar:', e)
    avatarUrl.value = undefined
  }
}

watch(() => props.editingCharacter, () => {
  loadAvatar()
}, { immediate: true })

watch(() => props.visible, (visible) => {
  if (visible && props.editingCharacter) {
    avatarError.value = false
    loadAvatar()
  }
})

function handleAvatarError() {
  avatarError.value = true
}

function handleImageSaved(characterId: string) {
  clearCharacterAvatarCache(characterId)
  avatarError.value = false
  loadAvatar()
  emit('avatarUpdated', characterId)
}

const characterTypeLabel = computed(() => {
  if (!props.editingCharacter) return ''
  if (props.existsOnServer && !props.isOwnerOfCharacter) return '来自分享'
  if (props.editingCharacterMeta.originalId) return '来自分享'
  if (props.editingCharacterMeta.shared) return '已分享'
  return '私密'
})

const characterTypeClass = computed(() => {
  if (!props.editingCharacter) return ''
  if (props.existsOnServer && !props.isOwnerOfCharacter) {
    return 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20'
  }
  if (props.editingCharacterMeta.originalId) {
    return 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20'
  }
  if (props.editingCharacterMeta.shared) {
    return 'bg-[var(--theme-success-bg)] text-[var(--theme-success)] border border-[var(--theme-success)]/20'
  }
  return 'bg-[var(--theme-primary)]/10 text-theme-text-accent border border-[var(--theme-primary)]/20'
})

const canToggleShared = computed(() => {
  if (props.isLoadingMeta) return false
  if (!isLoggedIn.value) return false
  if (props.existsOnServer && !props.isOwnerOfCharacter) {
    return false
  }
  return true
})

const sharedDisabledReason = computed(() => {
  if (props.isLoadingMeta) return '正在加载角色信息...'
  if (!isLoggedIn.value) return '请先登录'
  if (props.existsOnServer && !props.isOwnerOfCharacter) {
    return '此角色不属于您'
  }
  return ''
})

function handleSharedClick(event: MouseEvent) {
  if (!canToggleShared.value) {
    alert(sharedDisabledReason.value)
    event.preventDefault()
    event.stopPropagation()
  }
}

async function handleToggleShared() {
  if (!isLoggedIn.value) {
    userStore.requireLogin()
    return
  }
  
  const characterId = props.editingCharacter?.role_play?.id
  const userId = userStore.user?.id
  
  if (!characterId || !userId) return
  
  const newSharedState = !props.editingCharacterMeta.shared
  
  if (newSharedState) {
    const confirmed = confirm('分享后其他用户可以添加此角色，确定要分享吗？')
    if (!confirmed) {
      return
    }
  }
  
  localIsUpdatingShared.value = true
  
  try {
    if (newSharedState) {
      const blob = await getCharacterBlob(characterId)
      if (!blob) {
        alert('无法获取角色数据')
        return
      }
      
      const characterName = props.editingCharacter?.data?.name || props.editingCharacter?.name || 'character'
      const isImage = blob.type.startsWith('image/')
      const fileName = isImage ? `${characterName}.png` : `${characterName}.json`
      
      await charactersApi.uploadUserCharacter(userId, characterId, blob, fileName)
    } else {
      await charactersApi.updateUserCharacterShared(userId, characterId, false)
    }
    
    emit('update:shared', newSharedState)
  } catch (error: any) {
    console.error('更新分享状态失败:', error)
    alert('更新分享状态失败: ' + error.message)
  } finally {
    localIsUpdatingShared.value = false
  }
}
</script>
