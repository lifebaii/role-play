import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbSet, dbGet } from '@/utils/db'

export interface UserWorldInfo {
  id: string
  comment: string
  keys: string[]
  secondary_keys: string[]
  content: string
  enabled: boolean
  position: string
  depth: number
  order: number
  useRegex: boolean
  matchWholeWords: boolean
  caseSensitive: boolean
  scanDepth?: number
  probability: number
  useProbability: boolean
  selectiveLogic: number
  group: string
  groupWeight: number
  constant: boolean
  preferential: boolean
  sticky: number
  cooldown: number
  delay: number
  excludeRecursion: boolean
  preventRecursion: boolean
  delayUntilRecursion: boolean
}

export interface UserPreset {
  id: string
  name: string
  content: string
  enabled: boolean
  order: number
}

export interface UserRegexScript {
  id: string
  name: string
  regex: string
  replacement: string
  enabled: boolean
  flags: string
  promptOnly: boolean
  markdownOnly: boolean
  placement: number[]
  minDepth?: number
  maxDepth?: number
}

export interface UserData {
  worldInfo: UserWorldInfo[]
  presets: UserPreset[]
  regexScripts: UserRegexScript[]
}

const STORAGE_KEY = 'role_play_user_data'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function getDefaultWorldInfo(): Omit<UserWorldInfo, 'id'> {
  return {
    comment: '',
    keys: [],
    secondary_keys: [],
    content: '',
    enabled: true,
    position: 'at_depth',
    depth: 4,
    order: 100,
    useRegex: false,
    matchWholeWords: false,
    caseSensitive: false,
    probability: 100,
    useProbability: false,
    selectiveLogic: 0,
    group: '',
    groupWeight: 1,
    constant: false,
    preferential: false,
    sticky: 0,
    cooldown: 0,
    delay: 0,
    excludeRecursion: false,
    preventRecursion: false,
    delayUntilRecursion: false
  }
}

function getDefaultPreset(): Omit<UserPreset, 'id'> {
  return {
    name: '',
    prompt: '',
    enabled: true,
    order: 100
  }
}

function getDefaultRegexScript(): Omit<UserRegexScript, 'id'> {
  return {
    name: '',
    regex: '',
    replacement: '',
    enabled: true,
    flags: 'g',
    promptOnly: false,
    markdownOnly: false,
    placement: [1, 2]
  }
}

async function loadFromStorage(): Promise<UserData> {
  try {
    const saved = await dbGet<UserData>(STORAGE_KEY)
    if (saved) {
      return {
        worldInfo: saved.worldInfo || [],
        presets: saved.presets || [],
        regexScripts: saved.regexScripts || []
      }
    }
    const lsData = localStorage.getItem(STORAGE_KEY)
    if (lsData) {
      const parsed = JSON.parse(lsData)
      const data: UserData = {
        worldInfo: parsed.worldInfo || [],
        presets: parsed.presets || [],
        regexScripts: parsed.regexScripts || []
      }
      await dbSet(STORAGE_KEY, data)
      return data
    }
  } catch (e) {
    console.error('Failed to load user data from storage:', e)
  }
  return {
    worldInfo: [],
    presets: [],
    regexScripts: []
  }
}

async function saveToStorage(data: UserData): Promise<void> {
  try {
    await dbSet(STORAGE_KEY, data)
  } catch (e) {
    console.error('Failed to save user data to storage:', e)
  }
}

export const useUserDataStore = defineStore('userData', () => {
  const worldInfo = ref<UserWorldInfo[]>([])
  const presets = ref<UserPreset[]>([])
  const regexScripts = ref<UserRegexScript[]>([])
  const isLoaded = ref(false)

  const enabledWorldInfo = computed(() =>
    worldInfo.value.filter(w => w.enabled)
  )

  const enabledPresets = computed(() =>
    presets.value.filter(p => p.enabled).sort((a, b) => a.order - b.order)
  )

  const enabledRegexScripts = computed(() =>
    regexScripts.value.filter(r => r.enabled)
  )

  async function load() {
    if (isLoaded.value) return
    const data = await loadFromStorage()
    worldInfo.value = data.worldInfo
    presets.value = data.presets
    regexScripts.value = data.regexScripts
    isLoaded.value = true
  }

  function _save() {
    saveToStorage({
      worldInfo: worldInfo.value,
      presets: presets.value,
      regexScripts: regexScripts.value
    })
  }

  function addWorldInfo(data?: Partial<UserWorldInfo>): UserWorldInfo {
    const newEntry: UserWorldInfo = {
      id: generateId(),
      ...getDefaultWorldInfo(),
      ...data
    }
    worldInfo.value.push(newEntry)
    _save()
    return newEntry
  }

  function updateWorldInfo(id: string, data: Partial<UserWorldInfo>): boolean {
    const index = worldInfo.value.findIndex(w => w.id === id)
    if (index !== -1) {
      worldInfo.value[index] = { ...worldInfo.value[index], ...data }
      _save()
      return true
    }
    return false
  }

  function removeWorldInfo(id: string): boolean {
    const index = worldInfo.value.findIndex(w => w.id === id)
    if (index !== -1) {
      worldInfo.value.splice(index, 1)
      _save()
      return true
    }
    return false
  }

  function toggleWorldInfo(id: string): boolean {
    const entry = worldInfo.value.find(w => w.id === id)
    if (entry) {
      entry.enabled = !entry.enabled
      _save()
      return true
    }
    return false
  }

  function addPreset(data?: Partial<UserPreset>): UserPreset {
    const newPreset: UserPreset = {
      id: generateId(),
      ...getDefaultPreset(),
      ...data
    }
    presets.value.push(newPreset)
    _save()
    return newPreset
  }

  function updatePreset(id: string, data: Partial<UserPreset>): boolean {
    const index = presets.value.findIndex(p => p.id === id)
    if (index !== -1) {
      presets.value[index] = { ...presets.value[index], ...data }
      _save()
      return true
    }
    return false
  }

  function removePreset(id: string): boolean {
    const index = presets.value.findIndex(p => p.id === id)
    if (index !== -1) {
      presets.value.splice(index, 1)
      _save()
      return true
    }
    return false
  }

  function togglePreset(id: string): boolean {
    const preset = presets.value.find(p => p.id === id)
    if (preset) {
      preset.enabled = !preset.enabled
      _save()
      return true
    }
    return false
  }

  function addRegexScript(data?: Partial<UserRegexScript>): UserRegexScript {
    const newScript: UserRegexScript = {
      id: generateId(),
      ...getDefaultRegexScript(),
      ...data
    }
    regexScripts.value.push(newScript)
    _save()
    return newScript
  }

  function updateRegexScript(id: string, data: Partial<UserRegexScript>): boolean {
    const index = regexScripts.value.findIndex(r => r.id === id)
    if (index !== -1) {
      regexScripts.value[index] = { ...regexScripts.value[index], ...data }
      _save()
      return true
    }
    return false
  }

  function removeRegexScript(id: string): boolean {
    const index = regexScripts.value.findIndex(r => r.id === id)
    if (index !== -1) {
      regexScripts.value.splice(index, 1)
      _save()
      return true
    }
    return false
  }

  function toggleRegexScript(id: string): boolean {
    const script = regexScripts.value.find(r => r.id === id)
    if (script) {
      script.enabled = !script.enabled
      _save()
      return true
    }
    return false
  }

  function reorderWorldInfo(oldIndex: number, newIndex: number): void {
    const item = worldInfo.value.splice(oldIndex, 1)[0]
    worldInfo.value.splice(newIndex, 0, item)
    _save()
  }

  function reorderPresets(oldIndex: number, newIndex: number): void {
    const item = presets.value.splice(oldIndex, 1)[0]
    presets.value.splice(newIndex, 0, item)
    presets.value.forEach((p, i) => p.order = i)
    _save()
  }

  function reorderRegexScripts(oldIndex: number, newIndex: number): void {
    const item = regexScripts.value.splice(oldIndex, 1)[0]
    regexScripts.value.splice(newIndex, 0, item)
    _save()
  }

  function importData(data: Partial<UserData>): void {
    if (data.worldInfo) {
      worldInfo.value = data.worldInfo.map(w => ({
        ...getDefaultWorldInfo(),
        ...w,
        id: w.id || generateId()
      }))
    }
    if (data.presets) {
      presets.value = data.presets.map(p => ({
        ...getDefaultPreset(),
        ...p,
        id: p.id || generateId()
      }))
    }
    if (data.regexScripts) {
      regexScripts.value = data.regexScripts.map(r => ({
        ...getDefaultRegexScript(),
        ...r,
        id: r.id || generateId()
      }))
    }
    _save()
  }

  function exportData(): UserData {
    return {
      worldInfo: [...worldInfo.value],
      presets: [...presets.value],
      regexScripts: [...regexScripts.value]
    }
  }

  function clearAll(): void {
    worldInfo.value = []
    presets.value = []
    regexScripts.value = []
    _save()
  }

  return {
    worldInfo,
    presets,
    regexScripts,
    enabledWorldInfo,
    enabledPresets,
    enabledRegexScripts,
    isLoaded,
    load,
    addWorldInfo,
    updateWorldInfo,
    removeWorldInfo,
    toggleWorldInfo,
    addPreset,
    updatePreset,
    removePreset,
    togglePreset,
    addRegexScript,
    updateRegexScript,
    removeRegexScript,
    toggleRegexScript,
    reorderWorldInfo,
    reorderPresets,
    reorderRegexScripts,
    importData,
    exportData,
    clearAll
  }
})
