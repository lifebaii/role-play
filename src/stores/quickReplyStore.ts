import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbSet, dbGet } from '@/utils/db'

export interface QuickReply {
  id: string
  label: string
  message: string
  enabled: boolean
  group: string
  order: number
  is_hidden: boolean
  prevent_autoclose: boolean
}

const STORAGE_KEY = 'quick_replies'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

async function loadReplies(): Promise<QuickReply[]> {
  const data = await dbGet<QuickReply[]>(STORAGE_KEY)
  return data || []
}

async function saveReplies(replies: QuickReply[]): Promise<void> {
  await dbSet(STORAGE_KEY, replies)
}

export const useQuickReplyStore = defineStore('quickReply', () => {
  const replies = ref<QuickReply[]>([])
  const isLoaded = ref(false)

  const enabledReplies = computed(() =>
    replies.value
      .filter(r => r.enabled && !r.is_hidden)
      .sort((a, b) => a.order - b.order)
  )

  const groups = computed(() => {
    const groupSet = new Set<string>()
    for (const reply of replies.value) {
      if (reply.group) groupSet.add(reply.group)
    }
    return Array.from(groupSet).sort()
  })

  const repliesByGroup = computed(() => {
    const map: Record<string, QuickReply[]> = {}
    for (const reply of enabledReplies.value) {
      const group = reply.group || 'default'
      if (!map[group]) map[group] = []
      map[group].push(reply)
    }
    return map
  })

  async function load() {
    if (isLoaded.value) return
    replies.value = await loadReplies()
    isLoaded.value = true
  }

  function _save() {
    saveReplies(replies.value)
  }

  function addReply(data?: Partial<QuickReply>): QuickReply {
    const newReply: QuickReply = {
      id: generateId(),
      label: '',
      message: '',
      enabled: true,
      group: '',
      order: replies.value.length,
      is_hidden: false,
      prevent_autoclose: false,
      ...data,
    }
    replies.value.push(newReply)
    _save()
    return newReply
  }

  function updateReply(id: string, data: Partial<QuickReply>): boolean {
    const index = replies.value.findIndex(r => r.id === id)
    if (index !== -1) {
      replies.value[index] = { ...replies.value[index], ...data }
      _save()
      return true
    }
    return false
  }

  function removeReply(id: string): boolean {
    const index = replies.value.findIndex(r => r.id === id)
    if (index !== -1) {
      replies.value.splice(index, 1)
      replies.value.forEach((r, i) => r.order = i)
      _save()
      return true
    }
    return false
  }

  function toggleReply(id: string): void {
    const reply = replies.value.find(r => r.id === id)
    if (reply) {
      reply.enabled = !reply.enabled
      _save()
    }
  }

  function reorderReply(oldIndex: number, newIndex: number): void {
    const item = replies.value.splice(oldIndex, 1)[0]
    replies.value.splice(newIndex, 0, item)
    replies.value.forEach((r, i) => r.order = i)
    _save()
  }

  function duplicateReply(id: string): QuickReply | null {
    const source = replies.value.find(r => r.id === id)
    if (!source) return null
    return addReply({
      ...source,
      id: undefined as any,
      label: `${source.label} (副本)`,
      order: replies.value.length,
    })
  }

  function processMessage(message: string, context: Record<string, string>): string {
    return message.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match
    })
  }

  function importReplies(data: QuickReply[]): void {
    for (const reply of data) {
      replies.value.push({
        ...reply,
        id: generateId(),
      })
    }
    _save()
  }

  function exportReplies(): QuickReply[] {
    return [...replies.value]
  }

  function clearAll(): void {
    replies.value = []
    _save()
  }

  return {
    replies,
    enabledReplies,
    groups,
    repliesByGroup,
    isLoaded,
    load,
    addReply,
    updateReply,
    removeReply,
    toggleReply,
    reorderReply,
    duplicateReply,
    processMessage,
    importReplies,
    exportReplies,
    clearAll,
  }
})
