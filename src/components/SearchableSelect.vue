<template>
  <div class="searchable-select relative">
    <!-- 输入框 -->
    <div class="relative">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        ref="inputRef"
        type="text"
        v-model="searchText"
        :placeholder="placeholder"
        :disabled="disabled"
        @focus="isOpen = true"
        @blur="handleBlur"
        @input="handleInput"
        @keydown.enter.prevent="handleEnter"
        @keydown.arrow-down.prevent="handleArrowDown"
        @keydown.arrow-up.prevent="handleArrowUp"
        class="w-full pl-9 pr-10 py-3 border border-theme-border rounded-xl select-field transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        v-if="searchText"
        type="button"
        @mousedown.prevent="clearSearch"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-theme-card-hover text-theme-text-secondary"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- 下拉列表 -->
    <div
      v-if="isOpen && filteredOptions.length > 0"
      class="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-theme-card-bg border border-theme-border rounded-xl shadow-lg z-10"
    >
      <div
        v-for="(option, index) in filteredOptions"
        :key="option.id || option.value"
        @mousedown.prevent="selectOption(option)"
        @mouseenter="highlightedIndex = index"
        :class="[
          'px-4 py-2 cursor-pointer transition-colors text-sm',
          highlightedIndex === index ? 'bg-theme-primary/10' : 'hover:bg-theme-card-hover'
        ]"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface SearchableSelectOption {
  value: string
  label: string
  id?: string
}

const props = defineProps<{
  modelValue: string
  options: SearchableSelectOption[]
  placeholder?: string
  disabled?: boolean
  allowCustomValue?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const searchText = ref('')
const highlightedIndex = ref(-1)

const filteredOptions = ref<SearchableSelectOption[]>([])

// 初始化和更新筛选选项
function updateFilteredOptions() {
  if (!searchText.value.trim()) {
    filteredOptions.value = props.options
  } else {
    const filter = searchText.value.toLowerCase().trim()
    filteredOptions.value = props.options.filter(option =>
      option.label.toLowerCase().includes(filter)
    )
  }
}

watch(() => props.options, () => {
  updateFilteredOptions()
}, { immediate: true })

watch(searchText, () => {
  updateFilteredOptions()
  highlightedIndex.value = filteredOptions.value.length > 0 ? 0 : -1
})

// 当 modelValue 变化时，更新显示文本
watch(() => props.modelValue, (newValue) => {
  const selectedOption = props.options.find(option => option.value === newValue)
  searchText.value = selectedOption ? selectedOption.label : newValue
}, { immediate: true })

function selectOption(option: SearchableSelectOption) {
  emit('update:modelValue', option.value)
  searchText.value = option.label
  isOpen.value = false
}

function handleInput() {
  // 如果用户输入的内容完全匹配某个选项的 value，则选择该选项
  const exactMatch = props.options.find(option => option.value === searchText.value)
  if (exactMatch) {
    emit('update:modelValue', exactMatch.value)
  } else if (props.allowCustomValue) {
    emit('update:modelValue', searchText.value)
  }
}

function handleEnter() {
  if (highlightedIndex.value >= 0 && filteredOptions.value[highlightedIndex.value]) {
    selectOption(filteredOptions.value[highlightedIndex.value])
  }
}

function handleArrowDown() {
  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++
  }
}

function handleArrowUp() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

function handleBlur() {
  // 使用 setTimeout 避免 blur 事件在 mousedown 之前触发
  setTimeout(() => {
    isOpen.value = false
  }, 200)
}

function clearSearch() {
  searchText.value = ''
  if (props.allowCustomValue) {
    emit('update:modelValue', '')
  }
  if (inputRef.value) {
    inputRef.value.focus()
  }
}
</script>

<style scoped>
.searchable-select {
  position: relative;
}
</style>
