import { dbSet, dbGet } from './db'

const SECRETS_KEY = 'secrets'

export interface SecretKeyEntry {
  id: string
  value: string
  label: string
  active: boolean
}

export type SecretKeys = Record<string, SecretKeyEntry[]>

function generateId(): string {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

async function loadSecrets(): Promise<SecretKeys> {
  const data = await dbGet<SecretKeys>(SECRETS_KEY)
  return data || {}
}

async function saveSecrets(secrets: SecretKeys): Promise<void> {
  await dbSet(SECRETS_KEY, secrets)
}

export async function writeSecret(keyType: string, value: string, label?: string): Promise<string> {
  const secrets = await loadSecrets()
  if (!secrets[keyType]) secrets[keyType] = []

  const id = generateId()
  secrets[keyType].push({
    id,
    value,
    label: label || `Key ${secrets[keyType].length + 1}`,
    active: secrets[keyType].length === 0
  })

  await saveSecrets(secrets)
  return id
}

export async function deleteSecret(keyType: string, id: string): Promise<void> {
  const secrets = await loadSecrets()
  if (secrets[keyType]) {
    secrets[keyType] = secrets[keyType].filter(k => k.id !== id)
    if (secrets[keyType].length === 0) {
      delete secrets[keyType]
    }
  }
  await saveSecrets(secrets)
}

export async function readSecret(keyType: string): Promise<string | null> {
  const secrets = await loadSecrets()
  const entries = secrets[keyType]
  if (!entries || entries.length === 0) return null

  const active = entries.find(k => k.active)
  return active?.value || entries[0]?.value || null
}

export async function readSecretState(keyType: string): Promise<SecretKeyEntry[] | null> {
  const secrets = await loadSecrets()
  const entries = secrets[keyType]
  if (!entries) return null

  return entries.map(k => ({
    ...k,
    value: k.value ? `${k.value.slice(0, 4)}...${k.value.slice(-4)}` : ''
  }))
}

export async function rotateSecret(keyType: string): Promise<string | null> {
  const secrets = await loadSecrets()
  const entries = secrets[keyType]
  if (!entries || entries.length <= 1) return null

  const currentIdx = entries.findIndex(k => k.active)
  entries.forEach(k => k.active = false)
  const nextIdx = (currentIdx + 1) % entries.length
  entries[nextIdx].active = true

  await saveSecrets(secrets)
  return entries[nextIdx].id
}

export async function renameSecretLabel(keyType: string, id: string, label: string): Promise<void> {
  const secrets = await loadSecrets()
  const entry = secrets[keyType]?.find(k => k.id === id)
  if (entry) {
    entry.label = label
    await saveSecrets(secrets)
  }
}

export async function setActiveSecret(keyType: string, id: string): Promise<void> {
  const secrets = await loadSecrets()
  if (secrets[keyType]) {
    secrets[keyType].forEach(k => k.active = k.id === id)
    await saveSecrets(secrets)
  }
}

export async function getAllSecretTypes(): Promise<string[]> {
  const secrets = await loadSecrets()
  return Object.keys(secrets)
}

export async function clearAllSecrets(): Promise<void> {
  await saveSecrets({})
}
