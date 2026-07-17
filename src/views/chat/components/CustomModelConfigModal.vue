<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-2 sm:p-4" @click.self="$emit('update:visible', false)">
    <div class="chat-card rounded-2xl sm:rounded-3xl max-w-full sm:max-w-4xl w-full overflow-hidden flex flex-col shadow-2xl border border-theme-border" style="max-height: min(95vh, calc(var(--vh, 1vh) * 95));">
      <div class="p-3 sm:p-6 border-b border-theme-border flex items-center justify-between bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10">
        <h2 class="text-base sm:text-xl font-bold gradient-text flex items-center gap-2">
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573-1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065 2.573c-.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.066z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span class="hidden sm:inline">{{ t('model.customModelConfig') }}</span>
          <span class="sm:hidden">{{ t('model.modelConfigShort') }}</span>
        </h2>
        <button @click="$emit('update:visible', false)" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--theme-card-hover)] text-theme-text-secondary hover:text-theme-text-primary transition-all duration-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- 移动端标签页切换 -->
      <div class="sm:hidden border-b border-theme-border">
        <div class="flex">
          <button
            @click="mobileTab = 'list'"
            :class="[
              'flex-1 py-3 text-sm font-medium transition-all',
              mobileTab === 'list' 
                ? 'text-theme-primary border-b-2 border-theme-primary' 
                : 'text-theme-text-secondary'
            ]"
          >
            {{ t('model.configList') }}
          </button>
          <button
            @click="mobileTab = 'form'"
            :class="[
              'flex-1 py-3 text-sm font-medium transition-all',
              mobileTab === 'form' 
                ? 'text-theme-primary border-b-2 border-theme-primary' 
                : 'text-theme-text-secondary'
            ]"
          >
            {{ t('model.configDetails') }}
          </button>
        </div>
      </div>
      
      <div class="flex flex-1 overflow-hidden flex-col sm:flex-row">
        <!-- 左侧配置列表 - 桌面端显示 -->
        <div class="hidden sm:block w-64 border-r border-theme-border bg-[var(--theme-card-bg)]/50 flex flex-col">
          <div class="p-4 border-b border-theme-border">
            <button 
              @click="addNewConfig"
              class="w-full px-4 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              {{ t('model.addNewConfig') }}
            </button>
          </div>
          <div 
            class="flex-1 overflow-y-auto p-2 space-y-1 overscroll-contain"
            style="touch-action: pan-y; -webkit-overflow-scrolling: touch;"
            @touchmove.stop
          >
            <div 
              v-for="config in modelConfigStore.configs" 
              :key="config.id"
              @click="selectConfig(config.id)"
              :class="[
                'p-3 rounded-xl cursor-pointer transition-all border',
                selectedConfigId === config.id 
                  ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/30' 
                  : 'hover:bg-[var(--theme-card-hover)] border-transparent'
              ]"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium text-theme-text-primary truncate">
                  {{ config.name || config.default_model || t('model.unnamedConfig') }}
                </span>
                <div class="flex items-center gap-1">
                  <span v-if="config.is_default" class="text-xs px-2 py-0.5 bg-[var(--theme-success)]/20 text-[var(--theme-success)] rounded-full">{{ t('model.default') }}</span>
                  <span v-if="modelConfigStore.activeConfigId === config.id" class="text-xs px-2 py-0.5 bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] rounded-full">{{ t('model.active') }}</span>
                </div>
              </div>
              <div class="text-xs text-theme-text-secondary mt-1 truncate">
                {{ config.provider }} · {{ config.api_url || t('model.notConfigured') }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 移动端配置列表 -->
        <div 
          v-if="mobileTab === 'list'" 
          class="sm:hidden flex-1 overflow-y-auto overscroll-contain"
          style="touch-action: pan-y; -webkit-overflow-scrolling: touch;"
          @touchmove.stop
        >
          <div class="p-3 border-b border-theme-border">
            <button 
              @click="addNewConfig"
              class="w-full px-4 py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              {{ t('model.addNewConfig') }}
            </button>
          </div>
          <div class="p-2 space-y-2">
            <div 
              v-for="config in modelConfigStore.configs" 
              :key="config.id"
              @click="selectConfig(config.id); mobileTab = 'form'"
              :class="[
                'p-4 rounded-xl cursor-pointer transition-all border',
                selectedConfigId === config.id 
                  ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/30' 
                  : 'hover:bg-[var(--theme-card-hover)] border-transparent'
              ]"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium text-theme-text-primary truncate">
                  {{ config.name || config.default_model || t('model.unnamedConfig') }}
                </span>
                <div class="flex items-center gap-1">
                  <span v-if="config.is_default" class="text-xs px-2 py-0.5 bg-[var(--theme-success)]/20 text-[var(--theme-success)] rounded-full">{{ t('model.default') }}</span>
                  <span v-if="modelConfigStore.activeConfigId === config.id" class="text-xs px-2 py-0.5 bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] rounded-full">{{ t('model.active') }}</span>
                </div>
              </div>
              <div class="text-sm text-theme-text-secondary mt-2">
                {{ config.provider }} · {{ config.api_url || t('model.notConfigured') }}
              </div>
              <div v-if="config.default_model" class="text-xs text-theme-text-secondary mt-1 truncate">
                {{ config.default_model }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 右侧配置表单 -->
        <div 
          v-if="mobileTab === 'form'" 
          class="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-5 overscroll-contain"
          style="touch-action: pan-y; -webkit-overflow-scrolling: touch;"
          @touchmove.stop
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-theme-text-primary">{{ t('model.enableCustomModel') }}</span>
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
          
          <template v-if="selectedConfig">
            <!-- 配置名称 -->
            <div>
              <label class="block text-sm font-medium text-theme-text-primary mb-2">{{ t('model.configName') }}</label>
              <input
                type="text"
                :value="selectedConfig.name"
                @input="updateSelectedConfig('name', ($event.target as HTMLInputElement).value)"
                :placeholder="t('model.configNamePlaceholder')"
                class="w-full px-4 py-3 border border-theme-border rounded-xl chat-input-field transition-all text-base"
              />
            </div>
            
            <!-- 提供商 -->
            <div>
              <label class="block text-sm font-medium text-theme-text-primary mb-2">{{ t('model.provider') }}</label>
              <select
                :value="selectedConfig.provider"
                @input="updateSelectedConfig('provider', ($event.target as HTMLSelectElement).value)"
                class="w-full px-4 py-3 border border-theme-border rounded-xl select-field transition-all text-base"
              >
                <option value="openai">{{ t('model.openaiCompatible') }}</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
            
            <!-- API 地址 -->
            <div>
              <label class="block text-sm font-medium text-theme-text-primary mb-2">{{ t('model.apiUrl') }}</label>
              <input
                type="text"
                :value="selectedConfig.api_url"
                @input="updateSelectedConfig('api_url', ($event.target as HTMLInputElement).value)"
                :placeholder="selectedConfig.provider === 'anthropic' ? 'https://api.anthropic.com' : 'https://api.openai.com/v1'"
                class="w-full px-4 py-3 border border-theme-border rounded-xl chat-input-field transition-all text-base"
              />
            </div>
            
            <!-- API Key -->
            <div>
              <label class="block text-sm font-medium text-theme-text-primary mb-2">{{ t('model.apiKey') }}</label>
              <input
                type="password"
                :value="selectedConfig.api_key"
                @input="updateSelectedConfig('api_key', ($event.target as HTMLInputElement).value)"
                placeholder="sk-..."
                class="w-full px-4 py-3 border border-theme-border rounded-xl chat-input-field transition-all text-base"
              />
            </div>
            
            <!-- 模型选择 -->
            <div>
              <label class="block text-sm font-medium text-theme-text-primary mb-2">{{ t('model.model') }}</label>
              <div class="flex flex-col sm:flex-row gap-2">
                  <SearchableSelect
                    v-if="selectedConfig"
                    v-model="selectedConfig.default_model"
                    :options="getModelOptions"
                    :placeholder="t('model.searchOrSelectModel')"
                    :disabled="isFetchingModels"
                    allow-custom-value
                    class="flex-1"
                  />
                <button
                  @click="fetchModelsForSelectedConfig"
                  :disabled="isFetchingModels || !selectedConfig.api_key || !selectedConfig.api_url"
                  class="px-4 py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl font-medium shadow-lg shadow-[var(--theme-primary)]/25 hover:shadow-xl hover:shadow-[var(--theme-primary)]/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg v-if="isFetchingModels" class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  {{ t('model.fetchModels') }}
                </button>
              </div>
            </div>
            
            <div v-if="fetchModelsError" class="p-3 bg-[var(--theme-danger-bg)] border border-[var(--theme-danger)]/30 rounded-xl text-sm text-[var(--theme-danger)]">
              {{ fetchModelsError }}
            </div>
            
            <!-- 操作按钮 - 移动端垂直排列 -->
            <div class="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                v-if="modelConfigStore.activeConfigId !== selectedConfig.id"
                @click="useThisConfig"
                class="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-[var(--theme-success)] to-[var(--theme-success-light)] text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {{ t('model.useThisConfig') }}
              </button>
              
              <button
                v-if="!selectedConfig.is_default"
                @click="setAsDefault"
                class="w-full sm:w-auto px-4 py-3 bg-[var(--theme-card-hover)] text-theme-text-primary rounded-xl font-medium hover:bg-[var(--theme-card-hover)]/80 transition-all flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
                {{ t('model.setAsDefault') }}
              </button>
              
              <button
                @click="duplicateThisConfig"
                class="w-full sm:w-auto px-4 py-3 bg-[var(--theme-card-hover)] text-theme-text-primary rounded-xl font-medium hover:bg-[var(--theme-card-hover)]/80 transition-all flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                {{ t('model.duplicateConfig') }}
              </button>
              
              <button
                v-if="modelConfigStore.configs.length > 1"
                @click="deleteThisConfig"
                class="w-full sm:w-auto px-4 py-3 bg-[var(--theme-danger)]/10 text-[var(--theme-danger)] rounded-xl font-medium hover:bg-[var(--theme-danger)]/20 transition-all flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                {{ t('model.deleteConfig') }}
              </button>
            </div>
          </template>
          
          <div v-else class="text-center py-12 text-theme-text-secondary">
            <div class="mb-4">
              <svg class="w-16 h-16 mx-auto text-theme-text-secondary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <p>{{ t('model.selectOrCreateConfig') }}</p>
          </div>
          
          <div class="p-4 bg-gradient-to-r from-[var(--theme-primary)]/5 to-[var(--theme-secondary)]/5 border border-[var(--theme-primary)]/20 rounded-xl">
            <div class="flex items-center gap-2 text-theme-text-primary mb-2">
              <svg class="w-5 h-5 text-[var(--theme-primary)]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <span class="font-medium">{{ t('model.tip') }}</span>
            </div>
            <p class="text-sm text-theme-text-secondary">{{ t('model.loginTip') }}</p>
          </div>
        </div>
      </div>
      
      <div class="p-4 sm:p-6 border-t border-theme-border bg-gradient-to-r from-[var(--theme-bg-start)]/30 to-[var(--theme-bg-end)]/30 flex gap-3">
        <button
          @click="$emit('update:visible', false)"
          class="flex-1 px-4 py-3 text-theme-text-primary chat-card border border-theme-border rounded-xl font-medium hover:bg-[var(--theme-card-hover)] transition-all text-base"
        >
          {{ t('model.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useModelConfigStore, type ModelConfig } from '@/stores/modelConfig'
import SearchableSelect from '@/components/SearchableSelect.vue'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  selectedConfigId?: string | null
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

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:selectedConfigId', value: string | null): void
  (e: 'toggleUseCustomModel'): void
  (e: 'updateConfig', field: string, value: string): void
  (e: 'fetchModels', configId: string): void
}>()

// 从父组件接收的 composable 方法
const modelConfigStore = useModelConfigStore()

// 本地状态 - 使用 computed 和手动 emit 来处理双向绑定
const localSelectedConfigId = computed({
  get: () => props.selectedConfigId ?? null,
  set: (val: string | null) => emit('update:selectedConfigId', val)
})
const mobileTab = ref<'list' | 'form'>('form')

// 计算属性
const selectedConfig = computed(() => {
  if (!localSelectedConfigId.value) return null
  return modelConfigStore.configs.find(c => c.id === localSelectedConfigId.value) || null
})

const getAvailableModelsForSelectedConfig = computed(() => {
  if (!localSelectedConfigId.value) return []
  const models = modelConfigStore.modelLists[localSelectedConfigId.value]
  if (models) {
    return models.map(m => m.id)
  }
  return []
})

const getModelOptions = computed(() => {
  const models = getAvailableModelsForSelectedConfig.value
  return models.map(model => ({
    value: model,
    label: model
  }))
})

// 监听 visible 变化，初始化选中配置
watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (!localSelectedConfigId.value && modelConfigStore.configs.length > 0) {
      localSelectedConfigId.value = modelConfigStore.activeConfigId || modelConfigStore.configs[0].id
    }
    // 移动端默认显示配置列表
    if (window.innerWidth < 640 && !modelConfigStore.activeConfigId) {
      mobileTab.value = 'list'
    }
  }
})

// 方法
function selectConfig(id: string) {
  localSelectedConfigId.value = id
}

function addNewConfig() {
  const newConfig = modelConfigStore.addConfig({
    name: `${t('model.configName')} ${modelConfigStore.configs.length + 1}`
  })
  localSelectedConfigId.value = newConfig.id
  mobileTab.value = 'form'
}

function updateSelectedConfig(field: keyof ModelConfig, value: any) {
  if (!localSelectedConfigId.value) return
  
  // 特殊处理 provider 变化时自动设置 api_url
  if (field === 'provider') {
    const newApiUrl = value === 'anthropic' ? 'https://api.anthropic.com' : 'https://api.openai.com/v1'
    modelConfigStore.updateConfig(localSelectedConfigId.value, {
      [field]: value,
      api_url: newApiUrl
    })
  } else {
    modelConfigStore.updateConfig(localSelectedConfigId.value, { [field]: value })
  }
}

async function fetchModelsForSelectedConfig() {
  if (!localSelectedConfigId.value) return
  await emit('fetchModels', localSelectedConfigId.value)
}

function useThisConfig() {
  if (!localSelectedConfigId.value) return
  modelConfigStore.setActive(localSelectedConfigId.value)
}

function setAsDefault() {
  if (!localSelectedConfigId.value) return
  modelConfigStore.setDefault(localSelectedConfigId.value)
}

function duplicateThisConfig() {
  if (!localSelectedConfigId.value) return
  const newConfig = modelConfigStore.duplicateConfig(localSelectedConfigId.value)
  if (newConfig) {
    localSelectedConfigId.value = newConfig.id
  }
}

function deleteThisConfig() {
  if (!localSelectedConfigId.value) return
  modelConfigStore.removeConfig(localSelectedConfigId.value)
  if (modelConfigStore.configs.length > 0) {
    localSelectedConfigId.value = modelConfigStore.configs[0].id
  } else {
    localSelectedConfigId.value = null
  }
}
</script>
