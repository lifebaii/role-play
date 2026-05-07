import type { CompiledRegexScript } from '@/composables/useChat'

export interface RegexScript {
  disabled?: boolean
  enabled?: boolean
  findRegex?: string
  regex?: string
  flags?: string
  replaceString?: string
  replacement?: string
  placement?: number[]
  promptOnly?: boolean
  markdownOnly?: boolean
  name?: string
  scriptName?: string
}

export function compileRegexScripts(
  globalRegexList: RegexScript[],
  charRegexList: RegexScript[],
  userRegexList: RegexScript[]
): CompiledRegexScript[] {
  const allRegex = [...globalRegexList, ...charRegexList, ...userRegexList]
  const result: CompiledRegexScript[] = []

  for (const script of allRegex) {
    if (script.disabled || script.enabled === false) continue

    try {
      const regexStr = script.findRegex || script.regex || ''
      if (!regexStr.trim()) continue
      
      let pattern = regexStr
      let flags = script.flags || 'g'

      if (pattern.startsWith('/')) {
        const lastSlash = pattern.lastIndexOf('/')
        if (lastSlash > 0) {
          const flagStr = pattern.substring(lastSlash + 1)
          pattern = pattern.substring(1, lastSlash)
          flags = flagStr || flags
        }
      }

      const validFlags = new Set(['g', 'i', 'm'])
      flags = [...new Set(flags.split(''))].filter((f: string) => validFlags.has(f)).join('')

      const regex = new RegExp(pattern, flags)
      result.push({
        regex,
        replacement: script.replaceString || script.replacement || '',
        placement: script.placement || [1, 2],
        promptOnly: script.promptOnly || false,
        markdownOnly: script.markdownOnly || false,
        name: script.name || script.scriptName || ''
      })
    } catch (e) {
      console.error('Regex compile error:', script.name || script.scriptName, e)
    }
  }

  return result
}

/**
 * 安全地应用正则替换到HTML文本中，不影响HTML标签
 * 一旦检测到HTML开始，后面的所有内容都不进行处理
 * @param html 包含HTML的文本
 * @param regex 正则表达式
 * @param replacement 替换字符串
 * @returns 替换后的HTML
 */
export function applyRegexToHtmlText(html: string, regex: RegExp, replacement: string): string {
  // 检测HTML是否开始（查找 <!DOCTYPE html> 或 <html> 标签）
  const htmlStartMatch = html.match(/<!DOCTYPE\s+html|<html/i);
  
  // 如果找到HTML开始标记，只处理前面的文本部分，后面的HTML原样保留
  if (htmlStartMatch && htmlStartMatch.index !== undefined) {
    const htmlStartIndex = htmlStartMatch.index;
    const textBeforeHtml = html.substring(0, htmlStartIndex);
    const htmlContent = html.substring(htmlStartIndex);
    
    // 只处理HTML之前的文本部分
    const processedText = applyRegexToTextOnly(textBeforeHtml, regex, replacement);
    
    return processedText + htmlContent;
  }
  
  // 如果没有HTML，正常处理整个文本
  return applyRegexToTextOnly(html, regex, replacement);
}

/**
 * 只处理纯文本，不涉及HTML标签
 */
function applyRegexToTextOnly(text: string, regex: RegExp, replacement: string): string {
  const parts: string[] = [];
  let lastIndex = 0;
  const tagRegex = /<[^>]+>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textPart = text.substring(lastIndex, match.index);
      parts.push(textPart.replace(regex, replacement));
    }
    parts.push(match[0]);
    lastIndex = tagRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const textPart = text.substring(lastIndex);
    parts.push(textPart.replace(regex, replacement));
  }

  return parts.join('');
}

/**
 * 批量应用正则脚本到HTML文本
 * @param html 包含HTML的文本
 * @param scripts 编译后的正则脚本数组
 * @param isUser 是否是用户消息
 * @param isAssistant 是否是助手消息
 * @returns 替换后的HTML
 */
export function applyRegexScriptsToHtml(
  html: string,
  scripts: CompiledRegexScript[],
  isUser: boolean,
  isAssistant: boolean
): string {
  let result = html
  
  for (const script of scripts) {
    if (isUser && !script.placement.includes(1)) continue
    if (isAssistant && !script.placement.includes(2)) continue
    if (!script.markdownOnly && script.promptOnly) continue
    
    result = applyRegexToHtmlText(result, script.regex, script.replacement)
  }
  
  return result
}
