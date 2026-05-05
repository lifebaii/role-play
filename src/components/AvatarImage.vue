<template>
  <div 
    class="avatar-image-container flex items-center justify-center overflow-hidden"
    :class="[
      sizeClass,
      roundedClass,
      { 'bg-gradient-to-br': !isLoading && (hasError || !computedSrc) },
      gradientClass
    ]"
  >
    <div 
      v-if="isLoading && computedSrc" 
      class="avatar-loading flex items-center justify-center w-full h-full bg-[var(--theme-card-hover)]"
    >
      <svg 
        class="animate-spin text-[var(--theme-primary)]" 
        :class="iconSizeClass"
        viewBox="0 0 24 24"
      >
        <circle 
          class="opacity-25" 
          cx="12" cy="12" r="10" 
          stroke="currentColor" 
          stroke-width="4" 
          fill="none"
        />
        <path 
          class="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
    
    <img
      v-show="!isLoading && !hasError && computedSrc"
      :src="computedSrc"
      :alt="alt || name"
      class="w-full h-full object-cover"
      @load="handleLoad"
      @error="handleError"
    />
    
    <span 
      v-if="!isLoading && (hasError || !computedSrc)" 
      class="font-bold text-white"
      :class="textSizeClass"
    >
      {{ placeholderText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'nav'
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  gradient?: 'primary' | 'secondary' | 'accent'
}>(), {
  name: '?',
  size: 'md',
  rounded: 'lg',
  gradient: 'primary'
})

const isLoading = ref(true)
const hasError = ref(false)

const computedSrc = computed(() => props.src)

const placeholderText = computed(() => {
  return props.name?.charAt(0)?.toUpperCase() || '?'
})

const sizeClass = computed(() => {
  const sizes: Record<string, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    nav: 'w-9 h-9 sm:w-11 sm:h-11'
  }
  return sizes[props.size] || sizes.md
})

const roundedClass = computed(() => {
  const rounded: Record<string, string> = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full'
  }
  return rounded[props.rounded] || rounded.lg
})

const gradientClass = computed(() => {
  const gradients: Record<string, string> = {
    primary: 'from-[var(--theme-primary)] to-[var(--theme-secondary)]',
    secondary: 'from-[var(--theme-secondary)] to-[var(--theme-accent)]',
    accent: 'from-[var(--theme-accent)] to-[var(--theme-primary)]'
  }
  return gradients[props.gradient] || gradients.primary
})

const iconSizeClass = computed(() => {
  const sizes: Record<string, string> = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    nav: 'w-4 h-4 sm:w-5 sm:h-5'
  }
  return sizes[props.size] || sizes.md
})

const textSizeClass = computed(() => {
  const sizes: Record<string, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
    nav: 'text-base sm:text-lg'
  }
  return sizes[props.size] || sizes.md
})

function handleLoad() {
  isLoading.value = false
  hasError.value = false
}

function handleError() {
  isLoading.value = false
  hasError.value = true
}

watch(() => props.src, (newSrc) => {
  if (newSrc) {
    isLoading.value = true
    hasError.value = false
  } else {
    isLoading.value = false
    hasError.value = false
  }
}, { immediate: true })
</script>
