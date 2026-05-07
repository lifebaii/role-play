<template>
  <div
    ref="messagesContainer"
    data-scrollable="true"
    class="absolute inset-0 overflow-y-auto overflow-x-hidden px-2 sm:px-4 space-y-4 overscroll-contain"
    style="padding-top: calc(3.5rem + var(--safe-area-inset-top)); padding-bottom: calc(5.5rem + var(--safe-area-inset-bottom)); -webkit-overflow-scrolling: touch;"
    @click="$emit('click')"
  >
    <div class="h-0"></div>
    <div
      v-for="(message, index) in messages"
      :key="index"
      class="flex flex-col group"
      :class="message.role === 'user' ? 'items-end' : 'items-start'"
    >
      <div
        v-if="message.role === 'assistant' && chatStore.isStreaming && index === messages.length - 1 && !message.content && !chatStore.streamingContent"
        class="max-w-[90%] sm:max-w-[80%] p-0 rounded-2xl bubble-assistant text-theme-text-primary shadow-xl shadow-[var(--theme-shadow-light)]"
      >
        <div class="px-6 py-4 flex items-center justify-center gap-4">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="text-sm text-theme-text-secondary font-mono">{{ chatStore.currentWaitTime }}s</span>
        </div>
      </div>
      <div
        v-else
        class="max-w-[90%] sm:max-w-[80%] p-0 rounded-2xl shadow-xl shadow-[var(--theme-shadow-light)] text-base leading-relaxed transition-all duration-200"
        :class="message.role === 'user' 
          ? 'bubble-user text-theme-text-primary shadow-lg shadow-[var(--theme-primary)]/25' 
          : 'bubble-assistant text-theme-text-primary'"
      >
        <div :class="['mes_text flex items-center', message.role === 'user' ? 'user-bubble' : '']" v-html="renderMarkdown(getMessageContent(message, index), message.role)"></div>
      </div>
      
      <div v-if="message.isGreeting && editingIndex !== index && !chatStore.isLoading && !(chatStore.isStreaming && index === messages.length - 1)" class="flex gap-1 mt-1" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
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
          @click.stop="$emit('regenerateGreeting')"
          class="p-2 sm:p-1 action-icon"
          title="重新生成"
        >
          <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>
      
      <div 
        v-else-if="!message.isGreeting && editingIndex !== index && !chatStore.isLoading && !(chatStore.isStreaming && index === messages.length - 1)"
        class="flex gap-1 mt-1"
        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <button
          v-if="message.role === 'assistant'"
          @click.stop="$emit('regenerateFromAssistant', index)"
          class="p-2 sm:p-1 action-icon"
          title="重新生成"
        >
          <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
        <button
          v-if="message.role === 'user'"
          @click.stop="$emit('regenerateUser', index)"
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
      
      <div v-if="editingIndex === index" class="mt-2 w-full max-w-[75%]">
        <textarea
          :value="editContent"
          @input="$emit('update:editContent', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
          class="w-full px-4 py-3 border-2 border-theme-border rounded-2xl chat-input-field text-sm shadow-lg transition-all focus:border-[var(--theme-primary)] focus:ring-4 focus:ring-[var(--theme-primary)]/20 outline-none"
        ></textarea>
        <div class="flex gap-3 mt-3">
          <button
            @click.stop="$emit('saveEdit', index)"
            class="px-4 py-2 text-sm font-semibold text-theme-text-secondary chat-card hover:bg-[var(--theme-card-hover)] rounded-xl shadow-lg border border-theme-border transition-all duration-200"
          >
            保存
          </button>
          <button
            v-if="messages[index]?.role === 'user'"
            @click.stop="$emit('sendEdit', index)"
            class="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] rounded-xl shadow-lg shadow-[var(--theme-primary)]/25 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            发送
          </button>
          <button
            @click.stop="$emit('cancelEdit')"
            class="px-4 py-2 text-sm font-semibold text-theme-text-secondary chat-card hover:bg-[var(--theme-card-hover)] rounded-xl shadow-lg border border-theme-border transition-all duration-200"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { CompiledRegexScript } from '@/composables/useChat'
import { applyRegexScriptsToHtml } from '@/utils/regexUtils'

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
  (e: 'regenerateGreeting'): void
  (e: 'regenerateFromAssistant', index: number): void
  (e: 'regenerateUser', index: number): void
  (e: 'saveEdit', index: number): void
  (e: 'sendEdit', index: number): void
  (e: 'cancelEdit'): void
  (e: 'update:editContent', content: string): void
}>()

const chatStore = useChatStore()
const messagesContainer = ref<HTMLElement | null>(null)

function getMessageContent(message: any, index: number) {
  if (message.role === 'assistant' && 
      chatStore.isStreaming && 
      index === chatStore.messages.length - 1) {
    return chatStore.streamingContent || message.content
  }
  return message.content
}

const cleanConfig = {
  ADD_TAGS: ['details', 'summary', 'iframe', 'svg', 'path', 'g', 'circle', 'rect', 'defs', 'linearGradient', 'stop', 'style', 'div', 'span', 'script', 'button', 'input', 'textarea', 'select', 'option', 'label', 'form'],
  ADD_ATTR: ['style', 'open', 'srcdoc', 'sandbox', 'frameborder', 'allow', 'allowfullscreen', 'class', 'id', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd', 'stroke-linecap', 'stroke-linejoin', 'x1', 'y1', 'x2', 'y2', 'offset', 'stop-color', 'stop-opacity', 'width', 'height', 'onclick', 'onchange', 'oninput', 'onsubmit', 'type', 'value', 'checked', 'placeholder', 'rows', 'name', 'for', 'action', 'method', 'disabled', 'readonly', 'min', 'max', 'step'],
  FORBID_ATTR: ['onmouseover', 'onload'],
  FORCE_BODY: true
}

const createIframe = (rawHtml: string): string => {
  const hudCSS = '.sinan-hud{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;padding:12px;background:linear-gradient(to bottom right,rgba(255,255,255,0.9),rgba(255,255,255,0.6));border-radius:12px;border:1px solid rgba(0,0,0,0.08);backdrop-filter:blur(4px)}.char-card{flex:1 1 140px;background:#fff;padding:10px;border-radius:8px;border-left:4px solid #ddd;box-shadow:0 2px 6px rgba(0,0,0,0.04);display:flex;flex-direction:column;gap:4px;font-size:12px;position:relative;overflow:hidden;transition:transform 0.2s}.char-card:hover{transform:translateY(-2px);box-shadow:0 4px 8px rgba(0,0,0,0.1)}.char-name{font-weight:700;font-size:14px;color:#374151;display:flex;justify-content:space-between;align-items:center}.char-mood{color:#6b7280;font-size:12px}.char-loc{color:#9ca3af;font-size:11px;margin-top:auto;padding-top:4px}.bar-bg{height:4px;background:#f3f4f6;border-radius:2px;overflow:hidden;margin-top:6px}.bar-fill{height:100%;background:#10b98a;border-radius:2px}.c-tongqiu{border-left-color:#f59e0b}.c-tongqiu .bar-fill{background:#f59e0b}.c-yufan{border-left-color:#3b82f6}.c-yufan .bar-fill{background:#3b82f6}.c-linghu{border-left-color:#8b5cf6}.c-linghu .bar-fill{background:#8b5cf6}.c-chongtian{border-left-color:#ef4444}.c-chongtian .bar-fill{background:#ef4444}'
  const resetStyle = '<style>html,body{margin:0 !important;padding:0 !important;width:100% !important;height:auto !important;min-height:auto !important;word-wrap:break-word !important;box-sizing:border-box !important;overflow:hidden !important;} ::-webkit-scrollbar{display:none;} *,*::before,*::after{box-sizing:inherit !important;} img,video,canvas,svg{max-width:100% !important;height:auto !important;} table{display:block !important;overflow-x:auto !important;max-width:100% !important;} pre{white-space:pre-wrap !important;word-wrap:break-word !important;max-width:100% !important;} .container, .reality-panel, .app-container {max-width:100% !important; width:100% !important; margin:0 !important; border-radius:0 !important; box-shadow:none !important; border:none !important; height:auto !important; min-height:0 !important;} body > div:first-child { margin:0 !important; max-width:100% !important; height:auto !important; min-height:auto !important;} #app { height:auto !important; min-height:auto !important;}' + hudCSS + '</style>';
  const metaViewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
  const scriptShim = `
        <script>
          window.triggerSlash = function(text) {
            if (window.parent && window.parent.triggerSlash) {
              window.parent.triggerSlash(text);
            } else {
              console.error("SillyTavern's triggerSlash function not found in parent.");
            }
          };

          let lastHeight = 0;
          let isUpdating = false;

          function updateHeight() {
            if (!window.frameElement) return;
            if (isUpdating) return;
            
            isUpdating = true;
            
            requestAnimationFrame(() => {
              const body = document.body;
              const html = document.documentElement;
              if (!body || !html) {
                isUpdating = false;
                return;
              }

              let maxBottom = 0;
              for (let i = 0; i < body.children.length; i++) {
                const child = body.children[i];
                if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE' || child.tagName === 'LINK') continue;
                
                const style = window.getComputedStyle(child);
                if (style.position === 'fixed') continue;

                const rect = child.getBoundingClientRect();
                const bottom = rect.bottom;
                const offsetBottom = child.offsetTop + child.offsetHeight;
                const itemMax = Math.max(bottom, offsetBottom);
                if (itemMax > maxBottom) maxBottom = itemMax;
              }

              const style = window.getComputedStyle(body);
              const marginBottom = parseFloat(style.marginBottom) || 0;
              const finalMaxBottom = maxBottom + marginBottom;
              const scrollHeight = body.scrollHeight;
              let newHeight = Math.max(finalMaxBottom, scrollHeight);
              newHeight += 4;

              if (Math.abs(newHeight - lastHeight) > 0) {
                lastHeight = newHeight;
                window.frameElement.style.height = newHeight + 'px';
              }
              
              isUpdating = false;
            });
          }

          const onResize = () => {
            updateHeight();
          };

          window.addEventListener('load', () => {
            updateHeight();
            setTimeout(updateHeight, 200);
            setTimeout(updateHeight, 1000);
          });
          
          window.addEventListener('resize', onResize);
          
          window.addEventListener('click', () => {
            const start = Date.now();
            const duration = 600;
            
            const animate = () => {
              const now = Date.now();
              if (now - start >= duration) return;
              updateHeight();
              requestAnimationFrame(animate);
            };
            
            animate();
          });

          window.addEventListener('DOMContentLoaded', () => {
            const imgs = document.querySelectorAll('img');
            imgs.forEach(img => img.addEventListener('load', updateHeight));
            updateHeight();
          });

          if (window.ResizeObserver) {
            const ro = new ResizeObserver((entries) => {
              for (const entry of entries) {
                if (entry.target === document.body) {
                  onResize();
                }
              }
            });
            if (document.body) ro.observe(document.body);
          } else {
            setInterval(updateHeight, 1000);
          }
          
        <\/script>
      `;

  let content = rawHtml;
  const trimmedHtml = content.trim();
  const isStandardDoc = /^\s*(<!doctype|<html)/i.test(trimmedHtml);

  if (isStandardDoc) {
    const headRegex = /<head(\s[^>]*)?>/i;
    const htmlRegex = /<html(\s[^>]*)?>/i;

    if (headRegex.test(content)) {
      content = content.replace(headRegex, (match) => match + metaViewport + resetStyle + scriptShim);
    } else if (htmlRegex.test(content)) {
      content = content.replace(htmlRegex, (match) => match + '<head>' + metaViewport + resetStyle + scriptShim + '</head>');
    } else {
      content = metaViewport + resetStyle + scriptShim + content;
    }
  } else {
    content = `<!DOCTYPE html>
<html>
<head>
${metaViewport}
${resetStyle}
${scriptShim}
</head>
<body>
${rawHtml}
</body>
</html>`;
  }

  const escapedContent = content.split('"').join('&quot;');
  return `<iframe srcdoc="${escapedContent}" style="width:100%;border:none;border-radius:12px;margin-top:8px;min-height:100px;overflow:hidden;" sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin" scrolling="no"></iframe>`;
}

function renderMarkdown(content: string, role: string = 'assistant') {
  if (!content) return ''
  
  let processed = content.trim()
  
  const userName = chatStore.userName || '用户'
  processed = processed.replace(/\{\{user\}\}/gi, userName)
  
  const isStreaming = chatStore.isStreaming
  const isUser = role === 'user'
  const isAssistant = role === 'assistant'
  
  const compiled = props.compiledRegexScripts
  // 应用正则替换，但不影响HTML标签
  processed = applyRegexScriptsToHtml(processed, compiled, isUser, isAssistant)
  
  if (isStreaming) {
    const trimmed = processed.trim()
    const containsHtml = /<[^>]+>/i.test(processed)
    if (containsHtml && !trimmed.includes('```')) {
      return DOMPurify.sanitize(processed, cleanConfig)
    }
    return DOMPurify.sanitize(marked(processed) as string, cleanConfig)
  }
  
  const trimmed = processed.trim()
  
  const htmlDocPattern = /(<!doctype html>|<html\b[^>]*>)/i
  const htmlMatch = trimmed.match(htmlDocPattern)
  
  if (htmlMatch && !trimmed.includes('```')) {
    const startIndex = htmlMatch.index!
    const closeTag = '</html>'
    const closeIndex = trimmed.toLowerCase().lastIndexOf(closeTag)
    
    let htmlContent: string, preText: string, postText: string
    
    if (closeIndex !== -1 && closeIndex > startIndex) {
      const endIndex = closeIndex + closeTag.length
      htmlContent = trimmed.substring(startIndex, endIndex)
      preText = trimmed.substring(0, startIndex)
      postText = trimmed.substring(endIndex)
    } else {
      htmlContent = trimmed.substring(startIndex)
      preText = trimmed.substring(0, startIndex)
      postText = ''
    }
    
    let resultHtml = ''
    
    if (preText.trim()) {
      resultHtml += DOMPurify.sanitize(marked(preText) as string, cleanConfig)
    }
    
    const container = document.createElement('div')
    container.className = 'html-card-container'
    container.style.width = '100%'
    container.style.margin = '0'
    container.style.paddingBottom = '0'
    container.style.marginBottom = '-1px'
    container.innerHTML = createIframe(htmlContent)
    resultHtml += container.outerHTML
    
    if (postText.trim()) {
      resultHtml += DOMPurify.sanitize(marked(postText) as string, cleanConfig)
    }
    
    return resultHtml
  }
  
  const containsHtml = /<[^>]+>/i.test(processed)
  if (containsHtml && !trimmed.includes('```')) {
    return DOMPurify.sanitize(processed, cleanConfig)
  }
  
  if (trimmed.includes('```')) {
    const codeBlockMatch = trimmed.match(/```[\s\S]*?```/g)
    if (codeBlockMatch) {
      for (const block of codeBlockMatch) {
        if (/<[^>]+>/i.test(block)) {
          return DOMPurify.sanitize(processed, cleanConfig)
        }
      }
    }
  }
  
  const lowerTrimmed = trimmed.toLowerCase()
  if (lowerTrimmed.includes('<html') || lowerTrimmed.includes('<!doctype')) {
    processed = processed.replace(/<!DOCTYPE html>/gi, '')
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<\/?head[^>]*>/gi, '')
      .replace(/<\/?body[^>]*>/gi, '')
  }
  
  let html = DOMPurify.sanitize(marked(processed) as string, cleanConfig)
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    let modified = false
    
    const codeBlocks = doc.querySelectorAll('pre code')
    codeBlocks.forEach(block => {
      const rawHtml = block.textContent || ''
      const isHtmlClass = block.classList.contains('language-html') || block.classList.contains('language-xml')
      const looksLikeHtml = /^\s*<(!doctype|html|head|body|div|span|style|script|table|img)/i.test(rawHtml)
      
      if (isHtmlClass || looksLikeHtml) {
        const iframe = document.createElement('div')
        iframe.innerHTML = createIframe(rawHtml)
        const preTag = block.parentElement
        if (preTag && preTag.parentNode) {
          preTag.parentNode.replaceChild(iframe, preTag)
          modified = true
        }
      }
    })
    
    const paragraphs = doc.querySelectorAll('p')
    paragraphs.forEach(p => {
      if (/^\s*</.test(p.innerHTML)) {
        const rawHtml = p.textContent || ''
        if (/^\s*<(!doctype|html|head|body|div|span|style|script|table|img)/i.test(rawHtml)) {
          const iframe = document.createElement('div')
          iframe.innerHTML = createIframe(rawHtml)
          if (p.parentNode) {
            p.parentNode.replaceChild(iframe, p)
            modified = true
          }
        }
      }
    })
    
    if (modified) {
      return doc.body.innerHTML
    }
  } catch (e) {
    console.error('Error processing HTML:', e)
  }
  
  return html
}

watch(() => props.messages.length, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

defineExpose({
  messagesContainer
})
</script>
