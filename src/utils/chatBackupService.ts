import { saveBackupRecord, getBackupsByType, deleteBackupRecord, type BackupRecord } from './db'
import { dbGet, dbSet } from './db'

const MAX_BACKUPS = 50
const BACKUP_THROTTLE_MS = 10000

let lastBackupTime = 0

function generateBackupId(type: string, sourceId: string): string {
  return `${type}_${sourceId}_${Date.now()}`
}

async function createChatBackup(
  characterId: string,
  messages: any[],
  metadata?: Record<string, any>,
  label?: string
): Promise<BackupRecord> {
  const now = Date.now()
  const id = generateBackupId('chat', characterId)

  const record: BackupRecord = {
    id,
    type: 'chat',
    data: {
      characterId,
      messages,
      metadata,
      messageCount: messages.length,
    },
    createdAt: now,
    label: label || `Chat backup - ${new Date(now).toLocaleString()}`,
  }

  await saveBackupRecord(record)
  await pruneOldBackups('chat', MAX_BACKUPS)

  return record
}

async function createSettingsBackup(settings: any, label?: string): Promise<BackupRecord> {
  const now = Date.now()
  const id = generateBackupId('settings', 'global')

  const record: BackupRecord = {
    id,
    type: 'settings',
    data: settings,
    createdAt: now,
    label: label || `Settings backup - ${new Date(now).toLocaleString()}`,
  }

  await saveBackupRecord(record)
  await pruneOldBackups('settings', 10)

  return record
}

async function throttledChatBackup(
  characterId: string,
  messages: any[],
  metadata?: Record<string, any>
): Promise<BackupRecord | null> {
  const now = Date.now()
  if (now - lastBackupTime < BACKUP_THROTTLE_MS) {
    return null
  }
  lastBackupTime = now
  return createChatBackup(characterId, messages, metadata)
}

async function getChatBackups(): Promise<BackupRecord[]> {
  const backups = await getBackupsByType('chat')
  return backups.sort((a, b) => b.createdAt - a.createdAt)
}

async function getSettingsBackups(): Promise<BackupRecord[]> {
  const backups = await getBackupsByType('settings')
  return backups.sort((a, b) => b.createdAt - a.createdAt)
}

async function deleteBackup(id: string): Promise<void> {
  await deleteBackupRecord(id)
}

async function pruneOldBackups(type: 'chat' | 'settings', maxCount: number): Promise<number> {
  const backups = await getBackupsByType(type)
  const sorted = backups.sort((a, b) => b.createdAt - a.createdAt)

  if (sorted.length <= maxCount) return 0

  let deleted = 0
  const toDelete = sorted.slice(maxCount)
  for (const backup of toDelete) {
    await deleteBackupRecord(backup.id)
    deleted++
  }

  return deleted
}

function downloadBackupAsJson(backup: BackupRecord): void {
  const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup_${backup.type}_${new Date(backup.createdAt).toISOString().replace(/[:.]/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export {
  createChatBackup,
  createSettingsBackup,
  throttledChatBackup,
  getChatBackups,
  getSettingsBackups,
  deleteBackup,
  pruneOldBackups,
  downloadBackupAsJson,
}
