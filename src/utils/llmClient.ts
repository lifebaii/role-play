import type { CustomModelConfig } from '@/types'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

export interface LLMOptions {
  temperature?: number
  model?: string
  maxTokens?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  repetitionPenalty?: number
  minP?: number
  topA?: number
  logitBias?: Record<string, number>
  stop?: string[]
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void
  onComplete: (fullContent: string) => void
  onError: (error: Error) => void
}

export interface ModelInfo {
  id: string
  name?: string
  owned_by?: string
}

function buildOpenAIHeaders(config: CustomModelConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (config.api_key) {
    headers['Authorization'] = `Bearer ${config.api_key}`
  }
  return headers
}

function buildOpenAIBody(
  model: string,
  messages: LLMMessage[],
  options: LLMOptions,
  stream: boolean
): Record<string, any> {
  const body: Record<string, any> = {
    model,
    messages,
    temperature: options.temperature ?? 1,
    max_tokens: options.maxTokens,
    stream,
  }
  if (options.topP !== undefined) body.top_p = options.topP
  if (options.frequencyPenalty !== undefined) body.frequency_penalty = options.frequencyPenalty
  if (options.presencePenalty !== undefined) body.presence_penalty = options.presencePenalty
  if (options.logitBias && Object.keys(options.logitBias).length > 0) body.logit_bias = options.logitBias
  if (options.stop && options.stop.length > 0) body.stop = options.stop
  return body
}

async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
  extractContent: (parsed: any) => string | undefined
): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          try {
            const parsed = JSON.parse(data)
            const content = extractContent(parsed)
            if (content) yield content
          } catch {
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

async function* streamOpenAI(
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  options: LLMOptions,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildOpenAIHeaders({ provider: 'openai', api_url: apiUrl, api_key: apiKey, default_model: model }),
    body: JSON.stringify(buildOpenAIBody(model, messages, options, true)),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
  }

  if (!response.body) throw new Error('No response body')

  yield* parseSSEStream(response.body, (parsed) => parsed.choices?.[0]?.delta?.content)
}

async function* streamAnthropic(
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  options: LLMOptions,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl

  const systemMessage = messages.find(m => m.role === 'system')
  const otherMessages = messages.filter(m => m.role !== 'system')

  const anthropicMessages = otherMessages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }))

  const body: Record<string, any> = {
    model,
    messages: anthropicMessages,
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature ?? 1,
    stream: true,
  }
  if (systemMessage) body.system = systemMessage.content
  if (options.topP !== undefined) body.top_p = options.topP
  if (options.topK !== undefined) body.top_k = options.topK
  if (options.stop && options.stop.length > 0) body.stop_sequences = options.stop

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(body),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${errorText}`)
  }

  if (!response.body) throw new Error('No response body')

  yield* parseSSEStream(response.body, (parsed) => {
    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
      return parsed.delta.text
    }
    return undefined
  })
}

async function* streamKobold(
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  options: LLMOptions,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const response = await fetch(`${baseUrl}/api/v1/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: messages.map(m => `${m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Assistant' : 'System'}: ${m.content}`).join('\n'),
      max_length: options.maxTokens,
      temperature: options.temperature ?? 1,
      top_p: options.topP,
      top_k: options.topK,
      rep_pen: options.repetitionPenalty,
    }),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kobold API error: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  if (data.results?.[0]?.text) {
    yield data.results[0].text
  }
}

export async function* streamChat(
  config: CustomModelConfig,
  messages: LLMMessage[],
  options: LLMOptions = {},
  signal?: AbortSignal
): AsyncGenerator<string> {
  const { provider, api_url, api_key, default_model } = config
  const model = options.model || default_model

  if (!api_url || !api_key || !model) {
    throw new Error('Missing API configuration')
  }

  switch (provider) {
    case 'anthropic':
      yield* streamAnthropic(api_url, api_key, model, messages, options, signal)
      break
    case 'kobold':
      yield* streamKobold(api_url, api_key, model, messages, options, signal)
      break
    case 'openai':
    case 'openai-compatible':
    default:
      yield* streamOpenAI(api_url, api_key, model, messages, options, signal)
      break
  }
}

export async function chat(
  config: CustomModelConfig,
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  let fullContent = ''

  for await (const chunk of streamChat(config, messages, options)) {
    fullContent += chunk
  }

  return fullContent
}

export async function fetchModelList(config: CustomModelConfig): Promise<ModelInfo[]> {
  const { provider, api_url, api_key } = config
  const baseUrl = api_url.endsWith('/') ? api_url.slice(0, -1) : api_url

  try {
    if (provider === 'anthropic') {
      return []
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (api_key) {
      headers['Authorization'] = `Bearer ${api_key}`
    }

    const response = await fetch(`${baseUrl}/models`, { headers })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`)
    }

    const data = await response.json()
    const models = data.data || data.models || []
    return models.map((m: any) => ({
      id: m.id || m.name || m,
      name: m.name || m.id || m,
      owned_by: m.owned_by || m.owner || undefined,
    }))
  } catch (e: any) {
    console.warn('Failed to fetch model list:', e.message)
    return []
  }
}

export async function testConnection(config: CustomModelConfig): Promise<{ success: boolean; message: string }> {
  try {
    const { provider, api_url, api_key, default_model } = config

    if (!api_url || !api_key || !default_model) {
      return { success: false, message: '请填写完整的API配置' }
    }

    const testMessages: LLMMessage[] = [
      { role: 'user', content: 'Hi' }
    ]

    let content = ''
    for await (const chunk of streamChat(config, testMessages, { maxTokens: 10 })) {
      content += chunk
      if (content.length > 0) break
    }

    return { success: true, message: '连接成功' }
  } catch (error: any) {
    return { success: false, message: error.message || '连接失败' }
  }
}
