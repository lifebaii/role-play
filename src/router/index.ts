import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'
import { config } from '@/utils/config'

const routes = [
  {
    path: '/',
    redirect: '/chat'
  },
  {
    path: '/login',
    redirect: '/chat'
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/chat/ChatView.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'characters',
        name: 'Characters',
        component: () => import('@/views/admin/Characters.vue')
      },
      {
        path: 'characters/new',
        name: 'CharacterNew',
        component: () => import('@/views/admin/CharacterForm.vue')
      },
      {
        path: 'characters/:id/edit',
        name: 'CharacterEdit',
        component: () => import('@/views/admin/CharacterForm.vue')
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/admin/Users.vue')
      },
      {
        path: 'presets',
        name: 'Presets',
        component: () => import('@/views/admin/Presets.vue')
      },
      {
        path: 'worldinfo',
        name: 'WorldInfo',
        component: () => import('@/views/admin/WorldInfo.vue')
      },
      {
        path: 'regex',
        name: 'Regex',
        component: () => import('@/views/admin/Regex.vue')
      },
      {
        path: 'optimization-presets',
        name: 'OptimizationPresets',
        component: () => import('@/views/admin/OptimizationPresets.vue')
      },
      {
        path: 'models',
        name: 'Models',
        component: () => import('@/views/admin/Models.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/admin/Settings.vue')
      },
      {
        path: 'character-viewer',
        name: 'CharacterViewer',
        component: () => import('@/views/admin/CharacterViewer.vue')
      },
      {
        path: 'filesystem',
        name: 'FileSystem',
        component: () => import('@/views/admin/FileSystem.vue')
      }
    ]
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/Login.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const adminStore = useAdminStore()
  
  // 在任何路径下都检查 URL 中的 token 参数
  const urlParams = new URLSearchParams(window.location.search)
  const tokenFromUrl = urlParams.get('token')
  
  if (tokenFromUrl) {
    try {
      await userStore.loginWithToken(tokenFromUrl)
      // 清除 URL 中的 token 参数
      const newUrl = window.location.pathname + window.location.hash
      window.history.replaceState({}, document.title, newUrl)
    } catch (error) {
      console.error('Failed to login with token:', error)
    }
  }
  
  // 检查是否是管理员路由（包括登录页面）
  if (to.path.startsWith('/admin')) {
    // 如果不显示认证入口，则重定向到聊天页面
    if (!config.showAuthEntry) {
      next('/chat')
      return
    }
  }
  
  // 检查是否是管理员路由（不包括登录页面）
  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    console.log('[Router] Checking admin auth for:', to.path)
    
    // 快速检查：如果已验证或有token，直接放行，不等待异步
    if (adminStore.isLoggedIn && adminStore.hasVerified) {
      next()
      return
    }
    
    // 否则再完整验证
    const isValid = await adminStore.checkAuth()
    if (!isValid) {
      console.log('[Router] Not authenticated, redirecting to admin login')
      next('/admin/login')
      return
    }
    next()
    return
  }
  
  // 如果是管理员登录页面但已登录，则重定向到管理员首页
  if (to.path === '/admin/login') {
    if (adminStore.isLoggedIn && adminStore.hasVerified) {
      next('/admin')
      return
    }
    
    const isValid = await adminStore.checkAuth()
    if (isValid) {
      next('/admin')
      return
    }
  }
  
  if (to.path === '/chat') {
    if (userStore.isLoggedIn()) {
      try {
        await userStore.verify()
      } catch (error) {
        console.log('Token verification failed, continuing as anonymous user')
      }
    }
    
    next()
    return
  }
  
  if (to.path === '/login') {
    if (userStore.isLoggedIn()) {
      next('/chat')
      return
    }
    next('/chat')
    userStore.requireLogin()
    return
  }
  
  next()
})

export default router
