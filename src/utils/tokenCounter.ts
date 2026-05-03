const TOKEN_ESTIMATE_RATIO = 4

function estimateTokens(text: string): number {
  if (!text) return 0
  const charCount = text.length
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g) || []).length
  const otherChars = charCount - cjkChars
  return Math.ceil(cjkChars * 1.5 + otherChars / TOKEN_ESTIMATE_RATIO)
}

let tokenizer: any = null
let tokenizerModel: string | null = null

async function loadTokenizer(modelName: string): Promise<void> {
  if (tokenizer && tokenizerModel === modelName) return

  try {
    const tiktoken = await import('js-tiktoken')
    const encoding = modelName.startsWith('gpt-4') || modelName.startsWith('gpt-4o')
      ? 'cl100k_base'
      : modelName.startsWith('claude')
        ? 'cl100k_base'
        : 'cl100k_base'

    tokenizer = tiktoken.getEncoding(encoding as any)
    tokenizerModel = modelName
  } catch (e) {
    console.warn('Failed to load tiktoken, using estimation:', e)
    tokenizer = null
    tokenizerModel = null
  }
}

function countTokens(text: string, model?: string): number {
  if (!text) return 0

  if (tokenizer) {
    try {
      const tokens = tokenizer.encode(text)
      return tokens.length
    } catch {
      return estimateTokens(text)
    }
  }

  return estimateTokens(text)
}

function countMessageTokens(
  message: { role: string; content: string; name?: string },
  model?: string
): number {
  let count = 4
  count += countTokens(message.role, model)
  count += countTokens(message.content, model)
  if (message.name) {
    count += countTokens(message.name, model)
    count += 1
  }
  return count
}

function countChatTokens(
  messages: Array<{ role: string; content: string; name?: string }>,
  model?: string
): number {
  let total = 0
  for (const message of messages) {
    total += countMessageTokens(message, model)
  }
  total += 2
  return total
}

function truncateToTokenLimit(
  messages: Array<{ role: string; content: string; name?: string }>,
  maxTokens: number,
  model?: string
): Array<{ role: string; content: string; name?: string }> {
  const systemMessages = messages.filter(m => m.role === 'system')
  const nonSystemMessages = messages.filter(m => m.role !== 'system')

  let systemTokens = countChatTokens(systemMessages, model)
  let remainingTokens = maxTokens - systemTokens - 2

  if (remainingTokens <= 0) {
    return systemMessages.slice(0, 1)
  }

  const result: Array<{ role: string; content: string; name?: string }> = [...systemMessages]

  for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
    const msgTokens = countMessageTokens(nonSystemMessages[i], model)
    if (remainingTokens - msgTokens >= 0) {
      remainingTokens -= msgTokens
      result.push(nonSystemMessages[i])
    } else {
      break
    }
  }

  const nonSystemResult = result.filter(m => m.role !== 'system')
  nonSystemResult.reverse()

  return [...systemMessages, ...nonSystemResult]
}

function formatTokenCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return String(count)
}

export {
  estimateTokens,
  loadTokenizer,
  countTokens,
  countMessageTokens,
  countChatTokens,
  truncateToTokenLimit,
  formatTokenCount,
}
