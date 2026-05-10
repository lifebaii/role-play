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
import { ref, watch, nextTick } from 'vue'
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

watch(() => props.messages.length, () => {
  setTimeout(() => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTo({
          top: messagesContainer.value.scrollHeight,
          behavior: 'smooth'
        })
      }
    })
  }, 1000)
})

defineExpose({
  messagesContainer
})
</script>
