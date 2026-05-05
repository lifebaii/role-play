<template>
  <div class="mt-4 rounded-2xl shadow-lg shadow-[var(--theme-primary)]/5 border border-theme-border overflow-hidden bg-white/90 dark:bg-gray-900/90">
    <button
      @click="toggleExpand"
      class="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-[var(--theme-card-hover)] transition-colors"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-light)] flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h2 class="text-lg sm:text-xl font-semibold text-theme-text-primary">评论区</h2>
          <p class="text-xs text-theme-text-secondary" v-if="total > 0">{{ total }} 条评论</p>
          <p class="text-xs text-theme-text-secondary" v-else>暂无评论</p>
        </div>
        <span v-if="showOriginalHint" class="text-xs text-theme-text-secondary">
          (来自原角色)
        </span>
      </div>
      <svg 
        class="w-5 h-5 text-theme-text-secondary transition-transform duration-300 flex-shrink-0" 
        :class="{ 'rotate-180': isExpanded }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-if="isExpanded" class="px-4 sm:px-6 pb-4 sm:pb-6">
      <div v-if="showOriginalHint" class="text-xs text-theme-text-secondary px-3 py-2 bg-[var(--theme-card-hover)]/50 rounded-lg">
        <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        评论和点赞数据来自原角色，与所有添加该角色的用户共享
      </div>
      
      <div v-if="isLoading" class="flex justify-center py-4">
        <svg class="w-6 h-6 text-[var(--theme-primary)] animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <template v-else>
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <input
              v-model="newComment"
              type="text"
              placeholder="写下你的评论..."
              class="w-full px-3 py-2 chat-input-field border border-theme-border rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent pr-16"
              @keyup.enter="submitComment"
              :disabled="isSubmitting"
            />
            <span 
              v-if="newComment.length > 0 && newComment.length < 5"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-theme-text-secondary"
            >
              {{ newComment.length }}/5
            </span>
          </div>
          <button
            @click="submitComment"
            :disabled="!canSubmit || isSubmitting"
            class="px-4 py-2 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-1"
          >
            <svg v-if="isSubmitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            发送
          </button>
        </div>

        <div v-if="comments.length === 0" class="text-center py-6 text-theme-text-secondary text-sm">
          暂无评论，快来抢沙发吧~
        </div>

        <div v-else class="space-y-3 mt-4">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="p-3 rounded-lg bg-[var(--theme-card-hover)]/90 border border-theme-border"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-theme-text-primary text-sm">{{ getDisplayName(comment) }}</span>
                  <span v-if="comment.isOwner" class="text-xs px-1.5 py-0.5 rounded bg-[var(--theme-primary)]/10 text-theme-text-accent">我</span>
                  <span v-if="comment.isCreator" class="text-xs px-1.5 py-0.5 rounded bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]">创建者</span>
                  <span class="text-xs text-theme-text-secondary">{{ formatTime(comment.createdAt) }}</span>
                </div>
                <p class="text-sm text-theme-text-primary break-words">{{ comment.content }}</p>
              </div>
              <button
                v-if="canDelete(comment)"
                @click="handleDelete(comment.id)"
                class="flex-shrink-0 p-1 rounded hover:bg-[var(--theme-danger-bg)] text-theme-text-secondary hover:text-[var(--theme-danger)] transition-colors"
                title="删除评论"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="hasMore" class="text-center pt-2">
            <button
              @click="loadMore"
              :disabled="isLoadingMore"
              class="text-sm text-theme-text-accent hover:underline disabled:opacity-50"
            >
              {{ isLoadingMore ? '加载中...' : '加载更多' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Comment } from '@/types'
import { generateAnonymousName } from '@/utils/anonymousName'
import { charactersApi } from '@/api'

const props = defineProps<{
  characterId: string
  showOriginalHint?: boolean
  initialCommentCount?: number
}>()

const isExpanded = ref(false)
const comments = ref<Comment[]>([])
const total = ref(props.initialCommentCount || 0)
const currentPage = ref(1)
const totalPages = ref(1)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const isSubmitting = ref(false)
const newComment = ref('')

const hasMore = computed(() => currentPage.value < totalPages.value)
const canSubmit = computed(() => newComment.value.trim().length >= 5)

const getDisplayName = (comment: Comment) => {
  return generateAnonymousName(comment.anonymousId)
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value && comments.value.length === 0) {
    loadComments()
  }
}

const loadComments = async () => {
  isLoading.value = true
  try {
    const result = await charactersApi.getComments(props.characterId, 1)
    comments.value = result.comments
    total.value = result.total
    currentPage.value = result.page
    totalPages.value = result.totalPages
  } catch (error) {
    console.error('Failed to load comments:', error)
  } finally {
    isLoading.value = false
  }
}

const loadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) return
  
  isLoadingMore.value = true
  try {
    const result = await charactersApi.getComments(props.characterId, currentPage.value + 1)
    comments.value = [...comments.value, ...result.comments]
    currentPage.value = result.page
    totalPages.value = result.totalPages
  } catch (error) {
    console.error('Failed to load more comments:', error)
  } finally {
    isLoadingMore.value = false
  }
}

const submitComment = async () => {
  if (!canSubmit.value || isSubmitting.value) return
  
  isSubmitting.value = true
  try {
    const comment = await charactersApi.addComment(props.characterId, newComment.value.trim())
    comments.value = [comment, ...comments.value]
    total.value++
    newComment.value = ''
  } catch (error) {
    console.error('Failed to add comment:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (commentId: string) => {
  if (!confirm('确定要删除这条评论吗？')) return
  
  try {
    await charactersApi.deleteComment(props.characterId, commentId)
    comments.value = comments.value.filter(c => c.id !== commentId)
    total.value--
  } catch (error) {
    console.error('Failed to delete comment:', error)
  }
}

const canDelete = (comment: Comment) => {
  return comment.isOwner
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}

watch(() => props.characterId, () => {
  comments.value = []
  total.value = props.initialCommentCount || 0
  currentPage.value = 1
  totalPages.value = 1
  if (isExpanded.value) {
    loadComments()
  }
})

watch(() => props.initialCommentCount, (newVal) => {
  if (newVal !== undefined && comments.value.length === 0) {
    total.value = newVal
  }
})
</script>
