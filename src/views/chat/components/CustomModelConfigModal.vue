<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click.self="$emit('update:visible', false)">
    <div class="chat-card rounded-3xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl border border-theme-border" style="max-height: min(90vh, calc(var(--vh, 1vh) * 90));">
      <div class="p-3 sm:p-6 border-b border-theme-border flex items-center justify-between bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10">
        <h2 class="text-base sm:text-xl font-bold gradient-text flex items-center gap-2">
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          自定义模型配置
        </h2>
        <button @click="$emit('update:visible', false)" class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-[var(--theme-card-hover)] text-theme-text-secondary hover:text-theme-text-primary transition-all duration-200">
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-5 overscroll-contain" data-scrollable="true" style="-webkit-overflow-scrolling: touch;">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-theme-text-primary">启用自定义模型</span>
          <button
            @click="$emit('toggleUseCustomModel')"
            class="relative w-12 h-6 rounded-full transition-colors duration-200"
            :class="useCustomModel ? 'bg-[var(--theme-primary)]' : 'bg-[var(--theme-card-hover)]'"
          >
            <span
              class="absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200"
              :class="useCustomModel ? 'translate-x-6' : 'translate-x-0'"
            />
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-1.5">提供商</label>
            <select
              :value="config?.provider || 'openai'"
              @change="$emit('updateConfig', 'provider', ($event.target as HTMLSelectElement).value)"
              class="w-full px-4 py-2.5 border border-theme-border rounded-xl select-field transition-all"
            >
              <option value="openai">OpenAI 兼容</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-1.5">API 地址</label>
            <input
              type="text"
              :value="config?.api_url || ''"
              @input="$emit('updateConfig', 'api_url', ($event.target as HTMLInputElement).value)"
              :placeholder="config?.provider === 'anthropic' ? 'https://api.anthropic.com' : 'https://api.openai.com/v1'"
              class="w-full px-4 py-2.5 border border-theme-border rounded-xl chat-input-field transition-all"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-1.5">API Key</label>
            <input
              type="password"
              :value="config?.api_key || ''"
              @input="$emit('updateConfig', 'api_key', ($event.target as HTMLInputElement).value)"
              placeholder="sk-..."
              class="w-full px-4 py-2.5 border border-theme-border rounded-xl chat-input-field transition-all"
            />
          </div>
          
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="block text-sm font-medium text-theme-text-primary mb-1.5">模型</label>
              <div class="relative">
                <select
                  :value="config?.default_model || ''"
                  @change="$emit('updateConfig', 'default_model', ($event.target as HTMLSelectElement).value)"
                  :disabled="isFetchingModels"
                  class="w-full px-4 py-2.5 border border-theme-border rounded-xl select-field transition-all pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">选择模型</option>
                  <option v-for="model in availableModels" :key="model" :value="model">
                    {{ model }}
                  </option>
                </select>
              </div>
            </div>
            <div class="pt-7">
              <button
                @click="$emit('fetchModels')"
                :disabled="isFetchingModels || !config?.api_key || !config?.api_url"
                class="px-4 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl font-medium shadow-lg shadow-[var(--theme-primary)]/25 hover:shadow-xl hover:shadow-[var(--theme-primary)]/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                <svg v-if="isFetchingModels" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                获取
              </button>
            </div>
          </div>
          
          <div v-if="fetchModelsError" class="p-3 bg-[var(--theme-danger-bg)] border border-[var(--theme-danger)]/30 rounded-xl text-sm text-[var(--theme-danger)]">
            {{ fetchModelsError }}
          </div>
          
          <div class="p-4 bg-gradient-to-r from-[var(--theme-primary)]/5 to-[var(--theme-secondary)]/5 border border-[var(--theme-primary)]/20 rounded-xl">
            <div class="flex items-center gap-2 text-theme-text-primary mb-1">
              <svg class="w-4 h-4 text-[var(--theme-primary)]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <span class="font-medium text-sm">提示</span>
            </div>
            <p class="text-sm text-theme-text-secondary">登录后可领取免费的对话额度，使用自定义模型不会扣除您的对话额度，大模型配置信息仅保存到您的浏览器本地，请放心使用</p>
          </div>
        </div>
      </div>
      
      <div class="p-6 border-t border-theme-border bg-gradient-to-r from-[var(--theme-bg-start)]/30 to-[var(--theme-bg-end)]/30 flex gap-3">
        <button
          @click="$emit('update:visible', false)"
          class="flex-1 px-4 py-2.5 text-theme-text-primary chat-card border border-theme-border rounded-xl font-medium hover:bg-[var(--theme-card-hover)] transition-all"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  useCustomModel: boolean
  config: {
    provider?: string
    api_url?: string
    api_key?: string
    default_model?: string
  } | null
  availableModels: string[]
  isFetchingModels: boolean
  fetchModelsError: string
}>()

defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'toggleUseCustomModel'): void
  (e: 'updateConfig', field: string, value: string): void
  (e: 'fetchModels'): void
}>()
</script>
