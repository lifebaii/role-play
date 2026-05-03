import { getChatHistory, saveChatHistory } from './db'
import { exportAndDownload, importFromFile } from './dataTransferService'

export interface SyncStatus {
  totalLimit: number
  dailyLimit: number
  totalUsed: number
  dailyUsed: number
  remainingTotal: number
  remainingDaily: number
}

export interface UploadResult {
  success: boolean
  message?: string
}

export interface DownloadResult {
  success: boolean
  characterId: string
  characterName: string
  messages: any[]
  messageCount: number
}

export async function exportChatToFile(characterId: string): Promise<UploadResult> {
  try {
    const messages = await getChatHistory(characterId)
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat_${characterId}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    return { success: true }
  } catch (e: any) {
    return { success: false, message: e.message }
  }
}

export async function importChatFromFile(characterId: string, file: File): Promise<DownloadResult> {
  try {
    const text = await file.text()
    const messages = JSON.parse(text)
    await saveChatHistory(characterId, messages)
    return {
      success: true,
      characterId,
      characterName: characterId,
      messages,
      messageCount: messages.length,
    }
  } catch (e: any) {
    return {
      success: false,
      characterId,
      characterName: '',
      messages: [],
      messageCount: 0,
    }
  }
}

export async function getSyncStatus(): Promise<SyncStatus> {
  return {
    totalLimit: Infinity,
    dailyLimit: Infinity,
    totalUsed: 0,
    dailyUsed: 0,
    remainingTotal: Infinity,
    remainingDaily: Infinity,
  }
}

export async function cancelSync(): Promise<{ success: boolean }> {
  return { success: true }
}
