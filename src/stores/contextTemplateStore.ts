import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbSet, dbGet } from '@/utils/db'

export interface ContextTemplate {
  id: string
  name: string
  prompt_order: ContextPromptItem[]
  max_context_size: number
  reserved_tokens: number
  is_default: boolean
}

export interface ContextPromptItem {
  identifier: string
  enabled: boolean
  injection_position: number
  injection_depth: number
}

const STORAGE_KEY = 'context_templates'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

const DEFAULT_PROMPT_ORDER: ContextPromptItem[] = [
  { identifier: 'system_prompt', enabled: true, injection_position: 0, injection_depth: 0 },
  { identifier: 'character_description', enabled: true, injection_position: 1, injection_depth: 0 },
  { identifier: 'character_personality', enabled: true, injection_position: 2, injection_depth: 0 },
  { identifier: 'character_scenario', enabled: true, injection_position: 3, injection_depth: 0 },
  { identifier: 'world_info_before', enabled: true, injection_position: 4, injection_depth: 0 },
  { identifier: 'world_info_after', enabled: true, injection_position: 5, injection_depth: 0 },
  { identifier: 'authors_note', enabled: true, injection_position: 6, injection_depth: 4 },
  { identifier: 'chat_history', enabled: true, injection_position: 7, injection_depth: 0 },
  { identifier: 'example_messages', enabled: true, injection_position: 8, injection_depth: 0 },
]

const BUILTIN_TEMPLATES: Omit<ContextTemplate, 'id'>[] = [
  {
    name: 'Default',
    prompt_order: DEFAULT_PROMPT_ORDER,
    max_context_size: 128000,
    reserved_tokens: 1024,
    is_default: true,
  },
  {
    name: 'Compact',
    prompt_order: [
      { identifier: 'system_prompt', enabled: true, injection_position: 0, injection_depth: 0 },
      { identifier: 'character_description', enabled: true, injection_position: 1, injection_depth: 0 },
      { identifier: 'world_info_before', enabled: true, injection_position: 2, injection_depth: 0 },
      { identifier: 'authors_note', enabled: true, injection_position: 3, injection_depth: 2 },
      { identifier: 'chat_history', enabled: true, injection_position: 4, injection_depth: 0 },
    ],
    max_context_size: 128000,
    reserved_tokens: 512,
    is_default: false,
  },
]

async function loadTemplates(): Promise<ContextTemplate[]> {
  const data = await dbGet<ContextTemplate[]>(STORAGE_KEY)
  if (data && data.length > 0) return data

  const builtins = BUILTIN_TEMPLATES.map(t => ({
    ...t,
    id: generateId(),
  }))
  await dbSet(STORAGE_KEY, builtins)
  return builtins
}

async function saveTemplates(templates: ContextTemplate[]): Promise<void> {
  await dbSet(STORAGE_KEY, templates)
}

export const useContextTemplateStore = defineStore('contextTemplate', () => {
  const templates = ref<ContextTemplate[]>([])
  const activeTemplateId = ref<string | null>(null)
  const isLoaded = ref(false)

  const activeTemplate = computed(() => {
    if (activeTemplateId.value) {
      const found = templates.value.find(t => t.id === activeTemplateId.value)
      if (found) return found
    }
    return templates.value.find(t => t.is_default) || templates.value[0] || null
  })

  const templateList = computed(() =>
    templates.value.map(t => ({
      id: t.id,
      name: t.name,
      is_default: t.is_default,
    }))
  )

  async function load() {
    if (isLoaded.value) return
    templates.value = await loadTemplates()
    const savedActiveId = localStorage.getItem('active_context_template_id')
    if (savedActiveId && templates.value.find(t => t.id === savedActiveId)) {
      activeTemplateId.value = savedActiveId
    }
    isLoaded.value = true
  }

  function _save() {
    saveTemplates(templates.value)
  }

  function addTemplate(data?: Partial<ContextTemplate>): ContextTemplate {
    const newTemplate: ContextTemplate = {
      id: generateId(),
      name: 'New Template',
      prompt_order: [...DEFAULT_PROMPT_ORDER],
      max_context_size: 128000,
      reserved_tokens: 1024,
      is_default: false,
      ...data,
    }
    templates.value.push(newTemplate)
    _save()
    return newTemplate
  }

  function updateTemplate(id: string, data: Partial<ContextTemplate>): boolean {
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      templates.value[index] = { ...templates.value[index], ...data }
      _save()
      return true
    }
    return false
  }

  function removeTemplate(id: string): boolean {
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const wasDefault = templates.value[index].is_default
      templates.value.splice(index, 1)
      if (wasDefault && templates.value.length > 0) {
        templates.value[0].is_default = true
      }
      if (activeTemplateId.value === id) {
        activeTemplateId.value = null
      }
      _save()
      return true
    }
    return false
  }

  function setDefault(id: string): void {
    templates.value.forEach(t => t.is_default = t.id === id)
    _save()
  }

  function setActive(id: string): void {
    activeTemplateId.value = id
    localStorage.setItem('active_context_template_id', id)
  }

  function duplicateTemplate(id: string): ContextTemplate | null {
    const source = templates.value.find(t => t.id === id)
    if (!source) return null
    return addTemplate({
      ...source,
      id: undefined as any,
      name: `${source.name} (副本)`,
      is_default: false,
      prompt_order: source.prompt_order.map(p => ({ ...p })),
    })
  }

  function updatePromptOrder(id: string, promptOrder: ContextPromptItem[]): void {
    const template = templates.value.find(t => t.id === id)
    if (template) {
      template.prompt_order = promptOrder
      _save()
    }
  }

  function togglePromptItem(id: string, identifier: string): void {
    const template = templates.value.find(t => t.id === id)
    if (template) {
      const item = template.prompt_order.find(p => p.identifier === identifier)
      if (item) {
        item.enabled = !item.enabled
        _save()
      }
    }
  }

  function getEnabledItems(template?: ContextTemplate): ContextPromptItem[] {
    const t = template || activeTemplate.value
    if (!t) return []
    return t.prompt_order
      .filter(p => p.enabled)
      .sort((a, b) => a.injection_position - b.injection_position)
  }

  function importTemplates(data: ContextTemplate[]): void {
    for (const template of data) {
      templates.value.push({
        ...template,
        id: generateId(),
        is_default: false,
        prompt_order: template.prompt_order.map(p => ({ ...p })),
      })
    }
    _save()
  }

  function exportTemplates(): ContextTemplate[] {
    return templates.value.map(t => ({ ...t, prompt_order: t.prompt_order.map(p => ({ ...p })) }))
  }

  return {
    templates,
    activeTemplateId,
    activeTemplate,
    templateList,
    isLoaded,
    load,
    addTemplate,
    updateTemplate,
    removeTemplate,
    setDefault,
    setActive,
    duplicateTemplate,
    updatePromptOrder,
    togglePromptItem,
    getEnabledItems,
    importTemplates,
    exportTemplates,
  }
})
