<template>
  <div class="h-full bg-[var(--theme-bg-start)] py-6 sm:py-8 px-4">
    <div class="max-w-6xl mx-auto">

      <div class="chat-card rounded-2xl shadow-lg shadow-[var(--theme-primary)]/5 border border-theme-border p-4 sm:p-6 mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索角色名称或描述..."
              class="w-full pl-12 pr-4 py-3 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all duration-200"
            />
          </div>
          <div class="flex gap-3">
            <button
              v-if="showImport"
              type="button"
              class="flex items-center gap-2 px-4 py-3 chat-card border border-theme-border rounded-xl hover:bg-[var(--theme-card-hover)] transition-all"
            >
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="file" accept=".json,.png" multiple class="hidden" @change="$emit('import', $event)" />
                <svg class="w-5 h-5 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span class="text-sm font-medium text-theme-text-primary">导入角色</span>
              </label>
            </button>
            <button
              @click="$emit('create')"
              class="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] transition-all duration-200 shadow-md hover:shadow-lg font-medium active:scale-95"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>创建角色</span>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between mt-4 pt-4 border-t border-theme-border">
          <div class="flex items-center gap-4">
            <span class="text-sm text-theme-text-secondary">
              共 <span class="font-bold gradient-text">{{ filteredCharacters.length }}</span> 个角色
            </span>
            <div class="flex items-center gap-2">
              <select
                v-model="sortBy"
                class="px-3 py-1.5 chat-input-field border border-theme-border rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
              >
                <option value="updatedAt">最新更新</option>
                <option value="likeCount">点赞数</option>
                <option value="commentCount">评论数</option>
                <option value="createdAt">创建日期</option>
              </select>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="viewMode = 'grid'"
              :class="[
                'p-2 rounded-lg transition-all',
                viewMode === 'grid'
                  ? 'bg-[var(--theme-primary)]/10 text-theme-text-accent'
                  : 'text-theme-text-secondary hover:bg-[var(--theme-card-hover)]'
              ]"
              title="网格视图"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'p-2 rounded-lg transition-all',
                viewMode === 'list'
                  ? 'bg-[var(--theme-primary)]/10 text-theme-text-accent'
                  : 'text-theme-text-secondary hover:bg-[var(--theme-card-hover)]'
              ]"
              title="列表视图"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredCharacters.length === 0" class="chat-card rounded-2xl shadow-lg shadow-[var(--theme-primary)]/5 border border-theme-border p-12 text-center">
        <div class="w-20 h-20 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-theme-text-primary mb-2">暂无角色</h3>
        <p class="text-theme-text-secondary mb-6">点击"创建角色"按钮添加您的第一个角色</p>
        <button
          @click="$emit('create')"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] transition-all duration-200 shadow-md hover:shadow-lg font-medium"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          创建新角色
        </button>
      </div>

      <div
        v-else
        :class="[
          'grid gap-4 sm:gap-6',
          viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        ]"
      >
        <div
          v-for="(character, index) in filteredCharacters"
          :key="getCharacterId(character)"
          :class="[
            'group chat-card rounded-xl border border-theme-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[var(--theme-primary)]/10 hover:border-[var(--theme-primary)]/30 cursor-pointer',
            viewMode === 'grid' ? '' : 'flex items-center gap-4 p-4',
            { 'ring-2 ring-[var(--theme-primary)] bg-[var(--theme-primary)]/5': dragIndex === index }
          ]"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragover.prevent="handleDragOver($event, index)"
          @drop="handleDrop($event, index)"
          @dragend="handleDragEnd"
          @click="$emit('select', character)"
        >
          <div class="flex gap-4 p-4 sm:p-6">
            <div class="relative">
              <div
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-[var(--theme-card-bg)] shadow-lg"
                :class="getCharacterShared(character) ? 'bg-gradient-to-br from-[var(--theme-secondary)] to-[var(--theme-accent)]' : 'bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)]'"
              >
                <img
                  v-if="getCharacterAvatar(character)"
                  :src="getCharacterAvatar(character)"
                  :alt="getCharacterName(character)"
                  class="w-full h-full object-cover"
                  @error="handleImageError($event)"
                />
                <span v-else class="text-2xl sm:text-3xl font-bold text-white">{{ getCharacterName(character).charAt(0) || '?' }}</span>
              </div>
              <div
                v-if="showDragHandle"
                class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center cursor-move text-theme-text-secondary hover:text-[var(--theme-primary)] transition-colors"
                :class="{ 'bg-[var(--theme-primary)] text-white': dragIndex === index }"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
              </div>
              <div
                v-if="getCharacterShared(character)"
                class="absolute top-0 right-0 w-5 h-5 bg-[var(--theme-success)] rounded-bl-lg flex items-center justify-center"
                title="已分享"
              >
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2 mb-1">
                <h3 class="font-bold text-theme-text-primary text-base sm:text-lg truncate">
                  {{ getCharacterName(character) }}
                </h3>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span
                    v-if="getCharacterBook(character)?.entries?.length"
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--theme-primary)]/10 text-theme-text-accent rounded-full text-xs font-medium border border-[var(--theme-primary)]/20"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {{ getCharacterBook(character).entries.length }}
                  </span>
                  <span
                    v-if="getCharacterRegexScripts(character)?.length"
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--theme-accent)]/10 text-theme-text-accent rounded-full text-xs font-medium border border-[var(--theme-accent)]/20"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    {{ getCharacterRegexScripts(character).length }}
                  </span>
                </div>
              </div>
              <p class="text-sm text-theme-text-secondary line-clamp-2">
                {{ getCharacterDescription(character) || '暂无描述' }}
              </p>
              <div class="flex items-center gap-2 mt-3">
                <label
                  v-if="showShareToggle"
                  @click.stop
                  class="inline-flex items-center gap-2 cursor-pointer"
                >
                  <span class="relative">
                    <input
                      type="checkbox"
                      :checked="getCharacterShared(character)"
                      @change="$emit('toggleShare', character)"
                      class="sr-only peer"
                    />
                    <div class="w-9 h-5 bg-[var(--theme-card-hover)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--theme-primary)]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--theme-success)]"></div>
                  </span>
                  <span class="text-sm text-theme-text-secondary">{{ getCharacterShared(character) ? '已分享' : '分享' }}</span>
                </label>
                <button
                  @click.stop="$emit('edit', character)"
                  class="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--theme-primary)]/10 text-theme-text-accent rounded-lg text-sm font-medium hover:bg-[var(--theme-primary)]/20 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  编辑
                </button>
                <button
                  @click.stop="$emit('delete', character)"
                  class="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--theme-danger-bg)] text-[var(--theme-danger)] rounded-lg text-sm font-medium hover:opacity-80 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Character {
  id?: string
  name?: string
  description?: string
  avatar?: string
  shared?: boolean
  character_book?: {
    entries: any[]
  }
  regex_scripts?: any[]
  createdAt?: number
  updatedAt?: number
  likeCount?: number
  commentCount?: number
  spec?: string
  spec_version?: string
  data?: {
    name?: string
    description?: string
    avatar?: string
    character_book?: {
      entries: any[]
    }
    regex_scripts?: any[]
  }
  role_play?: {
    id?: string
    createdAt?: number
    updatedAt?: number
    shared?: boolean
  }
}

function getCharacterId(character: Character): string {
  return character.role_play?.id || character.id || ''
}

function getCharacterName(character: Character): string {
  return character.data?.name || character.name || ''
}

function getCharacterDescription(character: Character): string | undefined {
  return character.data?.description || character.description
}

function getCharacterAvatar(character: Character): string | undefined {
  return character.data?.avatar || character.avatar
}

function getCharacterShared(character: Character): boolean {
  return character.role_play?.shared || character.shared || false
}

function getCharacterCreatedAt(character: Character): number | undefined {
  return character.role_play?.createdAt || character.createdAt
}

function getCharacterBook(character: Character): any {
  return character.data?.character_book || character.character_book
}

function getCharacterRegexScripts(character: Character): any[] {
  return character.data?.extensions?.regex_scripts || character.extensions?.regex_scripts || []
}

const props = defineProps<{
  characters: Character[]
  showImport?: boolean
  showDragHandle?: boolean
  showShareToggle?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', character: Character): void
  (e: 'edit', character: Character): void
  (e: 'delete', character: Character): void
  (e: 'create'): void
  (e: 'import', event: Event): void
  (e: 'reorder', characters: Character[]): void
  (e: 'toggleShare', character: Character): void
}>()

const dragIndex = ref<number | null>(null)
const searchQuery = ref('')
const sortBy = ref<'updatedAt' | 'likeCount' | 'commentCount' | 'createdAt'>('updatedAt')
const viewMode = ref<'grid' | 'list'>('grid')

function getCharacterUpdatedAt(character: Character): number | undefined {
  return character.role_play?.updatedAt || character.updatedAt
}

function getCharacterLikeCount(character: Character): number {
  return character.likeCount || 0
}

function getCharacterCommentCount(character: Character): number {
  return character.commentCount || 0
}

const filteredCharacters = computed(() => {
  let result = [...props.characters]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(char => {
      const name = getCharacterName(char).toLowerCase()
      const description = (getCharacterDescription(char) || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }

  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'updatedAt':
        return (getCharacterUpdatedAt(b) || 0) - (getCharacterUpdatedAt(a) || 0)
      case 'likeCount':
        return getCharacterLikeCount(b) - getCharacterLikeCount(a)
      case 'commentCount':
        return getCharacterCommentCount(b) - getCharacterCommentCount(a)
      case 'createdAt':
        return (getCharacterCreatedAt(b) || 0) - (getCharacterCreatedAt(a) || 0)
      default:
        return 0
    }
  })

  return result
})

function handleDragStart(event: DragEvent, index: number) {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
  }
}

function handleDragOver(event: DragEvent, index: number) {
  event.preventDefault()
}

function handleDrop(event: DragEvent, targetIndex: number) {
  event.preventDefault()
  if (dragIndex.value === null || dragIndex.value === targetIndex) return

  const characters = [...props.characters]
  const [removed] = characters.splice(dragIndex.value, 1)
  characters.splice(targetIndex, 0, removed)

  emit('reorder', characters)
}

function handleDragEnd() {
  dragIndex.value = null
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
