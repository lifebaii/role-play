<template>
  <div>
    <CharacterList
      v-if="characterSource !== 'orphan'"
      :characters="adminStore.characters"
      :show-import="characterSource === 'admin'"
      :show-drag-handle="characterSource === 'admin'"
      :show-share-toggle="true"
      :show-batch-operations="true"
      :loading="isLoading"
      :total="adminStore.charactersTotal"
      :page="adminStore.charactersPage"
      :page-size="adminStore.charactersPageSize"
      :total-pages="adminStore.charactersTotalPages"
      :shared-filter="adminStore.charactersSharedFilter"
      @select="handleSelect"
      @edit="handleEdit"
      @delete="handleDelete"
      @create="handleCreate"
      @import="handleImport"
      @reorder="handleReorder"
      @toggle-share="handleToggleShare"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @search="handleSearch"
      @sort-change="handleSortChange"
      @batch-delete="handleBatchDelete"
      @batch-share="handleBatchShare"
      @shared-filter-change="handleSharedFilterChange"
    >
      <template #header>
        <div class="flex gap-2 mb-4">
          <button
            @click="handleSourceChange('admin')"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              characterSource === 'admin'
                ? 'bg-[var(--theme-primary)] text-white'
                : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
            ]"
          >
            管理员角色
          </button>
          <button
            @click="handleSourceChange('user')"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              characterSource === 'user'
                ? 'bg-[var(--theme-primary)] text-white'
                : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
            ]"
          >
            用户角色
          </button>
          <button
            @click="handleSourceChange('orphan')"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              characterSource === 'orphan'
                ? 'bg-[var(--theme-primary)] text-white'
                : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
            ]"
          >
            流浪角色
          </button>
        </div>
      </template>
    </CharacterList>

    <div v-else class="h-full bg-[var(--theme-bg-start)] py-6 sm:py-8 px-4 relative">
      <div
        v-if="isLoading"
        class="absolute inset-0 bg-[var(--theme-bg-start)]/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
          <span class="text-theme-text-primary font-medium">处理中...</span>
        </div>
      </div>
      <div class="max-w-6xl mx-auto">
        <div class="flex gap-2 mb-4">
          <button
            @click="handleSourceChange('admin')"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              characterSource === 'admin'
                ? 'bg-[var(--theme-primary)] text-white'
                : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
            ]"
          >
            管理员角色
          </button>
          <button
            @click="handleSourceChange('user')"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              characterSource === 'user'
                ? 'bg-[var(--theme-primary)] text-white'
                : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
            ]"
          >
            用户角色
          </button>
          <button
            @click="handleSourceChange('orphan')"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              characterSource === 'orphan'
                ? 'bg-[var(--theme-primary)] text-white'
                : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
            ]"
          >
            流浪角色
          </button>
        </div>

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
                @keyup.enter="handleOrphanSearchSubmit"
              />
            </div>
            <div class="flex gap-3">
              <button
                @click="toggleBatchMode"
                :class="[
                  'flex items-center gap-2 px-4 py-3 rounded-xl transition-all',
                  batchMode
                    ? 'bg-[var(--theme-primary)] text-white'
                    : 'chat-card border border-theme-border hover:bg-[var(--theme-card-hover)]'
                ]"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 0 002 2h10a2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span class="text-sm font-medium">{{ batchMode ? '取消选择' : '批量操作' }}</span>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between mt-4 pt-4 border-t border-theme-border">
            <div class="flex items-center gap-4">
              <span class="text-sm text-theme-text-secondary">
                共 <span class="font-bold gradient-text">{{ adminStore.orphanedCharactersTotal }}</span> 个角色
              </span>
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 0 01-2 2H6 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 0 01-2 2h2a2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 0 01-2 2h2a2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 0 01-2 2h2a2 0 01-2-2v-2z" />
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

        <div v-if="adminStore.orphanedCharacters.length === 0" class="chat-card rounded-2xl shadow-lg shadow-[var(--theme-primary)]/5 border border-theme-border p-12 text-center">
          <div class="w-20 h-20 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-theme-text-primary mb-2">暂无不归属角色</h3>
          <p class="text-theme-text-secondary">所有角色都已正确分配给用户</p>
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
              v-for="(character, index) in adminStore.orphanedCharacters"
              :key="character.id"
              :class="[
                'group chat-card rounded-xl border border-theme-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[var(--theme-primary)]/10 hover:border-[var(--theme-primary)]/30',
                batchMode ? 'cursor-pointer' : 'cursor-default',
                viewMode === 'grid' ? '' : 'flex items-center gap-4 p-4',
                { 'ring-2 ring-[var(--theme-primary)] bg-[var(--theme-primary)]/10': batchMode && isSelected(character.id) }
              ]"
              @click="batchMode ? toggleSelect(character.id) : null"
            >
              <div class="flex gap-4 p-4 sm:p-6">
                <div class="relative">
                  <div
                    v-if="batchMode"
                    class="absolute -top-2 -left-2 z-10"
                    @click.stop="toggleSelect(character.id)"
                  >
                    <div
                      :class="[
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                        isSelected(character.id)
                          ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)]'
                          : 'bg-[var(--theme-card-bg)] border-theme-border hover:border-[var(--theme-primary)]'
                      ]"
                    >
                      <svg
                        v-if="isSelected(character.id)"
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
                    :src="character.thumbnailUrl"
                    :name="character.name"
                    size="lg"
                    rounded="lg"
                    gradient="primary"
                    class="border-2 border-[var(--theme-card-bg)] shadow-lg flex-shrink-0"
                  />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <h3 class="font-bold text-theme-text-primary text-base sm:text-lg truncate">
                      {{ character.name }}
                    </h3>
                    <div class="flex items-center gap-1">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--theme-warning)]/10 text-[var(--theme-warning)] rounded-full text-xs font-medium border border-[var(--theme-warning)]/20">
                        无归属
                      </span>
                    </div>
                  </div>
                  <p class="text-sm text-theme-text-secondary line-clamp-2">
                    {{ character.description || '暂无描述' }}
                  </p>
                  <div class="flex items-center gap-2 mt-3 text-xs text-theme-text-secondary">
                    <span>文件大小: {{ formatFileSize(character.fileSize) }}</span>
                    <span 
                      :class="getFileTypeClass(character.fileType)"
                      class="px-2 py-0.5 rounded font-medium"
                    >
                      {{ getFileTypeLabel(character.fileType) }}
                    </span>
                    <span v-if="character.hasThumbnail" class="text-[var(--theme-success)]">✓ 有缩略图</span>
                  </div>
                  <div v-if="!batchMode" class="flex items-center gap-2 mt-3">
                    <button
                      @click.stop="handleAssignCharacter(character)"
                      class="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--theme-primary)]/10 text-theme-text-accent rounded-lg text-sm font-medium hover:bg-[var(--theme-primary)]/20 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      分配用户
                    </button>
                    <button
                      @click.stop="handleRegenerateThumbnail(character)"
                      :disabled="isJsonFile(character.fileType)"
                      :class="[
                        'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        isJsonFile(character.fileType)
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                          : 'bg-[var(--theme-accent)]/10 text-theme-text-accent hover:bg-[var(--theme-accent)]/20'
                      ]"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      重新生成缩略图
                    </button>
                    <button
                      @click.stop="handleDeleteOrphan(character)"
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

        <div class="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
          <div class="flex items-center gap-2">
            <span class="text-sm text-theme-text-secondary">每页</span>
            <div class="flex items-center">
              <select
                :value="localOrphanPageSize"
                @change="handleOrphanPageSizeChange"
                class="px-3 py-1.5 chat-input-field border border-theme-border rounded-l-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
              >
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
                <option :value="200">200</option>
                <option :value="500">500</option>
                <option :value="1000">1000</option>
              </select>
              <input
                type="number"
                :value="localOrphanPageSize"
                @input="handleOrphanPageSizeInput"
                @blur="handleOrphanPageSizeBlur"
                @keydown="handleOrphanPageSizeKeydown"
                min="1"
                max="1000"
                class="w-20 px-3 py-1.5 chat-input-field border border-theme-border border-l-0 rounded-r-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
              />
            </div>
            <span class="text-sm text-theme-text-secondary">条</span>
          </div>
          
          <div v-if="adminStore.orphanedCharactersTotalPages > 1" class="flex items-center gap-2">
            <button
              @click="handleOrphanPageChange(adminStore.orphanedCharactersPage - 1)"
              :disabled="adminStore.orphanedCharactersPage <= 1"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                adminStore.orphanedCharactersPage <= 1
                  ? 'bg-[var(--theme-card-hover)] text-theme-text-secondary/50 cursor-not-allowed'
                  : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
              ]"
            >
              上一页
            </button>
            <div class="flex items-center gap-1">
              <button
                v-for="p in displayedOrphanPages"
                :key="p"
                @click="handleOrphanPageChange(p)"
                :class="[
                  'w-10 h-10 rounded-lg text-sm font-medium transition-all',
                  p === adminStore.orphanedCharactersPage
                    ? 'bg-[var(--theme-primary)] text-white'
                    : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
                ]"
              >
                {{ p }}
              </button>
            </div>
            <button
              @click="handleOrphanPageChange(adminStore.orphanedCharactersPage + 1)"
              :disabled="adminStore.orphanedCharactersPage >= adminStore.orphanedCharactersTotalPages"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                adminStore.orphanedCharactersPage >= adminStore.orphanedCharactersTotalPages
                  ? 'bg-[var(--theme-card-hover)] text-theme-text-secondary/50 cursor-not-allowed'
                  : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-primary)]/10'
              ]"
            >
              下一页
            </button>
          </div>
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
                @click="showAssignDialog = true"
                class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                批量分配
              </button>
              <button
                @click="handleBatchDeleteOrphans"
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

    <!-- 用户选择对话框 -->
    <Transition name="dialog-fade">
      <div
        v-if="showAssignDialog"
        class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[99999] p-4"
        @click.self="showAssignDialog = false"
        @keydown.esc="showAssignDialog = false"
      >
        <Transition name="dialog-scale">
          <div
            v-if="showAssignDialog"
            class="chat-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-theme-border"
            role="dialog"
            aria-modal="true"
          >
            <div class="p-4 sm:p-6 border-b border-theme-border bg-gradient-to-r from-[var(--theme-gradient-start)]/10 to-[var(--theme-gradient-end)]/10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)]">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 class="text-lg font-bold text-theme-text-primary">
                  选择用户
                </h2>
              </div>
            </div>

            <div class="p-4 sm:p-6">
              <p class="text-theme-text-secondary text-sm mb-4">请选择要将这些角色分配给哪个用户：</p>
              <div class="max-h-60 overflow-y-auto space-y-2">
                <div
                  v-for="user in usersList"
                  :key="user.id"
                  @click="selectedUserId = user.id"
                  :class="[
                    'p-3 rounded-lg border cursor-pointer transition-all',
                    selectedUserId === user.id
                      ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/5'
                      : 'border-theme-border hover:bg-[var(--theme-card-hover)]',
                    user.id === 'admin' ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20' : ''
                  ]"
                >
                  <div class="flex items-center gap-3">
                    <div class="relative">
                      <div 
                        :class="[
                          'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                          user.id === 'admin' 
                            ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white' 
                            : 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)]'
                        ]"
                      >
                        {{ (user.name || user.login || 'U').charAt(0).toUpperCase() }}
                      </div>
                      <!-- 管理员徽章 -->
                      <div v-if="user.id === 'admin'" class="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-theme-text-primary">{{ user.name || user.login }}</span>
                        <span v-if="user.id === 'admin'" class="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 rounded">
                          管理员
                        </span>
                      </div>
                      <div class="text-sm text-theme-text-secondary">@{{ user.login }}</div>
                    </div>
                    <div v-if="selectedUserId === user.id" class="ml-auto">
                      <svg class="w-5 h-5 text-[var(--theme-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div v-if="usersList.length === 0" class="text-center py-8 text-theme-text-secondary">
                  暂无用户
                </div>
              </div>
            </div>

            <div class="p-4 border-t border-theme-border flex gap-3">
              <button
                @click="showAssignDialog = false"
                class="flex-1 px-4 py-2.5 chat-card text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] transition-all duration-200 font-medium border border-theme-border text-sm"
              >
                取消
              </button>
              <button
                @click="confirmBatchAssign"
                class="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white hover:opacity-90"
              >
                确认分配
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import CharacterList from '@/components/CharacterList.vue'
import AvatarImage from '@/components/AvatarImage.vue'
import Dialog from '@/components/Dialog.vue'
import { charactersApi, adminApi } from '@/api'
import type { OrphanedCharacter, User } from '@/api'
import { useDialog } from '@/composables/useDialog'

const router = useRouter()
const adminStore = useAdminStore()
const { showDangerConfirm, showAlert, showErrorAlert } = useDialog()

const isImporting = ref(false)
const isDeleting = ref(false)
const isLoading = ref(false)
const characterSource = ref<'admin' | 'user' | 'orphan'>('admin')
const searchQuery = ref('')
const sortBy = ref('updatedAt')

const viewMode = ref<'grid' | 'list'>('grid')
const batchMode = ref(false)
const selectedIds = ref<string[]>([])
const localSearchQuery = ref('')
const localOrphanPageSize = ref(adminStore.orphanedCharactersPageSize.toString())
const showAssignDialog = ref(false)
const selectedUserId = ref<string>('')
const usersList = ref<User[]>([
  {
    id: 'admin',
    name: '管理员',
    login: 'admin',
    is_admin: true
  } as any
])

onMounted(() => {
  loadCharacters()
  // 只有在初始就是流浪角色页面时才加载用户
  if (characterSource.value === 'orphan') {
    loadUsers()
  }
})

async function loadUsers() {
  try {
    await adminStore.loadUsers()
    // 添加固定的管理员到最前面
    const adminUser = {
      id: 'admin',
      name: '管理员',
      login: 'admin',
      is_admin: true
    } as any
    // 过滤掉可能存在的admin用户，避免重复
    const filteredUsers = (adminStore.users || []).filter(u => u.id !== 'admin')
    usersList.value = [adminUser, ...filteredUsers]
  } catch (error) {
    console.error('Failed to load users:', error)
    // 保持默认管理员用户
  }
}

async function loadCharacters(page = 1) {
  isLoading.value = true
  try {
    if (characterSource.value === 'orphan') {
      await adminStore.loadOrphanedCharacters({
        page,
        pageSize: adminStore.orphanedCharactersPageSize,
        search: searchQuery.value || undefined
      })
    } else {
      await adminStore.loadCharacters({
        source: characterSource.value,
        page,
        pageSize: adminStore.charactersPageSize,
        search: searchQuery.value || undefined,
        sortBy: sortBy.value,
        shared: adminStore.charactersSharedFilter
      })
    }
  } finally {
    isLoading.value = false
  }
}

function handleSharedFilterChange(shared: boolean | undefined) {
  adminStore.charactersSharedFilter = shared
  loadCharacters(1)
}

function handleSourceChange(source: 'admin' | 'user' | 'orphan') {
  characterSource.value = source
  searchQuery.value = ''
  localSearchQuery.value = ''
  batchMode.value = false
  selectedIds.value = []
  adminStore.charactersSharedFilter = undefined
  loadCharacters(1)
  
  // 如果切换到流浪角色页面且用户列表还没从服务器加载（只有默认管理员），则加载用户数据
  if (source === 'orphan' && (!adminStore.users || adminStore.users.length === 0)) {
    loadUsers()
  }
}

function handlePageChange(page: number) {
  loadCharacters(page)
}

function handlePageSizeChange(pageSize: number) {
  adminStore.charactersPageSize = pageSize
  loadCharacters(1)
}

function handleOrphanPageChange(page: number) {
  adminStore.orphanedCharactersPage = page
  loadCharacters(page)
}

function handleOrphanPageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const newPageSize = parseInt(target.value, 10)
  localOrphanPageSize.value = newPageSize.toString()
  adminStore.orphanedCharactersPageSize = newPageSize
  loadCharacters(1)
}

function handleOrphanPageSizeInput(event: Event) {
  const target = event.target as HTMLInputElement
  localOrphanPageSize.value = target.value
}

function handleOrphanPageSizeBlur() {
  let newPageSize = parseInt(localOrphanPageSize.value, 10)
  if (isNaN(newPageSize) || newPageSize < 1) {
    newPageSize = 1
  } else if (newPageSize > 1000) {
    newPageSize = 1000
  }
  localOrphanPageSize.value = newPageSize.toString()
  if (newPageSize !== adminStore.orphanedCharactersPageSize) {
    adminStore.orphanedCharactersPageSize = newPageSize
    loadCharacters(1)
  }
}

function handleOrphanPageSizeKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleOrphanPageSizeBlur()
  }
}

function handleSearch(query: string) {
  searchQuery.value = query
  loadCharacters(1)
}

function handleOrphanSearchSubmit() {
  searchQuery.value = localSearchQuery.value
  loadCharacters(1)
}

function handleSortChange(sort: string) {
  sortBy.value = sort
  loadCharacters(1)
}

function getCharacterId(character: any): string {
  return character.role_play?.id || character.id || ''
}

function getCharacterName(character: any): string {
  return character.data?.name || character.name || ''
}

function getCharacterDescription(character: any): string {
  return character.data?.description || character.description || ''
}

function getCharacterAvatar(character: any): string | undefined {
  if (character.thumbnailUrl) {
    return character.thumbnailUrl
  }
  return character.data?.avatar || character.avatar
}

function getCharacterShared(character: any): boolean {
  return character.role_play?.shared || character.shared || false
}

function getCharacterBook(character: any): any {
  return character.data?.character_book || character.character_book
}

function getCharacterRegexScripts(character: any): any[] {
  return character.data?.extensions?.regex_scripts || character.extensions?.regex_scripts || []
}

async function handleDelete(character: any) {
  const confirmed = await showDangerConfirm('确定要删除这个角色吗？此操作不可撤销。')
  if (confirmed) {
    isDeleting.value = true
    try {
      const id = getCharacterId(character)
      const result = await adminStore.deleteCharacter(id)
      
      if (result && result.warning) {
        await showAlert(`角色已删除，但存在警告: ${result.warning}`)
      }
    } catch (error: any) {
      await showErrorAlert('删除失败: ' + (error.message || '未知错误'))
    } finally {
      isDeleting.value = false
    }
  }
}

function handleSelect(character: any) {
  const id = getCharacterId(character)
  router.push(`/admin/characters/${id}/edit`)
}

function handleEdit(character: any) {
  const id = getCharacterId(character)
  router.push(`/admin/characters/${id}/edit`)
}

async function handleToggleShare(character: any) {
  try {
    await adminStore.toggleCharacterShared(character)
  } catch (error) {
    console.error('Failed to toggle share:', error)
  }
}

function handleCreate() {
  router.push('/admin/characters/new')
}

async function handleReorder(characters: any[]) {
  try {
    const ids = characters.map(c => getCharacterId(c))
    return
    adminStore.characters = characters
  } catch (err) {
    console.error('Failed to save order:', err)
  }
}

async function handleImport(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files || files.length === 0) return

  isImporting.value = true
  console.log(`[Admin Import] Starting import, files count: ${files.length}`)

  try {
    const result = await charactersApi.importFilesAdmin(Array.from(files))
    
    if (result.success && result.imported > 0) {
      await loadCharacters(adminStore.charactersPage)
      
      let message = `成功导入 ${result.imported} 个角色`
      if (result.failed > 0) {
        message += `，${result.failed} 个文件导入失败`
        
        if (result.failedFiles && result.failedFiles.length > 0) {
          console.error('[Admin Import] Failed files:', result.failedFiles)
        }
      }
      
      await showAlert(message)
    } else {
      let errorMessage = `所有 ${result.failed} 个文件导入失败`
      if (result.failedFiles && result.failedFiles.length > 0) {
        errorMessage += ':\n' + result.failedFiles.map(f => `- ${f.filename}: ${f.error}`).join('\n')
      }
      await showErrorAlert(errorMessage)
    }
  } catch (error: any) {
    console.error('[Admin Import] Import failed:', error)
    await showErrorAlert('导入失败: ' + (error.message || '未知错误'))
  } finally {
    isImporting.value = false
    ;(event.target as HTMLInputElement).value = ''
  }
}

async function handleBatchDelete(ids: string[]) {
  const confirmed = await showDangerConfirm(`确定要删除选中的 ${ids.length} 个角色吗？此操作不可撤销。`)
  if (confirmed) {
    isLoading.value = true
    try {
      const result = await adminStore.batchDeleteCharacters(ids)
      
      let message = `成功删除 ${result.deleted} 个角色`
      if (result.failed.length > 0) {
        message += `，${result.failed.length} 个删除失败`
      }
      if (result.warnings.length > 0) {
        message += `\n警告: ${result.warnings.join('; ')}`
      }
      
      await showAlert(message)
    } catch (error: any) {
      await showErrorAlert('批量删除失败: ' + (error.message || '未知错误'))
    } finally {
      isLoading.value = false
    }
  }
}

async function handleBatchShare(ids: string[], shared: boolean) {
  isLoading.value = true
  try {
    const result = await adminStore.batchToggleCharactersShared(ids, shared)
    
    const action = shared ? '分享' : '取消分享'
    let message = `成功${action} ${result.updated} 个角色`
    if (result.failed.length > 0) {
      message += `，${result.failed.length} 个${action}失败`
    }
    
    await showAlert(message)
  } catch (error: any) {
    const action = shared ? '分享' : '取消分享'
    await showErrorAlert(`批量${action}失败: ` + (error.message || '未知错误'))
  } finally {
    isLoading.value = false
  }
}

const displayedOrphanPages = computed(() => {
  const pages: number[] = []
  const current = adminStore.orphanedCharactersPage
  const total = adminStore.orphanedCharactersTotalPages
  
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

const isAllSelected = computed(() => {
  return adminStore.orphanedCharacters.length > 0 && selectedIds.value.length === adminStore.orphanedCharacters.length
})

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0
})

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
    selectedIds.value = adminStore.orphanedCharacters.map(c => c.id)
  }
}

async function handleAssignCharacter(character: OrphanedCharacter) {
  selectedUserId.value = ''
  showAssignDialog.value = true
  selectedIds.value = [character.id]
  
  // 如果用户列表还没加载，则加载用户数据
  if (!adminStore.users || adminStore.users.length === 0) {
    loadUsers()
  }
}

async function confirmBatchAssign() {
  if (!selectedUserId.value) {
    await showErrorAlert('请选择一个用户')
    return
  }

  const confirmed = await showDangerConfirm(`确定要将选中的 ${selectedIds.value.length} 个角色分配给该用户吗？`)
  if (!confirmed) return

  isLoading.value = true
  try {
    const result = await adminStore.batchAssignOrphanedCharacters(selectedIds.value, selectedUserId.value)
    await showAlert(`成功分配 ${result.successCount || 0} 个角色`)
    showAssignDialog.value = false
    batchMode.value = false
    selectedIds.value = []
    await loadCharacters(adminStore.orphanedCharactersPage)
  } catch (error: any) {
    await showErrorAlert('分配失败: ' + (error.message || '未知错误'))
  } finally {
    isLoading.value = false
  }
}

async function handleDeleteOrphan(character: OrphanedCharacter) {
  const confirmed = await showDangerConfirm('确定要删除这个角色吗？此操作将从 Hugging Face 删除相关文件，不可撤销。')
  if (confirmed) {
    isLoading.value = true
    try {
      await adminStore.deleteOrphanedCharacter(character.id)
      await showAlert('角色已删除')
      await loadCharacters(adminStore.orphanedCharactersPage)
    } catch (error: any) {
      await showErrorAlert('删除失败: ' + (error.message || '未知错误'))
    } finally {
      isLoading.value = false
    }
  }
}

async function handleRegenerateThumbnail(character: OrphanedCharacter) {
  isLoading.value = true
  try {
    await adminStore.regenerateOrphanedCharacterThumbnail(character.id)
    await showAlert('缩略图已重新生成')
    await loadCharacters(adminStore.orphanedCharactersPage)
  } catch (error: any) {
    await showErrorAlert('重新生成缩略图失败: ' + (error.message || '未知错误'))
  } finally {
    isLoading.value = false
  }
}

async function handleBatchDeleteOrphans() {
  const confirmed = await showDangerConfirm(`确定要删除选中的 ${selectedIds.value.length} 个角色吗？此操作将从 Hugging Face 删除相关文件，不可撤销。`)
  if (confirmed) {
    isLoading.value = true
    try {
      const result = await adminStore.batchDeleteOrphanedCharacters(selectedIds.value)
      await showAlert(`成功删除 ${result.successCount || 0} 个角色`)
      batchMode.value = false
      selectedIds.value = []
      await loadCharacters(adminStore.orphanedCharactersPage)
    } catch (error: any) {
      await showErrorAlert('批量删除失败: ' + (error.message || '未知错误'))
    } finally {
      isLoading.value = false
    }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileTypeLabel(fileType: string): string {
  switch (fileType?.toLowerCase()) {
    case 'json':
      return 'JSON'
    case 'png':
      return 'PNG'
    case 'jpg':
    case 'jpeg':
      return 'JPG'
    case 'thumbnail':
      return '缩略图'
    default:
      return fileType?.toUpperCase() || '未知'
  }
}

function getFileTypeClass(fileType: string): string {
  switch (fileType?.toLowerCase()) {
    case 'json':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'png':
    case 'jpg':
    case 'jpeg':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'thumbnail':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

function isJsonFile(fileType: string): boolean {
  return fileType?.toLowerCase() === 'json'
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
