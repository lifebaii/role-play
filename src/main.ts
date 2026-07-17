import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import { loadTheme } from './utils/theme'
import { migrateFromLocalStorage } from './utils/storageService'
import { installBackendRequestGuard } from './utils/backendMode'
import { i18n } from './locales'

installBackendRequestGuard()

function setViewportHeight() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}

setViewportHeight()
window.addEventListener('resize', () => {
  // Always update viewport height on resize, even for input/textarea
  setViewportHeight()
})

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const vh = window.visualViewport!.height * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
    document.documentElement.style.setProperty('--app-height', `${window.visualViewport!.height}px`)
    // Ensure input field stays visible when keyboard is open
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      setTimeout(() => {
        document.activeElement!.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  })
  window.visualViewport.addEventListener('scroll', setViewportHeight)
}

// Additional fix for Android devices: handle focus events
document.addEventListener('focusin', (e) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    // Update viewport height when input is focused
    setTimeout(() => {
      if (window.visualViewport) {
        const vh = window.visualViewport.height * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
        document.documentElement.style.setProperty('--app-height', `${window.visualViewport.height}px`)
      } else {
        setViewportHeight()
      }
      // Scroll the input into view
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }
})

document.addEventListener('focusout', () => {
  // Reset viewport height when input loses focus
  setTimeout(() => {
    setViewportHeight()
  }, 200)
})

let touchStartY = 0
document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY
}, { passive: true })

function findScrollableElement(target: EventTarget | null): HTMLElement | null {
  let element = target instanceof Element ? target : null

  while (element) {
    if (element instanceof HTMLElement) {
      const overflowY = window.getComputedStyle(element).overflowY
      const hasScrollableOverflow = (overflowY === 'auto' || overflowY === 'scroll')
        && element.scrollHeight > element.clientHeight

      if (element.dataset.scrollable === 'true' || hasScrollableOverflow) {
        return element
      }
    }

    element = element.parentElement
  }

  return null
}

document.addEventListener('touchmove', (e) => {
  const touchY = e.touches[0].clientY
  const touchDiff = touchY - touchStartY
  
  const scrollableElement = findScrollableElement(e.target)
  
  if (!scrollableElement) {
    if (document.scrollingElement && document.scrollingElement.scrollTop === 0 && touchDiff > 0) {
      e.preventDefault()
    }
  }
}, { passive: false })

loadTheme()

migrateFromLocalStorage().catch(e => console.warn('Storage migration failed:', e))

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')

function removeLoading() {
  const loading = document.getElementById('app-loading')
  if (loading) {
    loading.classList.add('hidden')
    setTimeout(() => {
      loading.remove()
    }, 300)
  }
}

removeLoading()

const isDev = import.meta.env.DEV
if (!isDev || true) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {})
    })
  }
}
