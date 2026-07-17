import { createI18n } from 'vue-i18n'
import type { LocaleMessages, SupportedLocale } from './types'
import zhCN from './zh-CN'
import enUS from './en-US'

const messages: Record<SupportedLocale, LocaleMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

function getDefaultLocale(): SupportedLocale {
  const savedLocale = localStorage.getItem('app_language')
  if (savedLocale && Object.keys(messages).includes(savedLocale)) {
    return savedLocale as SupportedLocale
  }
  
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }
  
  return 'en-US'
}

export const i18n = createI18n<[LocaleMessages], SupportedLocale>({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en-US',
  messages,
  missingWarn: false,
  fallbackWarn: false,
})

export function setI18nLanguage(locale: SupportedLocale): void {
  i18n.global.locale.value = locale
  document.documentElement.setAttribute('lang', locale)
  localStorage.setItem('app_language', locale)
}

export function getI18nLocale(): SupportedLocale {
  return i18n.global.locale.value as SupportedLocale
}

export { messages }
export type { LocaleMessages, SupportedLocale } from './types'
