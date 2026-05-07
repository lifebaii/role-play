import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { useUserDataStore } from '@/stores/userData'
import { useDialog } from '@/composables/useDialog'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { compileRegexScripts, applyRegexScriptsToHtml } from '@/utils/regexUtils'

export interface CompiledRegexScript {
  regex: RegExp
  replacement: string
  placement: number[]
  promptOnly: boolean
  markdownOnly: boolean
  name: string
}

export function useChat(globalRegex: any[] = []) {
  const chatStore = useChatStore()
  const userStore = useUserStore()
  const userDataStore = useUserDataStore()
  const { showConfirm, showDangerConfirm, showErrorAlert } = useDialog()
  
  const messagesContainer = ref<HTMLElement | null>(null)
  const editingIndex = ref(-1)
  const editContent = ref('')
  const inputText = ref('')
  const showSuggestions = ref(false)
  const suggestions = ref<string[]>([])
  const isGeneratingSuggestions = ref(false)
  let lastSuggestionsMessagesSnapshot: string = ''
  
  const autoFetchSuggestions = ref(localStorage.getItem('role_play_auto_suggestions') === 'true')
  
  const messages = computed(() => chatStore.messages)
  
  const compiledRegexScripts = computed<CompiledRegexScript[]>(() => {
    const globalRegexList = globalRegex || []
    const charRegexList = chatStore.currentCharacter?.regex_scripts || []
    const userRegexList = userDataStore.enabledRegexScripts || []
    return compileRegexScripts(globalRegexList, charRegexList, userRegexList)
  })

  function scrollToBottom() {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }

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

  function renderMarkdown(content: string, role: string = 'assistant') {
    if (!content) return ''
    
    let processed = content.trim()
    
    const userName = chatStore.userName || '用户'
    processed = processed.replace(/\{\{user\}\}/gi, userName)
    
    const isStreaming = chatStore.isStreaming
    const isUser = role === 'user'
    const isAssistant = role === 'assistant'
    
    const compiled = compiledRegexScripts.value
    
    const beforeRegex = processed
    let hasRegexChange = false
    
    // 应用正则替换，但不影响HTML标签
    const processedWithRegex = applyRegexScriptsToHtml(processed, compiled, isUser, isAssistant)
    hasRegexChange = processedWithRegex !== processed
    processed = processedWithRegex
    
    if (!isStreaming && hasRegexChange) {
      console.log('%c[正则替换对比]', 'color: #4CAF50; font-weight: bold; font-size: 14px;')
      console.log('%c替换前:', 'color: #2196F3; font-weight: bold;', beforeRegex)
      console.log('%c替换后:', 'color: #FF9800; font-weight: bold;', processed)
      console.log('%c----------------------------------------', 'color: #9E9E9E;')
    }
    
    if (isStreaming) {
      const trimmed = processed.trim()
      const containsHtml = /<[^>]+>/i.test(processed)
      if (containsHtml && !trimmed.includes('```')) {
        return DOMPurify.sanitize(processed, cleanConfig)
      }
      return DOMPurify.sanitize(marked(processed) as string, cleanConfig)
    }
    
    const trimmed = processed.trim()
    
    const createIframe = (rawHtml: string): string => {
      const hudCSS = '.sinan-hud{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;padding:12px;background:linear-gradient(to bottom right,rgba(255,255,255,0.9),rgba(255,255,255,0.6));border-radius:12px;border:1px solid rgba(0,0,0,0.08);backdrop-filter:blur(4px)}.char-card{flex:1 1 140px;background:#fff;padding:10px;border-radius:8px;border-left:4px solid #ddd;box-shadow:0 2px 6px rgba(0,0,0,0.04);display:flex;flex-direction:column;gap:4px;font-size:12px;position:relative;overflow:hidden;transition:transform 0.2s}.char-card:hover{transform:translateY(-2px);box-shadow:0 4px 8px rgba(0,0,0,0.1)}.char-name{font-weight:700;font-size:14px;color:#374151;display:flex;justify-content:space-between;align-items:center}.char-mood{color:#6b7280;font-size:12px}.char-loc{color:#9ca3af;font-size:11px;margin-top:auto;padding-top:4px}.bar-bg{height:4px;background:#f3f4f6;border-radius:2px;overflow:hidden;margin-top:6px}.bar-fill{height:100%;background:#10b981;border-radius:2px}.c-tongqiu{border-left-color:#f59e0b}.c-tongqiu .bar-fill{background:#f59e0b}.c-yufan{border-left-color:#3b82f6}.c-yufan .bar-fill{background:#3b82f6}.c-linghu{border-left-color:#8b5cf6}.c-linghu .bar-fill{background:#8b5cf6}.c-chongtian{border-left-color:#ef4444}.c-chongtian .bar-fill{background:#ef4444}'
      const resetStyle = '<style>html,body{margin:0 !important;padding:0 !important;width:100% !important;height:auto !important;min-height:auto !important;word-wrap:break-word !important;box-sizing:border-box !important;overflow:hidden !important;} ::-webkit-scrollbar{display:none;} *,*::before,*::after{box-sizing:inherit !important;} img,video,canvas,svg{max-width:100% !important;height:auto !important;} table{display:block !important;overflow-x:auto !important;max-width:100% !important;} pre{white-space:pre-wrap !important;word-wrap:break-word !important;max-width:100% !important;} .container, .reality-panel, .app-container {max-width:100% !important; width:100% !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; border: none !important; height: auto !important; min-height: 0 !important;} body > div:first-child { margin: 0 !important; max-width: 100% !important; height: auto !important; min-height: 0 !important; } #app { height: auto !important; min-height: auto !important; }' + hudCSS + '</style>';
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

  async function handleSubmit() {
    if (!inputText.value.trim()) return
    
    if (!userStore.user?.userName) {
      return { needUserName: true }
    }
    
    const text = inputText.value
    inputText.value = ''
    await chatStore.sendMessage(text)
    return { needUserName: false }
  }

  function copyMessage(content: string) {
    navigator.clipboard.writeText(content)
  }

  function startEdit(index: number, content: string) {
    editingIndex.value = index
    editContent.value = content
  }

  function cancelEdit() {
    editingIndex.value = -1
    editContent.value = ''
  }

  function saveEdit(index: number) {
    chatStore.editMessage(index, editContent.value)
    cancelEdit()
    suggestions.value = []
    lastSuggestionsMessagesSnapshot = ''
    showSuggestions.value = false
  }

  async function deleteMessage(index: number) {
    const confirmed = await showDangerConfirm('确定要删除这条消息吗？')
    if (confirmed) {
      chatStore.deleteMessage(index)
      suggestions.value = []
      lastSuggestionsMessagesSnapshot = ''
      showSuggestions.value = false
    }
  }

  function regenerateMessage(index: number) {
    chatStore.regenerateFrom(index)
    suggestions.value = []
    lastSuggestionsMessagesSnapshot = ''
    showSuggestions.value = false
  }

  function regenerateFromAssistant(index: number) {
    if (index > 0 && chatStore.messages[index - 1].role === 'user') {
      chatStore.regenerateFrom(index - 1)
      suggestions.value = []
      lastSuggestionsMessagesSnapshot = ''
      showSuggestions.value = false
    }
  }

  function regenerateUserMessage(index: number) {
    const msg = chatStore.messages[index]
    if (!msg || msg.role !== 'user') return
    chatStore.regenerateFrom(index)
  }

  async function regenerateGreeting() {
    if (!chatStore.currentCharacter) return
    
    try {
      const response = await chatApi.generateGreeting(chatStore.currentCharacter.id)
      const first_mesIndex = chatStore.messages.findIndex(m => m.isGreeting)
      
      if (first_mesIndex !== -1) {
        chatStore.editMessage(first_mesIndex, response.first_mes)
      }
    } catch (e: any) {
      throw new Error('生成开场白失败: ' + e.message)
    }
  }

  async function confirmClearHistory() {
    const confirmed = await showDangerConfirm('确定要清空聊天记录吗？')
    if (confirmed) {
      chatStore.clearHistory()
    }
  }

  async function handleExportChat() {
    try {
      await chatStore.exportChat()
    } catch (e: any) {
      throw new Error('导出失败: ' + e.message)
    }
  }

  async function handleImportChat(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return 0
    
    try {
      const count = await chatStore.importChat(file)
      return count
    } catch (e: any) {
      throw new Error('导入失败: ' + e.message)
    } finally {
      ;(event.target as HTMLInputElement).value = ''
    }
  }

  async function fetchSuggestions(options: { autoShow?: boolean, force?: boolean } = {}) {
    if (isGeneratingSuggestions.value) return
    
    const { autoShow = true, force = false } = options
    
    const currentMessagesSnapshot = JSON.stringify(chatStore.messages.slice(-6))
    if (!force && suggestions.value.length > 0 && lastSuggestionsMessagesSnapshot === currentMessagesSnapshot) {
      if (autoShow) {
        showSuggestions.value = true
      }
      return
    }
    
    isGeneratingSuggestions.value = true
    if (autoShow) {
      showSuggestions.value = false
    }
    
    try {
      const model = chatStore.selectedModel || chatStore.globalDefaultModel
      const customModelConfig = chatStore.useCustomModel ? chatStore.customModelConfig : undefined
      
      let token = localStorage.getItem('user_token')
      if (!token) {
        token = localStorage.getItem('admin_token')
      }
      
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          character_id: chatStore.currentCharacter?.id,
          history: chatStore.messages,
          user_name: chatStore.userName,
          model: model,
          custom_model_config: customModelConfig
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        if (data.error === 'Insufficient quota') {
          setTimeout(() => {
            showErrorAlert('对话额度不足，请签到获取更多额度或联系管理员')
          }, 100)
        }
        return
      }
      
      suggestions.value = data.suggestions || []
      if (autoShow) {
        showSuggestions.value = suggestions.value.length > 0
      }
      lastSuggestionsMessagesSnapshot = JSON.stringify(chatStore.messages.slice(-6))
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      isGeneratingSuggestions.value = false
    }
  }

  function sendSuggestion(suggestion: string) {
    inputText.value = suggestion
    handleSubmit()
    showSuggestions.value = false
  }

  function toggleAutoSuggestions() {
    autoFetchSuggestions.value = !autoFetchSuggestions.value
    localStorage.setItem('role_play_auto_suggestions', autoFetchSuggestions.value.toString())
  }

  watch(() => messages.value.length, () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  })

  let previousIsStreaming = chatStore.isStreaming
  watch(() => chatStore.isStreaming, (isStreaming) => {
    if (previousIsStreaming && !isStreaming && autoFetchSuggestions.value) {
      setTimeout(() => {
        if (chatStore.error) return
        
        const lastMessage = chatStore.messages[chatStore.messages.length - 1]
        if (lastMessage && lastMessage.role === 'assistant') {
          const content = lastMessage.content || ''
          if (!content.trim() || content.startsWith('[Error:')) {
            return
          }
        }
        
        fetchSuggestions({ autoShow: false })
      }, 300)
    }
    previousIsStreaming = isStreaming
  })

  return {
    messagesContainer,
    editingIndex,
    editContent,
    inputText,
    showSuggestions,
    suggestions,
    isGeneratingSuggestions,
    autoFetchSuggestions,
    messages,
    compiledRegexScripts,
    scrollToBottom,
    getMessageContent,
    renderMarkdown,
    handleSubmit,
    copyMessage,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteMessage,
    regenerateMessage,
    regenerateFromAssistant,
    regenerateUserMessage,
    regenerateGreeting,
    confirmClearHistory,
    handleExportChat,
    handleImportChat,
    fetchSuggestions,
    sendSuggestion,
    toggleAutoSuggestions
  }
}
