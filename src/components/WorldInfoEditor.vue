<template>
  <div v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div
        class="chat-card rounded-2xl border border-theme-border w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden" style="max-height: min(90vh, calc(var(--vh, 1vh) * 90));">
      <div
          class="p-4 md:p-5 border-b border-theme-border flex justify-between items-center bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10 backdrop-blur-sm flex-shrink-0 z-10">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-[var(--theme-accent)]/15 text-theme-text-accent rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253">
              </path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-theme-text-primary leading-tight">{{ isEditing ? '编辑条目' : '新建条目' }}</h3>
            <p class="text-xs text-theme-text-secondary">World Info Entry</p>
          </div>
        </div>
        <button @click="handleClose"
            class="text-theme-text-secondary hover:text-theme-text-primary hover:bg-[var(--theme-card-hover)] p-2 rounded-full transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[var(--theme-bg-start)]/30">

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label
                  class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5">名称/备注
                  (Comment)</label>
              <input v-model="localData.comment" type="text"
                  class="w-full chat-input-field border border-theme-border rounded-xl px-4 py-2.5 text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all shadow-sm font-medium"
                  placeholder="例如：主城描述">
            </div>
            <div>
              <label class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5">主关键词
                  (Keys)</label>
              <div class="relative">
                <input
                    :value="Array.isArray(localData.keys) ? localData.keys.join(', ') : ''"
                    @input="localData.keys = ($event.target as HTMLInputElement).value.split(',').map(k => k.trim()).filter(k => k)"
                    type="text"
                    class="w-full chat-input-field border border-theme-border rounded-xl px-4 py-2.5 text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none transition-all shadow-sm"
                    :class="{'border-l-4 !border-l-[var(--theme-success)]': localData.constant}"
                    placeholder="逗号分隔，留空则需勾选'常驻'">
                <div class="absolute right-2 top-2">
                  <button
                      @click="localData.constant = !localData.constant"
                      :class="['flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition-all shadow-sm active:scale-95',
                                   localData.constant ? 'bg-[var(--theme-success-bg)] border-[var(--theme-success)]/30 text-[var(--theme-success)]' : 'bg-[var(--theme-card-hover)] border-theme-border text-theme-text-secondary hover:bg-[var(--theme-sidebar-hover)]']"
                      title="常驻条目，始终插入，忽略概率">
                    <svg v-if="localData.constant" class="w-3 h-3"
                        fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-[10px] font-bold uppercase tracking-wider">{{
                        localData.constant ? '已常驻' : '设为常驻' }}</span>
                  </button>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <label
                  :class="['flex-1 flex items-center space-x-1.5 cursor-pointer px-3 py-1.5 border rounded-xl transition-all select-none shadow-sm active:scale-95',
                             localData.useRegex ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/30 text-theme-text-accent' : 'chat-card border-theme-border text-theme-text-secondary hover:border-[var(--theme-primary)]/30']">
                <input type="checkbox" v-model="localData.useRegex" class="hidden">
                <svg v-if="localData.useRegex" class="w-3.5 h-3.5" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                      d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-xs font-bold">正则匹配</span>
              </label>
              <label
                  :class="['flex-1 flex items-center space-x-1.5 cursor-pointer px-3 py-1.5 border rounded-xl transition-all select-none shadow-sm active:scale-95',
                             localData.matchWholeWords ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/30 text-theme-text-accent' : 'chat-card border-theme-border text-theme-text-secondary hover:border-[var(--theme-primary)]/30']">
                <input type="checkbox" v-model="localData.matchWholeWords"
                    class="hidden">
                <svg v-if="localData.matchWholeWords" class="w-3.5 h-3.5" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                      d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-xs font-bold">全词匹配</span>
              </label>
              <label
                  :class="['flex-1 flex items-center space-x-1.5 cursor-pointer px-3 py-1.5 border rounded-xl transition-all select-none shadow-sm active:scale-95',
                             localData.caseSensitive ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/30 text-theme-text-accent' : 'chat-card border-theme-border text-theme-text-secondary hover:border-[var(--theme-primary)]/30']">
                <input type="checkbox" v-model="localData.caseSensitive" class="hidden">
                <svg v-if="localData.caseSensitive" class="w-3.5 h-3.5" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                      d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-xs font-bold">区分大小写</span>
              </label>
            </div>
          </div>

          <div
              class="chat-card border border-theme-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div class="space-y-4">
              <div>
                <label
                    class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5">插入位置
                    (Position)</label>
                <div class="relative group">
                  <select v-model="localData.position"
                      class="w-full select-field border border-theme-border rounded-xl px-4 py-2.5 text-sm text-theme-text-primary focus:ring-4 focus:ring-[var(--theme-primary)]/10 focus:border-[var(--theme-primary)] focus:outline-none appearance-none transition-all shadow-sm cursor-pointer group-hover:border-[var(--theme-primary)]/30">
                    <optgroup label="System Prompt (系统提示词)">
                      <option value="system_top">System Top (最顶)</option>
                      <option value="global_note">Global Note (全局)</option>
                      <option value="before_char">Before Character (角色前)</option>
                      <option value="after_char">After Character (角色后)</option>
                    </optgroup>
                    <optgroup label="In-Chat (对话中)">
                      <option value="at_depth">@ Depth (按深度)</option>
                      <option value="user_top">User Message Top (用户消息顶)</option>
                      <option value="assistant_top">AI Message Top (AI消息顶)</option>
                    </optgroup>
                  </select>
                  <div
                      class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-theme-text-secondary group-hover:text-theme-text-primary transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                          d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-theme-text-secondary mb-1">顺序 (Order)</label>
                  <input type="number" v-model.number="localData.order"
                      class="w-full chat-input-field border border-theme-border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:outline-none"
                      placeholder="100">
                </div>
                <div>
                  <label
                      class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5">触发概率
                      (%)</label>
                  <div
                      :class="['flex items-center border rounded-xl transition-all overflow-hidden shadow-sm',
                               localData.useProbability ? 'border-[var(--theme-primary)]/30 ring-2 ring-[var(--theme-primary)]/10' : 'border-theme-border opacity-60']">
                    <button
                        @click="localData.useProbability = !localData.useProbability"
                        :class="['px-3 py-2 transition-colors border-r',
                                     localData.useProbability ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]' : 'bg-[var(--theme-card-hover)] text-theme-text-secondary border-theme-border']">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor"
                          viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </button>
                    <input type="number" v-model.number="localData.probability"
                        min="0" max="100"
                        class="w-full chat-input-field px-3 py-1.5 text-sm font-bold text-theme-text-primary focus:outline-none"
                        :disabled="!localData.useProbability" placeholder="100">
                  </div>
                </div>
              </div>
              <div v-if="localData.position === 'at_depth'"
                  class="pt-2 border-t border-theme-border">
                <label class="block text-xs text-theme-text-secondary mb-1">插入深度 (Depth) <span
                        class="text-[10px] text-theme-text-secondary/60">@D</span></label>
                <input type="number" v-model.number="localData.depth"
                    class="w-full chat-input-field border border-theme-border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:outline-none"
                    placeholder="4">
              </div>
            </div>
          </div>
        </div>

        <div>
          <label
              class="block text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-1.5 flex justify-between">
            <span>内容 (Content)</span>
            <span
                class="text-[10px] font-normal normal-case bg-[var(--theme-card-hover)] px-1.5 rounded text-theme-text-secondary">{{
                (localData.content || '').length }} 字符</span>
          </label>
          <textarea v-model="localData.content" rows="8"
              class="w-full chat-input-field border border-theme-border rounded-xl px-4 py-3 text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:outline-none font-mono text-sm shadow-inner leading-relaxed resize-y min-h-[150px]"
              placeholder="在此输入世界书条目的具体内容..."></textarea>
        </div>

        <details class="group border border-theme-border rounded-xl chat-card shadow-sm overflow-hidden">
          <summary
              class="flex items-center justify-between p-4 cursor-pointer bg-[var(--theme-card-hover)] hover:bg-[var(--theme-sidebar-hover)] transition-colors select-none">
            <span class="text-sm font-bold text-theme-text-primary flex items-center">
              <svg class="w-4 h-4 mr-2 text-theme-text-secondary" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z">
                </path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              高级设置 (逻辑、分组、时效、递归)
            </span>
            <svg class="w-5 h-5 text-theme-text-secondary group-open:rotate-180 transition-transform duration-300"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div class="p-6 border-t border-theme-border grid grid-cols-1 md:grid-cols-2 gap-6">

            <div class="space-y-3">
              <h4
                  class="text-xs font-bold text-theme-text-secondary uppercase tracking-wide border-b border-theme-border pb-1">
                逻辑过滤 (Selective)</h4>
              <div class="flex items-center gap-2">
                <div class="relative flex-1 group">
                  <select v-model.number="localData.selectiveLogic"
                      class="w-full select-field border border-theme-border rounded-xl px-3 py-2 text-xs text-theme-text-primary focus:ring-4 focus:ring-[var(--theme-primary)]/10 focus:border-[var(--theme-primary)] focus:outline-none appearance-none transition-all shadow-sm cursor-pointer group-hover:border-[var(--theme-primary)]/30">
                    <option :value="0">AND ANY (主词 & 任一次词)</option>
                    <option :value="1">AND ALL (主词 & 所有次词)</option>
                    <option :value="2">NOT ANY (主词 & 无任一次词)</option>
                    <option :value="3">NOT ALL (主词 & 非所有次词)</option>
                  </select>
                  <div
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-theme-text-secondary group-hover:text-theme-text-primary transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                          d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <input
                  :value="Array.isArray(localData.secondary_keys) ? localData.secondary_keys.join(', ') : ''"
                  @input="localData.secondary_keys = ($event.target as HTMLInputElement).value.split(',').map(k => k.trim()).filter(k => k)"
                  type="text"
                  class="w-full chat-input-field border border-theme-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:outline-none"
                  placeholder="次级关键词 (逗号分隔)">
            </div>

            <div class="space-y-3">
              <h4
                  class="text-xs font-bold text-theme-text-secondary uppercase tracking-wide border-b border-theme-border pb-1">
                分组 (Group)</h4>
              <div class="flex gap-2">
                <input type="text" v-model="localData.group"
                    class="flex-1 chat-input-field border border-theme-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:outline-none"
                    placeholder="组名">
                <input type="number" v-model.number="localData.groupWeight"
                    class="w-20 chat-input-field border border-theme-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:outline-none"
                    placeholder="权重">
              </div>
              <label
                  :class="['flex items-center space-x-2 cursor-pointer p-2 rounded-xl border transition-all select-none shadow-sm active:scale-95',
                             localData.preferential ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/30 text-theme-text-accent' : 'chat-card border-theme-border text-theme-text-secondary hover:border-[var(--theme-primary)]/30']">
                <input type="checkbox" v-model="localData.preferential" class="hidden">
                <div
                    :class="['w-4 h-4 rounded flex items-center justify-center border transition-colors',
                             localData.preferential ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)]' : 'bg-[var(--theme-input-bg)] border-theme-border']">
                  <svg v-if="localData.preferential" class="w-3 h-3 text-white"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4"
                        d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span class="text-xs font-bold">组内优先 (基于Order)</span>
              </label>
            </div>

            <div class="space-y-3">
              <h4
                  class="text-xs font-bold text-theme-text-secondary uppercase tracking-wide border-b border-theme-border pb-1">
                时效控制 (消息数)</h4>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-[10px] text-theme-text-secondary mb-1">持续 (Sticky)</label>
                  <input type="number" v-model.number="localData.sticky" min="0"
                      class="w-full chat-input-field border border-theme-border rounded-lg px-2 py-1.5 text-sm text-center">
                </div>
                <div>
                  <label class="block text-[10px] text-theme-text-secondary mb-1">冷却 (Cooldown)</label>
                  <input type="number" v-model.number="localData.cooldown" min="0"
                      class="w-full chat-input-field border border-theme-border rounded-lg px-2 py-1.5 text-sm text-center">
                </div>
                <div>
                  <label class="block text-[10px] text-theme-text-secondary mb-1">延迟 (Delay)</label>
                  <input type="number" v-model.number="localData.delay" min="0"
                      class="w-full chat-input-field border border-theme-border rounded-lg px-2 py-1.5 text-sm text-center">
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <h4
                  class="text-xs font-bold text-theme-text-secondary uppercase tracking-wide border-b border-theme-border pb-1">
                其他设置</h4>
              <div class="grid grid-cols-1 gap-2">
                <label
                    v-for="key in ['excludeRecursion', 'preventRecursion', 'delayUntilRecursion']"
                    :key="key"
                    :class="['flex items-center space-x-2 cursor-pointer p-2 rounded-xl border transition-all select-none shadow-sm active:scale-95',
                               localData[key] ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/30 text-theme-text-accent' : 'chat-card border-theme-border text-theme-text-secondary hover:border-[var(--theme-primary)]/30']">
                  <input type="checkbox" v-model="localData[key]" class="hidden">
                  <div
                      :class="['w-4 h-4 rounded flex items-center justify-center border transition-colors',
                               localData[key] ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)]' : 'bg-[var(--theme-input-bg)] border-theme-border']">
                    <svg v-if="localData[key]" class="w-3 h-3 text-white"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4"
                          d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span class="text-xs font-bold">{{ {excludeRecursion: '不可被递归', preventRecursion: '阻止后续递归', delayUntilRecursion: '仅在递归时触发'}[key] }}</span>
                </label>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-xs text-theme-text-secondary whitespace-nowrap">自定义扫描深度:</span>
                <input type="number" v-model.number="localData.scanDepth"
                    class="w-16 chat-input-field border border-theme-border rounded px-2 py-1 text-xs"
                    placeholder="默认">
              </div>
            </div>

          </div>
        </details>
      </div>

      <div
          class="p-4 md:p-5 border-t border-theme-border flex justify-end space-x-3 bg-gradient-to-r from-[var(--theme-gradient-start)]/5 to-[var(--theme-gradient-end)]/5 backdrop-blur-sm flex-shrink-0 z-10">
        <button @click="handleClose"
            class="px-5 py-2.5 chat-card hover:bg-[var(--theme-card-hover)] text-theme-text-primary border border-theme-border rounded-xl transition-all shadow-sm font-medium text-sm active:scale-95">取消</button>
        <button @click="handleSave"
            class="px-6 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] text-white rounded-xl transition-all shadow-md hover:shadow-lg font-bold text-sm active:scale-95 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7">
            </path>
          </svg>
          保存条目
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  visible: boolean
  editingData?: any
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: any): void
}>()

const localData = ref<any>(getDefaultWorldInfo())

const isEditing = computed(() => props.editingData !== undefined)

function getDefaultWorldInfo() {
  return {
    comment: '',
    keys: [],
    secondary_keys: [],
    content: '',
    position: 'at_depth',
    order: 100,
    depth: 4,
    probability: 100,
    useProbability: false,
    useRegex: false,
    matchWholeWords: false,
    caseSensitive: false,
    constant: false,
    selectiveLogic: 0,
    group: '',
    groupWeight: 1,
    preferential: false,
    sticky: 0,
    cooldown: 0,
    delay: 0,
    excludeRecursion: false,
    preventRecursion: false,
    delayUntilRecursion: false,
    scanDepth: undefined
  }
}

watch(() => props.editingData, (newData) => {
  if (newData) {
    localData.value = { ...getDefaultWorldInfo(), ...newData }
  } else {
    localData.value = getDefaultWorldInfo()
  }
}, { immediate: true })

function handleClose() {
  emit('update:visible', false)
}

function handleSave() {
  emit('save', { ...localData.value })
  emit('update:visible', false)
}
</script>
