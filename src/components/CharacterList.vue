<template>
  <div class="h-full bg-[var(--theme-bg-start)] py-6 sm:py-8 px-4 relative">
    <div
      v-if="loading"
      class="absolute inset-0 bg-[var(--theme-bg-start)]/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
        <span class="text-theme-text-primary font-medium">处理中...</span>
      </div>
    </div>
    <div class="max-w-6xl mx-auto">
      <slot name="header"></slot>
      <div class="chat-card rounded-2xl shadow-lg shadow-[var(--theme-primary)]/5 border border-theme-border p-4 sm:p-6 mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="localSearchQuery"
              type="text"
              placeholder="搜索角色名称或描述..."
              class="w-full pl-12 pr-4 py-3 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all duration-200"
              @keyup.enter="handleSearchSubmit"
            />
          </div>
          <div class="flex gap-3">
            <button
              v-if="showBatchOperations"
              @click="toggleBatchMode"
              :class="[
                'flex items-center gap-2 px-4 py-3 rounded-xl transition-all',
                batchMode
                  ? 'bg-[var(--theme-primary)] text-white'
                  : 'chat-card border border-theme-border hover:bg-[var(--theme-card-hover)]'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span class="text-sm font-medium">{{ batchMode ? '取消选择' : '批量操作' }}</span>
            </button>
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
              共 <span class="font-bold gradient-text">{{ total }}</span> 个角色
            </span>
            <div class="flex items-center gap-2">
              <select
                v-model="localSortBy"
                class="px-3 py-1.5 chat-input-field border border-theme-border rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                @change="handleSortChange"
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

      <div v-if="characters.length === 0" class="chat-card rounded-2xl shadow-lg shadow-[var(--theme-primary)]/5 border border-theme-border p-12 text-center">
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

      <div v-else>
        <div
          v-if="batchMode"
          class="flex items-center gap-3 mb-4 p-3 chat-card rounded-xl border border-theme-border"
        >
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate="isSomeSelected && !isAllSelected"
              @change="toggleSelectAll"
              class="w-5 h-5 rounded border-theme-border text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
            />
            <span class="text-sm font-medium text-theme-text-primary">全选</span>
          </label>
          <span class="text-sm text-theme-text-secondary">
            已选择 <span class="font-bold text-[var(--theme-primary)]">{{ selectedIds.length }}</span> 个角色
          </span>
        </div>

        <div
          :class="[
            'grid gap-4 sm:gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          ]"
        >
          <div
            v-for="(character, index) in characters"
            :key="getCharacterId(character)"
            :class="[
              'group chat-card rounded-xl border border-theme-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[var(--theme-primary)]/10 hover:border-[var(--theme-primary)]/30',
              batchMode ? 'cursor-pointer' : 'cursor-pointer',
              viewMode === 'grid' ? '' : 'flex items-center gap-4 p-4',
              { 'ring-2 ring-[var(--theme-primary)] bg-[var(--theme-primary)]/5': dragIndex === index },
              { 'ring-2 ring-[var(--theme-primary)] bg-[var(--theme-primary)]/10': batchMode && isSelected(getCharacterId(character)) }
            ]"
            :draggable="!batchMode && showDragHandle"
            @dragstart="batchMode ? null : handleDragStart($event, index)"
            @dragover.prevent="batchMode ? null : handleDragOver($event, index)"
            @drop="batchMode ? null : handleDrop($event, index)"
            @dragend="batchMode ? null : handleDragEnd"
            @click="batchMode ? toggleSelect(getCharacterId(character)) : $emit('select', character)"
          >
            <div class="flex gap-4 p-4 sm:p-6">
              <div class="relative">
                <div
                  v-if="batchMode"
                  class="absolute -top-2 -left-2 z-10"
                  @click.stop="toggleSelect(getCharacterId(character))"
                >
                  <div
                    :class="[
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected(getCharacterId(character))
                        ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)]'
                        : 'bg-[var(--theme-card-bg)] border-theme-border hover:border-[var(--theme-primary)]'
                    ]"
                  >
                    <svg
                      v-if="isSelected(getCharacterId(character))"
                      class="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <AvatarImage
                  :src="getCharacterAvatar(character)"
                  :name="getCharacterName(character)"
                  size="lg"
                  rounded="lg"
                  :gradient="getCharacterShared(character) ? 'secondary' : 'primary'"
                  class="border-2 border-[var(--theme-card-bg)] shadow-lg flex-shrink-0"
                />
                <div
                  v-if="showDragHandle && !batchMode"
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
                <div v-if="!batchMode" class="flex items-center gap-2 mt-3">
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

      <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-6">
        <button
          @click="$emit('pageChange', page - 1)"
          :disabled="page <= 1"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            page <= 1
              ? 'bg-[var(--theme-card-hover)] text-theme-text-secondary/50 cursor-not-allowed'
              : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
          ]"
        >
          上一页
        </button>
        <div class="flex items-center gap-1">
          <button
            v-for="p in displayedPages"
            :key="p"
            @click="$emit('pageChange', p)"
            :class="[
              'w-10 h-10 rounded-lg text-sm font-medium transition-all',
              p === page
                ? 'bg-[var(--theme-primary)] text-white'
                : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
            ]"
          >
            {{ p }}
          </button>
        </div>
        <button
          @click="$emit('pageChange', page + 1)"
          :disabled="page >= totalPages"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            page >= totalPages
              ? 'bg-[var(--theme-card-hover)] text-theme-text-secondary/50 cursor-not-allowed'
              : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
          ]"
        >
          下一页
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-if="batchMode && selectedIds.length > 0"
        class="fixed bottom-0 left-0 right-0 bg-[var(--theme-card-bg)] border-t border-theme-border shadow-lg z-40 p-4"
      >
        <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-theme-text-secondary">
              已选择 <span class="font-bold text-[var(--theme-primary)]">{{ selectedIds.length }}</span> 个角色
            </span>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="handleBatchShare(true)"
              class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--theme-success)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              批量分享
            </button>
            <button
              @click="handleBatchShare(false)"
              class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--theme-card-hover)] text-theme-text-primary rounded-lg text-sm font-medium hover:bg-[var(--theme-card-hover)]/80 transition-colors border border-theme-border"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              取消分享
            </button>
            <button
              @click="handleBatchDelete"
              class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--theme-danger)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              批量删除
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AvatarImage from './AvatarImage.vue'

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
  thumbnailUrl?: string
  sourceUrl?: string
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
  if (character.thumbnailUrl) {
    return character.thumbnailUrl
  }
  return character.data?.avatar || character.avatar
}

function getCharacterShared(character: Character): boolean {
  return character.role_play?.shared || character.shared || false
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
  showBatchOperations?: boolean
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
}>()

const emit = defineEmits<{
  (e: 'select', character: Character): void
  (e: 'edit', character: Character): void
  (e: 'delete', character: Character): void
  (e: 'create'): void
  (e: 'import', event: Event): void
  (e: 'reorder', characters: Character[]): void
  (e: 'toggleShare', character: Character): void
  (e: 'pageChange', page: number): void
  (e: 'search', query: string): void
  (e: 'sortChange', sortBy: string): void
  (e: 'batchDelete', ids: string[]): void
  (e: 'batchShare', ids: string[], shared: boolean): void
}>()

const dragIndex = ref<number | null>(null)
const localSearchQuery = ref('')
const localSortBy = ref<'updatedAt' | 'likeCount' | 'commentCount' | 'createdAt'>('updatedAt')
const viewMode = ref<'grid' | 'list'>('grid')
const batchMode = ref(false)
const selectedIds = ref<string[]>([])

const total = computed(() => props.total ?? props.characters.length)
const page = computed(() => props.page ?? 1)
const totalPages = computed(() => props.totalPages ?? 1)

const isAllSelected = computed(() => {
  return props.characters.length > 0 && selectedIds.value.length === props.characters.length
})

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0
})

const displayedPages = computed(() => {
  const pages: number[] = []
  const current = page.value
  const total = totalPages.value
  
  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)
  
  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4)
    } else if (end === total) {
      start = Math.max(1, end - 4)
    }
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

function handleSearchSubmit() {
  emit('search', localSearchQuery.value)
}

function handleSortChange() {
  emit('sortChange', localSortBy.value)
}

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

function toggleBatchMode() {
  batchMode.value = !batchMode.value
  if (!batchMode.value) {
    selectedIds.value = []
  }
}

function isSelected(id: string): boolean {
  return selectedIds.value.includes(id)
}

function toggleSelect(id: string) {
  const index = selectedIds.value.indexOf(id)
  if (index === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(index, 1)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = props.characters.map(c => getCharacterId(c))
  }
}

function handleBatchShare(shared: boolean) {
  emit('batchShare', [...selectedIds.value], shared)
}

function handleBatchDelete() {
  emit('batchDelete', [...selectedIds.value])
}

watch(() => props.characters, () => {
  selectedIds.value = []
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
