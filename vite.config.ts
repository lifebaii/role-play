import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

const removeManifestPlugin = (): Plugin => ({
  name: 'remove-manifest',
  transformIndexHtml(html) {
    return html.replace(/<link rel="manifest" href="\/manifest\.webmanifest" \/>/g, '')
  }
})

function getBeijingTime(): string {
  const now = new Date()
  const beijingOffset = 8 * 60
  const utcOffset = now.getTimezoneOffset()
  const beijingTime = new Date(now.getTime() + (beijingOffset + utcOffset) * 60 * 1000)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${beijingTime.getFullYear()}-${pad(beijingTime.getMonth() + 1)}-${pad(beijingTime.getDate())} ${pad(beijingTime.getHours())}:${pad(beijingTime.getMinutes())}:${pad(beijingTime.getSeconds())}`
}

const buildTime = getBeijingTime()

export default defineConfig(({ command, mode }) => {
  const isDev = mode === 'development'

  return {
    base: './',
    define: {
      __APP_BUILD_TIME__: JSON.stringify(buildTime)
    },
    plugins: [
      vue(),
      ...(isDev ? [removeManifestPlugin()] : []),
      ...(!isDev ? [VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png'],
        manifest: {
          name: 'Role-Play',
          short_name: 'RolePlay',
          description: 'Role-Play - Role Play & Chat Application',
          theme_color: '#1f2937',
          background_color: '#f3f4f6',
          display: 'standalone',
          start_url: './',
          icons: [
            {
              src: './pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: './pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: './pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallbackDenylist: [/^\/api\/.*/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })] : [])
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: resolve(__dirname, './dist'),
      emptyOutDir: true
    }
  }
})
