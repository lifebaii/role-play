import { computed } from 'vue'
import { useI18n as useVueI18n } from 'vue-i18n'
import { setI18nLanguage, getI18nLocale } from '@/locales'
import type { SupportedLocale } from '@/locales/types'
import { SUPPORTED_LOCALES } from '@/locales/types'

export function useI18n() {
  const { t, locale, n, d } = useVueI18n()

  const currentLocale = computed<SupportedLocale>({
    get: () => locale.value as SupportedLocale,
    set: (value: SupportedLocale) => {
      setI18nLanguage(value)
    },
  })

  const availableLocales = SUPPORTED_LOCALES

  function setLocale(newLocale: SupportedLocale): void {
    setI18nLanguage(newLocale)
  }

  function getLocale(): SupportedLocale {
    return getI18nLocale()
  }

  function getLocaleName(code: SupportedLocale): string {
    const localeInfo = SUPPORTED_LOCALES.find((l) => l.code === code)
    return localeInfo?.nativeName || code
  }

  return {
    t,
    locale: currentLocale,
    availableLocales,
    setLocale,
    getLocale,
    getLocaleName,
    n,
    d,
  }
}
