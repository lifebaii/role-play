export type ColorMode = 'light' | 'dark' | 'system'

export interface ThemeColors {
  primary: string
  primaryLight: string
  primaryDark: string
  secondary: string
  secondaryLight: string
  secondaryDark: string
  accent: string
  accentLight: string
  accentDark: string
  gradientStart: string
  gradientMiddle: string
  gradientEnd: string
  bgStart: string
  bgMiddle: string
  bgEnd: string
  textPrimary: string
  textSecondary: string
  textAccent: string
  border: string
  sidebar: string
  sidebarHover: string
  inputArea: string
  inputBg: string
  bubbleAssistant: string
  bubbleAssistantBorder: string
  cardBg: string
  cardHover: string
  overlay: string
  actionIcon: string
  actionIconHover: string
  danger: string
  dangerLight: string
  dangerBg: string
  success: string
  successLight: string
  successBg: string
  menuBg: string
  shadow: string
  shadowLight: string
}

export interface Theme {
  id: string
  name: string
  colors: ThemeColors
  isDark: boolean
}

const TEAL_LIGHT_COLORS: ThemeColors = {
  primary: '#12ac99',
  primaryLight: '#2dd4bf',
  primaryDark: '#0d9488',
  secondary: '#06b6d4',
  secondaryLight: '#22d3ee',
  secondaryDark: '#0891b2',
  accent: '#14b8a6',
  accentLight: '#2dd4bf',
  accentDark: '#0d9488',
  gradientStart: '#12ac99',
  gradientMiddle: '#06b6d4',
  gradientEnd: '#14b8a6',
  bgStart: '#f0fdfa',
  bgMiddle: '#ccfbf1',
  bgEnd: '#f0fdfa',
  textPrimary: '#134e4a',
  textSecondary: '#0f766e',
  textAccent: '#0d9488',
  border: 'rgba(18, 172, 153, 0.2)',
  sidebar: 'rgba(255, 255, 255, 0.7)',
  sidebarHover: 'rgba(18, 172, 153, 0.08)',
  inputArea: 'rgba(255, 255, 255, 0.7)',
  inputBg: 'rgba(255, 255, 255, 0.5)',
  bubbleAssistant: 'rgba(255, 255, 255, 0.7)',
  bubbleAssistantBorder: 'rgba(18, 172, 153, 0.15)',
  cardBg: 'rgba(255, 255, 255, 0.95)',
  cardHover: 'rgba(18, 172, 153, 0.06)',
  overlay: 'rgba(240, 253, 250, 0.85)',
  actionIcon: '#5eead4',
  actionIconHover: '#12ac99',
  danger: '#ef4444',
  dangerLight: '#f87171',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  success: '#22c55e',
  successLight: '#4ade80',
  successBg: 'rgba(34, 197, 94, 0.1)',
  menuBg: 'rgba(255, 255, 255, 0.85)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
}

const TEAL_DARK_COLORS: ThemeColors = {
  primary: '#2dd4bf',
  primaryLight: '#5eead4',
  primaryDark: '#14b8a6',
  secondary: '#22d3ee',
  secondaryLight: '#67e8f9',
  secondaryDark: '#06b6d4',
  accent: '#5eead4',
  accentLight: '#99f6e4',
  accentDark: '#2dd4bf',
  gradientStart: '#2dd4bf',
  gradientMiddle: '#22d3ee',
  gradientEnd: '#5eead4',
  bgStart: '#0f172a',
  bgMiddle: '#1e293b',
  bgEnd: '#0f172a',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textAccent: '#5eead4',
  border: 'rgba(45, 212, 191, 0.2)',
  sidebar: 'rgba(30, 41, 59, 0.7)',
  sidebarHover: 'rgba(45, 212, 191, 0.15)',
  inputArea: 'rgba(30, 41, 59, 0.7)',
  inputBg: 'rgba(30, 41, 59, 0.5)',
  bubbleAssistant: 'rgba(30, 41, 59, 0.7)',
  bubbleAssistantBorder: 'rgba(45, 212, 191, 0.2)',
  cardBg: 'rgba(30, 41, 59, 0.95)',
  cardHover: 'rgba(45, 212, 191, 0.1)',
  overlay: 'rgba(15, 23, 42, 0.85)',
  actionIcon: '#5eead4',
  actionIconHover: '#2dd4bf',
  danger: '#f87171',
  dangerLight: '#fca5a5',
  dangerBg: 'rgba(248, 113, 113, 0.15)',
  success: '#4ade80',
  successLight: '#86efac',
  successBg: 'rgba(74, 222, 128, 0.15)',
  menuBg: 'rgba(30, 41, 59, 0.92)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.15)',
}

const THEMES: Record<'light' | 'dark', Theme> = {
  light: {
    id: 'teal-light',
    name: '青绿亮色',
    colors: TEAL_LIGHT_COLORS,
    isDark: false,
  },
  dark: {
    id: 'teal-dark',
    name: '青绿暗色',
    colors: TEAL_DARK_COLORS,
    isDark: true,
  },
}

const COLOR_MODE_KEY = 'color-mode'

let currentColorMode: ColorMode = 'system'
let currentTheme: Theme = THEMES.light

export function getColorMode(): ColorMode {
  return currentColorMode
}

export function getTheme(): Theme {
  return currentTheme
}

export function isDarkMode(): boolean {
  return currentTheme.isDark
}

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement

  let metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta')
    metaThemeColor.setAttribute('name', 'theme-color')
    document.head.appendChild(metaThemeColor)
  }
  metaThemeColor.setAttribute('content', theme.colors.bgStart)

  root.style.setProperty('--theme-primary', theme.colors.primary)
  root.style.setProperty('--theme-primary-light', theme.colors.primaryLight)
  root.style.setProperty('--theme-primary-dark', theme.colors.primaryDark)
  root.style.setProperty('--theme-secondary', theme.colors.secondary)
  root.style.setProperty('--theme-secondary-light', theme.colors.secondaryLight)
  root.style.setProperty('--theme-secondary-dark', theme.colors.secondaryDark)
  root.style.setProperty('--theme-accent', theme.colors.accent)
  root.style.setProperty('--theme-accent-light', theme.colors.accentLight)
  root.style.setProperty('--theme-accent-dark', theme.colors.accentDark)
  root.style.setProperty('--theme-gradient-start', theme.colors.gradientStart)
  root.style.setProperty('--theme-gradient-middle', theme.colors.gradientMiddle)
  root.style.setProperty('--theme-gradient-end', theme.colors.gradientEnd)
  root.style.setProperty('--theme-bg-start', theme.colors.bgStart)
  root.style.setProperty('--theme-bg-middle', theme.colors.bgMiddle)
  root.style.setProperty('--theme-bg-end', theme.colors.bgEnd)
  root.style.setProperty('--theme-text-primary', theme.colors.textPrimary)
  root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary)
  root.style.setProperty('--theme-text-accent', theme.colors.textAccent)
  root.style.setProperty('--theme-border', theme.colors.border)
  root.style.setProperty('--theme-sidebar', theme.colors.sidebar)
  root.style.setProperty('--theme-sidebar-hover', theme.colors.sidebarHover)
  root.style.setProperty('--theme-input-area', theme.colors.inputArea)
  root.style.setProperty('--theme-input-bg', theme.colors.inputBg)
  root.style.setProperty('--theme-bubble-assistant', theme.colors.bubbleAssistant)
  root.style.setProperty('--theme-bubble-assistant-border', theme.colors.bubbleAssistantBorder)
  root.style.setProperty('--theme-card-bg', theme.colors.cardBg)
  root.style.setProperty('--theme-card-hover', theme.colors.cardHover)
  root.style.setProperty('--theme-overlay', theme.colors.overlay)
  root.style.setProperty('--theme-action-icon', theme.colors.actionIcon)
  root.style.setProperty('--theme-action-icon-hover', theme.colors.actionIconHover)
  root.style.setProperty('--theme-danger', theme.colors.danger)
  root.style.setProperty('--theme-danger-light', theme.colors.dangerLight)
  root.style.setProperty('--theme-danger-bg', theme.colors.dangerBg)
  root.style.setProperty('--theme-success', theme.colors.success)
  root.style.setProperty('--theme-success-light', theme.colors.successLight)
  root.style.setProperty('--theme-success-bg', theme.colors.successBg)
  root.style.setProperty('--theme-menu-bg', theme.colors.menuBg)
  root.style.setProperty('--theme-shadow', theme.colors.shadow)
  root.style.setProperty('--theme-shadow-light', theme.colors.shadowLight)

  if (theme.isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

function resolveTheme(mode: ColorMode): Theme {
  if (mode === 'system') {
    return getSystemPrefersDark() ? THEMES.dark : THEMES.light
  }
  return mode === 'dark' ? THEMES.dark : THEMES.light
}

export function setColorMode(mode: ColorMode): void {
  currentColorMode = mode
  localStorage.setItem(COLOR_MODE_KEY, mode)
  currentTheme = resolveTheme(mode)
  applyTheme(currentTheme)
}

export function toggleColorMode(): ColorMode {
  const modes: ColorMode[] = ['system', 'light', 'dark']
  const currentIndex = modes.indexOf(currentColorMode)
  const nextIndex = (currentIndex + 1) % modes.length
  const nextMode = modes[nextIndex]
  setColorMode(nextMode)
  return nextMode
}

function handleSystemThemeChange(e: MediaQueryListEvent): void {
  if (currentColorMode === 'system') {
    currentTheme = e.matches ? THEMES.dark : THEMES.light
    applyTheme(currentTheme)
  }
}

export function loadTheme(): void {
  const savedMode = localStorage.getItem(COLOR_MODE_KEY) as ColorMode | null
  currentColorMode = savedMode || 'system'
  currentTheme = resolveTheme(currentColorMode)
  applyTheme(currentTheme)

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleSystemThemeChange)
}

export { THEMES }
