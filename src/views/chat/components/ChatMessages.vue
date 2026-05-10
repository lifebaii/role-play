<template>
  <div
    ref="messagesContainer"
    data-scrollable="true"
    class="absolute inset-0 overflow-y-auto overflow-x-hidden px-2 sm:px-4 space-y-4 overscroll-contain"
    style="padding-top: calc(3.5rem + var(--safe-area-inset-top)); padding-bottom: calc(5.5rem + var(--safe-area-inset-bottom)); -webkit-overflow-scrolling: touch;"
    @click="$emit('click')"
  >
    <div class="h-0"></div>
    <ChatMessage
      v-for="(message, index) in messages"
      :key="message.id"
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import type { CompiledRegexScript } from '@/composables/useChat'
import ChatMessage from './ChatMessage.vue'

const props = defineProps<{
  messages: any[]
  editingIndex: number
  editContent: string
  compiledRegexScripts: CompiledRegexScript[]
}>()

const emit = defineEmits<{
  (e: 'click'): void
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
}>()

const chatStore = useChatStore()
const messagesContainer = ref<HTMLElement | null>(null)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null
let isRestoringScroll = false

// 保存滚动位置（防抖）
function handleScroll() {
  if (isRestoringScroll || !messagesContainer.value || !chatStore.currentCharacter) return
  
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
  
  if (savedPosition !== undefined) {
    isRestoringScroll = true
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = savedPosition
        setTimeout(() => {
          isRestoringScroll = false
        }, 100)
      }
    })
  }
}

// 监听角色切换，恢复滚动位置
watch(() => chatStore.currentCharacter?.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    // 延迟恢复滚动位置，确保消息已加载
    setTimeout(() => {
      restoreScrollPosition()
    }, 100)
  }
})

onMounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll, { passive: true })
  }
  // 组件挂载时尝试恢复滚动位置
  setTimeout(() => {
    restoreScrollPosition()
  }, 100)
})

onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll)
  }
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})

defineExpose({
  messagesContainer
})
</script>
