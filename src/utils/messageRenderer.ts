import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { CompiledRegexScript } from '@/composables/useChat'
import { applyRegexScriptsToHtml } from '@/utils/regexUtils'
import { getStreamingProcessor, resetStreamingProcessor } from '@/utils/streamingRegexProcessor'

export interface RenderMessageOptions {
  content: string
  role?: 'user' | 'assistant'
  userName?: string
  compiledRegexScripts?: CompiledRegexScript[]
  isStreaming?: boolean
}

export const cleanConfig = {
  ADD_TAGS: ['details', 'summary', 'iframe', 'svg', 'path', 'g', 'circle', 'rect', 'defs', 'linearGradient', 'stop', 'style', 'div', 'span', 'script', 'button', 'input', 'textarea', 'select', 'option', 'label', 'form'],
  ADD_ATTR: ['style', 'open', 'srcdoc', 'sandbox', 'frameborder', 'allow', 'allowfullscreen', 'class', 'id', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd', 'stroke-linecap', 'stroke-linejoin', 'x1', 'y1', 'x2', 'y2', 'offset', 'stop-color', 'stop-opacity', 'width', 'height', 'onclick', 'onchange', 'oninput', 'onsubmit', 'type', 'value', 'checked', 'placeholder', 'rows', 'name', 'for', 'action', 'method', 'disabled', 'readonly', 'min', 'max', 'step', 'data-slash'],
  FORBID_ATTR: ['onmouseover', 'onload'],
  FORCE_BODY: true
}

const renderMarkdownCache = new Map<string, string>()
const htmlFrameDetectionCache = new Map<string, boolean>()

let lastRegexScriptsHash = ''
let lastRegexScriptsLength = 0

function clearCaches() {
  renderMarkdownCache.clear()
  htmlFrameDetectionCache.clear()
}

const contentUsesHtmlFrame = (text: string, role: 'user' | 'assistant' = 'assistant', skipRegex = false): boolean => {
  if (!text) return false
  const cacheKey = `${role}_${skipRegex}_${text}`
  if (htmlFrameDetectionCache.has(cacheKey)) {
    return htmlFrameDetectionCache.get(cacheKey)!
  }

  const trimmed = text.trim()
  let usesFrame = false

  const codeFencePattern = /```([^\n`]*)\n?([\s\S]*?)```/g
  let codeMatch: RegExpExecArray | null
  while ((codeMatch = codeFencePattern.exec(trimmed)) !== null) {
    const lang = codeMatch[1] || ''
    const blockContent = codeMatch[2] || ''
    if (/\b(html|xml)\b/i.test(lang) || /^\s*<(!doctype|html|head|body|div|span|style|script|table|img)/i.test(blockContent)) {
      usesFrame = true
      break
    }
  }

  if (!usesFrame && !trimmed.includes('```')) {
    usesFrame = /(<!doctype html>|<html\b[^>]*>)/i.test(trimmed)
  }

  htmlFrameDetectionCache.set(cacheKey, usesFrame)
  if (htmlFrameDetectionCache.size > 2000) {
    const firstKey = htmlFrameDetectionCache.keys().next().value
    if (firstKey !== undefined) {
      htmlFrameDetectionCache.delete(firstKey)
    }
  }
  return usesFrame
}

const htmlIframeSandbox = 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-same-origin allow-downloads allow-pointer-lock allow-presentation allow-top-navigation-by-user-activation';

const buildExecutableHtmlDocument = (rawHtml: string) => {
  const metaViewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
  const hudCSS = '.sinan-hud{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;padding:12px;background:linear-gradient(to bottom right,rgba(255,255,255,0.9),rgba(255,255,255,0.6));border-radius:12px;border:1px solid rgba(0,0,0,0.08);backdrop-filter:blur(4px)}.char-card{flex:1 1 140px;background:#fff;padding:10px;border-radius:8px;border-left:4px solid #ddd;box-shadow:0 2px 6px rgba(0,0,0,0.04);display:flex;flex-direction:column;gap:4px;font-size:12px;position:relative;overflow:hidden;transition:transform 0.2s}.char-card:hover{transform:translateY(-2px);box-shadow:0 4px 8px rgba(0,0,0,0.1)}.char-name{font-weight:700;font-size:14px;color:#374151;display:flex;justify-content:space-between;align-items:center}.char-mood{color:#6b7280;font-size:12px}.char-loc{color:#9ca3af;font-size:11px;margin-top:auto;padding-top:4px}.bar-bg{height:4px;background:#f3f4f6;border-radius:2px;overflow:hidden;margin-top:6px}.bar-fill{height:100%;background:#10b981;border-radius:2px}.c-tongqiu{border-left-color:#f59e0b}.c-tongqiu .bar-fill{background:#f59e0b}.c-yufan{border-left-color:#3b82f6}.c-yufan .bar-fill{background:#3b82f6}.c-linghu{border-left-color:#8b5cf6}.c-linghu .bar-fill{background:#8b5cf6}.c-chongtian{border-left-color:#ef4444}.c-chongtian .bar-fill{background:#ef4444}';
  const resetStyle = '<style>html,body{margin:0!important;padding:0!important;width:100%!important;height:auto!important;min-height:auto!important;word-wrap:break-word!important;box-sizing:border-box!important;overflow:hidden!important;background:transparent!important;}::-webkit-scrollbar{display:none;}*,*::before,*::after{box-sizing:inherit!important;}img,video,canvas,svg{max-width:100%!important;height:auto!important;}table{display:block!important;overflow-x:auto!important;max-width:100%!important;}pre{white-space:pre-wrap!important;word-wrap:break-word!important;max-width:100%!important;}.container,.reality-panel,.app-container{max-width:100%!important;width:100%!important;margin:0!important;border-radius:0!important;box-shadow:none!important;border:none!important;height:auto!important;min-height:0!important;background:transparent!important;}body>div:first-child{margin:0!important;max-width:100%!important;height:auto!important;min-height:0!important;}#app{height:auto!important;min-height:auto!important;background:transparent!important;}.bottom-safe{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;}' + hudCSS + '</style>';
  const baseAndJquery = `
    <script>
        // 动态设置 base href 和 jQuery 路径
        (function() {
            var base = document.createElement('base');
            var path = window.parent && window.parent.location ? 
                window.parent.location.pathname.replace(/[^\/]+$/, '') : './';
            base.href = path;
            document.head.appendChild(base);
            
            // 动态加载 jQuery
            var script = document.createElement('script');
            script.src = path + 'jquery.min.js';
            script.defer = true;
            document.head.appendChild(script);
        })();
    <\/script>`;
  const scriptShim = `
        <script>
            window.triggerSlash = function(text) {
                if (window.parent && window.parent.triggerSlash) {
                    window.parent.triggerSlash(text);
                }
            };

            let lastHeight = 0;
            let isUpdating = false;
            function updateHeight() {
                if (!window.frameElement || isUpdating) return;
                isUpdating = true;
                requestAnimationFrame(function() {
                    var body = document.body;
                    var html = document.documentElement;
                    if (!body || !html) {
                        isUpdating = false;
                        return;
                    }
                    var maxBottom = 0;
                    for (var i = 0; i < body.children.length; i++) {
                        var child = body.children[i];
                        if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE' || child.tagName === 'LINK') continue;
                        var style = window.getComputedStyle(child);
                        if (style.position === 'fixed') continue;
                        var rect = child.getBoundingClientRect();
                        var itemMax = Math.max(rect.bottom, child.offsetTop + child.offsetHeight);
                        if (itemMax > maxBottom) maxBottom = itemMax;
                    }
                    var bodyStyle = window.getComputedStyle(body);
                    var marginBottom = parseFloat(bodyStyle.marginBottom) || 0;
                    var newHeight = Math.max(maxBottom + marginBottom, body.scrollHeight) + 4;
                    if (Math.abs(newHeight - lastHeight) > 0) {
                        lastHeight = newHeight;
                        window.frameElement.style.height = newHeight + 'px';
                    }
                    isUpdating = false;
                });
            }

            window.addEventListener('load', function() {
                updateHeight();
                setTimeout(updateHeight, 200);
                setTimeout(updateHeight, 1000);
            });
            window.addEventListener('resize', updateHeight);
            window.addEventListener('click', function(event) {
                var slashTarget = event.target && event.target.closest && event.target.closest('[data-slash]');
                if (slashTarget) {
                    event.preventDefault();
                    var command = slashTarget.getAttribute('data-slash');
                    if (command) window.triggerSlash(command);
                }
                var start = Date.now();
                var tick = function() {
                    if (Date.now() - start >= 600) return;
                    updateHeight();
                    requestAnimationFrame(tick);
                };
                tick();
            });
            window.addEventListener('DOMContentLoaded', function() {
                document.querySelectorAll('img').forEach(function(img) {
                    img.addEventListener('load', updateHeight);
                });
                updateHeight();
            });
            if (window.ResizeObserver) {
                var ro = new ResizeObserver(updateHeight);
                if (document.body) ro.observe(document.body);
            } else {
                setInterval(updateHeight, 1000);
            }
            if (document.readyState === 'complete') updateHeight();
        <\/script>
    `;

  let content = rawHtml || '';
  const trimmed = content.trim();
  if (/^\s*(<!doctype|<html)/i.test(trimmed)) {
    const headRegex = /<head(\s[^>]*)?>/i;
    const htmlRegex = /<html(\s[^>]*)?>/i;
    if (headRegex.test(content)) {
      return content.replace(headRegex, (match) => match + metaViewport + resetStyle + baseAndJquery + scriptShim);
    }
    if (htmlRegex.test(content)) {
      return content.replace(htmlRegex, (match) => match + '<head>' + metaViewport + resetStyle + baseAndJquery + scriptShim + '</head>');
    }
    return metaViewport + resetStyle + baseAndJquery + scriptShim + content;
  }

  return `<!DOCTYPE html>
<html>
<head>
${metaViewport}
${resetStyle}
${baseAndJquery}
${scriptShim}
</head>
<body>
${content}
</body>
</html>`;
};

const createExecutableHtmlIframe = (rawHtml: string, extraClass = '') => {
  const iframe = document.createElement('iframe');
  iframe.className = `w-full block executable-html-frame ${extraClass}`.trim();
  iframe.style.height = 'auto';
  iframe.style.overflow = 'hidden';
  iframe.style.transition = 'height 0.2s ease-out';
  iframe.style.margin = '0';
  iframe.style.padding = '0';
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('sandbox', htmlIframeSandbox);
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture');
  iframe.onload = function () {
    try {
      setTimeout(() => {
        if (this.contentWindow && this.contentWindow.document) {
          const doc = this.contentWindow.document;
          this.style.height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) + 'px';
        }
      }, 100);
    } catch (e) {
      console.warn('Failed to resize iframe:', e);
    }
  };
  iframe.srcdoc = buildExecutableHtmlDocument(rawHtml);
  return iframe;
};

export function createIframe(rawHtml: string): string {
  const container = document.createElement('div');
  container.className = 'html-card-container';
  container.style.width = '100%';
  container.style.margin = '0';
  container.style.paddingBottom = '0';
  container.style.marginBottom = '-1px';
  container.style.overflow = 'hidden';
  container.appendChild(createExecutableHtmlIframe(rawHtml, ''));
  return container.outerHTML;
}

function getRegexScriptsHash(compiledRegexScripts: CompiledRegexScript[]): string {
  return compiledRegexScripts.map(s => s.find + s.replace + JSON.stringify(s.condition)).join('|');
}

export function renderMessage(options: RenderMessageOptions): string {
  const {
    content,
    role = 'assistant',
    userName = '用户',
    compiledRegexScripts = [],
    isStreaming = false
  } = options;

  if (!content) return '';

  const regexHash = getRegexScriptsHash(compiledRegexScripts);
  if (lastRegexScriptsHash !== regexHash || lastRegexScriptsLength !== compiledRegexScripts.length) {
    lastRegexScriptsHash = regexHash;
    lastRegexScriptsLength = compiledRegexScripts.length;
    clearCaches();
  }

  const cacheKey = `${role}_${content}_${isStreaming}_${regexHash}`;

  if (!isStreaming && renderMarkdownCache.has(cacheKey)) {
    return renderMarkdownCache.get(cacheKey)!;
  }

  let processed = content.trim();

  processed = processed.replace(/\{\{user\}\}/gi, userName);

  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  const beforeRegex = processed;
  let hasRegexChange = false;

  let processedWithRegex: string;
  if (isStreaming) {
    const processor = getStreamingProcessor('streaming');
    processedWithRegex = processor.process(processed, compiledRegexScripts, isUser, isAssistant, true);
  } else {
    resetStreamingProcessor('streaming');
    processedWithRegex = applyRegexScriptsToHtml(processed, compiledRegexScripts, isUser, isAssistant);
  }
  hasRegexChange = processedWithRegex !== processed;
  processed = processedWithRegex;

  if (!isStreaming && hasRegexChange && import.meta.env.DEV) {
    console.log('%c[正则替换对比]', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
    console.log('%c替换前:', 'color: #2196F3; font-weight: bold;', beforeRegex);
    console.log('%c替换后:', 'color: #FF9800; font-weight: bold;', processed);
    console.log('%c----------------------------------------', 'color: #9E9E9E;');
  }

  if (isStreaming) {
    const trimmed = processed.trim();
    const containsHtml = /<[^>]+>/i.test(processed);
    if (containsHtml && !trimmed.includes('```')) {
      return DOMPurify.sanitize(processed, cleanConfig);
    }
    return DOMPurify.sanitize(marked(processed) as string, cleanConfig);
  }

  const trimmed = processed.trim();

  const htmlDocPattern = /(<!doctype html>|<html\b[^>]*>)/i;
  const htmlMatch = trimmed.match(htmlDocPattern);
  const containsHtmlDoc = !!htmlMatch;

  if (containsHtmlDoc && !trimmed.includes('```')) {
    const startIndex = htmlMatch.index!;

    const closeTag = '</html>';
    const closeIndex = trimmed.toLowerCase().lastIndexOf(closeTag);

    let htmlContent: string, preText: string, postText: string;

    if (closeIndex !== -1 && closeIndex > startIndex) {
      const endIndex = closeIndex + closeTag.length;
      htmlContent = trimmed.substring(startIndex, endIndex);
      preText = trimmed.substring(0, startIndex);
      postText = trimmed.substring(endIndex);
    } else {
      htmlContent = trimmed.substring(startIndex);
      preText = trimmed.substring(0, startIndex);
      postText = '';
    }

    let resultHtml = '';

    if (preText.trim()) {
      const preTrimmed = preText.trim();
      const preContainsHtml = /<[^>]+>/i.test(preTrimmed);
      if (preContainsHtml) {
        resultHtml += DOMPurify.sanitize(preTrimmed, cleanConfig);
      } else {
        resultHtml += DOMPurify.sanitize(marked(preTrimmed) as string, cleanConfig);
      }
    }

    const container = document.createElement('div');
    container.className = 'html-card-container';
    container.style.width = '100%';
    container.style.margin = '0';
    container.style.paddingBottom = '0';
    container.style.marginBottom = '-1px';
    container.style.overflow = 'hidden';
    container.appendChild(createExecutableHtmlIframe(htmlContent, ''));
    resultHtml += container.outerHTML;

    if (postText.trim()) {
      const postTrimmed = postText.trim();
      const postContainsHtml = /<[^>]+>/i.test(postTrimmed);
      if (postContainsHtml) {
        resultHtml += DOMPurify.sanitize(postTrimmed, cleanConfig);
      } else {
        resultHtml += DOMPurify.sanitize(marked(postTrimmed) as string, cleanConfig);
      }
    }

    if (!isStreaming) {
      renderMarkdownCache.set(cacheKey, resultHtml);
      if (renderMarkdownCache.size > 2000) {
        const firstKey = renderMarkdownCache.keys().next().value;
        if (firstKey !== undefined) {
          renderMarkdownCache.delete(firstKey);
        }
      }
    }

    return resultHtml;
  }

  const startsWithBlockHtml = /^\s*<(div|table|section|article|aside|header|footer|style|script)/i.test(trimmed);
  if (startsWithBlockHtml && !trimmed.includes('```')) {
    const result = DOMPurify.sanitize(processed, cleanConfig);
    if (!isStreaming) {
      renderMarkdownCache.set(cacheKey, result);
      if (renderMarkdownCache.size > 2000) {
        const firstKey = renderMarkdownCache.keys().next().value;
        if (firstKey !== undefined) {
          renderMarkdownCache.delete(firstKey);
        }
      }
    }
    return result;
  }

  const lowerTrimmed = trimmed.toLowerCase();
  if (lowerTrimmed.includes('<html') || lowerTrimmed.includes('<!doctype')) {
    processed = processed.replace(/<!DOCTYPE html>/gi, '')
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<\/?head[^>]*>/gi, '')
      .replace(/<\/?body[^>]*>/gi, '');
  }

  let html = DOMPurify.sanitize(marked(processed) as string, cleanConfig);

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let modified = false;

    const codeBlocks = doc.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
      const rawHtml = block.textContent || '';
      const isHtmlClass = block.classList.contains('language-html') || block.classList.contains('language-xml');
      const looksLikeHtml = /^\s*<(!doctype|html|head|body|div|span|style|script|table|img)/i.test(rawHtml);

      if (isHtmlClass || looksLikeHtml) {
        const iframeContainer = document.createElement('div');
        iframeContainer.className = 'html-card-container';
        iframeContainer.style.width = '100%';
        iframeContainer.style.margin = '0';
        iframeContainer.style.paddingBottom = '0';
        iframeContainer.style.marginBottom = '-1px';
        iframeContainer.style.overflow = 'hidden';
        iframeContainer.appendChild(createExecutableHtmlIframe(rawHtml, ''));
        const preTag = block.parentElement;
        if (preTag && preTag.parentNode) {
          preTag.parentNode.replaceChild(iframeContainer, preTag);
          modified = true;
        }
      }
    });

    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach(p => {
      if (/^\s*</.test(p.innerHTML)) {
        const rawHtml = p.textContent || '';
        if (/^\s*<(!doctype|html|head|body|div|span|style|script|table|img)/i.test(rawHtml)) {
          const iframeContainer = document.createElement('div');
          iframeContainer.className = 'html-card-container';
          iframeContainer.style.width = '100%';
          iframeContainer.style.margin = '0';
          iframeContainer.style.paddingBottom = '0';
          iframeContainer.style.marginBottom = '-1px';
          iframeContainer.style.overflow = 'hidden';
          iframeContainer.appendChild(createExecutableHtmlIframe(rawHtml, ''));
          if (p.parentNode) {
            p.parentNode.replaceChild(iframeContainer, p);
            modified = true;
          }
        }
      }
    });

    const complexDivs = doc.querySelectorAll('div[style*="position"], div[style*="background"], div[class*="panel"]');
    complexDivs.forEach(div => {
      if (div.querySelector('script')) {
        const rawHtml = div.outerHTML;
        const iframeContainer = document.createElement('div');
        iframeContainer.className = 'html-card-container';
        iframeContainer.style.width = '100%';
        iframeContainer.style.margin = '0';
        iframeContainer.style.paddingBottom = '0';
        iframeContainer.style.marginBottom = '-1px';
        iframeContainer.style.overflow = 'hidden';
        iframeContainer.appendChild(createExecutableHtmlIframe(rawHtml, ''));
        if (div.parentNode) {
          div.parentNode.replaceChild(iframeContainer, div);
          modified = true;
        }
      }
    });

    if (modified) {
      const result = doc.body.innerHTML;
      if (!isStreaming) {
        renderMarkdownCache.set(cacheKey, result);
        if (renderMarkdownCache.size > 2000) {
          const firstKey = renderMarkdownCache.keys().next().value;
          if (firstKey !== undefined) {
            renderMarkdownCache.delete(firstKey);
          }
        }
      }
      return result;
    }
  } catch (e) {
    console.error('Error processing HTML:', e);
  }

  if (!isStreaming) {
    renderMarkdownCache.set(cacheKey, html);
    if (renderMarkdownCache.size > 2000) {
      const firstKey = renderMarkdownCache.keys().next().value;
      if (firstKey !== undefined) {
        renderMarkdownCache.delete(firstKey);
      }
    }
  }

  return html;
}
