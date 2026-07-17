<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[var(--theme-primary)]/10 transition-all text-theme-text-secondary hover:text-theme-text-accent"
      :title="t('settings.language')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <!-- <span class="text-xs font-medium hidden sm:inline">{{ getLocaleName(locale) }}</span> -->
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-36 rounded-xl shadow-lg bg-[var(--theme-card-bg)] border border-theme-border overflow-hidden z-50"
      >
        <div class="py-1">
          <button
            v-for="lang in availableLocales"
            :key="lang.code"
            @click="changeLocale(lang.code)"
            :class="[
              'w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors',
              locale === lang.code
                ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
                : 'text-theme-text-primary hover:bg-[var(--theme-card-hover)]'
            ]"
          >
            <span>{{ lang.nativeName }}</span>
            <svg
              v-if="locale === lang.code"
              class="w-4 h-4 text-[var(--theme-primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import type { SupportedLocale } from '@/locales/types'

const { t, locale, availableLocales, setLocale, getLocaleName } = useI18n()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function changeLocale(newLocale: SupportedLocale): void {
  setLocale(newLocale)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent): void {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
