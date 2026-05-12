<template>
  <div
    ref="messagesContainer"
    data-scrollable="true"
    class="absolute inset-0 overflow-y-auto overflow-x-hidden px-2 sm:px-4 space-y-4 overscroll-contain"
    style="padding-top: calc(3.5rem + env(safe-area-inset-top, 0px)); padding-bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px) + (100vh - 100dvh)); -webkit-overflow-scrolling: touch;"
    @click="$emit('click')"
  >
    <div class="h-0"></div>
    <div class="max-w-4xl mx-auto">
      <!-- 加载更多历史消息指示器 -->
      <div v-if="hasMoreMessages" class="flex justify-center py-3">
        <div v-if="isLoadingMore" class="flex items-center gap-2 text-theme-text-secondary text-sm">
          <div class="w-4 h-4 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
          加载中...
        </div>
        <button v-else @click="$emit('loadMore')" class="text-sm text-[var(--theme-primary)] hover:underline px-4 py-2">
          ↑ 加载更多消息
        </button>
      </div>

      <ChatMessage
        v-for="(message, index) in messages"
        :key="message.id"
        v-memo="[message.content, message.id, editingIndex === index, index === messages.length - 1 && chatStore.isStreaming, chatStore.currentWaitTime]"
        :message="message"
        :index="index"
        :messages="messages"
        :editing-index="editingIndex"
        :edit-content="editContent"
        :compiled-regex-scripts="compiledRegexScripts"
        :is-last-message="index === messages.length - 1"
        :is-streaming="chatStore.isStreaming"
        :streaming-content="chatStore.streamingContent"
        :current-wait-time="chatStore.currentWaitTime"
        @copy="$emit('copy', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @regenerate-greeting="$emit('regenerate-greeting')"
        @regenerate-from-assistant="$emit('regenerate-from-assistant', $event)"
        @regenerate-user="$emit('regenerate-user', $event)"
        @save-edit="$emit('save-edit', $event)"
        @send-edit="$emit('send-edit', $event)"
        @cancel-edit="$emit('cancel-edit')"
        @update:editContent="$emit('update:editContent', $event)"
      />

      <!-- 建议回复区域 -->
      <Transition name="suggestions-panel">
        <div v-if="showSuggestions || isGeneratingSuggestions" class="mt-4 flex justify-end">
          <div class="w-full max-w-[95%] sm:max-w-[95%] p-2 sm:p-4 rounded-2xl border border-theme-border bubble-assistant overflow-hidden">
            <div class="text-xs font-semibold text-theme-text-secondary mb-2 sm:mb-3 uppercase tracking-wider flex items-center justify-between">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              建议回复
            </div>
            <div class="flex items-center gap-2">
              <button
                @click.stop="$emit('refreshSuggestions')"
                :disabled="isGeneratingSuggestions"
                class="px-3 py-2 rounded-xl hover:bg-[var(--theme-primary)]/10 transition-all text-theme-text-accent disabled:opacity-50"
                title="刷新建议"
              >
                <div v-if="isGeneratingSuggestions" class="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <svg v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
              <button
                @click.stop="$emit('closeSuggestions')"
                class="px-3 py-2 rounded-xl hover:bg-[var(--theme-danger)]/10 transition-all text-theme-text-secondary"
                title="关闭"
              >
                <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <Transition name="suggestions-content" mode="out-in">
            <!-- 加载状态 -->
            <div v-if="isGeneratingSuggestions" key="loading" class="flex items-center justify-center gap-3 py-4">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span class="text-sm text-theme-text-secondary font-mono">{{ chatStore.suggestionsWaitTime }}s</span>
            </div>

            <!-- 建议列表 -->
            <div v-else-if="suggestions.length > 0" key="list" class="space-y-1 sm:space-y-2">
              <button
                v-for="(suggestion, index) in suggestions"
                :key="index"
                @click="$emit('sendSuggestion', suggestion)"
                class="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-sm text-theme-text-primary hover:bg-[var(--theme-primary)]/10 rounded-xl transition-all duration-200 flex items-center gap-2 sm:gap-3 group"
              >
                <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-text-accent opacity-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                {{ suggestion }}
              </button>
            </div>
          </Transition>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import type { CompiledRegexScript } from '@/composables/useChat'
import ChatMessage from './ChatMessage.vue'

const props = defineProps<{
  messages: any[]
  hasMoreMessages: boolean
  isLoadingMore: boolean
  editingIndex: number
  editContent: string
  compiledRegexScripts: CompiledRegexScript[]
  showSuggestions: boolean
  suggestions: string[]
  isGeneratingSuggestions: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'loadMore'): void
  (e: 'copy', content: string): void
  (e: 'edit', data: { index: number; content: string }): void
  (e: 'delete', index: number): void
  (e: 'regenerate-greeting'): void
  (e: 'regenerate-from-assistant', index: number): void
  (e: 'regenerate-user', index: number): void
  (e: 'save-edit', index: number): void
  (e: 'send-edit', index: number): void
  (e: 'cancel-edit'): void
  (e: 'update:editContent', content: string): void
  (e: 'refreshSuggestions'): void
  (e: 'closeSuggestions'): void
  (e: 'sendSuggestion', suggestion: string): void
}>()

const chatStore = useChatStore()
const messagesContainer = ref<HTMLElement | null>(null)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null
let isRestoringScroll = false

// 滚动到最底部（带平滑动画）
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

// 保存滚动位置（防抖）+ 检测滚动到顶部
function handleScroll() {
  if (!messagesContainer.value || !chatStore.currentCharacter) return

  // 检测滚动到顶部，自动加载更多历史消息
  if (messagesContainer.value.scrollTop < 50 && props.hasMoreMessages && !props.isLoadingMore) {
    emit('loadMore')
  }

  // 检测滚动到底部，自动折叠回最新 PAGE_SIZE 条消息
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  if (
    scrollTop + clientHeight >= scrollHeight - 100 &&
    props.messages.length > 10 &&
    !props.isLoadingMore &&
    !isRestoringScroll &&
    !chatStore.isStreaming
  ) {
    const characterId = chatStore.currentCharacter.id
    chatStore.resetPagination()
    chatStore.saveScrollPosition(characterId, 0)
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }

  if (isRestoringScroll) return

  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  scrollTimeout = setTimeout(() => {
    if (messagesContainer.value && chatStore.currentCharacter) {
      const characterId = chatStore.currentCharacter.id
      const scrollTop = messagesContainer.value.scrollTop
      chatStore.saveScrollPosition(characterId, scrollTop)
    }
  }, 300)
}

// 恢复滚动位置
function restoreScrollPosition() {
  if (!messagesContainer.value || !chatStore.currentCharacter) return

  const characterId = chatStore.currentCharacter.id
  const savedPosition = chatStore.getScrollPosition(characterId)

  nextTick(() => {
    if (messagesContainer.value) {
      if (savedPosition !== undefined) {
        messagesContainer.value.scrollTop = savedPosition
      } else {
        // 没有保存的位置，滚动到底部显示最新消息
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
      // 保持抑制状态足够久，确保 messages.length watcher 不会随后覆盖
      setTimeout(() => {
        isRestoringScroll = false
      }, 300)
    } else {
      isRestoringScroll = false
    }
  })
}

// 角色切换时，立即阻止自动滚底（在消息加载之前就设标志）
watch(() => chatStore.currentCharacter?.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    isRestoringScroll = true
  }
})

// 加载状态变为 false 时恢复滚动位置（这是最可靠的时机，消息一定已加载渲染）
watch(() => chatStore.isLoading, (loading, prevLoading) => {
  if (!loading && chatStore.currentCharacter) {
    restoreScrollPosition()
  }
})

// 监听消息变化，当有新消息时滚动到最底部
watch(() => props.messages.length, (newLen, oldLen) => {
  if (newLen > oldLen) {
    // 正在恢复滚动位置时不自动滚底（避免与 restoreScrollPosition 竞争）
    if (isRestoringScroll) return

    // 加载更多历史消息时不自动滚底（由 handleLoadMore 负责保持位置）
    if (props.isLoadingMore) return

    // 只有用户已经在底部附近时才自动滚到底部
    if (messagesContainer.value) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        scrollToBottom()
      }
    }
  }
})

// 监听 streamingContent 变化，流式输出时保持在底部
watch(() => chatStore.streamingContent, () => {
  if (chatStore.isStreaming && messagesContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    // 如果已经接近底部，就自动滚动到底部
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      scrollToBottom()
    }
  }
})

onMounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll, { passive: true })
  }
  // 如果角色已加载且不在加载中，立即恢复滚动位置
  // （正常流程由 isLoading watcher 处理，此处处理组件重建等边界情况）
  if (chatStore.currentCharacter && !chatStore.isLoading && props.messages.length > 0) {
    isRestoringScroll = true
    restoreScrollPosition()
  }
})

onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll)
  }
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})

// 加载更多消息后保持滚动位置（避免跳动）
function preserveScrollOnLoadMore() {
  if (!messagesContainer.value) return
  const previousScrollHeight = messagesContainer.value.scrollHeight
  nextTick(() => {
    if (messagesContainer.value) {
      const newScrollHeight = messagesContainer.value.scrollHeight
      messagesContainer.value.scrollTop = newScrollHeight - previousScrollHeight
    }
  })
}

defineExpose({
  messagesContainer,
  scrollToBottom,
  preserveScrollOnLoadMore
})
</script>

<style scoped>
.suggestions-panel-enter-active,
.suggestions-panel-leave-active {
  max-height: 420px;
  opacity: 1;
  transform: translateY(0);
  transition: max-height 260ms ease, opacity 220ms ease, transform 260ms ease, margin-top 260ms ease, padding-top 260ms ease, padding-bottom 260ms ease, border-width 260ms ease;
}

.suggestions-panel-enter-from,
.suggestions-panel-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(8px);
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-width: 0;
}

.suggestions-content-enter-active,
.suggestions-content-leave-active {
  max-height: 280px;
  opacity: 1;
  transform: translateY(0);
  transition: max-height 220ms ease, opacity 180ms ease, transform 220ms ease;
  overflow: hidden;
}

.suggestions-content-enter-from,
.suggestions-content-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(6px);
}
</style>
