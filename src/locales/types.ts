export interface CommonMessages {
  confirm: string
  cancel: string
  save: string
  delete: string
  edit: string
  create: string
  import: string
  export: string
  search: string
  loading: string
  loadingText: string
  noData: string
  success: string
  error: string
  close: string
  back: string
  next: string
  previous: string
  previousPage: string
  nextPage: string
  goToPage: string
  submit: string
  reset: string
  clear: string
  copy: string
  copied: string
  download: string
  upload: string
  select: string
  selectAll: string
  deselectAll: string
  more: string
  less: string
  show: string
  hide: string
  enable: string
  disable: string
  enabled: string
  disabled: string
  yes: string
  no: string
  or: string
  and: string
  required: string
  optional: string
  default: string
  custom: string
  name: string
  description: string
  type: string
  status: string
  action: string
  details: string
  view: string
  manage: string
  settings: string
  help: string
  about: string
  version: string
  update: string
  saving: string
  pleaseWait: string
  importSuccess: string
  importError: string
  noDataToExport: string
  deleteConfirm: string
  deletePresetConfirm: string
  deleteWorldInfoConfirm: string
  deleteRegexConfirm: string
  noValidPresetData: string
  noValidWorldInfoData: string
  noValidRegexData: string
  noValidData: string
  perPage: string
  items: string
}

export interface SidebarMessages {
  title: string
  friendsList: string
  create: string
  add: string
  import: string
  noFriends: string
  collapse: string
  close: string
  openSidebar: string
  colorMode: {
    light: string
    dark: string
    system: string
  }
}

export interface ChatMessages {
  startStory: string
  selectCharacter: string
  viewCharacters: string
  hideCharacters: string
  unknownCharacter: string
  replying: string
  noDescription: string
  selectService: string
  selectModel: string
  builtinService: string
  unnamedConfig: string
  manageConfig: string
  loadingModels: string
  sendMessage: string
  inputPlaceholder: string
  newChat: string
  clearChat: string
  exportChat: string
  importChat: string
  deleteChat: string
  chatHistory: string
  noMessages: string
  regenerate: string
  continue: string
  stop: string
  retry: string
  copyMessage: string
  deleteMessage: string
  editMessage: string
  tokenCount: string
  contextSize: string
  streamingEnabled: string
  streamingDisabled: string
  autoScroll: string
  showTimestamps: string
  sendOnEnter: string
  suggestions: string
  refreshSuggestions: string
  autoFetchSuggestions: string
  parseCachedUserCharactersFailed: string
  loadOriginalCharacterFailed: string
  updateToServerSuccess: string
  updateToServerFailed: string
  updateFromServerFailed: string
  saveFailed: string
  importCharactersSuccess: string
  importCharactersPartialFail: string
  importCharactersFailed: string
  viewCharacterDetailFailed: string
  loadCharacterInfoFailed: string
  deleteMessageConfirm: string
  generateGreetingFailed: string
  clearChatConfirm: string
  exportChatFailed: string
  importChatSuccess: string
  importChatFailed: string
  completeCustomModelConfig: string
  loginFirstForBuiltinModel: string
  selectModelFirst: string
  generateSuggestionsPrompt: string
  guest: string
  removeFriendFailed: string
  signinFailed: string
  welcomeMessage: string
  modelConfig: string
  apiConfig: string
  historyTruncatedForSuggestions: string
  historyTruncatedForChat: string
  menu: {
    newChat: string
    export: string
    import: string
    clear: string
    loadMore: string
    settings: string
    characterInfo: string
    worldInfo: string
    authorNote: string
    quickReplies: string
    sprites: string
    groupChat: string
  }
}

export interface CharacterMessages {
  createCharacter: string
  editCharacter: string
  deleteCharacter: string
  characterInfo: string
  characterName: string
  characterDescription: string
  characterPersonality: string
  characterScenario: string
  characterGreeting: string
  characterAvatar: string
  characterTags: string
  characterCreator: string
  characterVersion: string
  characterNotes: string
  worldInfo: string
  regexScripts: string
  alternateGreetings: string
  characterBook: string
  extensions: string
  importCharacter: string
  exportCharacter: string
  exportFormats: {
    json: string
    png: string
    tavern: string
  }
  noCharacters: string
  characterCreated: string
  characterUpdated: string
  characterDeleted: string
  confirmDelete: string
  uploadAvatar: string
  changeAvatar: string
  removeAvatar: string
  avatarUploadError: string
  nameRequired: string
  namePlaceholder: string
  descriptionPlaceholder: string
  personalityPlaceholder: string
  scenarioPlaceholder: string
  greetingPlaceholder: string
  tagsPlaceholder: string
  notesPlaceholder: string
  liked: string
  like: string
  loadingCharacter: string
  editImage: string
  share: string
  cannotExportOnline: string
  deleting: string
  downloading: string
  download: string
  downloadShareCancelled: string
  uploading: string
  upload: string
  fromShare: string
  shared: string
  private: string
  loadingCharacterInfo: string
  notOwner: string
  shareConfirm: string
  cannotGetCharacterData: string
  updateShareFailed: string
  imageEditor: {
    title: string
    previewImage: string
    noImage: string
    imageSource: string
    jsonSource: string
    replaceImage: string
    uploadImage: string
    clearSelection: string
    selected: string
    convertToPng: string
    embedCharacterData: string
    cancel: string
    saving: string
    saveImage: string
    pleaseSelectImage: string
    saveFailed: string
  }
}

export interface SettingsMessages {
  title: string
  language: string
  theme: string
  general: string
  chat: string
  ui: string
  advanced: string
  generalSettings: {
    title: string
    language: string
    languageHint: string
    autoSave: string
    autoSaveInterval: string
    confirmDelete: string
  }
  chatSettings: {
    title: string
    sendOnEnter: string
    autoScroll: string
    showTimestamps: string
    showTokenCount: string
    maxContextSize: string
    streaming: string
  }
  uiSettings: {
    title: string
    fontScale: string
    blurStrength: string
    avatarStyle: string
    avatarStyles: {
      round: string
      square: string
      hidden: string
    }
    chatDisplay: string
    chatDisplays: {
      bubbles: string
      flat: string
    }
    showCharacterName: string
  }
  advancedSettings: {
    title: string
    debugMode: string
    verboseLogging: string
    maxBackupCount: string
    exportFormat: string
    exportFormats: {
      json: string
      jsonl: string
    }
  }
  resetToDefaults: string
  exportSettings: string
  importSettings: string
  settingsExported: string
  settingsImported: string
  settingsReset: string
}

export interface AuthMessages {
  login: string
  logout: string
  register: string
  loginWithGithub: string
  loginAsGuest: string
  username: string
  password: string
  confirmPassword: string
  email: string
  forgotPassword: string
  noAccount: string
  hasAccount: string
  loginSuccess: string
  logoutSuccess: string
  registerSuccess: string
  loginError: string
  registerError: string
  invalidCredentials: string
  passwordMismatch: string
  usernameRequired: string
  passwordRequired: string
  emailRequired: string
  authenticating: string
  welcomeBack: string
  hello: string
  guest: string
  loginFirst: string
}

export interface UserMessages {
  profile: string
  settings: string
  quota: string
  quotaHint: string
  characterLimit: string
  baseLimit: string
  bonusSlots: string
  totalLikes: string
  signin: string
  signinReward: string
  alreadySignedIn: string
  editName: string
  namePlaceholder: string
  nameNotSet: string
  remainingQuota: string
  dailySignin: string
  signinSuccess: string
  user: string
}

export interface ModelMessages {
  title: string
  customModelConfig: string
  modelConfigShort: string
  configList: string
  configDetails: string
  addConfig: string
  addNewConfig: string
  unnamedConfig: string
  default: string
  active: string
  notConfigured: string
  enableCustomModel: string
  configName: string
  configNamePlaceholder: string
  provider: string
  openaiCompatible: string
  apiUrl: string
  apiKey: string
  model: string
  searchOrSelectModel: string
  fetchModels: string
  useThisConfig: string
  duplicateConfig: string
  deleteConfig: string
  selectOrCreateConfig: string
  tip: string
  loginTip: string
  close: string
  addModel: string
  editModel: string
  deleteModel: string
  modelName: string
  apiEndpoint: string
  defaultModel: string
  modelList: string
  refreshModels: string
  noModels: string
  modelAdded: string
  modelUpdated: string
  modelDeleted: string
  testConnection: string
  connectionSuccess: string
  connectionFailed: string
  apiKeyHint: string
  endpointHint: string
  isDefault: string
  customModel: string
  builtinModel: string
}

export interface WorldInfoMessages {
  title: string
  addEntry: string
  editEntry: string
  deleteEntry: string
  newEntry: string
  key: string
  keys: string
  keysHint: string
  comment: string
  commentPlaceholder: string
  secondaryKeys: string
  secondaryKeysHint: string
  secondaryKeysPlaceholder: string
  content: string
  contentPlaceholder: string
  contentHint: string
  enabled: string
  disabled: string
  useRegex: string
  caseSensitive: string
  matchWholeWords: string
  useProbability: string
  probability: string
  depth: string
  depthHint: string
  scanDepth: string
  scanDepthHint: string
  scanDepthPlaceholder: string
  position: string
  positions: {
    systemTop: string
    globalNote: string
    beforeChar: string
    afterChar: string
    atDepth: string
    userTop: string
    assistantTop: string
    beforeExample: string
    afterExample: string
    atTop: string
    atBottom: string
  }
  order: string
  orderPlaceholder: string
  characters: string
  setConstant: string
  isConstant: string
  constantTitle: string
  systemPromptGroup: string
  inChatGroup: string
  advancedSettings: string
  logicFilter: string
  logicOptions: {
    andAny: string
    andAll: string
    notAny: string
    notAll: string
  }
  group: string
  groupPlaceholder: string
  groupWeight: string
  groupWeightPlaceholder: string
  preferential: string
  timeControl: string
  sticky: string
  cooldown: string
  delay: string
  otherSettings: string
  excludeRecursion: string
  preventRecursion: string
  delayUntilRecursion: string
  customScanDepth: string
  noEntries: string
  entryCreated: string
  entryUpdated: string
  entryDeleted: string
  importWorldInfo: string
  exportWorldInfo: string
  globalWorldInfo: string
  characterWorldInfo: string
  constant: string
  saveEntry: string
}

export interface RegexMessages {
  title: string
  addScript: string
  editScript: string
  deleteScript: string
  scriptName: string
  findRegex: string
  replaceString: string
  replaceStringHint: string
  testScript: string
  testInput: string
  testOutput: string
  noScripts: string
  scriptCreated: string
  scriptUpdated: string
  scriptDeleted: string
  importScript: string
  exportScript: string
  globalScripts: string
  characterScripts: string
  applyTo: string
  applyToOptions: {
    userMessage: string
    aiMessage: string
    slashCommand: string
    worldInfo: string
  }
  newScript: string
  editRegexScript: string
  scriptNamePlaceholder: string
  regex: string
  regexPlaceholder: string
  replacementPlaceholder: string
  advancedOptions: string
  placement: string
  placementUser: string
  placementAi: string
  markdownOnly: string
  promptOnly: string
  minDepth: string
  maxDepth: string
  noLimit: string
  saveScript: string
  cancel: string
}

export interface PresetMessages {
  title: string
  addPreset: string
  editPreset: string
  deletePreset: string
  presetName: string
  systemPrompt: string
  systemPromptHint: string
  userPrompt: string
  userPromptHint: string
  aiPrompt: string
  aiPromptHint: string
  noPresets: string
  presetCreated: string
  presetUpdated: string
  presetDeleted: string
  importPreset: string
  exportPreset: string
  globalPresets: string
  userPresets: string
  newPreset: string
  presetContent: string
  presetNamePlaceholder: string
  presetContentPlaceholder: string
  characters: string
  sortOrder: string
  sortOrderHint: string
  enablePreset: string
  savePreset: string
}

export interface GroupChatMessages {
  title: string
  createGroup: string
  editGroup: string
  deleteGroup: string
  groupName: string
  groupDescription: string
  addMember: string
  removeMember: string
  members: string
  noMembers: string
  noGroups: string
  activationStrategy: string
  activationStrategies: {
    random: string
    roundRobin: string
    natural: string
    list: string
  }
  autoReply: string
  groupCreated: string
  groupUpdated: string
  groupDeleted: string
}

export interface AuthorNoteMessages {
  title: string
  content: string
  contentHint: string
  depth: string
  depthHint: string
  frequency: string
  frequencyHint: string
  position: string
  enabled: string
  disabled: string
  noAuthorNote: string
  authorNoteSaved: string
}

export interface QuickReplyMessages {
  title: string
  addReply: string
  editReply: string
  deleteReply: string
  replyName: string
  replyContent: string
  replyContentHint: string
  noReplies: string
  replyCreated: string
  replyUpdated: string
  replyDeleted: string
  groups: string
  addGroup: string
  editGroup: string
  deleteGroup: string
  groupName: string
  noGroups: string
}

export interface SpriteMessages {
  title: string
  addSprite: string
  deleteSprite: string
  spriteName: string
  spriteImage: string
  noSprites: string
  importZip: string
  exportZip: string
  spriteAdded: string
  spriteDeleted: string
  setAsDefault: string
  isDefault: string
}

export interface ErrorMessages {
  generic: string
  network: string
  unauthorized: string
  forbidden: string
  notFound: string
  serverError: string
  validation: string
  fileTooLarge: string
  invalidFormat: string
  importFailed: string
  exportFailed: string
  saveFailed: string
  loadFailed: string
  deleteFailed: string
  uploadFailed: string
  downloadFailed: string
  connectionFailed: string
  timeout: string
  rateLimited: string
  quotaExceeded: string
  characterLimitReached: string
  somethingWentWrong: string
  tryAgain: string
  contactSupport: string
  fetchCharacterFailed: string
}

export interface SuccessMessages {
  saved: string
  deleted: string
  updated: string
  created: string
  imported: string
  exported: string
  uploaded: string
  downloaded: string
  copied: string
  sent: string
  cleared: string
  reset: string
  connected: string
  disconnected: string
  operationComplete: string
}

export interface AdminMessages {
  title: string
  dashboard: string
  characters: string
  models: string
  presets: string
  worldInfo: string
  regex: string
  users: string
  settings: string
  optimizationPresets: string
  fileSystem: string
  login: string
  password: string
  loginButton: string
  logout: string
  welcome: string
  totalCharacters: string
  totalUsers: string
  totalChats: string
  storageUsed: string
  recentActivity: string
  noRecentActivity: string
  systemStatus: string
  systemHealth: string
  uptime: string
  version: string
  lastBackup: string
  backupNow: string
  restoreBackup: string
  viewLogs: string
  clearCache: string
  maintenanceMode: string
  enableMaintenance: string
  disableMaintenance: string
}

export interface FriendsMessages {
  title: string
  addFriend: string
  removeFriend: string
  friendCode: string
  friendCodeHint: string
  yourFriendCode: string
  copyFriendCode: string
  noFriends: string
  friendAdded: string
  friendRemoved: string
  friendNotFound: string
  alreadyFriend: string
  friendInfo: string
  lastActive: string
  sharedCharacters: string
  noSharedCharacters: string
  acceptRequest: string
  rejectRequest: string
  pendingRequests: string
  sentRequests: string
  noPendingRequests: string
  noSentRequests: string
  addFriendTitle: string
  recallFriends: string
  searchCharacterPlaceholder: string
  sortUpdatedAt: string
  sortQuotaDesc: string
  sortLikeCount: string
  sortCommentCount: string
  sortCreatedAt: string
  sortQuotaAsc: string
  noCharacters: string
  noCharactersHint: string
  alreadyAdded: string
  invalidCharacterId: string
  addSuccess: string
  operationFailed: string
  myCharactersTitle: string
  noUserCharactersHint: string
  alreadyRecalled: string
  recallSuccess: string
}

export interface SyncMessages {
  title: string
  syncNow: string
  syncStatus: string
  lastSync: string
  neverSynced: string
  syncing: string
  syncComplete: string
  syncFailed: string
  syncConflict: string
  resolveConflict: string
  useLocal: string
  useRemote: string
  merge: string
  autoSync: string
  syncInterval: string
  syncSettings: string
  syncHistory: string
  clearSyncData: string
  chatSyncModalTitle: string
  remainingDailyDownloads: string
  bonusDownloads: string
  upload: string
  download: string
  uploadDescription: string
  generatingSyncCode: string
  syncCode: string
  copySyncCode: string
  copied: string
  syncCodeExpires: string
  regenerate: string
  syncCodePlaceholder: string
  downloadDescription: string
  downloading: string
  downloadLimitReached: string
  confirmOverwrite: string
  confirmOverwriteDescription: string
  confirm: string
  cancel: string
  activeSync: string
  syncCodeLabel: string
  characterName: string
  downloadedTimes: string
  expiresAt: string
  cancelSync: string
  downloadSuccess: string
  syncCancelled: string
  userDataSyncModalTitle: string
  userDataUploadDescription: string
  currentData: string
  userDataCurrentData: string
  userDataSyncCodeExpires: string
  userDataDownloadDescription: string
  userDataConfirmOverwriteDescription: string
  userDataDownloadSuccess: string
  userDataActiveSyncData: string
}

export interface CommentMessages {
  title: string
  commentCount: string
  noComments: string
  fromOriginalCharacter: string
  originalDataHint: string
  placeholder: string
  send: string
  noCommentsYet: string
  me: string
  creator: string
  deleteComment: string
  loading: string
  loadMore: string
  sendFailed: string
  deleteConfirm: string
  timeJustNow: string
  timeMinutesAgo: string
  timeHoursAgo: string
  timeDaysAgo: string
}

export interface AboutMessages {
  title: string
  description: string
  version: string
  author: string
  license: string
  repository: string
  documentation: string
  reportBug: string
  requestFeature: string
  credits: string
  madeWith: string
  specialThanks: string
  thirdParty: string
  privacyPolicy: string
  termsOfService: string
  contact: string
  features: {
    immersiveChat: string
    customCharacter: string
    shareWithFriends: string
    themeSwitch: string
  }
  githubRepo: string
}

export interface LocaleMessages {
  common: CommonMessages
  sidebar: SidebarMessages
  chat: ChatMessages
  character: CharacterMessages
  settings: SettingsMessages
  auth: AuthMessages
  user: UserMessages
  model: ModelMessages
  worldInfo: WorldInfoMessages
  regex: RegexMessages
  preset: PresetMessages
  groupChat: GroupChatMessages
  authorNote: AuthorNoteMessages
  quickReply: QuickReplyMessages
  sprite: SpriteMessages
  error: ErrorMessages
  success: SuccessMessages
  admin: AdminMessages
  friends: FriendsMessages
  sync: SyncMessages
  about: AboutMessages
  comment: CommentMessages
}

export type SupportedLocale = 'zh-CN' | 'en-US'

export interface LocaleOption {
  code: SupportedLocale
  name: string
  nativeName: string
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'zh-CN', name: 'Chinese Simplified', nativeName: '简体中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
]
