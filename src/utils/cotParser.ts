const parseCotCache = new Map<string, CotParseResult>()

export interface CotParseResult {
  cot: string
  main: string
  sys: string
  isFinished: boolean
}

export function parseCot(text: string): CotParseResult {
  if (!text) return { cot: '', main: '', sys: '', isFinished: false }
  if (parseCotCache.has(text)) return parseCotCache.get(text)!

  const cotPattern = /<(think|cot)>([\s\S]*?)(?:<\/\s*\1\s*>|<\s*\1\s*>|$)/gi
  let cotContent = ''
  let mainContent = text
  let isFinished = false

  mainContent = mainContent.replace(cotPattern, (match, tag, content) => {
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/)
    let escapedContent = parts.map((part, i) => {
      if (i % 2 === 1) return part
      return part.replace(/</g, '&lt;')
    }).join('')

    cotContent += escapedContent
    if (match.includes('</') || (match.match(new RegExp('<' + tag + '>', 'gi')) || []).length > 1) {
      isFinished = true
    }
    return ''
  })

  let sys = ''
  const sysMatch = mainContent.match(/\n\n\[系统指令:\s*([\s\S]*?)\]\s*$/)
  if (sysMatch) {
    sys = sysMatch[1]
    mainContent = mainContent.slice(0, sysMatch.index).trim()
  }

  const result: CotParseResult = { cot: cotContent.trim(), main: mainContent.trim(), sys, isFinished }
  parseCotCache.set(text, result)

  if (parseCotCache.size > 2000) {
    const firstKey = parseCotCache.keys().next().value
    if (firstKey !== undefined) {
      parseCotCache.delete(firstKey)
    }
  }

  return result
}