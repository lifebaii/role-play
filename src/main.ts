import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import { loadTheme } from './utils/theme'
import { migrateFromLocalStorage } from './utils/storageService'

function setViewportHeight() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}

setViewportHeight()
window.addEventListener('resize', () => {
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
    return
  }
  setViewportHeight()
})

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const vh = window.visualViewport!.height * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
    document.documentElement.style.setProperty('--app-height', `${window.visualViewport!.height}px`)
  })
  window.visualViewport.addEventListener('scroll', setViewportHeight)
}

let touchStartY = 0
document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY
}, { passive: true })

document.addEventListener('touchmove', (e) => {
  const touchY = e.touches[0].clientY
  const touchDiff = touchY - touchStartY
  
  const scrollableElement = (e.target as HTMLElement).closest('[data-scrollable="true"]')
  
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
