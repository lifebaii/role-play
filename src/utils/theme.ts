export interface Theme {
  id: string
  name: string
  description?: string
  colors: {
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
  isDark: boolean
}

export const themes: Theme[] = [
  {
    id: 'ocean',
    name: '海洋蓝',
    description: '清新的蓝色渐变，如海洋般宁静',
    colors: {
      primary: '#0ea5e9',
      primaryLight: '#38bdf8',
      primaryDark: '#0284c7',
      secondary: '#06b6d4',
      secondaryLight: '#22d3ee',
      secondaryDark: '#0891b2',
      accent: '#14b8a6',
      accentLight: '#2dd4bf',
      accentDark: '#0d9488',
      gradientStart: '#0ea5e9',
      gradientMiddle: '#06b6d4',
      gradientEnd: '#14b8a6',
      bgStart: '#f0f9ff',
      bgMiddle: '#e0f2fe',
      bgEnd: '#f0f9ff',
      textPrimary: '#0c4a6e',
      textSecondary: '#0369a1',
      textAccent: '#0891b2',
      border: 'rgba(14, 165, 233, 0.2)',
      sidebar: 'rgba(255, 255, 255, 0.95)',
      sidebarHover: 'rgba(14, 165, 233, 0.08)',
      inputArea: 'rgba(255, 255, 255, 0.7)',
      inputBg: '#ffffff',
      bubbleAssistant: 'rgba(255, 255, 255, 0.7)',
      bubbleAssistantBorder: 'rgba(14, 165, 233, 0.15)',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      cardHover: 'rgba(14, 165, 233, 0.06)',
      overlay: 'rgba(240, 249, 255, 0.85)',
      actionIcon: '#7dd3fc',
      actionIconHover: '#0ea5e9',
      danger: '#ef4444',
      dangerLight: '#f87171',
      dangerBg: 'rgba(239, 68, 68, 0.1)',
      success: '#22c55e',
      successLight: '#4ade80',
      successBg: 'rgba(34, 197, 94, 0.1)',
      menuBg: 'rgba(255, 255, 255, 0.85)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowLight: 'rgba(0, 0, 0, 0.05)',
    },
    isDark: false,
  },
  {
    id: 'aurora',
    name: '极光紫',
    description: '优雅的紫色渐变，经典之选',
    colors: {
      primary: '#6366f1',
      primaryLight: '#818cf8',
      primaryDark: '#4f46e5',
      secondary: '#8b5cf6',
      secondaryLight: '#a78bfa',
      secondaryDark: '#7c3aed',
      accent: '#a855f7',
      accentLight: '#c084fc',
      accentDark: '#9333ea',
      gradientStart: '#6366f1',
      gradientMiddle: '#8b5cf6',
      gradientEnd: '#a855f7',
      bgStart: '#f5f7fa',
      bgMiddle: '#e8eef5',
      bgEnd: '#f0f4f8',
      textPrimary: '#1e293b',
      textSecondary: '#64748b',
      textAccent: '#7c3aed',
      border: 'rgba(99, 102, 241, 0.2)',
      sidebar: 'rgba(255, 255, 255, 0.95)',
      sidebarHover: 'rgba(99, 102, 241, 0.08)',
      inputArea: 'rgba(255, 255, 255, 0.7)',
      inputBg: '#ffffff',
      bubbleAssistant: 'rgba(255, 255, 255, 0.7)',
      bubbleAssistantBorder: 'rgba(99, 102, 241, 0.15)',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      cardHover: 'rgba(99, 102, 241, 0.06)',
      overlay: 'rgba(255, 255, 255, 0.85)',
      actionIcon: '#94a3b8',
      actionIconHover: '#6366f1',
      danger: '#ef4444',
      dangerLight: '#f87171',
      dangerBg: 'rgba(239, 68, 68, 0.1)',
      success: '#22c55e',
      successLight: '#4ade80',
      successBg: 'rgba(34, 197, 94, 0.1)',
      menuBg: 'rgba(255, 255, 255, 0.85)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowLight: 'rgba(0, 0, 0, 0.05)',
    },
    isDark: false,
  },
  {
    id: 'forest',
    name: '森林绿',
    description: '自然的绿色渐变，生机盎然',
    colors: {
      primary: '#22c55e',
      primaryLight: '#4ade80',
      primaryDark: '#16a34a',
      secondary: '#10b981',
      secondaryLight: '#34d399',
      secondaryDark: '#059669',
      accent: '#84cc16',
      accentLight: '#a3e635',
      accentDark: '#65a30d',
      gradientStart: '#22c55e',
      gradientMiddle: '#10b981',
      gradientEnd: '#84cc16',
      bgStart: '#f0fdf4',
      bgMiddle: '#dcfce7',
      bgEnd: '#f0fdf4',
      textPrimary: '#14532d',
      textSecondary: '#166534',
      textAccent: '#059669',
      border: 'rgba(34, 197, 94, 0.2)',
      sidebar: 'rgba(255, 255, 255, 0.95)',
      sidebarHover: 'rgba(34, 197, 94, 0.08)',
      inputArea: 'rgba(255, 255, 255, 0.7)',
      inputBg: '#ffffff',
      bubbleAssistant: 'rgba(255, 255, 255, 0.7)',
      bubbleAssistantBorder: 'rgba(34, 197, 94, 0.15)',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      cardHover: 'rgba(34, 197, 94, 0.06)',
      overlay: 'rgba(240, 253, 244, 0.85)',
      actionIcon: '#86efac',
      actionIconHover: '#22c55e',
      danger: '#ef4444',
      dangerLight: '#f87171',
      dangerBg: 'rgba(239, 68, 68, 0.1)',
      success: '#22c55e',
      successLight: '#4ade80',
      successBg: 'rgba(34, 197, 94, 0.1)',
      menuBg: 'rgba(255, 255, 255, 0.85)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowLight: 'rgba(0, 0, 0, 0.05)',
    },
    isDark: false,
  },
  {
    id: 'sunset',
    name: '日落橙',
    description: '温暖的橙色渐变，如日落般绚烂',
    colors: {
      primary: '#f97316',
      primaryLight: '#fb923c',
      primaryDark: '#ea580c',
      secondary: '#f59e0b',
      secondaryLight: '#fbbf24',
      secondaryDark: '#d97706',
      accent: '#ef4444',
      accentLight: '#f87171',
      accentDark: '#dc2626',
      gradientStart: '#f97316',
      gradientMiddle: '#f59e0b',
      gradientEnd: '#ef4444',
      bgStart: '#fff7ed',
      bgMiddle: '#ffedd5',
      bgEnd: '#fff7ed',
      textPrimary: '#7c2d12',
      textSecondary: '#c2410c',
      textAccent: '#ea580c',
      border: 'rgba(249, 115, 22, 0.2)',
      sidebar: 'rgba(255, 255, 255, 0.95)',
      sidebarHover: 'rgba(249, 115, 22, 0.08)',
      inputArea: 'rgba(255, 255, 255, 0.7)',
      inputBg: '#ffffff',
      bubbleAssistant: 'rgba(255, 255, 255, 0.7)',
      bubbleAssistantBorder: 'rgba(249, 115, 22, 0.15)',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      cardHover: 'rgba(249, 115, 22, 0.06)',
      overlay: 'rgba(255, 247, 237, 0.85)',
      actionIcon: '#fdba74',
      actionIconHover: '#f97316',
      danger: '#dc2626',
      dangerLight: '#ef4444',
      dangerBg: 'rgba(220, 38, 38, 0.1)',
      success: '#16a34a',
      successLight: '#22c55e',
      successBg: 'rgba(22, 163, 74, 0.1)',
      menuBg: 'rgba(255, 255, 255, 0.85)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowLight: 'rgba(0, 0, 0, 0.05)',
    },
    isDark: false,
  },
  {
    id: 'rose',
    name: '玫瑰粉',
    description: '甜美的粉色渐变，温柔浪漫',
    colors: {
      primary: '#ec4899',
      primaryLight: '#f472b6',
      primaryDark: '#db2777',
      secondary: '#f43f5e',
      secondaryLight: '#fb7185',
      secondaryDark: '#e11d48',
      accent: '#a855f7',
      accentLight: '#c084fc',
      accentDark: '#9333ea',
      gradientStart: '#ec4899',
      gradientMiddle: '#f43f5e',
      gradientEnd: '#a855f7',
      bgStart: '#fdf2f8',
      bgMiddle: '#fce7f3',
      bgEnd: '#fdf2f8',
      textPrimary: '#831843',
      textSecondary: '#be185d',
      textAccent: '#db2777',
      border: 'rgba(236, 72, 153, 0.2)',
      sidebar: 'rgba(255, 255, 255, 0.95)',
      sidebarHover: 'rgba(236, 72, 153, 0.08)',
      inputArea: 'rgba(255, 255, 255, 0.7)',
      inputBg: '#ffffff',
      bubbleAssistant: 'rgba(255, 255, 255, 0.7)',
      bubbleAssistantBorder: 'rgba(236, 72, 153, 0.15)',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      cardHover: 'rgba(236, 72, 153, 0.06)',
      overlay: 'rgba(253, 242, 248, 0.85)',
      actionIcon: '#f9a8d4',
      actionIconHover: '#ec4899',
      danger: '#ef4444',
      dangerLight: '#f87171',
      dangerBg: 'rgba(239, 68, 68, 0.1)',
      success: '#22c55e',
      successLight: '#4ade80',
      successBg: 'rgba(34, 197, 94, 0.1)',
      menuBg: 'rgba(255, 255, 255, 0.85)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowLight: 'rgba(0, 0, 0, 0.05)',
    },
    isDark: false,
  },
  {
    id: 'midnight',
    name: '午夜蓝',
    description: '深邃的暗色调，护眼之选',
    colors: {
      primary: '#3b82f6',
      primaryLight: '#60a5fa',
      primaryDark: '#2563eb',
      secondary: '#6366f1',
      secondaryLight: '#818cf8',
      secondaryDark: '#4f46e5',
      accent: '#8b5cf6',
      accentLight: '#a78bfa',
      accentDark: '#7c3aed',
      gradientStart: '#3b82f6',
      gradientMiddle: '#6366f1',
      gradientEnd: '#8b5cf6',
      bgStart: '#0f172a',
      bgMiddle: '#1e293b',
      bgEnd: '#0f172a',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      textAccent: '#a78bfa',
      border: 'rgba(59, 130, 246, 0.2)',
      sidebar: 'rgba(30, 41, 59, 0.95)',
      sidebarHover: 'rgba(59, 130, 246, 0.15)',
      inputArea: 'rgba(30, 41, 59, 0.7)',
      inputBg: 'rgba(51, 65, 85, 0.9)',
      bubbleAssistant: 'rgba(30, 41, 59, 0.7)',
      bubbleAssistantBorder: 'rgba(59, 130, 246, 0.2)',
      cardBg: 'rgba(30, 41, 59, 0.95)',
      cardHover: 'rgba(59, 130, 246, 0.1)',
      overlay: 'rgba(15, 23, 42, 0.85)',
      actionIcon: '#64748b',
      actionIconHover: '#60a5fa',
      danger: '#f87171',
      dangerLight: '#fca5a5',
      dangerBg: 'rgba(248, 113, 113, 0.15)',
      success: '#4ade80',
      successLight: '#86efac',
      successBg: 'rgba(74, 222, 128, 0.15)',
      menuBg: 'rgba(30, 41, 59, 0.92)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowLight: 'rgba(0, 0, 0, 0.15)',
    },
    isDark: true,
  },
  {
    id: 'cyber',
    name: '赛博黑',
    description: '科技感的深色主题，酷劲十足',
    colors: {
      primary: '#06b6d4',
      primaryLight: '#22d3ee',
      primaryDark: '#0891b2',
      secondary: '#8b5cf6',
      secondaryLight: '#a78bfa',
      secondaryDark: '#7c3aed',
      accent: '#22c55e',
      accentLight: '#4ade80',
      accentDark: '#16a34a',
      gradientStart: '#06b6d4',
      gradientMiddle: '#8b5cf6',
      gradientEnd: '#22c55e',
      bgStart: '#020617',
      bgMiddle: '#0f172a',
      bgEnd: '#020617',
      textPrimary: '#e2e8f0',
      textSecondary: '#64748b',
      textAccent: '#22d3ee',
      border: 'rgba(6, 182, 212, 0.2)',
      sidebar: 'rgba(15, 23, 42, 0.95)',
      sidebarHover: 'rgba(6, 182, 212, 0.12)',
      inputArea: 'rgba(15, 23, 42, 0.7)',
      inputBg: 'rgba(30, 41, 59, 0.9)',
      bubbleAssistant: 'rgba(15, 23, 42, 0.7)',
      bubbleAssistantBorder: 'rgba(6, 182, 212, 0.2)',
      cardBg: 'rgba(15, 23, 42, 0.95)',
      cardHover: 'rgba(6, 182, 212, 0.1)',
      overlay: 'rgba(2, 6, 23, 0.85)',
      actionIcon: '#475569',
      actionIconHover: '#22d3ee',
      danger: '#f87171',
      dangerLight: '#fca5a5',
      dangerBg: 'rgba(248, 113, 113, 0.15)',
      success: '#4ade80',
      successLight: '#86efac',
      successBg: 'rgba(74, 222, 128, 0.15)',
      menuBg: 'rgba(15, 23, 42, 0.92)',
      shadow: 'rgba(0, 0, 0, 0.4)',
      shadowLight: 'rgba(0, 0, 0, 0.2)',
    },
    isDark: true,
  },
]

let currentTheme: Theme = themes[0]
const THEME_STORAGE_KEY = 'role_play_theme'

export function getTheme(): Theme {
  return currentTheme
}

export function setTheme(themeId: string): void {
  const theme = themes.find(t => t.id === themeId)
  if (theme) {
    currentTheme = theme
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
    applyTheme(theme)
  }
}

export function loadTheme(): void {
  const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedThemeId) {
    const theme = themes.find(t => t.id === savedThemeId)
    if (theme) {
      currentTheme = theme
    }
  }
  applyTheme(currentTheme)
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement

  // 动态更新 meta theme-color 标签
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
