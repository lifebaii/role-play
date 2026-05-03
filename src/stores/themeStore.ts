import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dbSet, dbGet } from '@/utils/db'

export interface Theme {
  id: string
  name: string
  colors: ThemeColors
  fonts: ThemeFonts
  customCss: string
  is_default: boolean
}

export interface ThemeColors {
  bg_primary: string
  bg_secondary: string
  bg_tertiary: string
  text_primary: string
  text_secondary: string
  text_muted: string
  accent: string
  accent_hover: string
  border: string
  input_bg: string
  input_border: string
  input_focus_border: string
  button_primary: string
  button_primary_text: string
  button_secondary: string
  button_secondary_text: string
  message_user_bg: string
  message_user_text: string
  message_assistant_bg: string
  message_assistant_text: string
  message_system_bg: string
  message_system_text: string
  scrollbar_thumb: string
  scrollbar_track: string
  shadow: string
}

export interface ThemeFonts {
  family: string
  size_base: number
  size_scale: number
  line_height: number
}

const STORAGE_KEY = 'themes'
const ACTIVE_THEME_KEY = 'active_theme'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

const DEFAULT_DARK_COLORS: ThemeColors = {
  bg_primary: '#1a1a2e',
  bg_secondary: '#16213e',
  bg_tertiary: '#0f3460',
  text_primary: '#e0e0e0',
  text_secondary: '#b0b0b0',
  text_muted: '#808080',
  accent: '#533483',
  accent_hover: '#6a4c9c',
  border: '#2a2a4a',
  input_bg: '#1a1a2e',
  input_border: '#2a2a4a',
  input_focus_border: '#533483',
  button_primary: '#533483',
  button_primary_text: '#ffffff',
  button_secondary: '#2a2a4a',
  button_secondary_text: '#e0e0e0',
  message_user_bg: '#0f3460',
  message_user_text: '#e0e0e0',
  message_assistant_bg: '#16213e',
  message_assistant_text: '#e0e0e0',
  message_system_bg: '#2a2a4a',
  message_system_text: '#b0b0b0',
  scrollbar_thumb: '#3a3a5a',
  scrollbar_track: '#1a1a2e',
  shadow: 'rgba(0, 0, 0, 0.3)',
}

const DEFAULT_LIGHT_COLORS: ThemeColors = {
  bg_primary: '#ffffff',
  bg_secondary: '#f5f5f5',
  bg_tertiary: '#e8e8e8',
  text_primary: '#1a1a1a',
  text_secondary: '#4a4a4a',
  text_muted: '#808080',
  accent: '#533483',
  accent_hover: '#6a4c9c',
  border: '#d0d0d0',
  input_bg: '#ffffff',
  input_border: '#d0d0d0',
  input_focus_border: '#533483',
  button_primary: '#533483',
  button_primary_text: '#ffffff',
  button_secondary: '#e8e8e8',
  button_secondary_text: '#1a1a1a',
  message_user_bg: '#e8e0f0',
  message_user_text: '#1a1a1a',
  message_assistant_bg: '#f0f0f0',
  message_assistant_text: '#1a1a1a',
  message_system_bg: '#fff3cd',
  message_system_text: '#856404',
  scrollbar_thumb: '#c0c0c0',
  scrollbar_track: '#f5f5f5',
  shadow: 'rgba(0, 0, 0, 0.1)',
}

const DEFAULT_FONTS: ThemeFonts = {
  family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  size_base: 14,
  size_scale: 1,
  line_height: 1.6,
}

const BUILTIN_THEMES: Omit<Theme, 'id'>[] = [
  {
    name: 'Dark',
    colors: DEFAULT_DARK_COLORS,
    fonts: { ...DEFAULT_FONTS },
    customCss: '',
    is_default: true,
  },
  {
    name: 'Light',
    colors: DEFAULT_LIGHT_COLORS,
    fonts: { ...DEFAULT_FONTS },
    customCss: '',
    is_default: false,
  },
]

async function loadThemes(): Promise<Theme[]> {
  const data = await dbGet<Theme[]>(STORAGE_KEY)
  if (data && data.length > 0) return data

  const builtins = BUILTIN_THEMES.map(t => ({
    ...t,
    id: generateId(),
  }))
  await dbSet(STORAGE_KEY, builtins)
  return builtins
}

async function saveThemes(themes: Theme[]): Promise<void> {
  await dbSet(STORAGE_KEY, themes)
}

function applyThemeToDom(theme: Theme): void {
  const root = document.documentElement
  const { colors, fonts } = theme

  for (const [key, value] of Object.entries(colors)) {
    const cssVar = `--color-${key.replace(/_/g, '-')}`
    root.style.setProperty(cssVar, value)
  }

  root.style.setProperty('--font-family', fonts.family)
  root.style.setProperty('--font-size-base', `${fonts.size_base}px`)
  root.style.setProperty('--font-size-scale', String(fonts.size_scale))
  root.style.setProperty('--line-height', String(fonts.line_height))

  let styleEl = document.getElementById('custom-theme-css') as HTMLStyleElement | null
  if (theme.customCss) {
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'custom-theme-css'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = theme.customCss
  } else if (styleEl) {
    styleEl.remove()
  }
}

export const useThemeStore = defineStore('theme', () => {
  const themes = ref<Theme[]>([])
  const activeThemeId = ref<string | null>(null)
  const isLoaded = ref(false)

  const activeTheme = computed(() => {
    if (activeThemeId.value) {
      const found = themes.value.find(t => t.id === activeThemeId.value)
      if (found) return found
    }
    return themes.value.find(t => t.is_default) || themes.value[0] || null
  })

  const themeList = computed(() =>
    themes.value.map(t => ({
      id: t.id,
      name: t.name,
      is_default: t.is_default,
    }))
  )

  async function load() {
    if (isLoaded.value) return
    themes.value = await loadThemes()
    const savedActiveId = localStorage.getItem(ACTIVE_THEME_KEY)
    if (savedActiveId && themes.value.find(t => t.id === savedActiveId)) {
      activeThemeId.value = savedActiveId
    }
    if (activeTheme.value) {
      applyThemeToDom(activeTheme.value)
    }
    isLoaded.value = true
  }

  function _save() {
    saveThemes(themes.value)
  }

  function addTheme(data?: Partial<Theme>): Theme {
    const newTheme: Theme = {
      id: generateId(),
      name: 'New Theme',
      colors: { ...DEFAULT_DARK_COLORS },
      fonts: { ...DEFAULT_FONTS },
      customCss: '',
      is_default: false,
      ...data,
    }
    themes.value.push(newTheme)
    _save()
    return newTheme
  }

  function updateTheme(id: string, data: Partial<Theme>): boolean {
    const index = themes.value.findIndex(t => t.id === id)
    if (index !== -1) {
      themes.value[index] = { ...themes.value[index], ...data }
      _save()
      if (activeThemeId.value === id) {
        applyThemeToDom(themes.value[index])
      }
      return true
    }
    return false
  }

  function removeTheme(id: string): boolean {
    const index = themes.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const wasDefault = themes.value[index].is_default
      themes.value.splice(index, 1)
      if (wasDefault && themes.value.length > 0) {
        themes.value[0].is_default = true
      }
      if (activeThemeId.value === id) {
        activeThemeId.value = themes.value[0]?.id || null
        if (activeTheme.value) applyThemeToDom(activeTheme.value)
      }
      _save()
      return true
    }
    return false
  }

  function setDefault(id: string): void {
    themes.value.forEach(t => t.is_default = t.id === id)
    _save()
  }

  function setActive(id: string): void {
    activeThemeId.value = id
    localStorage.setItem(ACTIVE_THEME_KEY, id)
    const theme = themes.value.find(t => t.id === id)
    if (theme) applyThemeToDom(theme)
  }

  function duplicateTheme(id: string): Theme | null {
    const source = themes.value.find(t => t.id === id)
    if (!source) return null
    return addTheme({
      ...source,
      id: undefined as any,
      name: `${source.name} (副本)`,
      is_default: false,
      colors: { ...source.colors },
      fonts: { ...source.fonts },
    })
  }

  function importThemes(data: Theme[]): void {
    for (const theme of data) {
      themes.value.push({
        ...theme,
        id: generateId(),
        is_default: false,
        colors: { ...theme.colors },
        fonts: { ...theme.fonts },
      })
    }
    _save()
  }

  function exportThemes(): Theme[] {
    return themes.value.map(t => ({
      ...t,
      colors: { ...t.colors },
      fonts: { ...t.fonts },
    }))
  }

  return {
    themes,
    activeThemeId,
    activeTheme,
    themeList,
    isLoaded,
    load,
    addTheme,
    updateTheme,
    removeTheme,
    setDefault,
    setActive,
    duplicateTheme,
    importThemes,
    exportThemes,
    applyThemeToDom,
  }
})
