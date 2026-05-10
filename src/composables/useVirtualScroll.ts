import { ref, computed, watch, nextTick, type Ref } from 'vue'
import { useVirtualizer, defaultRangeExtractor, type Range } from '@tanstack/vue-virtual'
import type { Message } from '@/types'

interface ScrollPosition {
  messageIndex: number
  offset: number
}

interface UseVirtualScrollOptions {
  containerRef: Ref<HTMLElement | null>
  messages: Ref<Message[]>
  isStreaming: Ref<boolean>
  overscan?: number
}

export function useVirtualScroll(options: UseVirtualScrollOptions) {
  const { containerRef, messages, isStreaming, overscan = 8 } = options

  const paddingTop = ref(0)

  function estimateSize(index: number): number {
    const msg = messages.value[index]
    if (!msg) return 100
    if (msg.role === 'user') return 80
    if (isStreaming.value && index === messages.value.length - 1) return 300
    return 200
  }

  const rangeExtractorWithStreaming = (range: Range) => {
    const next = new Set(defaultRangeExtractor(range))
    if (isStreaming.value && messages.value.length > 0) {
      next.add(messages.value.length - 1)
    }
    return Array.from(next).sort((a, b) => a - b)
  }

  const virtualizer = useVirtualizer({
    get count() {
      return messages.value.length
    },
    getScrollElement: () => containerRef.value,
    estimateSize,
    overscan,
    rangeExtractor: rangeExtractorWithStreaming,
    scrollMargin: paddingTop.value,
  })

  const virtualItems = computed(() => virtualizer.value.getVirtualItems())
  const totalSize = computed(() => virtualizer.value.getTotalSize())

  function measureElement(node: Element | null, index: number) {
    if (node) {
      node.setAttribute('data-index', String(index))
      virtualizer.value.measureElement(node)
    }
  }

  function scrollToBottom(smooth = true) {
    nextTick(() => {
      if (messages.value.length === 0) return
      virtualizer.value.scrollToIndex(messages.value.length - 1, {
        align: 'end',
        behavior: smooth ? 'smooth' : 'auto',
      })
    })
  }

  function scrollToIndex(index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }) {
    virtualizer.value.scrollToIndex(index, options)
  }

  function isNearBottom(threshold = 150): boolean {
    const el = containerRef.value
    if (!el) return true
    return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
  }

  function saveScrollPosition(characterId: string) {
    if (!containerRef.value || messages.value.length === 0) return

    const el = containerRef.value
    const scrollTop = el.scrollTop

    const items = virtualizer.value.getVirtualItems()
    let targetIndex = 0
    let targetOffset = 0

    for (const item of items) {
      if (item.start + item.size > scrollTop) {
        targetIndex = item.index
        targetOffset = scrollTop - item.start
        break
      }
    }

    const position: ScrollPosition = { messageIndex: targetIndex, offset: targetOffset }
    try {
      const savedRaw = localStorage.getItem('role_play_scroll_positions_v2')
      const positions: Record<string, ScrollPosition> = savedRaw ? JSON.parse(savedRaw) : {}
      positions[characterId] = position
      localStorage.setItem('role_play_scroll_positions_v2', JSON.stringify(positions))
    } catch (e) {
      console.error('Failed to save scroll position:', e)
    }
  }

  function restoreScrollPosition(characterId: string) {
    try {
      const savedRaw = localStorage.getItem('role_play_scroll_positions_v2')
      if (!savedRaw) return false
      const positions: Record<string, ScrollPosition> = JSON.parse(savedRaw)
      const position = positions[characterId]
      if (!position || position.messageIndex >= messages.value.length) return false

      nextTick(() => {
        virtualizer.value.scrollToIndex(position.messageIndex, {
          align: 'start',
          behavior: 'auto',
        })
        requestAnimationFrame(() => {
          const el = containerRef.value
          if (el) {
            el.scrollTop += position.offset
          }
        })
      })
      return true
    } catch (e) {
      console.error('Failed to restore scroll position:', e)
      return false
    }
  }

  watch(() => isStreaming.value, (streaming) => {
    if (streaming) return
    nextTick(() => {
      virtualizer.value.measure()
    })
  })

  function setPadding(top: number) {
    paddingTop.value = top
  }

  return {
    virtualizer,
    virtualItems,
    totalSize,
    measureElement,
    scrollToBottom,
    scrollToIndex,
    isNearBottom,
    saveScrollPosition,
    restoreScrollPosition,
    setPadding,
  }
}
