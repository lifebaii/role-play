import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbSet, dbGet } from '@/utils/db'

export interface InstructTemplate {
  id: string
  name: string
  system_prompt: string
  system_prefix: string
  system_suffix: string
  input_prefix: string
  input_suffix: string
  output_prefix: string
  output_suffix: string
  stop_sequence: string[]
  activation_regex: string
  user_role: string
  assistant_role: string
  system_role: string
  is_default: boolean
}

const STORAGE_KEY = 'instruct_templates'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

const BUILTIN_TEMPLATES: Omit<InstructTemplate, 'id'>[] = [
  {
    name: 'ChatML',
    system_prompt: 'You are a helpful assistant.',
    system_prefix: '<|im_start|>system\n',
    system_suffix: '<|im_end|>\n',
    input_prefix: '<|im_start|>user\n',
    input_suffix: '<|im_end|>\n',
    output_prefix: '<|im_start|>assistant\n',
    output_suffix: '<|im_end|>\n',
    stop_sequence: ['<|im_end|>'],
    activation_regex: '',
    user_role: 'user',
    assistant_role: 'assistant',
    system_role: 'system',
    is_default: true,
  },
  {
    name: 'Alpaca',
    system_prompt: 'Below is an instruction that describes a task. Write a response that appropriately completes the request.',
    system_prefix: '### Instruction:\n',
    system_suffix: '\n\n',
    input_prefix: '### Input:\n',
    input_suffix: '\n\n',
    output_prefix: '### Response:\n',
    output_suffix: '\n\n',
    stop_sequence: ['### Instruction:', '### Input:', '### Response:'],
    activation_regex: '',
    user_role: 'user',
    assistant_role: 'assistant',
    system_role: 'system',
    is_default: false,
  },
  {
    name: 'Vicuna',
    system_prompt: 'A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user\'s questions.',
    system_prefix: '',
    system_suffix: '\n\n',
    input_prefix: 'USER: ',
    input_suffix: '\n',
    output_prefix: 'ASSISTANT: ',
    output_suffix: '</s>\n',
    stop_sequence: ['USER:', 'ASSISTANT:'],
    activation_regex: '',
    user_role: 'user',
    assistant_role: 'assistant',
    system_role: 'system',
    is_default: false,
  },
  {
    name: 'Llama 3',
    system_prompt: 'You are a helpful assistant.',
    system_prefix: '<|start_header_id|>system<|end_header_id|>\n\n',
    system_suffix: '<|eot_id|>',
    input_prefix: '<|start_header_id|>user<|end_header_id|>\n\n',
    input_suffix: '<|eot_id|>',
    output_prefix: '<|start_header_id|>assistant<|end_header_id|>\n\n',
    output_suffix: '<|eot_id|>',
    stop_sequence: ['<|eot_id|>'],
    activation_regex: '',
    user_role: 'user',
    assistant_role: 'assistant',
    system_role: 'system',
    is_default: false,
  },
  {
    name: 'Mistral',
    system_prompt: 'Always assist with care, respect, and truth. Respond with utmost utility yet securely. Avoid harmful, unethical, prejudiced, or negative content. Ensure replies promote fairness and positivity.',
    system_prefix: '[INST] ',
    system_suffix: ' [/INST]',
    input_prefix: '[INST] ',
    input_suffix: ' [/INST]',
    output_prefix: '',
    output_suffix: '</s>',
    stop_sequence: ['[INST]', '</s>'],
    activation_regex: '',
    user_role: 'user',
    assistant_role: 'assistant',
    system_role: 'system',
    is_default: false,
  },
]

async function loadTemplates(): Promise<InstructTemplate[]> {
  const data = await dbGet<InstructTemplate[]>(STORAGE_KEY)
  if (data && data.length > 0) return data

  const builtins = BUILTIN_TEMPLATES.map(t => ({
    ...t,
    id: generateId(),
  }))
  await dbSet(STORAGE_KEY, builtins)
  return builtins
}

async function saveTemplates(templates: InstructTemplate[]): Promise<void> {
  await dbSet(STORAGE_KEY, templates)
}

export const useInstructStore = defineStore('instruct', () => {
  const templates = ref<InstructTemplate[]>([])
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
    const savedActiveId = localStorage.getItem('active_instruct_template_id')
    if (savedActiveId && templates.value.find(t => t.id === savedActiveId)) {
      activeTemplateId.value = savedActiveId
    }
    isLoaded.value = true
  }

  function _save() {
    saveTemplates(templates.value)
  }

  function addTemplate(data?: Partial<InstructTemplate>): InstructTemplate {
    const newTemplate: InstructTemplate = {
      id: generateId(),
      name: 'New Template',
      system_prompt: '',
      system_prefix: '',
      system_suffix: '\n',
      input_prefix: '',
      input_suffix: '\n',
      output_prefix: '',
      output_suffix: '\n',
      stop_sequence: [],
      activation_regex: '',
      user_role: 'user',
      assistant_role: 'assistant',
      system_role: 'system',
      is_default: false,
      ...data,
    }
    templates.value.push(newTemplate)
    _save()
    return newTemplate
  }

  function updateTemplate(id: string, data: Partial<InstructTemplate>): boolean {
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
    localStorage.setItem('active_instruct_template_id', id)
  }

  function duplicateTemplate(id: string): InstructTemplate | null {
    const source = templates.value.find(t => t.id === id)
    if (!source) return null
    return addTemplate({
      ...source,
      id: undefined as any,
      name: `${source.name} (副本)`,
      is_default: false,
    })
  }

  function formatMessage(
    role: 'system' | 'user' | 'assistant',
    content: string,
    template?: InstructTemplate
  ): string {
    const t = template || activeTemplate.value
    if (!t) return content

    switch (role) {
      case 'system':
        return `${t.system_prefix}${content}${t.system_suffix}`
      case 'user':
        return `${t.input_prefix}${content}${t.input_suffix}`
      case 'assistant':
        return `${t.output_prefix}${content}${t.output_suffix}`
      default:
        return content
    }
  }

  function getStopSequences(template?: InstructTemplate): string[] {
    const t = template || activeTemplate.value
    return t?.stop_sequence || []
  }

  function importTemplates(data: InstructTemplate[]): void {
    for (const template of data) {
      templates.value.push({
        ...template,
        id: generateId(),
        is_default: false,
      })
    }
    _save()
  }

  function exportTemplates(): InstructTemplate[] {
    return [...templates.value]
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
    formatMessage,
    getStopSequences,
    importTemplates,
    exportTemplates,
  }
})
