const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
import { eventBus } from '@/utils/eventBus'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  params?: Record<string, string>
}

function createRequest(tokenSource: 'user-only' | 'user-first' | 'admin-only') {
  return async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, params } = options

    let token
    if (tokenSource === 'admin-only') {
      token = localStorage.getItem('admin_token')
    } else if (tokenSource === 'user-only') {
      // user-only：只使用 user_token
      token = localStorage.getItem('user_token')
    } else {
      // user-first：优先使用 user_token
      token = localStorage.getItem('user_token')
      if (!token) {
        token = localStorage.getItem('admin_token')
      }
    }
    
    const config: RequestInit = {
      method,
      headers: {}
    }

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // 只有当 body 不是 FormData 时才设置 Content-Type
    if (!(body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
      // 合并用户自定义 headers
      Object.assign(config.headers, headers)
      
      if (body && method !== 'GET') {
        config.body = JSON.stringify(body)
      }
    } else {
      // 如果是 FormData，直接使用，不设置 Content-Type，让浏览器自动设置
      // 合并用户自定义 headers（除了 Content-Type）
      Object.assign(config.headers, headers)
      config.body = body
    }

    let url = `${API_BASE}${path}`
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value)
        }
      })
      url += `?${searchParams.toString()}`
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      // 401 错误处理：自动退出登录
      if (response.status === 401) {
        console.log('[API] 401 Unauthorized, logging out')
        if (tokenSource === 'admin-only') {
          localStorage.removeItem('admin_token')
          eventBus.emit('admin-logout')
        } else {
          localStorage.removeItem('user_token')
          localStorage.removeItem('user_data')
          eventBus.emit('user-logout')
        }
        eventBus.emit('auth-error', { type: tokenSource, message: '登录已过期，请重新登录' })
      }
      
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }
}

const request = createRequest('user-only')
const adminOnlyRequest = createRequest('admin-only')

export const api = {
  get: <T>(path: string, params?: Record<string, string>) => request<T>(path, { params }),
  post: <T>(path: string, body: any) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: any) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  getRaw: async (path: string, params?: Record<string, string>): Promise<{ blob: Blob; contentType: string }> => {
    let token = localStorage.getItem('user_token')
    if (!token) {
      token = localStorage.getItem('admin_token')
    }
    
    let url = `${API_BASE}${path}`
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => searchParams.append(key, value))
      url += `?${searchParams.toString()}`
    }
    
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('user_token')
        localStorage.removeItem('user_data')
        eventBus.emit('user-logout')
        eventBus.emit('auth-error', { type: 'user-only', message: '登录已过期，请重新登录' })
      }
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }
    
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream'
    const blob = await response.blob()
    return { blob, contentType }
  }
}

export const adminApiClient = {
  get: <T>(path: string, params?: Record<string, string>) => adminOnlyRequest<T>(path, { params }),
  post: <T>(path: string, body: any) => adminOnlyRequest<T>(path, { method: 'POST', body }),
  postForm: <T>(path: string, body: FormData) => adminOnlyRequest<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: any) => adminOnlyRequest<T>(path, { method: 'PUT', body }),
  putForm: <T>(path: string, body: FormData) => adminOnlyRequest<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => adminOnlyRequest<T>(path, { method: 'DELETE' })
}

export interface CharacterData {
  name: string
  description: string
  avatar?: string
  first_mes?: string
  personality?: string
  scenario?: string
  examples?: string
  system_prompt?: string
  post_history_instructions?: string
  character_book?: {
    entries: WorldInfo[]
  }
  regex_scripts?: RegexScript[]
  temperature?: number
  model_override?: string
  alternate_greetings?: string[]
  tags?: string[]
  creator?: string
  creator_notes?: string
  character_version?: string
  extensions?: {
    talkativeness?: string
    fav?: boolean
    avatar_prompt?: string
    world?: string
    depth_prompt?: {
      prompt?: string
      depth?: number
      role?: string
    }
  }
}

export interface RolePlayMeta {
  id: string
  createdAt: number
  updatedAt: number
  originalId?: string
  shared?: boolean
  userId?: string
  originalUserId?: string
  likeCount?: number
  liked?: boolean
  isFriend?: boolean
}

export interface Character {
  spec?: string
  spec_version?: string
  data?: CharacterData
  role_play?: RolePlayMeta
  
  // 兼容旧格式的字段
  id?: string
  name?: string
  description?: string
  avatar?: string
  first_mes?: string
  personality?: string
  scenario?: string
  examples?: string
  system_prompt?: string
  post_history_instructions?: string
  world_info?: WorldInfo[]
  character_book?: {
    entries: WorldInfo[]
  }
  regex_scripts?: RegexScript[]
  temperature?: number
  model_override?: string
  global_world_info?: WorldInfo[]
  global_regex?: RegexScript[]
  global_presets?: Preset[]
  alternate_greetings?: string[]
  tags?: string[]
  creator?: string
  creator_notes?: string
  character_version?: string
  spec?: string
  spec_version?: number
  createdAt?: number
  userId?: string
  shared?: boolean
  originalUserId?: string
  originalId?: string
  likeCount?: number
  liked?: boolean
  isFriend?: boolean
  isOfficial?: boolean
}

export interface WorldInfo {
  keys: string[]
  content: string
  enabled: boolean
  comment?: string
  position?: string
  depth?: number
  order?: number
  useRegex?: boolean
  matchWholeWords?: boolean
  caseSensitive?: boolean
  scanDepth?: number
  probability?: number
  useProbability?: boolean
  selectiveLogic?: number
  secondary_keys?: string[]
  group?: string
  groupWeight?: number
  constant?: boolean
  preferential?: boolean
  sticky?: number
  cooldown?: number
  delay?: number
}

export interface Preset {
  name: string
  prompt: string
  enabled: boolean
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  name?: string
  content: string
  shouldAnimate?: boolean
  isSelf?: boolean
  avatar?: string
  isGreeting?: boolean
  reasoning?: string
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  api_key: string;
  api_url: string;
  default_model: string;
  is_default: boolean;
  available_models?: { id: string; name: string }[];
  selected_models?: string[];
}

// 自定义模型配置（前端存储，传给后端）
export interface CustomModelConfig {
  provider: 'openai' | 'anthropic' | string;
  api_key: string;
  api_url: string;
  default_model: string;
}

export interface CharactersResponse {
  characters: Character[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  characters: Character[]
  failedFiles?: Array<{
    filename: string
    error: string
  }>
}

export interface DeleteResult {
  success: boolean
  source: 'hf' | 'local'
  warning?: string
}

export interface UpdateResult extends Character {
  _updateMeta?: {
    source: 'hf' | 'local'
    warning?: string
  }
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  isOwner: boolean
  anonymousId: string
}

export const charactersApi = {
  list: async () => {
    const response = await api.get<CharactersResponse>('/characters')
    return response.characters
  },
  listAdmin: async (params?: { source?: 'admin' | 'user'; page?: number; pageSize?: number; search?: string; sortBy?: string }) => {
    const response = await adminApiClient.get<CharactersResponse>('/characters', params)
    return response
  },
  search: (params?: { search?: string; page?: number; pageSize?: number }) => 
    api.get<CharactersResponse>('/characters', params),
  searchAdmin: (params?: { search?: string; page?: number; pageSize?: number; source?: 'admin' | 'user'; sortBy?: string }) => 
    adminApiClient.get<CharactersResponse>('/characters', params),
  getAll: (params?: { search?: string; page?: number; pageSize?: number; userId?: string; friendIds?: string }) => 
    api.get<CharactersResponse>('/characters/all', params),
  getAllAdmin: (params?: { search?: string; page?: number; pageSize?: number; userId?: string; friendIds?: string }) => 
    adminApiClient.get<CharactersResponse>('/characters/all', params),
  get: (id: string) => api.get<Character>(`/characters/${id}`),
  getRaw: (id: string) => api.getRaw(`/characters/${id}/raw`),
  getAdmin: (id: string) => adminApiClient.get<Character>(`/characters/${id}`),
  create: (data: Partial<Character>) => adminApiClient.post<Character>('/characters', data),
  update: (id: string, data: Partial<Character>) => adminApiClient.put<Character>(`/characters/${id}`, data),
  updateShared: (id: string, shared: boolean) => 
    adminApiClient.put<{ success: boolean; shared: boolean; character?: Character }>(`/characters/${id}/shared`, { shared }),
  toggleShared: (id: string, shared: boolean) => 
    adminApiClient.put<{ success: boolean; shared: boolean; character?: Character }>(`/characters/${id}/shared`, { shared }),
  delete: (id: string) => adminApiClient.delete<DeleteResult>(`/characters/${id}`),
  import: (data: any) => adminApiClient.post('/characters/import', data),
  importFiles: (files: File[], id?: string): Promise<ImportResult> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });
    
    if (id) {
      formData.append('id', id);
    }
    
    return api.post('/characters/import-files', formData);
  },
  importFilesAdmin: (files: File[], id?: string): Promise<ImportResult> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });
    
    if (id) {
      formData.append('id', id);
    }
    
    return adminApiClient.postForm('/characters/import-files', formData);
  },
  updateOrder: (ids: string[]) => adminApiClient.put('/characters/order', { ids }),
  uploadCharacterImage: (id: string, file: File | Blob, characterData?: any) => {
    const formData = new FormData();
    formData.append('image', file);
    if (characterData) {
      formData.append('characterData', JSON.stringify(characterData));
    }
    return adminApiClient.putForm<Character>(`/characters/${id}/image`, formData);
  },
  updateCharacterFile: (id: string, file: Blob, filename: string) => {
    const formData = new FormData();
    formData.append('file', file, filename);
    return adminApiClient.putForm<Character>(`/characters/${id}/file`, formData);
  },
  getUserCharacter: (userId: string, charId: string) => api.get<Character>(`/characters/user/${userId}/${charId}`),
  createUserCharacter: (userId: string, character: Partial<Character>) => 
    api.post<Character>('/characters/user', { userId, character }),
  updateUserCharacter: (userId: string, charId: string, data: Partial<Character>) => 
    api.put<Character>(`/characters/user/${userId}/${charId}`, data),
  updateUserCharacterData: (userId: string, charId: string, data: Partial<Character>) => 
    api.put<Character>(`/characters/user/${userId}/${charId}/data`, data),
  updateUserCharacterShared: (userId: string, charId: string, shared: boolean) => 
    api.put<{ success: boolean; shared: boolean }>(`/characters/user/${userId}/${charId}/shared`, { shared }),
  deleteUserCharacter: (userId: string, charId: string) => api.delete(`/characters/user/${userId}/${charId}`),
  importUserCharacters: (userId: string, characters: any[]) => 
    api.post(`/characters/user/import`, { userId, characters }),
  getSharedCharacters: (params?: { search?: string; page?: number; pageSize?: number; userId?: string; friendIds?: string; own?: string; sortBy?: string }) => 
    api.get<CharactersResponse>('/characters/shared', params),
  
  toggleLike: (characterId: string) => api.post<{ liked: boolean; likeCount: number }>(`/characters/${characterId}/like`, {}),
  
  getCharacterMeta: (characterId: string) => api.get<{
    id: string
    name: string
    file_type: string
    shared: boolean
    sourceUrl: string | null
    thumbnailUrl: string | null
    exists: boolean
    isOwner: boolean
    likeCount: number
    commentCount: number
    isLiked: boolean
    originalId: string | null
    originalUserId: string | null
    originalMeta: {
      originalId: string | null
      shared: boolean
      likeCount: number
      commentCount: number
      isLiked: boolean
    } | null
  }>(`/characters/${characterId}/meta`),
  
  getCharacterDetail: (characterId: string) => api.get<{
    characterMeta: {
      originalId: string | null
      shared: boolean
      originalUserId: string | null
      likeCount: number
      commentCount: number
      isLiked: boolean
      originalMeta: {
        originalId: string | null
        shared: boolean
        likeCount: number
        commentCount: number
        isLiked: boolean
      } | null
    }
    character: any | null
    exists: boolean
    isOwner: boolean
  }>(`/characters/${characterId}/detail`),
  
  getLikedCharacters: () => api.get<{ likedCharacterIds: string[] }>('/characters/likes/list'),
  
  getComments: (characterId: string, page = 1, limit = 20) => 
    api.get<{ comments: Comment[], total: number, page: number, totalPages: number }>(`/characters/${characterId}/comments`, { page, limit }),
  
  addComment: (characterId: string, content: string) => 
    api.post<Comment>(`/characters/${characterId}/comments`, { content }),
  
  deleteComment: (characterId: string, commentId: string) => 
    api.delete<{ success: boolean }>(`/characters/${characterId}/comments/${commentId}`),
  
  getSource: (id: string) => adminApiClient.get<{
    enabled: boolean
    data: Character | null
    fileType: string
    rawBuffer?: string
    message?: string
  }>(`/characters/${id}/source`),
  
  getMeta: (id: string) => adminApiClient.get<{
    id: string
    name: string
    file_type: string
    shared: boolean
    sourceUrl: string | null
    thumbnailUrl: string | null
  }>(`/characters/${id}/meta`)
}

export const chatApi = {
  send: (characterId: string, message: string, history: Message[], userName?: string, model?: string, custom_model_config?: CustomModelConfig) =>
    api.post<{ response: string }>('/chat', {
      character_id: characterId,
      message,
      history,
      user_name: userName,
      model,
      custom_model_config
    }),

  generateGreeting: (characterId: string) =>
    api.post<{ first_mes: string }>('/chat/generate-greeting', { character_id: characterId })
}

export interface AdminSettings {
  newUserQuota: number
  signinMinQuota: number
  signinMaxQuota: number
  chatQuotaCost: number
  suggestionQuotaCost: number
  maxUserCharacters: number
  maxCharacterSize: number
}

export const adminApi = {
  login: (password: string) =>
    api.post<{ token: string }>('/admin/login', { password }),
  
  verify: () => adminApiClient.get<{ valid: boolean }>('/admin/verify'),
  
  getSettings: () => adminApiClient.get<AdminSettings>('/admin/settings'),
  
  updateSettings: (data: Partial<AdminSettings>) =>
    adminApiClient.put<AdminSettings>('/admin/settings', data),
  
  getGitSync: () => adminApiClient.get<{
    enabled: boolean
    syncInterval: number
    repoUrl: string
  }>('/admin/git-sync'),
  
  updateGitSync: (data: { syncInterval?: number }) =>
    adminApiClient.put<{ enabled: boolean; syncInterval: number }>('/admin/git-sync', data),
  
  gitPush: () => adminApiClient.post<{ success: boolean }>('/admin/git-sync/push'),
  
  gitPull: () => adminApiClient.post<{ success: boolean }>('/admin/git-sync/pull')
}

export const modelsApi = {
  list: () => adminApiClient.get<{ models: Model[], global_default_model: string }>('/models'),
  update: (models: Model[], globalDefaultModel?: string) => 
    adminApiClient.put<{ models: Model[], global_default_model: string }>('/models', { models, global_default_model: globalDefaultModel }),
  test: (params: { modelId?: string; apiKey?: string; apiUrl?: string; provider?: string }) => 
    adminApiClient.post('/models/test', { 
      model_id: params.modelId, 
      api_key: params.apiKey, 
      api_url: params.apiUrl, 
      provider: params.provider 
    }),
  listModels: (params: { modelId?: string; apiKey?: string; apiUrl?: string; provider?: string }) => 
    adminApiClient.post<{ models: { id: string; name: string }[] }>('/models/list', { 
      model_id: params.modelId, 
      api_key: params.apiKey, 
      api_url: params.apiUrl, 
      provider: params.provider 
    }),
  delete: (modelId: string) => adminApiClient.delete<any>(`/models/${modelId}`),
  listUnique: () => adminApiClient.get<{ models: { id: string; name: string; is_default: boolean; providers: { id: string; name: string }[] }[] }>('/models/list-unique')
}

export const presetsApi = {
  list: () => adminApiClient.get<Preset[]>('/presets'),
  update: (presets: Preset[]) => adminApiClient.put<Preset[]>('/presets', { presets }),
  import: (data: any) => adminApiClient.post('/presets/import', data)
}

export const worldInfoApi = {
  list: () => adminApiClient.get<any[]>('/worldinfo'),
  update: (worldinfo: any[]) => adminApiClient.put<any[]>('/worldinfo', { worldinfo }),
  import: (data: any) => adminApiClient.post('/worldinfo/import', data)
}

export interface RegexScript {
  name?: string
  regex?: string
  replacement?: string
  enabled: boolean
  flags?: string
  promptOnly?: boolean
  markdownOnly?: boolean
  placement?: number[] | boolean
  minDepth?: number
  maxDepth?: number
  scriptName?: string
  findRegex?: string
  replaceString?: string
  trimStrings?: boolean
}

export const regexApi = {
  list: () => adminApiClient.get<RegexScript[]>('/regex'),
  update: (regex: RegexScript[]) => adminApiClient.put<RegexScript[]>('/regex', { regex }),
  import: (data: any) => adminApiClient.post('/regex/import', data)
}

export interface User {
  id: string
  login: string
  name: string
  avatarUrl: string
  quota: number
  totalChats: number
  lastSigninDate: string | null
  userName: string
}

export const userApi = {
  verify: () => api.get<{ valid: boolean; user: User }>('/auth/verify'),
  signin: () => api.post<{ success: boolean; bonusQuota: number; user: User }>('/auth/signin', {}),
  logout: () => api.post<{ success: boolean }>('/auth/logout', {}),
  getCharacterLimit: () => api.get<{ currentCount: number; baseLimit: number; bonusSlots: number; totalLikes: number; maxLimit: number }>('/auth/character-limit'),
  updateUserName: (userName: string) => api.put<{ success: boolean; user: User }>('/auth/username', { userName })
}

export interface V1ChatCompletionOptions {
  messages: Array<{ role: string; content: string; name?: string }>
  temperature?: number
  model?: string
  stream?: boolean
  mode?: 'chat' | 'suggestions'
}

export const v1Api = {
  chatCompletions: async function* (
    options: V1ChatCompletionOptions,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    let token = localStorage.getItem('user_token')
    
    const response = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        messages: options.messages,
        temperature: options.temperature,
        model: options.model,
        stream: true,
        mode: options.mode || 'chat'
      }),
      signal
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('user_token')
        localStorage.removeItem('user_data')
        eventBus.emit('user-logout')
        eventBus.emit('auth-error', { type: 'user-only', message: '登录已过期，请重新登录' })
      }
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch (e) {
        // ignore
      }
      throw new Error(errorMessage)
    }
    
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    if (!reader) return

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
              if (parsed.content) yield parsed.content
              if (parsed.error) throw new Error(parsed.error)
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  },

  chatCompletion: async (options: V1ChatCompletionOptions): Promise<string> => {
    let token = localStorage.getItem('user_token')
    
    const response = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        messages: options.messages,
        temperature: options.temperature,
        model: options.model,
        stream: false,
        mode: options.mode || 'suggestions'
      })
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('user_token')
        localStorage.removeItem('user_data')
        eventBus.emit('user-logout')
        eventBus.emit('auth-error', { type: 'user-only', message: '登录已过期，请重新登录' })
      }
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch (e) {
        // ignore
      }
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }
}

export interface SyncStatus {
  totalLimit: number
  dailyLimit: number
  totalUsed: number
  dailyUsed: number
  remainingTotal: number
  remainingDaily: number
  activeSync?: {
    syncId: string
    syncCode: string
    characterName: string
    createdAt: string
    expiresAt: string
  }
}

export interface UploadResult {
  success: boolean
  syncId: string
  syncCode: string
  expiresAt: string
  remainingCount: number
}

export interface DownloadResult {
  success: boolean
  characterId: string
  characterName: string
  messages: Message[]
  messageCount: number
}

export const chatSyncApi = {
  upload: (characterId: string, characterName: string, messages: Message[]) =>
    api.post<UploadResult>('/chat-sync/upload', { characterId, characterName, messages }),
  
  download: (syncCode: string) =>
    api.post<DownloadResult>('/chat-sync/download', { syncCode: syncCode.toUpperCase() }),
  
  getStatus: () => api.get<SyncStatus>('/chat-sync/status'),
  
  cancel: () => api.delete<{ success: boolean }>('/chat-sync/cancel')
}
