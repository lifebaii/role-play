import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbSet, dbGet } from '@/utils/db'
import { saveBackupRecord, getBackupsByType, deleteBackupRecord, type BackupRecord } from '@/utils/db'

export interface AppSettings {
  general: GeneralSettings
  chat: ChatSettings
  ui: UiSettings
  advanced: AdvancedSettings
}

export interface GeneralSettings {
  language: string
  auto_save: boolean
  auto_save_interval: number
  confirm_delete: boolean
}

export interface ChatSettings {
  send_on_enter: boolean
  auto_scroll: boolean
  show_timestamps: boolean
  show_token_count: boolean
  max_context_size: number
  streaming: boolean
}

export interface UiSettings {
  font_scale: number
  blur_strength: number
  avatar_style: 'round' | 'square' | 'hidden'
  chat_display: 'bubbles' | 'flat'
  show_character_name: boolean
}

export interface AdvancedSettings {
  debug_mode: boolean
  verbose_logging: boolean
  max_backup_count: number
  export_format: 'json' | 'jsonl'
}

const SETTINGS_KEY = 'app_settings'

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    language: 'zh-CN',
    auto_save: true,
    auto_save_interval: 30,
    confirm_delete: true,
  },
  chat: {
    send_on_enter: true,
    auto_scroll: true,
    show_timestamps: true,
    show_token_count: true,
    max_context_size: 128000,
    streaming: true,
  },
  ui: {
    font_scale: 1,
    blur_strength: 10,
    avatar_style: 'round',
    chat_display: 'bubbles',
    show_character_name: true,
  },
  advanced: {
    debug_mode: false,
    verbose_logging: false,
    max_backup_count: 50,
    export_format: 'json',
  },
}

async function loadSettings(): Promise<AppSettings> {
  const data = await dbGet<AppSettings>(SETTINGS_KEY)
  if (data) {
    return {
      general: { ...DEFAULT_SETTINGS.general, ...data.general },
      chat: { ...DEFAULT_SETTINGS.chat, ...data.chat },
      ui: { ...DEFAULT_SETTINGS.ui, ...data.ui },
      advanced: { ...DEFAULT_SETTINGS.advanced, ...data.advanced },
    }
  }
  return { ...DEFAULT_SETTINGS }
}

async function saveSettings(settings: AppSettings): Promise<void> {
  await dbSet(SETTINGS_KEY, settings)
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS })
  const isLoaded = ref(false)

  const general = computed(() => settings.value.general)
  const chat = computed(() => settings.value.chat)
  const ui = computed(() => settings.value.ui)
  const advanced = computed(() => settings.value.advanced)

  async function load() {
    if (isLoaded.value) return
    settings.value = await loadSettings()
    isLoaded.value = true
  }

  function _save() {
    saveSettings(settings.value)
  }

  function updateGeneral(data: Partial<GeneralSettings>): void {
    settings.value.general = { ...settings.value.general, ...data }
    _save()
  }

  function updateChat(data: Partial<ChatSettings>): void {
    settings.value.chat = { ...settings.value.chat, ...data }
    _save()
  }

  function updateUi(data: Partial<UiSettings>): void {
    settings.value.ui = { ...settings.value.ui, ...data }
    _save()
  }

  function updateAdvanced(data: Partial<AdvancedSettings>): void {
    settings.value.advanced = { ...settings.value.advanced, ...data }
    _save()
  }

  function resetToDefaults(): void {
    settings.value = { ...DEFAULT_SETTINGS }
    _save()
  }

  async function createSnapshot(label?: string): Promise<BackupRecord> {
    const now = Date.now()
    const record: BackupRecord = {
      id: `settings_snapshot_${now}`,
      type: 'settings',
      data: JSON.parse(JSON.stringify(settings.value)),
      createdAt: now,
      label: label || `Settings snapshot - ${new Date(now).toLocaleString()}`,
    }
    await saveBackupRecord(record)
    return record
  }

  async function listSnapshots(): Promise<BackupRecord[]> {
    const snapshots = await getBackupsByType('settings')
    return snapshots.sort((a, b) => b.createdAt - a.createdAt)
  }

  async function restoreSnapshot(id: string): Promise<boolean> {
    const snapshot = await dbGet<BackupRecord>(id)
    if (!snapshot || snapshot.type !== 'settings') return false

    settings.value = {
      ...DEFAULT_SETTINGS,
      ...snapshot.data,
    }
    _save()
    return true
  }

  async function deleteSnapshot(id: string): Promise<void> {
    await deleteBackupRecord(id)
  }

  function exportSettings(): string {
    return JSON.stringify(settings.value, null, 2)
  }

  async function importSettings(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString)
      settings.value = {
        general: { ...DEFAULT_SETTINGS.general, ...data.general },
        chat: { ...DEFAULT_SETTINGS.chat, ...data.chat },
        ui: { ...DEFAULT_SETTINGS.ui, ...data.ui },
        advanced: { ...DEFAULT_SETTINGS.advanced, ...data.advanced },
      }
      _save()
      return true
    } catch {
      return false
    }
  }

  return {
    settings,
    isLoaded,
    general,
    chat,
    ui,
    advanced,
    load,
    updateGeneral,
    updateChat,
    updateUi,
    updateAdvanced,
    resetToDefaults,
    createSnapshot,
    listSnapshots,
    restoreSnapshot,
    deleteSnapshot,
    exportSettings,
    importSettings,
  }
})
