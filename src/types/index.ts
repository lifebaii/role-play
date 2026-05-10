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
  spec_version?: string | number
  data?: CharacterData
  role_play?: RolePlayMeta
  
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
  createdAt?: number
  userId?: string
  shared?: boolean
  originalUserId?: string
  originalId?: string
  likeCount?: number
  liked?: boolean
  isFriend?: boolean
  isOfficial?: boolean
  thumbnailUrl?: string
  sourceUrl?: string
  quota?: number
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
  id: string
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
  id: string
  name: string
  provider: string
  api_key: string
  api_url: string
  default_model: string
  is_default: boolean
  available_models?: { id: string; name: string }[]
  selected_models?: string[]
  // key是原始模型ID，value是该模型的别名数组
  model_id_mapping?: Record<string, string[]>
}

export interface CustomModelConfig {
  provider: 'openai' | 'anthropic' | string
  api_key: string
  api_url: string
  default_model: string
}

export interface CharactersResponse {
  characters: Character[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  isOwner: boolean
  isCreator: boolean
  anonymousId: string
}

export interface FriendCharacter {
  id: string
  name: string
  avatar?: string
  description?: string
  first_mes?: string
  personality?: string
  scenario?: string
  system_prompt?: string
  shared?: boolean
  originalId?: string
  likeCount?: number
  liked?: boolean
}

export interface RegexScript {
  id?: string
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

export interface AdminSettings {
  registrationEnabled?: boolean
  defaultQuota?: number
  githubAuthEnabled?: boolean
  gitSyncEnabled?: boolean
  gitSyncRepo?: string
  gitSyncBranch?: string
  gitSyncPath?: string
  newUserQuota?: number
  signinMinQuota?: number
  signinMaxQuota?: number
  chatQuotaCost?: number
  suggestionQuotaCost?: number
  maxUserCharacters?: number
  maxCharacterSize?: number
  maxCommentsPerUserPerCharacter?: number
  chatSyncTotalLimit?: number
  chatSyncDailyLimit?: number
}

export interface WorldInfoEntry {
  uid: string
  key: string
  keysecondary?: string
  keylogic?: string
  comment?: string
  content: string
  enabled: boolean
  position?: string
  insertion_order?: number
  selective?: boolean
  keys?: string[]
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

export interface UploadResult {
  success: boolean
  syncId: string
  syncCode: string
  expiresAt: string
  remainingCount: number
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
