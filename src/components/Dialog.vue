<template>
  <Transition name="dialog-fade">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[99999] p-4"
      @click.self="handleBackdropClick"
      @keydown.esc="handleCancel"
    >
      <Transition name="dialog-scale">
        <div
          v-if="visible"
          class="chat-card rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-theme-border"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <div class="p-4 sm:p-6 border-b border-theme-border bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10">
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  iconBgClass
                ]"
              >
                <component :is="iconComponent" class="w-5 h-5 text-white" />
              </div>
              <h2 :id="titleId" class="text-lg font-bold text-theme-text-primary">
                {{ title }}
              </h2>
            </div>
          </div>

          <div class="p-4 sm:p-6">
            <p v-if="message" class="text-theme-text-secondary text-sm sm:text-base whitespace-pre-wrap">
              {{ message }}
            </p>

            <div v-if="type === 'prompt'" class="mt-4">
              <input
                ref="inputRef"
                v-model="inputValue"
                type="text"
                class="w-full px-4 py-2.5 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
                :placeholder="inputPlaceholder"
                @keydown.enter="handleConfirm"
              />
            </div>
          </div>

          <div class="p-4 border-t border-theme-border flex gap-3">
            <template v-if="type === 'multi-button'">
              <button
                v-for="(button, index) in buttons"
                :key="index"
                @click="handleMultiButton(button.value)"
                :class="[
                  'flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                  getButtonClass(button.variant)
                ]"
              >
                {{ button.text }}
              </button>
            </template>
            <template v-else>
              <button
                v-if="type !== 'alert'"
                @click="handleCancel"
                class="flex-1 px-4 py-2.5 chat-card text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] transition-all duration-200 font-medium border border-theme-border text-sm"
              >
                {{ cancelText }}
              </button>
              <button
                @click="handleConfirm"
                :class="[
                  'flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                  confirmButtonClass
                ]"
              >
                {{ confirmText }}
              </button>
            </template>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, shallowRef, h, type Component } from 'vue'

interface ButtonOption {
  text: string
  value: any
  variant?: 'default' | 'primary' | 'danger' | 'success'
}

export interface DialogOptions {
  type: 'alert' | 'confirm' | 'prompt' | 'multi-button'
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  inputPlaceholder?: string
  inputValue?: string
  variant?: 'default' | 'danger' | 'success'
  buttons?: ButtonOption[]
}

interface Props {
  visible: boolean
  type: 'alert' | 'confirm' | 'prompt' | 'multi-button'
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  inputPlaceholder?: string
  inputValue?: string
  variant?: 'default' | 'danger' | 'success'
  buttons?: ButtonOption[]
}

const props = withDefaults(defineProps<Props>(), {
  type: 'alert',
  title: '提示',
  confirmText: '确定',
  cancelText: '取消',
  inputPlaceholder: '请输入',
  variant: 'default',
  buttons: () => []
})

const emit = defineEmits<{
  (e: 'confirm', value?: string): void
  (e: 'cancel'): void
  (e: 'update:visible', value: boolean): void
  (e: 'multi-button', value: any): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref(props.inputValue || '')
const titleId = computed(() => `dialog-title-${Date.now()}`)

watch(() => props.visible, (newVal) => {
  if (newVal && props.type === 'prompt') {
    inputValue.value = props.inputValue || ''
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

const iconComponent = shallowRef<Component | null>(null)
const iconBgClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-gradient-to-br from-[var(--theme-danger)] to-[var(--theme-danger-light)]'
    case 'success':
      return 'bg-gradient-to-br from-[var(--theme-success)] to-[var(--theme-success-light)]'
    default:
      return 'bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)]'
  }
})

const confirmButtonClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-gradient-to-r from-[var(--theme-danger)] to-[var(--theme-danger-light)] text-white hover:opacity-90'
    case 'success':
      return 'bg-gradient-to-r from-[var(--theme-success)] to-[var(--theme-success-light)] text-white hover:opacity-90'
    default:
      return 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white hover:opacity-90'
  }
})

const InfoIcon = {
  render() {
    return h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ])
  }
}

const QuestionIcon = {
  render() {
    return h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ])
  }
}

const DangerIcon = {
  render() {
    return h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      })
    ])
  }
}

const SuccessIcon = {
  render() {
    return h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ])
  }
}

iconComponent.value = computed(() => {
  if (props.variant === 'danger') return DangerIcon
  if (props.variant === 'success') return SuccessIcon
  if (props.type === 'confirm') return QuestionIcon
  return InfoIcon
}).value

function handleBackdropClick() {
  if (props.type === 'alert') {
    handleConfirm()
  } else {
    handleCancel()
  }
}

function handleConfirm() {
  if (props.type === 'prompt') {
    emit('confirm', inputValue.value)
  } else {
    emit('confirm')
  }
  emit('update:visible', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:visible', false)
}

function handleMultiButton(value: any) {
  emit('multi-button', value)
  emit('update:visible', false)
}

function getButtonClass(variant?: string) {
  switch (variant) {
    case 'danger':
      return 'bg-gradient-to-r from-[var(--theme-danger)] to-[var(--theme-danger-light)] text-white hover:opacity-90'
    case 'success':
      return 'bg-gradient-to-r from-[var(--theme-success)] to-[var(--theme-success-light)] text-white hover:opacity-90'
    case 'primary':
      return 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white hover:opacity-90'
    default:
      return 'chat-card text-theme-text-primary hover:bg-[var(--theme-card-hover)] transition-all duration-200 font-medium border border-theme-border'
  }
}
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-scale-enter-active,
.dialog-scale-leave-active {
  transition: all 0.2s ease;
}

.dialog-scale-enter-from,
.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
