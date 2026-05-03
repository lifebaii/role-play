<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click.self="$emit('update:visible', false)">
    <div class="chat-card rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-theme-border">
      <div class="p-3 sm:p-6 border-b border-theme-border bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10">
        <div class="flex items-center justify-between">
          <h2 class="text-base sm:text-xl font-bold gradient-text">个人设置</h2>
          <button @click="$emit('update:visible', false)" class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-[var(--theme-card-hover)] text-theme-text-secondary hover:text-theme-text-primary transition-all duration-200">
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div class="p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div class="flex items-center gap-4">
          <div class="relative">
            <img
              :src="user?.avatarUrl"
              :alt="user?.name"
              class="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] shadow-lg"
            />
            <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--theme-success)] rounded-full border-2 border-[var(--theme-card-bg)]"></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-lg text-theme-text-primary truncate">
              {{ user?.name }}
            </div>
            <div class="text-sm text-theme-text-secondary">@{{ user?.login }}</div>
            <div class="text-sm text-theme-text-primary mt-1">
              称呼：<span class="font-medium text-theme-text-accent">{{ userName || '未设置' }}</span>
            </div>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="p-4 bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-secondary)]/10 rounded-xl border border-theme-border">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-theme-text-accent">剩余对话额度</span>
              <span class="text-2xl font-bold text-theme-text-accent">{{ user?.quota || 0 }}</span>
            </div>
            <p class="text-xs text-theme-text-secondary/70">每日签到可获得更多额度</p>
          </div>
          
          <div class="p-4 bg-gradient-to-r from-[var(--theme-secondary)]/10 to-[var(--theme-accent)]/10 rounded-xl border border-theme-border">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-theme-text-accent">角色上限</span>
              <div class="text-right">
                <span class="text-2xl font-bold text-theme-text-accent">{{ characterLimit?.currentCount || 0 }}</span>
                <span class="text-lg text-theme-text-secondary">/</span>
                <span class="text-lg font-medium text-theme-text-primary">{{ characterLimit?.maxLimit || 5 }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-theme-text-secondary/70">
              <span>基础: {{ characterLimit?.baseLimit || 5 }}</span>
              <span v-if="characterLimit?.bonusSlots" class="text-[var(--theme-success)]">
                点赞奖励: +{{ characterLimit.bonusSlots }} (共 {{ characterLimit.totalLikes }} 赞)
              </span>
            </div>
          </div>
          
          <div class="space-y-2">
            <button
              @click="$emit('signin')"
              :disabled="!canSigninToday"
              class="w-full py-3 px-4 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
              <span>{{ canSigninToday ? '签到领取奖励' : '今日已签到' }}</span>
            </button>
            
            <div v-if="signinMessage" class="p-3 bg-[var(--theme-success-bg)] rounded-lg text-sm text-[var(--theme-success)] text-center">
              {{ signinMessage }}
            </div>
          </div>
          
          <div class="pt-2 border-t border-theme-border">
            <button
              @click="$emit('editUserName')"
              class="w-full py-2 px-4 text-theme-text-secondary hover:text-theme-text-accent hover:bg-[var(--theme-card-hover)] rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              修改称呼
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '@/stores/user'

defineProps<{
  visible: boolean
  user: User | null
  userName: string
  canSigninToday: boolean
  signinMessage: string
  characterLimit: {
    currentCount: number
    baseLimit: number
    bonusSlots: number
    totalLikes: number
    maxLimit: number
  } | null
}>()

defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'signin'): void
  (e: 'editUserName'): void
}>()
</script>
