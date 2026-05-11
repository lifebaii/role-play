import type { CompiledRegexScript } from '@/composables/useChat'
import { applyRegexScriptsToHtml } from './regexUtils'

export const STREAMING_REGEX_CONFIG = {
  throttleMs: 1000,
  cacheMaxSize: 20,
  enableDebugLog: false
}

export function updateStreamingRegexConfig(config: Partial<typeof STREAMING_REGEX_CONFIG>) {
  Object.assign(STREAMING_REGEX_CONFIG, config)
}

export class StreamingRegexProcessor {
  private lastResult: string = ''
  private lastProcessTime: number = 0
  private pendingContent: string = ''
  private pendingScripts: CompiledRegexScript[] = []
  private pendingIsUser: boolean = false
  private pendingIsAssistant: boolean = false
  private throttleTimer: ReturnType<typeof setTimeout> | null = null
  
  constructor() {}
  
  process(
    content: string,
    scripts: CompiledRegexScript[],
    isUser: boolean,
    isAssistant: boolean,
    isStreaming: boolean
  ): string {
    if (!isStreaming) {
      this.reset()
      return applyRegexScriptsToHtml(content, scripts, isUser, isAssistant)
    }
    
    const now = Date.now()
    const timeSinceLastProcess = now - this.lastProcessTime
    const throttleMs = STREAMING_REGEX_CONFIG.throttleMs
    
    if (timeSinceLastProcess >= throttleMs) {
      this.lastProcessTime = now
      return this.executeProcess(content, scripts, isUser, isAssistant)
    }
    
    this.pendingContent = content
    this.pendingScripts = scripts
    this.pendingIsUser = isUser
    this.pendingIsAssistant = isAssistant
    
    if (!this.throttleTimer) {
      const delay = throttleMs - timeSinceLastProcess
      this.throttleTimer = setTimeout(() => {
        this.throttleTimer = null
        if (this.pendingContent) {
          this.lastProcessTime = Date.now()
          this.lastResult = this.executeProcess(
            this.pendingContent,
            this.pendingScripts,
            this.pendingIsUser,
            this.pendingIsAssistant
          )
        }
      }, delay)
    }
    
    return this.lastResult || content
  }
  
  private executeProcess(
    content: string,
    scripts: CompiledRegexScript[],
    isUser: boolean,
    isAssistant: boolean
  ): string {
    const result = applyRegexScriptsToHtml(content, scripts, isUser, isAssistant)
    this.lastResult = result
    
    if (STREAMING_REGEX_CONFIG.enableDebugLog) {
      console.log('[StreamingRegex] Processed full content:', {
        contentLength: content.length,
        throttleMs: STREAMING_REGEX_CONFIG.throttleMs
      })
    }
    
    return result
  }
  
  reset() {
    this.lastResult = ''
    this.lastProcessTime = 0
    this.pendingContent = ''
    
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer)
      this.throttleTimer = null
    }
  }
  
  forceProcess(): string {
    if (this.pendingContent) {
      this.lastProcessTime = Date.now()
      this.lastResult = this.executeProcess(
        this.pendingContent,
        this.pendingScripts,
        this.pendingIsUser,
        this.pendingIsAssistant
      )
    }
    return this.lastResult
  }
}

const processorCache = new Map<string, StreamingRegexProcessor>()

export function getStreamingProcessor(key: string = 'default'): StreamingRegexProcessor {
  let processor = processorCache.get(key)
  if (!processor) {
    processor = new StreamingRegexProcessor()
    processorCache.set(key, processor)
    
    if (processorCache.size > STREAMING_REGEX_CONFIG.cacheMaxSize) {
      const firstKey = processorCache.keys().next().value
      if (firstKey !== undefined) {
        const oldProcessor = processorCache.get(firstKey)
        oldProcessor?.reset()
        processorCache.delete(firstKey)
      }
    }
  }
  return processor
}

export function resetStreamingProcessor(key: string = 'default') {
  const processor = processorCache.get(key)
  if (processor) {
    processor.reset()
  }
}

export function clearAllStreamingProcessors() {
  processorCache.forEach(processor => processor.reset())
  processorCache.clear()
}
