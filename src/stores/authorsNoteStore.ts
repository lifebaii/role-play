import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbSet, dbGet } from '@/utils/db'

export interface AuthorsNote {
  id: string
  content: string
  depth: number
  frequency: number
  role: 'system' | 'user' | 'assistant'
  position: 'after_depth' | 'before_depth' | 'top' | 'bottom'
  enabled: boolean
  characterId?: string
  chatId?: string
}

const STORAGE_KEY = 'authors_notes'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

async function loadNotes(): Promise<AuthorsNote[]> {
  const data = await dbGet<AuthorsNote[]>(STORAGE_KEY)
  return data || []
}

async function saveNotes(notes: AuthorsNote[]): Promise<void> {
  await dbSet(STORAGE_KEY, notes)
}

export const useAuthorsNoteStore = defineStore('authorsNote', () => {
  const notes = ref<AuthorsNote[]>([])
  const activeNoteId = ref<string | null>(null)
  const isLoaded = ref(false)

  const activeNote = computed(() => {
    if (activeNoteId.value) {
      const found = notes.value.find(n => n.id === activeNoteId.value)
      if (found) return found
    }
    return null
  })

  const globalNotes = computed(() =>
    notes.value.filter(n => !n.characterId && !n.chatId)
  )

  async function load() {
    if (isLoaded.value) return
    notes.value = await loadNotes()
    const savedActiveId = localStorage.getItem('active_authors_note_id')
    if (savedActiveId && notes.value.find(n => n.id === savedActiveId)) {
      activeNoteId.value = savedActiveId
    }
    isLoaded.value = true
  }

  function _save() {
    saveNotes(notes.value)
  }

  function addNote(data?: Partial<AuthorsNote>): AuthorsNote {
    const newNote: AuthorsNote = {
      id: generateId(),
      content: '',
      depth: 4,
      frequency: 1,
      role: 'system',
      position: 'after_depth',
      enabled: true,
      ...data,
    }
    notes.value.push(newNote)
    _save()
    return newNote
  }

  function updateNote(id: string, data: Partial<AuthorsNote>): boolean {
    const index = notes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notes.value[index] = { ...notes.value[index], ...data }
      _save()
      return true
    }
    return false
  }

  function removeNote(id: string): boolean {
    const index = notes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notes.value.splice(index, 1)
      if (activeNoteId.value === id) {
        activeNoteId.value = null
      }
      _save()
      return true
    }
    return false
  }

  function setActive(id: string | null): void {
    activeNoteId.value = id
    if (id) {
      localStorage.setItem('active_authors_note_id', id)
    } else {
      localStorage.removeItem('active_authors_note_id')
    }
  }

  function toggleNote(id: string): void {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      note.enabled = !note.enabled
      _save()
    }
  }

  function getNoteForCharacter(characterId: string): AuthorsNote | null {
    return notes.value.find(n => n.characterId === characterId && n.enabled) || null
  }

  function getNoteForChat(chatId: string): AuthorsNote | null {
    return notes.value.find(n => n.chatId === chatId && n.enabled) || null
  }

  function getEffectiveNote(characterId?: string, chatId?: string): AuthorsNote | null {
    if (chatId) {
      const chatNote = getNoteForChat(chatId)
      if (chatNote) return chatNote
    }
    if (characterId) {
      const charNote = getNoteForCharacter(characterId)
      if (charNote) return charNote
    }
    if (activeNote.value?.enabled) return activeNote.value
    return notes.value.find(n => n.enabled && !n.characterId && !n.chatId) || null
  }

  function duplicateNote(id: string): AuthorsNote | null {
    const source = notes.value.find(n => n.id === id)
    if (!source) return null
    return addNote({
      ...source,
      id: undefined as any,
      content: source.content,
      characterId: undefined,
      chatId: undefined,
    })
  }

  function importNotes(data: AuthorsNote[]): void {
    for (const note of data) {
      notes.value.push({
        ...note,
        id: generateId(),
      })
    }
    _save()
  }

  function exportNotes(): AuthorsNote[] {
    return [...notes.value]
  }

  function clearAll(): void {
    notes.value = []
    activeNoteId.value = null
    _save()
  }

  return {
    notes,
    activeNoteId,
    activeNote,
    globalNotes,
    isLoaded,
    load,
    addNote,
    updateNote,
    removeNote,
    setActive,
    toggleNote,
    getNoteForCharacter,
    getNoteForChat,
    getEffectiveNote,
    duplicateNote,
    importNotes,
    exportNotes,
    clearAll,
  }
})
