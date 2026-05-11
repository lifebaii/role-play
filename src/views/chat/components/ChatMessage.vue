<template>
  <div
    ref="messageRef"
    class="flex flex-col group"
    :class="message.role === 'user' ? 'items-end' : 'items-start'"
  >
    <div
      v-if="message.role === 'assistant' && isStreaming && isLastMessage && !message.content && !streamingContent"
      class="max-w-[95%] sm:max-w-[95%] p-0 rounded-2xl bubble-assistant text-theme-text-primary shadow-xl shadow-[var(--theme-shadow-light)]"
    >
      <div class="px-6 py-4 flex items-center justify-center gap-4">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="text-sm text-theme-text-secondary font-mono">{{ currentWaitTime }}s</span>
      </div>
    </div>
    <div
      v-else
 class="max-w-[95%] sm:max-w-[95%] p-0 rounded-2xl shadow-xl shadow-[var(--theme-shadow-light)] text-base leading-relaxed transition-all duration-200"
    :class="message.role === 'user'
      ? 'bubble-user text-theme-text-primary shadow-lg shadow-[var(--theme-primary)]/25'
      : 'bubble-assistant text-theme-text-primary'
  ">
      <div
        :class="['mes_text flex items-center', message.role === 'user' ? 'user-bubble' : '']"
        v-html="renderedContent"
      ></div>
    </div>

    <div
      v-if="isVisible && message.isGreeting && editingIndex !== index && !chatStore.isLoading && !(chatStore.isStreaming && isLastMessage)"
      class="flex gap-1 mt-1"
      :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
    >
      <button
        @click.stop="$emit('copy', message.content)"
        class="p-2 sm:p-1 action-icon"
        title="复制"
      >
        <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </button>
      <button
        @click.stop="$emit('edit', { index, content: message.content })"
        class="p-2 sm:p-1 action-icon"
        title="编辑"
      >
        <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
        </svg>
      </button>
      <button
        @click.stop="$emit('delete', index)"
        class="p-2 sm:p-1 action-icon hover:!text-[var(--theme-danger)]"
        title="删除"
      >
        <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
      <button
        @click.stop="$emit('regenerate-greeting')"
        class="p-2 sm:p-1 action-icon"
        title="重新生成"
      >
        <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </button>
    </div>

    <div
      v-if="isVisible && !message.isGreeting && editingIndex !== index && !chatStore.isLoading && !(chatStore.isStreaming && isLastMessage)"
      class="flex gap-1 mt-1"
      :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
    >
      <button
        v-if="message.role === 'assistant'"
        @click.stop="$emit('regenerate-from-assistant', index)"
        class="p-2 sm:p-1 action-icon"
        title="重新生成"
      >
        <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </button>
      <button
        v-if="message.role === 'user'"
        @click.stop="$emit('regenerate-user', index)"
        class="p-2 sm:p-1 action-icon"
        title="重新生成"
      >
        <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </button>
      <button
        @click.stop="$emit('copy', message.content)"
        class="p-2 sm:p-1 action-icon"
        title="复制"
      >
        <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </button>
      <button
        @click.stop="$emit('edit', { index, content: message.content })"
        class="p-2 sm:p-1 action-icon"
        title="编辑"
      >
        <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
        </svg>
      </button>
      <button
        @click.stop="$emit('delete', index)"
        class="p-2 sm:p-1 action-icon hover:!text-red-500"
        title="删除"
      >
        <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>

    <div
      v-if="editingIndex === index"
      class="mt-2 w-full max-w-[75%]"
    >
      <textarea
        :value="editContent"
        @input="$emit('update:editContent', ($event.target as HTMLTextAreaElement).value)"
        rows="3"
        class="w-full px-4 py-3 border-2 border-theme-border rounded-2xl chat-input-field text-sm shadow-lg transition-all focus:border-[var(--theme-primary)] focus:ring-4 focus:ring-[var(--theme-primary)]/20 outline-none"
      ></textarea>
      <div class="flex gap-3 mt-3">
        <button
          @click.stop="$emit('save-edit', index)"
          class="px-4 py-2 text-sm font-semibold text-theme-text-secondary chat-card hover:bg-[var(--theme-card-hover)] rounded-xl shadow-lg border border-theme-border transition-all duration-200"
        >
          保存
        </button>
        <button
          v-if="messages[index]?.role === 'user'"
          @click.stop="$emit('send-edit', index)"
          class="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] rounded-xl shadow-lg shadow-[var(--theme-primary)]/25 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          发送
        </button>
        <button
          @click.stop="$emit('cancel-edit')"
          class="px-4 py-2 text-sm font-semibold text-theme-text-secondary chat-card hover:bg-[var(--theme-card-hover)] rounded-xl shadow-lg border border-theme-border transition-all duration-200"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import type { Message } from '@/types'
import type { CompiledRegexScript } from '@/composables/useChat'
import { renderMessage } from '@/utils/messageRenderer'

const props = defineProps<{
  message: Message
  index: number
  messages: Message[]
  editingIndex: number
  editContent: string
  compiledRegexScripts: CompiledRegexScript[]
  isLastMessage: boolean
  isStreaming: boolean
  streamingContent: string
  currentWaitTime: string
}>()

const emit = defineEmits<{
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

const isVisible = ref(false)
const messageRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (messageRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true
          } else {
            isVisible.value = false
          }
        })
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0
      }
    )
    observer.observe(messageRef.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

const renderedContent = computed(() => {
  let content = props.message.content
  if (props.message.role === 'assistant' &&
      props.isStreaming &&
      props.isLastMessage) {
    content = props.streamingContent || props.message.content
  }

  const role = props.message.role as 'user' | 'assistant'

  return renderMessage({
    content,
    role,
    userName: chatStore.userName || '用户',
    compiledRegexScripts: props.compiledRegexScripts,
    isStreaming: props.isStreaming && props.isLastMessage
  })
})
</script>
