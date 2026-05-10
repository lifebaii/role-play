<template>
  <div
    ref="messagesContainer"
    data-scrollable="true"
    class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
    style="padding-top: calc(3.5rem + var(--safe-area-inset-top)); padding-bottom: calc(5.5rem + var(--safe-area-inset-bottom)); -webkit-overflow-scrolling: touch;"
    @scroll="onScroll"
    @click="$emit('click')"
  >
    <div
      :style="{ height: `${totalSize}px`, width: '100%', position: 'relative' }"
    >
      <div
        v-for="virtualItem in virtualItems"
        :key="messages[virtualItem.index].id"
        :ref="(el: any) => measureElement(el, virtualItem.index)"
        :data-index="virtualItem.index"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${virtualItem.start}px)`,
        }"
        class="px-2 sm:px-4 py-2"
      >
        <ChatMessage
          v-memo="[getMessageContent(messages[virtualItem.index], virtualItem.index),
                   messages[virtualItem.index].id,
                   editingIndex === virtualItem.index,
                   virtualItem.index === messages.length - 1 && chatStore.isStreaming]"
          :message="messages[virtualItem.index]"
          :index="virtualItem.index"
          :messages="messages"
          :editing-index="editingIndex"
          :edit-content="editContent"
          :compiled-regex-scripts="compiledRegexScripts"
          :is-last-message="virtualItem.index === messages.length - 1"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import type { CompiledRegexScript } from '@/composables/useChat'
import { useVirtualScroll } from '@/composables/useVirtualScroll'
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

const isStreaming = computed(() => chatStore.isStreaming)
const messagesRef = computed(() => props.messages)

const {
  virtualItems,
  totalSize,
  measureElement,
  scrollToBottom,
  isNearBottom,
  saveScrollPosition,
  restoreScrollPosition,
} = useVirtualScroll({
  containerRef: messagesContainer,
  messages: messagesRef,
  isStreaming,
  overscan: 8,
})

let scrollTimeout: ReturnType<typeof setTimeout> | null = null
let isRestoringScroll = false

function getMessageContent(message: any, index: number) {
  if (message.role === 'assistant' &&
      chatStore.isStreaming &&
      index === props.messages.length - 1) {
    return chatStore.streamingContent || message.content
  }
  return message.content
}

function onScroll() {
  if (isRestoringScroll || !chatStore.currentCharacter) return

  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  scrollTimeout = setTimeout(() => {
    if (chatStore.currentCharacter?.id) {
      saveScrollPosition(chatStore.currentCharacter.id)
    }
  }, 300)
}

watch(() => chatStore.currentCharacter?.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    setTimeout(() => {
      if (chatStore.currentCharacter?.id) {
        isRestoringScroll = true
        const restored = restoreScrollPosition(chatStore.currentCharacter.id)
        if (!restored) {
          isRestoringScroll = false
        } else {
          setTimeout(() => {
            isRestoringScroll = false
          }, 200)
        }
      }
    }, 150)
  }
})

watch(() => props.messages.length, (newLen, oldLen) => {
  if (newLen > oldLen) {
    scrollToBottom(true)
  }
})

let lastScrollBottom = 0
watch(() => chatStore.streamingContent, () => {
  if (chatStore.isStreaming && isNearBottom(150)) {
    const now = Date.now()
    if (now - lastScrollBottom > 100) {
      lastScrollBottom = now
      scrollToBottom(false)
    }
  }
})

onMounted(() => {
  setTimeout(() => {
    if (chatStore.currentCharacter?.id) {
      isRestoringScroll = true
      const restored = restoreScrollPosition(chatStore.currentCharacter.id)
      if (!restored) {
        isRestoringScroll = false
      } else {
        setTimeout(() => {
          isRestoringScroll = false
        }, 200)
      }
    }
  }, 150)
})

onUnmounted(() => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})

defineExpose({
  messagesContainer,
  scrollToBottom,
})
</script>
