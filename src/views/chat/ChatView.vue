<template>
  <div class="chat-container flex bg-[var(--theme-bg-start)]" style="height: 100vh;">
    <div
      v-if="backgroundImageUrl"
      class="chat-background-image"
      :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
    ></div>
    <div
      v-if="backgroundImageUrl"
      class="chat-background-overlay"
    ></div>

    <div
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
      :class="sidebarOpen ? 'block' : 'hidden'"
      @click="sidebarOpen = false"
    ></div>

    <ChatSidebar
      v-model="sidebarOpen"
      :friend-characters="friendCharacters"
      :avatar-update-trigger="avatarUpdateTrigger"
      @open-create-character="openCreateCharacterModal"
      @open-friend-selector="handleOpenFriendSelector"
      @open-user-settings="handleOpenUserSettings"
      @open-user-data-settings="showUserDataSettings = true"
      @edit-character="handleEditUserCharacterWithErrorHandling"
      @select-character="selectCharacter"
      @import-character="onImportCharacter"
      @open-about="showAbout = true"
      @friend-characters-updated="handleFriendCharactersUpdated"
    />

    <div class="flex-1 flex flex-col min-w-0 relative overflow-hidden" style="height: 100%">
      <div v-if="chatStore.isLoading" class="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-3 bg-[var(--theme-card-bg)] p-8 rounded-2xl shadow-xl border border-theme-border">
          <div class="w-12 h-12 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin shadow-lg shadow-[var(--theme-primary)]/30"></div>
          <span class="text-theme-text-secondary font-medium">{{ t('common.loading') }}</span>
        </div>
      </div>

      <div v-if="!chatStore.isLoading && !chatStore.currentCharacter" class="flex-1 flex items-center justify-center">
        <div class="text-center px-4">
          <div class="w-32 h-32 mx-auto mb-6 animate-float">
            <img src="/pwa-512x512.png" alt="Logo" class="w-full h-full object-contain" style="filter: drop-shadow(0 25px 25px rgba(59, 130, 246, 0.3));" />
          </div>
          <h2 class="text-2xl font-bold gradient-text mb-2">{{ t('chat.startStory') }}</h2>
          <p class="text-theme-text-secondary mb-6">{{ t('chat.selectCharacter') }}</p>
          <button
            @click="sidebarOpen = !sidebarOpen"
            class="px-6 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] text-white rounded-xl font-semibold shadow-lg shadow-[var(--theme-primary)]/25 hover:shadow-xl hover:shadow-[var(--theme-primary)]/30 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            {{ sidebarOpen ? t('chat.hideCharacters') : t('chat.viewCharacters') }}
          </button>
        </div>
      </div>

      <template v-else>
        <div class="absolute top-0 left-0 right-0 z-20 overflow-hidden chat-header bg-white/10 dark:bg-black/10" style="padding-top: env(safe-area-inset-top, 0px);">
          <div class="h-14 px-2 sm:px-4 flex items-center justify-between">
            <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                @click="sidebarOpen = !sidebarOpen"
                class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-theme-text-primary dark:text-gray-200 flex-shrink-0 rounded-xl transition-all bg-white/70 dark:bg-black/50 border border-white/30 dark:border-white/10 hover:bg-white/85 dark:hover:bg-black/70"
                style="backdrop-filter: blur(1px); -webkit-backdrop-filter: blur(1px);"
                :title="sidebarOpen ? t('sidebar.close') : t('sidebar.openSidebar')"
              >
                <svg v-if="sidebarOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
            <div class="flex items-center gap-2 sm:gap-3 min-w-0 justify-center px-3 py-1 rounded-2xl bg-white/70 dark:bg-black/50 border border-white/30 dark:border-white/10 cursor-pointer hover:bg-white/85 dark:hover:bg-black/70 transition-all mx-2 sm:mx-4" @click="openCharacterInfoFromCurrent" style="backdrop-filter: blur(1px); -webkit-backdrop-filter: blur(1px);">
              <div class="flex items-center gap-1 sm:gap-2 min-w-0">
                <div v-if="chatStore.isUpdatingInBackground" class="w-4 h-4 flex-shrink-0">
                  <div class="w-4 h-4 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span
                  class="text-base sm:text-lg font-semibold text-theme-text-primary dark:text-gray-200 truncate transition-colors"
                >
                  {{ chatStore.currentCharacter?.name || t('chat.unknownCharacter') }}
                </span>
              </div>
            </div>
            <button
              ref="menuButtonRef"
              @click="showMenuDropdown = !showMenuDropdown"
              class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-theme-text-primary dark:text-gray-200 rounded-xl flex-shrink-0 transition-all bg-white/70 dark:bg-black/50 border border-white/30 dark:border-white/10 hover:bg-white/85 dark:hover:bg-black/70"
              style="backdrop-filter: blur(1px); -webkit-backdrop-filter: blur(1px);"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            </div>
        </div>

        <div
          v-if="showMenuDropdown"
          class="fixed right-2 sm:right-4 top-16 sm:top-20 w-48 sm:w-52 menu-dropdown rounded-2xl shadow-xl shadow-[var(--theme-shadow)] border border-theme-border py-2 z-50"
          @click="showMenuDropdown = false"
        >
          <div class="px-4 py-3 border-b border-theme-border mb-1" @click.stop>
            <div class="text-xs font-semibold text-theme-text-secondary mb-2 uppercase tracking-wider">{{ t('chat.selectService') }}</div>
            <select
              :value="getCurrentServiceValue()"
              @change.stop="handleServiceSelectNew($event)"
              class="w-full px-3 py-2 text-sm border border-theme-border rounded-xl select-field focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] mb-3"
            >
              <template v-if="showAuthEntry">
                <option value="builtin">{{ t('chat.builtinService') }}</option>
              </template>
              <option v-for="config in modelConfigStore.configs" :key="config.id" :value="`config:${config.id}`">
                {{ config.name || config.default_model || t('chat.unnamedConfig') }}{{ config.is_default ? ` (${t('model.isDefault')})` : '' }}
              </option>
              <option value="add-config">➕ {{ t('model.addNewConfig') }}</option>
            </select>

            <template v-if="chatStore.useCustomModel || !showAuthEntry">
              <select
                :value="chatStore.customModelConfig?.default_model || ''"
                @change.stop="updateCustomModelConfig('default_model', ($event.target as HTMLSelectElement).value)"
                class="w-full px-3 py-2 text-sm border border-theme-border rounded-xl select-field focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"
              >
                <option value="">选择模型</option>
                <option
                  v-if="chatStore.customModelConfig?.default_model && !availableCustomModels.includes(chatStore.customModelConfig.default_model)"
                  :value="chatStore.customModelConfig.default_model"
                >
                  {{ chatStore.customModelConfig.default_model }}（手动）
                </option>
                <option v-for="model in availableCustomModels" :key="model" :value="model">
                  {{ model }}
                </option>
              </select>
              <button
                @click.stop="showCustomModelConfig = true; showMenuDropdown = false"
                class="w-full mt-2 px-3 py-2 text-sm bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] rounded-xl hover:bg-[var(--theme-primary)]/20 transition-all flex items-center justify-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {{ t('chat.manageConfig') }}
              </button>
            </template>
            <template v-else>
              <template v-if="isLoadingBuiltinModels">
                <div class="flex items-center justify-center py-2 text-sm text-theme-text-secondary">
                  <svg class="w-4 h-4 animate-spin mr-2" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  {{ t('chat.loadingModels') }}
                </div>
              </template>
              <template v-else-if="userStore.isAnonymous">
                <div class="text-sm text-theme-text-secondary mb-2">
                  {{ t('auth.loginError') }}
                </div>
                <button
                  @click.stop="userStore.requireLogin()"
                  class="w-full px-3 py-2 text-sm bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                    {{ t('auth.login') }}
                  </button>
              </template>
              <template v-else-if="chatStore.uniqueModels.length === 0">
                <div class="text-sm text-theme-text-secondary mb-2">
                  {{ t('model.noModels') }}
                </div>
              </template>
              <template v-else>
                <SearchableSelect
                v-model="chatStore.selectedModel"
                :options="getBuiltinModelOptions"
                :placeholder="t('model.searchOrSelectModel')"
              />
              </template>
            </template>
          </div>
          <button
            @click.stop="toggleAutoSuggestions"
            class="w-full px-4 py-2.5 text-left text-sm menu-dropdown-item flex items-center gap-3 transition-all"
          >
            <div :class="autoFetchSuggestions 
              ? 'w-7 h-7 rounded-lg bg-gradient-to-r from-[var(--theme-success)] to-[var(--theme-success-light)] flex items-center justify-center text-white shadow-lg shadow-[var(--theme-success)]/25' 
              : 'w-7 h-7 rounded-lg bg-[var(--theme-card-hover)] flex items-center justify-center text-theme-text-secondary'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span :class="autoFetchSuggestions ? 'text-theme-text-primary' : 'text-theme-text-secondary'">
      {{ t('chat.autoFetchSuggestions') }}
    </span>
            <div class="ml-auto flex items-center">
              <div :class="autoFetchSuggestions ? 'w-10 h-5 bg-[var(--theme-success)] rounded-full relative' : 'w-10 h-5 bg-[var(--theme-card-hover)] rounded-full relative'">
                <div :class="autoFetchSuggestions ? 'absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all' : 'absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all'"></div>
              </div>
            </div>
          </button>
          <button
            @click.stop="showBackgroundSelector = true; showMenuDropdown = false"
            class="w-full px-4 py-2.5 text-left text-sm text-theme-text-primary menu-dropdown-item flex items-center gap-3 transition-all"
          >
            <div class="w-7 h-7 rounded-lg bg-[var(--theme-secondary)]/10 flex items-center justify-center text-theme-text-accent">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span>切换聊天背景</span>
          </button>
          <div class="border-t border-theme-border my-1"></div>
          <label class="w-full px-4 py-2.5 text-left text-sm text-theme-text-primary menu-dropdown-item cursor-pointer block flex items-center gap-3 transition-all">
            <div class="w-7 h-7 rounded-lg bg-[var(--theme-secondary)]/10 flex items-center justify-center text-theme-text-accent">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
            </div>
            <span>{{ t('chat.menu.import') }}</span>
            <input type="file" accept=".jsonl,.json" class="hidden" @change="handleImportChat" />
          </label>
          <button
            @click="handleExportChat"
            class="w-full px-4 py-2.5 text-left text-sm text-theme-text-primary menu-dropdown-item flex items-center gap-3 transition-all"
          >
            <div class="w-7 h-7 rounded-lg bg-[var(--theme-accent)]/10 flex items-center justify-center text-theme-text-accent">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
            </div>
            <span>{{ t('chat.menu.export') }}</span>
          </button>
          <button
            @click="handleExportChatAsText"
            class="w-full px-4 py-2.5 text-left text-sm text-theme-text-primary menu-dropdown-item flex items-center gap-3 transition-all"
          >
            <div class="w-7 h-7 rounded-lg bg-[var(--theme-accent)]/10 flex items-center justify-center text-theme-text-accent">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
            </div>
            <span>导出纯文本（TXT）</span>
          </button>
          <button
            v-if="backendEnabled && !userStore.isAnonymous"
            @click="showChatSync = true; showMenuDropdown = false"
            class="w-full px-4 py-2.5 text-left text-sm text-theme-text-primary menu-dropdown-item flex items-center gap-3 transition-all"
          >
            <div class="w-7 h-7 rounded-lg bg-[var(--theme-primary)]/10 flex items-center justify-center text-theme-text-accent">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
            </div>
            <span>{{ t('sync.title') }}</span>
          </button>
          <div class="border-t border-theme-border my-1"></div>
          <button
            @click="showChatStats = true; showMenuDropdown = false"
            class="w-full px-4 py-2.5 text-left text-sm text-theme-text-primary menu-dropdown-item flex items-center gap-3 transition-all"
          >
            <div class="w-7 h-7 rounded-lg bg-[var(--theme-accent)]/10 flex items-center justify-center text-theme-text-accent">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span>{{ t('chat.menu.stats') }}</span>
          </button>
          <button
            @click="confirmClearHistory"
            class="w-full px-4 py-2.5 text-left text-sm text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] flex items-center gap-3 transition-all"
          >
            <div class="w-7 h-7 rounded-lg bg-[var(--theme-danger-bg)] flex items-center justify-center text-[var(--theme-danger)]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </div>
            <span>{{ t('chat.menu.clear') }}</span>
          </button>
        </div>

        <ChatMessages
          ref="chatMessagesRef"
          :messages="messages"
          :has-more-messages="chatStore.hasMoreMessages"
          :is-loading-more="isLoadingMore"
          :editingIndex="editingIndex >= 0 ? editingIndex - chatStore.displayOffset : -1"
          :editContent="editContent"
          :compiledRegexScripts="compiledRegexScripts"
          :showSuggestions="chatStore.showSuggestions"
          :suggestions="chatStore.suggestions"
          :isGeneratingSuggestions="chatStore.isGeneratingSuggestions"
          @click="showMenuDropdown = false"
          @load-more="handleLoadMore"
          @copy="copyMessage"
          @edit="startEdit"
          @delete="deleteMessage"
          @regenerate-greeting="regenerateGreeting"
          @regenerate-from-assistant="regenerateFromAssistant"
          @regenerate-user="regenerateUserMessage"
          @save-edit="saveEdit"
          @send-edit="sendEdit"
          @cancel-edit="cancelEdit"
          @update:editContent="editContent = $event"
          @refresh-suggestions="fetchSuggestions({ autoShow: true, force: true })"
          @close-suggestions="chatStore.cancelSuggestions"
          @send-suggestion="sendSuggestion"
        />

        <ChatInput
          :is-streaming="chatStore.isStreaming"
          :show-suggestions="chatStore.showSuggestions"
          :suggestions="chatStore.suggestions"
          :is-generating-suggestions="chatStore.isGeneratingSuggestions"
          :auto-fetch-suggestions="autoFetchSuggestions"
          :sidebar-open="sidebarOpen"
          :total-messages-count="chatStore.totalMessagesCount"
          @submit="handleSubmit"
          @stop="chatStore.abortStream()"
          @fetch-suggestions="fetchSuggestions"
          @cancel-suggestions="chatStore.cancelSuggestions"
          @toggle-suggestions="handleToggleSuggestions"
          @refresh-suggestions="fetchSuggestions({ autoShow: true, force: true })"
          @send-suggestion="sendSuggestion"
        />
      </template>
    </div>

    <div v-if="showUserNameDialog" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4">
      <div class="chat-card rounded-3xl max-w-md w-full p-4 sm:p-8 shadow-2xl border border-theme-border">
        <div class="text-center mb-4 sm:mb-6">
          <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
            <svg class="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 class="text-lg sm:text-xl font-bold text-theme-text-primary mb-1 sm:mb-2">{{ t('auth.welcomeBack') }}</h2>
          <p class="text-theme-text-secondary text-xs sm:text-sm">{{ t('user.editName') }}</p>
        </div>
        <input
          v-model="editingUserName"
          type="text"
          placeholder="..."
          class="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-theme-border rounded-xl chat-input-field mb-4 sm:mb-6 text-center text-base sm:text-lg"
          @keyup.enter="saveUserName"
          autofocus
        />
        <button
          @click="saveUserName"
          class="w-full px-4 py-2 sm:px-6 sm:py-3 text-white bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm sm:text-base"
          :disabled="!editingUserName.trim()"
        >
            {{ t('chat.startStory') }}
          </button>
      </div>
    </div>

    <div v-if="showRemoveFriendConfirm" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click.self="showRemoveFriendConfirm = false">
      <div class="chat-card rounded-2xl p-3 sm:p-6 max-w-md w-full shadow-2xl border border-theme-border">
        <h3 class="text-base sm:text-lg font-bold text-theme-text-primary mb-1 sm:mb-2">确认删除剧本</h3>
        <p class="text-theme-text-secondary text-sm sm:text-base mb-4 sm:mb-6">确定要删除这个剧本吗？删除后聊天记录也会一并删除。</p>
        <div class="flex gap-3">
          <button
            @click="showRemoveFriendConfirm = false"
            class="flex-1 px-4 py-2 chat-card text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] transition-all"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            @click="handleRemoveFriend"
            :disabled="isRemovingFriend"
            class="flex-1 px-4 py-2 bg-gradient-to-r from-[var(--theme-danger)] to-[var(--theme-danger-light)] text-white rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="isRemovingFriend" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isRemovingFriend ? t('common.loading') : t('common.confirm') }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showErrorDialog" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click.self="showErrorDialog = false">
      <div class="chat-card rounded-2xl p-3 sm:p-6 max-w-lg w-full shadow-2xl border border-theme-border">
        <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[var(--theme-danger)] to-[var(--theme-danger-light)] rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-lg">
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h3 class="text-base sm:text-lg font-bold text-theme-text-primary">{{ t('error.generic') }}</h3>
        </div>
        <div class="mb-4 sm:mb-6">
          <p class="text-theme-text-secondary text-sm sm:text-base mb-2">{{ t('error.generic') }}:</p>
          <div class="bg-[var(--theme-danger-bg)] border border-[var(--theme-danger)]/30 rounded-xl p-3 sm:p-4 max-h-60 overflow-y-auto">
            <p class="text-[var(--theme-danger)] text-xs sm:text-sm whitespace-pre-wrap break-words">{{ errorMessage }}</p>
          </div>
        </div>
        <div class="flex justify-end">
          <button
            @click="showErrorDialog = false; chatStore.error = null;"
            class="px-6 py-2 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] transition-all shadow-lg hover:shadow-xl"
          >
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>

    <UserSettingsModal
      v-model:visible="showUserSettings"
      :user="userStore.user"
      :user-name="chatStore.userName"
      :can-signin-today="userStore.canSigninToday()"
      :signin-message="userStore.signinMessage"
      :character-limit="characterLimit"
      @signin="handleSignin"
      @edit-user-name="editingUserName = chatStore.userName || ''; showUserNameDialog = true; showUserSettings = false;"
    />

    <UserDataSettingsModal
      v-model:visible="showUserDataSettings"
    />

    <BackgroundSelectorModal
      v-model:visible="showBackgroundSelector"
      :current-mode="backgroundMode"
      :selected-background="selectedBackgroundName"
      :character-preview-url="characterBackgroundUrl"
      @background-changed="loadBackground"
    />

    <FriendSelector v-if="backendEnabled" v-model:visible="showFriendSelector" @view-character="handleViewCharacterWithErrorHandling" />

    <ChatSyncModal
      v-if="backendEnabled"
      :show="showChatSync"
      :character-name="chatStore.currentCharacter?.name || ''"
      @close="showChatSync = false"
    />

    <CharacterModal
      v-model:visible="showCreateCharacterModal"
      :editing-character="editingCharacter"
      :editing-character-meta="editingCharacterMeta"
      :display-meta="displayMeta"
      :is-view-only-mode="isViewOnlyMode"
      :is-loading-character-detail="isLoadingCharacterDetail"
      :is-loading-meta="isLoadingMeta"
      :is-saving-character="isSavingCharacter"
      :is-loading-original="isLoadingOriginal"
      :is-loading-source="isLoadingSource"
      :is-loading-view-data="isLoadingViewData"
      :is-liking-in-edit="isLikingInEdit"
      :exists-on-server="existsOnServer"
      :is-owner-of-character="isOwnerOfCharacter"
      :show-comment-section="showCommentSection"
      :character-data="newCharacterData"
      :is-uploading-to-server="isUploadingToServer"
      :is-updating-to-server="isUpdatingToServer"
      :is-updating-from-server="isUpdatingFromServer"
      :is-deleting-character="isDeletingCharacter"
      :thumbnail-url="editingCharacterMeta.thumbnailUrl"
      :source-url="editingCharacterMeta.sourceUrl"
      @save="handleSaveCharacter"
      @delete="handleDeleteFromEdit"
      @load-original="handleLoadOriginalCharacterData"
      @toggle-like="handleToggleLikeInEdit"
      @update:shared="handleUpdateSharedFromModal"
      @avatar-updated="handleAvatarUpdated"
      @upload-to-server="handleUploadToServer"
      @update-to-server="handleUpdateToServer"
      @update-from-server="handleUpdateFromServer"
    />

    <div v-if="isImportingCharacter" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4">
      <div class="chat-card rounded-2xl p-4 sm:p-8 flex flex-col items-center shadow-2xl border border-theme-border">
        <div class="w-10 h-10 sm:w-12 sm:h-12 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin shadow-lg shadow-[var(--theme-primary)]/30 mb-3 sm:mb-4"></div>
        <h3 class="text-base sm:text-lg font-semibold text-theme-text-primary mb-1 sm:mb-2">{{ t('character.importCharacter') }}...</h3>
        <p class="text-xs sm:text-sm text-theme-text-secondary">{{ t('common.loading') }}</p>
      </div>
    </div>

    <div v-if="showAbout" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click="showAbout = false">
      <div class="chat-card rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl border border-theme-border" @click.stop>
        <div class="text-center">
          <div class="mx-auto mb-3 sm:mb-4 flex items-center justify-center">
            <img src="/pwa-512x512.png" alt="ROLE PLAY" class="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
          </div>
          <h2 class="text-xl sm:text-2xl font-bold gradient-text mb-1 sm:mb-2">{{ t('sidebar.title') }}</h2>
          <p class="text-xs sm:text-sm text-theme-text-secondary mb-4 sm:mb-6">{{ t('about.description') }}</p>
          
          <div class="text-left space-y-2 sm:space-y-3 text-xs sm:text-sm text-theme-text-primary mb-4 sm:mb-6">
            <p>🎭 与各种角色进行沉浸式对话</p>
            <p>✨ 支持自定义角色创建</p>
            <p v-if="backendEnabled">🌐 在线分享剧本</p>
            <p>🎨 支持亮色/暗色主题切换</p>
          </div>
          
          <div class="text-xs text-theme-text-secondary mb-3 sm:mb-4">
            {{ t('about.version') }} 1.0.0 ({{ buildTime }})
          </div>
          
          <a
            href="https://github.com/smanx/role-play"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 w-full py-2 sm:py-3 rounded-2xl font-semibold transition-all duration-200 bg-[var(--theme-card-hover)] text-theme-text-primary hover:bg-[var(--theme-primary)]/10 mb-2 sm:mb-3 text-sm sm:text-base"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.304.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            {{ t('about.githubRepo') }}
          </a>
          
          <button
            @click="showAbout = false"
            class="w-full py-2 sm:py-3 rounded-2xl font-semibold transition-all duration-200 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white hover:shadow-lg hover:shadow-[var(--theme-primary)]/30 text-sm sm:text-base"
          >
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showChatStats" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click="showChatStats = false">
      <div class="chat-card rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl border border-theme-border" @click.stop>
        <div class="flex items-center justify-between mb-4 sm:mb-6">
          <div class="flex items-center gap-2 sm:gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-secondary)] flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-semibold text-theme-text-primary">{{ t('chat.menu.stats') }}</h3>
              <p class="text-xs sm:text-sm text-theme-text-secondary">{{ chatStore.currentCharacter?.name || t('chat.unknownCharacter') }}</p>
            </div>
          </div>
          <button @click="showChatStats = false" class="p-2 rounded-xl hover:bg-[var(--theme-card-hover)] transition-all">
            <svg class="w-5 h-5 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-3 sm:space-y-4">
          <div class="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-[var(--theme-card-hover)]">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 rounded-lg bg-[var(--theme-primary)]/10 flex items-center justify-center">
                <svg class="w-4 h-4 text-[var(--theme-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span class="text-sm text-theme-text-secondary">{{ t('chat.stats.messages') }}</span>
            </div>
            <span class="text-lg sm:text-xl font-bold text-theme-text-primary">{{ chatStore.totalMessagesCount }}</span>
          </div>

          <div class="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-[var(--theme-card-hover)]">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 rounded-lg bg-[var(--theme-secondary)]/10 flex items-center justify-center">
                <svg class="w-4 h-4 text-[var(--theme-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span class="text-sm text-theme-text-secondary">{{ t('chat.stats.characters') }}</span>
            </div>
            <span class="text-lg sm:text-xl font-bold text-theme-text-primary">{{ formatNumber(chatStore.totalCharactersCount) }}</span>
          </div>

          <div class="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-[var(--theme-card-hover)]">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 flex items-center justify-center">
                <svg class="w-4 h-4 text-[var(--theme-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span class="text-sm text-theme-text-secondary">{{ t('chat.stats.tokens') }}</span>
            </div>
            <span class="text-lg sm:text-xl font-bold text-theme-text-primary">{{ formatNumber(chatStore.totalTokensCount) }}</span>
          </div>
        </div>

        <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-theme-border">
          <p class="text-xs sm:text-sm text-theme-text-secondary text-center">
            {{ t('chat.stats.estimateNote') }}
          </p>
        </div>
      </div>
    </div>

    <CustomModelConfigModal
      v-model:visible="showCustomModelConfig"
      v-model:selected-config-id="selectedConfigId"
      :use-custom-model="chatStore.useCustomModel"
      :config="activeCustomModelConfig"
      :config-list="customModelConfigs"
      :active-config-id="activeCustomModelConfigId"
      :available-models="availableCustomModels"
      :is-fetching-models="isFetchingModels"
      :fetch-models-error="fetchModelsError"
      @toggle-use-custom-model="chatStore.setUseCustomModel(!chatStore.useCustomModel)"
      @update-config="updateCustomModelConfig"
      @create-config="createCustomModelConfig"
      @select-config="selectCustomModelConfig"
      @delete-config="handleDeleteCustomModelConfig"
      @fetch-models="fetchCustomModels"
    />

    <LoginModal
      :visible="userStore.showLoginModal"
      @update:visible="(val: boolean) => val ? userStore.requireLogin() : userStore.closeLoginModal()"
    />

    <div v-if="isDev" 
         :style="{ left: devMarkerPosition.x + 'px', top: devMarkerPosition.y + 'px' }"
         class="fixed z-50 cursor-move select-none"
         @mousedown="startDragDevMarker"
         @touchstart="startDragDevMarker">
      <div class="w-8 h-8 rounded-full shadow-lg flex items-center justify-center font-bold text-xs
                  bg-gradient-to-br from-theme-primary to-theme-secondary text-white
                  hover:scale-110 transition-transform">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
        </svg>
      </div>
    </div>

    <div 
      v-if="toastMessage" 
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2 rounded-lg shadow-lg transition-all duration-300 border backdrop-blur-xl"
      :class="toastType === 'success' ? 'bg-[var(--theme-success-bg)] border-[var(--theme-success)]/50 text-[var(--theme-success)]' : 'bg-[var(--theme-danger-bg)] border-[var(--theme-danger)]/50 text-[var(--theme-danger)]'"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { useUserDataStore } from '@/stores/userData'
import { loadTheme } from '@/utils/theme'
import { characterGet } from '@/utils/db'
import { chat as llmChat } from '@/utils/llmClient'
import type { Character } from '@/types'
import type { CompiledRegexScript } from '@/composables/useChat'
import { compileRegexScripts } from '@/utils/regexUtils'
import { hasLocalUserName } from '@/utils/anonymousUser'
import { userApi, v1Api } from '@/api'

import ChatSidebar from './components/ChatSidebar.vue'
import ChatMessages from './components/ChatMessages.vue'
import ChatInput from './components/ChatInput.vue'
import CharacterModal from './components/CharacterModal.vue'
import UserSettingsModal from './components/UserSettingsModal.vue'
import UserDataSettingsModal from './components/UserDataSettingsModal.vue'
import CustomModelConfigModal from './components/CustomModelConfigModal.vue'
import BackgroundSelectorModal from './components/BackgroundSelectorModal.vue'
import ChatSyncModal from './components/ChatSyncModal.vue'
import FriendSelector from '@/components/FriendSelector.vue'
import LoginModal from '@/components/LoginModal.vue'
import AvatarImage from '@/components/AvatarImage.vue'
import SearchableSelect from '@/components/SearchableSelect.vue'

import { useCharacter } from '@/composables/useCharacter'
import { useCustomModel } from '@/composables/useCustomModel'
import { useDialog } from '@/composables/useDialog'
import { useI18n } from '@/composables/useI18n'
import { getFriendAvatar, clearCharacterAvatarCache } from '@/utils/localFriendStorage'
import {
  getBackgroundUrl,
  loadSettings as loadBackgroundSettings,
  selectBackgroundMode,
  type BackgroundMode,
} from '@/utils/backgroundService'
import { config } from '@/utils/config'

const isDev = import.meta.env.DEV
const backendEnabled = config.backendEnabled
const showAuthEntry = config.showAuthEntry
const devMarkerPosition = ref({ x: window.innerWidth - 50, y: window.innerHeight - 50 })
let isDragging = false
let dragOffset = { x: 0, y: 0 }
const { showDangerConfirm } = useDialog()
const { t } = useI18n()

function startDragDevMarker(e: MouseEvent | TouchEvent) {
  isDragging = true
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
  
  dragOffset.x = clientX - devMarkerPosition.value.x
  dragOffset.y = clientY - devMarkerPosition.value.y
  
  window.addEventListener('mousemove', onDragDevMarker)
  window.addEventListener('mouseup', stopDragDevMarker)
  window.addEventListener('touchmove', onDragDevMarker, { passive: false })
  window.addEventListener('touchend', stopDragDevMarker)
}

function onDragDevMarker(e: MouseEvent | TouchEvent) {
  if (!isDragging) return
  e.preventDefault()
  
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
  
  let newX = clientX - dragOffset.x
  let newY = clientY - dragOffset.y
  
  newX = Math.max(0, Math.min(newX, window.innerWidth - 32))
  newY = Math.max(0, Math.min(newY, window.innerHeight - 32))
  
  devMarkerPosition.value = { x: newX, y: newY }
}

function stopDragDevMarker() {
  isDragging = false
  window.removeEventListener('mousemove', onDragDevMarker)
  window.removeEventListener('mouseup', stopDragDevMarker)
  window.removeEventListener('touchmove', onDragDevMarker)
  window.removeEventListener('touchend', stopDragDevMarker)
}

const chatStore = useChatStore()
const userStore = useUserStore()
const userDataStore = useUserDataStore()

watch(
  () => userStore.user?.id,
  (newUserId) => {
    if (newUserId) {
      const cachedKey = `user_characters_${newUserId}`
      const cachedCharacters = localStorage.getItem(cachedKey)
      if (cachedCharacters) {
        try {
          const parsed = JSON.parse(cachedCharacters)
          chatStore.userCharacters = parsed.characters || []
        } catch (e) {
          console.error(t('chat.parseCachedUserCharactersFailed') + ':', e)
        }
      }
      chatStore.loadUserCharacters(newUserId)
    }
  },
  { immediate: true }
)

const globalRegex = ref<any[]>([])

const compiledRegexScripts = computed<CompiledRegexScript[]>(() => {
  const globalRegexList = globalRegex.value || []
  const charRegexList = chatStore.currentCharacter?.regex_scripts || []
  const userRegexList = userDataStore.enabledRegexScripts || []
  return compileRegexScripts(globalRegexList, charRegexList, userRegexList)
})

// 判断是否为PC端
const isPc = () => window.innerWidth >= 1024

// 从 localStorage 读取侧边栏状态，手机端默认关闭，PC端读取保存的状态
const savedSidebarState = localStorage.getItem('sidebarOpen')
const sidebarOpen = ref(isPc() ? (savedSidebarState !== null ? savedSidebarState === 'true' : true) : false)

// 监听侧边栏状态变化，只有PC端才保存到 localStorage
watch(sidebarOpen, (newValue) => {
  if (isPc()) {
    localStorage.setItem('sidebarOpen', newValue.toString())
  }
})
const showMenuDropdown = ref(false)
const showUserNameDialog = ref(false)
const editingUserName = ref('')
const showRemoveFriendConfirm = ref(false)
const isRemovingFriend = ref(false)
const showErrorDialog = ref(false)
const errorMessage = ref('')
const showFriendSelector = ref(false)
const showUserSettings = ref(false)
const showUserDataSettings = ref(false)
const showBackgroundSelector = ref(false)
const showChatSync = ref(false)
const showChatStats = ref(false)
const showAbout = ref(false)
const buildTime = __APP_BUILD_TIME__
const backgroundImageUrl = ref<string | null>(null)
const characterBackgroundUrl = ref<string | null>(null)
const backgroundMode = ref<BackgroundMode>('character')
const selectedBackgroundName = ref<string | null>(null)
let currentCharacterBgObjectUrl: string | null = null
let currentCustomBgObjectUrl: string | null = null
let backgroundLoadVersion = 0
const characterLimit = ref<{ currentCount: number; baseLimit: number; bonusSlots: number; totalLikes: number; maxLimit: number } | null>(null)

const {
  showCreateCharacterModal,
  isLoadingCharacterDetail,
  isSavingCharacter,
  isImportingCharacter,
  editingCharacter,
  editingCharacterMeta,
  displayMeta,
  isLoadingMeta,
  isViewOnlyMode,
  newCharacterData,
  likedCharacterIds,
  isLikingInEdit,
  isLoadingOriginal,
  isLoadingSource,
  isLoadingViewData,
  existsOnServer,
  isOwnerOfCharacter,
  showCommentSection,
  friendCharacters,
  isCurrentCharacterFriend,
  isCurrentCharacterUserOwned,
  isUpdatingToServer,
  isUploadingToServer,
  isUpdatingFromServer,
  isDeletingCharacter,
  selectCharacter,
  openCreateCharacterModal,
  closeCreateCharacterModal,
  saveCharacter,
  editUserCharacter,
  handleViewCharacter,
  handleDeleteFromEdit,
  handleToggleLikeInEdit,
  loadOriginalCharacterData: originalLoadOriginalCharacterData,
  loadLikedCharacters,
  handleImportUserCharacter,
  updateToServer,
  handleUploadToServer,
  updateFromServer
} = useCharacter()

async function handleLoadOriginalCharacterData() {
  try {
    const message = await originalLoadOriginalCharacterData()
    if (message) {
      showToast(message, 'success')
    }
  } catch (e: any) {
    showToast(e.message || t('chat.loadOriginalCharacterFailed'), 'error')
  }
}

async function handleUpdateToServer(data: any) {
  try {
    await updateToServer(data)
    showToast(t('chat.updateToServerSuccess'), 'success')
  } catch (e: any) {
    showToast(e.message || t('chat.updateToServerFailed'), 'error')
  }
}

async function handleUpdateFromServer() {
  try {
    const result = await updateFromServer()
    if (result.success && result.message) {
      showToast(result.message, 'success')
    }
  } catch (e: any) {
    showToast(e.message || t('chat.updateFromServerFailed'), 'error')
  }
}

async function handleSaveCharacter(data: any) {
  try {
    const result = await saveCharacter(data)
    if (result.success && result.message) {
      showToast(result.message, 'success')
    }
  } catch (e: any) {
    showToast(e.message || t('chat.saveFailed'), 'error')
  }
}

async function onImportCharacter(event: Event) {
  try {
    const result = await handleImportUserCharacter(event)
    if (result) {
      let message = t('chat.importCharactersSuccess', { successCount: result.successCount })
      if (result.failCount > 0) {
        message += t('chat.importCharactersPartialFail', { failCount: result.failCount })
      }
      showToast(message, 'success')
    }
  } catch (e: any) {
    showToast(e.message || t('chat.importCharactersFailed'), 'error')
  }
}

async function handleFriendCharactersUpdated(characters: any[]) {
  // 好友列表已经通过 localFriendStorage 更新，这里不需要额外处理
  // 保持 friendCharacters 的响应性即可
}

async function handleViewCharacterWithErrorHandling(character: any) {
  try {
    await handleViewCharacter(character)
  } catch (e: any) {
    showToast(e.message || t('chat.viewCharacterDetailFailed'), 'error')
  }
}

async function handleEditUserCharacterWithErrorHandling(character: any) {
  try {
    await editUserCharacter(character)
  } catch (e: any) {
    showToast(e.message || t('chat.loadCharacterInfoFailed'), 'error')
  }
}

const {
  showCustomModelConfig,
  customModelConfigs,
  activeCustomModelConfig,
  activeCustomModelConfigId,
  isFetchingModels,
  availableCustomModels,
  fetchModelsError,
  isLoadingBuiltinModels,
  pendingSwitchToBuiltin,
  fetchCustomModels,
  updateCustomModelConfig,
  createCustomModelConfig,
  selectCustomModelConfig,
  deleteCustomModelConfig,
  handleServiceSelect,
  loadCustomModelsFromStorage
} = useCustomModel()

// 更新当前激活配置的单个字段
function updateConfigField(field: string, value: any) {
  if (modelConfigStore.activeConfigId) {
    updateConfig(modelConfigStore.activeConfigId, { [field]: value })
  }
}

// 配置弹窗中当前选中的配置 ID
const selectedConfigId = ref<string | null>(null)

// 内置模型选项
const getBuiltinModelOptions = computed(() => {
  const models = chatStore.uniqueModels
  return models.map(model => ({
    id: model.id,
    value: model.id,
    label: `${model.name}${model.is_default ? ` (${t('model.isDefault')})` : ''}`
  }))
})

// 自定义模型选项
const getCustomModelOptions = computed(() => {
  const models = availableCustomModels.value
  return models.map((model: string) => ({
    value: model,
    label: model
  }))
})

const messages = computed(() => chatStore.displayedMessages)

const editingIndex = ref(-1)
  const editContent = ref('')
  const autoFetchSuggestions = ref(localStorage.getItem('role_play_auto_suggestions') === 'true')
  const isLoadingMore = ref(false)

const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message
  toastType.value = type
  setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}

async function handleDeleteCustomModelConfig(id: string) {
  if (!id) return

  const confirmed = await showDangerConfirm('确定要删除当前自定义模型配置吗？')
  if (!confirmed) return

  await deleteCustomModelConfig(id)
  showToast('已删除自定义模型配置', 'success')
}

function toggleAutoSuggestions() {
  autoFetchSuggestions.value = !autoFetchSuggestions.value
  localStorage.setItem('role_play_auto_suggestions', autoFetchSuggestions.value.toString())
}

// 获取当前选择的服务值
function getCurrentServiceValue() {
  if (!chatStore.useCustomModel && showAuthEntry) {
    return 'builtin'
  }
  if (modelConfigStore.activeConfigId) {
    return `config:${modelConfigStore.activeConfigId}`
  }
  // 如果还没有激活的配置，但有配置，选第一个
  if (modelConfigStore.configs.length > 0) {
    return `config:${modelConfigStore.configs[0].id}`
  }
  return 'builtin'
}

// 处理服务选择
async function handleServiceSelectNew(event: Event) {
  const target = event.target as HTMLSelectElement
  const value = target.value
  
  if (value === 'builtin') {
    if (!userStore.isLoggedIn()) {
      // 需要登录
      pendingSwitchToBuiltin.value = true
      userStore.requireLogin()
      target.value = getCurrentServiceValue()
      return
    }
    // 切换到内置模型
    await switchToBuiltinModel()
  } else if (value.startsWith('config:')) {
    // 切换到自定义配置
    const configId = value.replace('config:', '')
    const config = modelConfigStore.configs.find(c => c.id === configId)
    if (config) {
      setActiveConfig(configId)
      chatStore.setUseCustomModel(true)
    }
  } else if (value === 'add-config') {
    // 添加新配置
    const newConfig = modelConfigStore.addConfig({
      name: `${t('model.configName')} ${modelConfigStore.configs.length}`
    })
    selectedConfigId.value = newConfig.id
    setActiveConfig(newConfig.id)
    chatStore.setUseCustomModel(true)
    showCustomModelConfig.value = true
    showMenuDropdown.value = false
    // 重置选择值
    target.value = getCurrentServiceValue()
  }
}

function handleLoadMore() {
  if (isLoadingMore.value || !chatStore.hasMoreMessages) return
  isLoadingMore.value = true

  // 记录当前 scrollHeight，用于加载后恢复滚动位置
  const container = chatMessagesRef.value?.messagesContainer
  const previousScrollHeight = container?.scrollHeight || 0

  chatStore.loadMoreMessages()

  nextTick(() => {
    if (container) {
      const newScrollHeight = container.scrollHeight
      container.scrollTop = newScrollHeight - previousScrollHeight
    }
    isLoadingMore.value = false
  })
}

const chatMessagesRef = ref<InstanceType<typeof ChatMessages> | null>(null)

function copyMessage(content: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(content)
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = content
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

function startEdit(data: { index: number; content: string }) {
  editingIndex.value = data.index + chatStore.displayOffset
  editContent.value = data.content
}

function cancelEdit() {
  editingIndex.value = -1
  editContent.value = ''
}

function saveEdit(index: number) {
  chatStore.editMessage(index + chatStore.displayOffset, editContent.value)
  cancelEdit()
  chatStore.suggestions = []
  chatStore.lastSuggestionsMessagesSnapshot = ''
  chatStore.showSuggestions = false
}

function sendEdit(index: number) {
  const content = editContent.value.trim()
  if (!content) return

  const realIndex = index + chatStore.displayOffset
  chatStore.editMessage(realIndex, content)
  cancelEdit()
  chatStore.suggestions = []
  chatStore.lastSuggestionsMessagesSnapshot = ''
  chatStore.showSuggestions = false

  chatStore.regenerateFrom(realIndex)
}

async function deleteMessage(index: number) {
  const confirmed = await showDangerConfirm(t('chat.deleteMessageConfirm'))
  if (confirmed) {
    chatStore.deleteMessage(index + chatStore.displayOffset)
    chatStore.suggestions = []
    chatStore.lastSuggestionsMessagesSnapshot = ''
    chatStore.showSuggestions = false
  }
}

function regenerateFromAssistant(index: number) {
  const realIndex = index + chatStore.displayOffset
  if (realIndex > 0 && chatStore.messages[realIndex - 1].role === 'user') {
    chatStore.regenerateFrom(realIndex - 1)
    chatStore.suggestions = []
    chatStore.lastSuggestionsMessagesSnapshot = ''
    chatStore.showSuggestions = false
  }
}

function regenerateUserMessage(index: number) {
  const realIndex = index + chatStore.displayOffset
  const msg = chatStore.messages[realIndex]
  if (!msg || msg.role !== 'user') return
  chatStore.regenerateFrom(realIndex)
}

async function regenerateGreeting() {
  if (!backendEnabled) return
  if (!chatStore.currentCharacter) return
  
  try {
    const response = await fetch('/api/chat/greeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: chatStore.currentCharacter.id })
    }).then(r => r.json())
    
    const greetingIndex = chatStore.messages.findIndex(m => m.isGreeting)
    
    if (greetingIndex !== -1) {
      chatStore.editMessage(greetingIndex, response.first_mes)
    }
  } catch (e: any) {
    showToast(t('chat.generateGreetingFailed') + ': ' + e.message, 'error')
  }
}

async function confirmClearHistory() {
  const confirmed = await showDangerConfirm(t('chat.clearChatConfirm'))
  if (confirmed) {
    chatStore.clearHistory()
  }
}

async function handleExportChat() {
  try {
    await chatStore.exportChat()
  } catch (e: any) {
    showToast(t('chat.exportChatFailed') + ': ' + e.message, 'error')
  }
}

async function handleExportChatAsText() {
  try {
    await chatStore.exportChatAsText()
  } catch (e: any) {
    showToast('导出失败: ' + e.message, 'error')
  }
}

async function handleImportChat(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  try {
    const count = await chatStore.importChat(file)
    showToast(t('chat.importChatSuccess', { count: count }), 'success')
  } catch (e: any) {
    showToast(t('chat.importChatFailed') + ': ' + e.message, 'error')
  }
  
  ;(event.target as HTMLInputElement).value = ''
}

async function fetchSuggestions(options: { autoShow?: boolean, force?: boolean } = {}) {
  // 如果正在生成，则取消之前的请求
  if (chatStore.isGeneratingSuggestions) {
    chatStore.cancelSuggestions()
  }
  
  // 检查自定义模型配置
  if (chatStore.useCustomModel) {
    const config = chatStore.customModelConfig
    if (!config?.api_url || !config?.api_key || !config?.default_model) {
      showToast(t('chat.completeCustomModelConfig'), 'error')
      return
    }
  }
  
  const { autoShow = true, force = false } = options
  
  // 获取当前角色ID
  const currentCharacterId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id
  if (!currentCharacterId) {
    return
  }
  
  const currentMessagesSnapshot = JSON.stringify(chatStore.messages.slice(-6))
  if (!force && chatStore.suggestions.length > 0 && chatStore.lastSuggestionsMessagesSnapshot === currentMessagesSnapshot) {
    if (autoShow) {
      chatStore.showSuggestions = true
    }
    return
  }
  
  chatStore.isGeneratingSuggestions = true
  chatStore.startSuggestionsTimer()
  if (autoShow) {
    chatStore.showSuggestions = false
  }
  
  // 创建新的AbortController
  const abortController = new AbortController()
  chatStore.setSuggestionsAbortController(abortController, currentCharacterId)
  
  try {
    // 在前端构建上下文（不添加用户新消息）
    // 截取最新的 n 条消息
    let filteredHistory = chatStore.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))
    let historyTruncated = false
    let truncatedCount = 0
    if (config.suggestionsMaxHistory > 0 && filteredHistory.length > config.suggestionsMaxHistory) {
      truncatedCount = filteredHistory.length - config.suggestionsMaxHistory
      filteredHistory = filteredHistory.slice(-config.suggestionsMaxHistory)
      historyTruncated = true
    }
    
    // 如果历史记录被截取，添加系统提示
    if (historyTruncated) {
      filteredHistory.unshift({
        role: 'system',
        content: t('chat.historyTruncatedForSuggestions', { truncatedCount, maxHistory: config.suggestionsMaxHistory })
      })
    }
    
    const contextResult = await chatStore.buildLocalContext(
      filteredHistory,
      ''
    )
    
    const context = contextResult.messages
    
    // 添加建议生成提示
    const prompt = t('chat.generateSuggestionsPrompt')
    context.push({ role: 'user', content: prompt })
    
    let response: string
    
    // 如果使用自定义模型，前端直接调用模型API
    if (chatStore.useCustomModel && chatStore.customModelConfig) {
      response = await llmChat(
        chatStore.customModelConfig,
        context as any,
        { temperature: 1.0 }
      )
    } else {
      // 使用内置模型调用 API（共用相同的上下文）
      if (userStore.isAnonymous) {
        showToast(t('chat.loginFirstForBuiltinModel'), 'error')
        return
      }
      
      let modelToUse = chatStore.selectedModel
      if (!modelToUse) {
        modelToUse = chatStore.globalDefaultModel
      }
      
      if (!modelToUse) {
        showToast(t('chat.selectModelFirst'), 'error')
        return
      }
      
      // 使用相同的上下文调用内置模型 API
      response = await v1Api.chatCompletion({
        messages: context.map(m => ({
          role: m.role,
          content: m.content,
          name: m.name
        })),
        temperature: 1.0,
        model: modelToUse,
        mode: 'suggestions'
      })
    }
    
    // 检查请求是否已被取消，或角色是否已切换
    if (abortController.signal.aborted) {
      return
    }
    
    // 检查角色是否还是原来的角色
    const currentId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id
    if (currentId !== currentCharacterId) {
      return
    }
    
    let content = response
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const match = content.match(/\[(.*)\]/s)
    if (match) {
      content = match[0]
    }
    
    // 替换中文引号和逗号为英文引号和逗号，确保 JSON 能正常解析
    const originalContent = content
    content = content.replace(/[；]/g, ';')
    
    if (isDev) {
      console.log('[建议回复解析] 替换前内容:', originalContent)
      console.log('[建议回复解析] 替换后内容:', content)
    }
    
    let parsedSuggestions: string[] = []
    try {
      const parsed = content.split(';')
      if (Array.isArray(parsed)) {
        parsedSuggestions = parsed.slice(0, 5)
      }
      if (isDev) {
        console.log('[建议回复解析] 解析成功:', parsedSuggestions)
      }
    } catch (e) {
      if (isDev) {
        console.error('[建议回复解析] JSON 解析失败，使用备用解析方案:', e)
      }
      const lines = content.split('\n').filter(line => line.trim())
      parsedSuggestions = lines.slice(0, 5).map(line => line.replace(/^[\d\.\-\*]+\s*/, '').trim()).filter(s => s)
      if (isDev) {
        console.log('[建议回复解析] 备用解析结果:', parsedSuggestions)
      }
    }
    
    // 再次检查角色是否还是原来的角色
    const finalCharacterId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id
    if (finalCharacterId !== currentCharacterId) {
      return
    }
    
    chatStore.suggestions = parsedSuggestions
    if (autoShow) {
      chatStore.showSuggestions = parsedSuggestions.length > 0
    }
    chatStore.lastSuggestionsMessagesSnapshot = JSON.stringify(chatStore.messages.slice(-6))
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return
    }
    
    console.error('Failed to fetch suggestions:', error)
    if (error.message?.includes('额度不足')) {
      setTimeout(() => {
        showToast(error.message, 'error')
      }, 100)
    }
  } finally {
    // 检查角色是否还是原来的角色，只有在角色未切换时才更新状态
    const finalCharacterId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id
    if (finalCharacterId === currentCharacterId) {
      chatStore.isGeneratingSuggestions = false
    }
    chatStore.stopSuggestionsTimer()
  }
}

function handleToggleSuggestions() {
  if (chatStore.showSuggestions) {
    // 如果已经显示，则隐藏
    chatStore.showSuggestions = false
  } else {
    // 如果没有显示
    if (chatStore.suggestions.length > 0) {
      // 如果有已有建议，直接显示
      chatStore.showSuggestions = true
    } else {
      // 如果没有建议，则获取并显示
      fetchSuggestions({ autoShow: true })
    }
  }
}

async function handleOpenUserSettings() {
  if (userStore.user) {
    showUserSettings.value = true
    // 直接在这里调用 API 获取最新数据
    try {
      const result = await userApi.getCharacterLimit()
      characterLimit.value = result
    } catch (e) {
      console.error('Failed to get user data:', e)
    }
  } else {
    editingUserName.value = chatStore.userName || ''
    showUserNameDialog.value = true
  }
}

function handleOpenFriendSelector() {
  if (!backendEnabled) return
  if (userStore.isAnonymous) {
    userStore.requireLogin()
  } else {
    showFriendSelector.value = true
  }
}

async function sendSuggestion(suggestion: string) {
  if (!chatStore.userName || chatStore.userName === t('chat.guest')) {
    editingUserName.value = ''
    showUserNameDialog.value = true
    return
  }
  
  const success = await chatStore.sendMessage(suggestion)
  chatStore.showSuggestions = false
  if (success) {
    nextTick(() => {
      // chatMessagesRef.value?.scrollToBottom(1000)
    })
  }
}

async function handleSubmit(text: string, clearInput: () => void) {
  if (!text.trim()) return
  
  if (!chatStore.userName || chatStore.userName === t('chat.guest')) {
    editingUserName.value = ''
    showUserNameDialog.value = true
    return
  }
  
  const success = await chatStore.sendMessage(text)
  if (success) {
    clearInput()
    // 发送消息后立即滚动到底部
    nextTick(() => {
      chatMessagesRef.value?.scrollToBottom(300)
    })
  }
}

async function saveUserName() {
  if (!editingUserName.value.trim()) return
  try {
    await userStore.updateUserName(editingUserName.value.trim())
  } catch (error) {
    console.error('Failed to save userName:', error)
  }
  showUserNameDialog.value = false
  
  if (chatStore.lastCharacterId) {
    const lastChar = userStore.friendCharacters.find(c => 
      c.role_play?.id === chatStore.lastCharacterId || c.id === chatStore.lastCharacterId
    )
    if (lastChar) {
      await chatStore.selectCharacter(lastChar)
    }
  }
}

async function handleRemoveFriend() {
  if (!chatStore.currentCharacter) return
  
  isRemovingFriend.value = true
  try {
    await userStore.removeFriend(chatStore.currentCharacter.id)
    await chatStore.clearCharacterHistory(chatStore.currentCharacter.id)
    chatStore.setCurrentCharacter(null)
    showRemoveFriendConfirm.value = false
  } catch (error) {
    console.error('Failed to remove friend:', error)
    showToast('删除剧本失败', 'error')
  } finally {
    isRemovingFriend.value = false
  }
}

const currentAvatarUrl = ref<string | undefined>(undefined)
const avatarUpdateTrigger = ref<string | undefined>(undefined)

async function loadCurrentCharacterAvatar() {
  if (!chatStore.currentCharacter) {
    currentAvatarUrl.value = undefined
    return
  }
  try {
    const url = await getFriendAvatar(chatStore.currentCharacter)
    currentAvatarUrl.value = url
  } catch (e) {
    console.error('Failed to load avatar:', e)
    currentAvatarUrl.value = undefined
  }
}

function handleAvatarUpdated(characterId: string) {
  clearCharacterAvatarCache(characterId)
  avatarUpdateTrigger.value = characterId
  
  const currentId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id
  if (currentId === characterId) {
    loadCurrentCharacterAvatar()
    loadBackground()
  }
}

function handleUpdateSharedFromModal(value: boolean) {
  editingCharacterMeta.value.shared = value
  userStore.loadLocalFriends()
}

async function openCharacterInfoFromCurrent() {
  if (chatStore.currentCharacter) {
    await handleEditUserCharacterWithErrorHandling(chatStore.currentCharacter)
  }
}

async function loadBackground() {
  const loadVersion = ++backgroundLoadVersion
  let nextCharacterUrl: string | null = null
  let nextCustomUrl: string | null = null

  try {
    const settings = await loadBackgroundSettings()
    const characterId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id

    if (characterId) {
      const blob = await characterGet(characterId)
      if (blob && blob.type?.startsWith('image/')) {
        nextCharacterUrl = URL.createObjectURL(blob)
      }
    }

    if (settings.backgroundMode === 'custom' && settings.selectedBackground) {
      nextCustomUrl = await getBackgroundUrl(settings.selectedBackground)
    }

    if (loadVersion !== backgroundLoadVersion) {
      if (nextCharacterUrl) URL.revokeObjectURL(nextCharacterUrl)
      if (nextCustomUrl) URL.revokeObjectURL(nextCustomUrl)
      return
    }

    if (currentCharacterBgObjectUrl) URL.revokeObjectURL(currentCharacterBgObjectUrl)
    if (currentCustomBgObjectUrl) URL.revokeObjectURL(currentCustomBgObjectUrl)

    currentCharacterBgObjectUrl = nextCharacterUrl
    currentCustomBgObjectUrl = nextCustomUrl
    characterBackgroundUrl.value = nextCharacterUrl
    selectedBackgroundName.value = settings.selectedBackground

    if (settings.backgroundMode === 'custom') {
      if (nextCustomUrl) {
        backgroundMode.value = 'custom'
        backgroundImageUrl.value = nextCustomUrl
      } else {
        backgroundMode.value = 'character'
        selectedBackgroundName.value = null
        backgroundImageUrl.value = nextCharacterUrl
        await selectBackgroundMode('character')
      }
    } else if (settings.backgroundMode === 'none') {
      backgroundMode.value = 'none'
      backgroundImageUrl.value = null
    } else {
      backgroundMode.value = 'character'
      backgroundImageUrl.value = nextCharacterUrl
    }
  } catch (e) {
    if (nextCharacterUrl) URL.revokeObjectURL(nextCharacterUrl)
    if (nextCustomUrl) URL.revokeObjectURL(nextCustomUrl)
    console.error('Failed to load chat background:', e)
  }
}

async function handleSignin() {
  if (!backendEnabled) return
  try {
    await userStore.signin()
  } catch (e: any) {
    showToast(t('chat.signinFailed') + ': ' + e.message, 'error')
  }
}

let previousIsStreaming = chatStore.isStreaming
let streamingCharacterId: string | null = null

watch(() => chatStore.isStreaming, (isStreaming) => {
  if (isStreaming) {
    streamingCharacterId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id || null
  }
  
  if (previousIsStreaming && !isStreaming && autoFetchSuggestions.value) {
    setTimeout(() => {
      if (chatStore.error) return
      if (chatStore.wasManuallyStopped) return
      
      const currentCharId = chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id
      if (streamingCharacterId && currentCharId !== streamingCharacterId) {
        return
      }
      
      const lastMessage = chatStore.messages[chatStore.messages.length - 1]
      if (!lastMessage || lastMessage.role !== 'assistant') {
        return
      }
      const content = lastMessage.content || ''
      if (!content.trim() || content.startsWith('[Error:')) {
        return
      }
      
      fetchSuggestions({ autoShow: true })
    }, 300)
  }
  previousIsStreaming = isStreaming
})

watch(() => chatStore.error, (newError) => {
  if (newError) {
    showToast(newError, 'error')
    
    if (newError.includes('API Key') || 
        newError.includes(t('chat.modelConfig')) ||
        newError.includes(t('chat.apiConfig'))) {
      showMenuDropdown.value = true
    }
    
    chatStore.error = null
  }
})

watch(() => chatStore.currentCharacter?.role_play?.id || chatStore.currentCharacter?.id, () => {
  loadCurrentCharacterAvatar()
  loadBackground()
})

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const tokenFromUrl = urlParams.get('token')
  const isNewFromUrl = urlParams.get('is_new') === 'true'

  if (backendEnabled && tokenFromUrl) {
    try {
      await userStore.loginWithToken(tokenFromUrl, isNewFromUrl)
      window.history.replaceState({}, document.title, window.location.pathname)
      
      if (isNewFromUrl) {
        // 延迟一点时间显示欢迎消息，确保用户数据已加载
        setTimeout(() => {
          showToast(t('chat.welcomeMessage'), 'success')
        }, 500)
      }
    } catch (error) {
      console.error('Failed to login with token:', error)
    }
  }

  if (backendEnabled) {
    chatStore.loadModels()
  } else {
    chatStore.setUseCustomModel(true)
  }
  if (userStore.isLoggedIn()) {
    await userStore.loadFriends()
  }
  
  if (backendEnabled && userStore.isLoggedIn()) {
    loadLikedCharacters()
  }
  
  loadCustomModelsFromStorage()
  
  loadBackground()

  await userDataStore.load()
  
  if (chatStore.lastCharacterId) {
    const lastChar = userStore.friendCharacters.find(c => 
      c.role_play?.id === chatStore.lastCharacterId || c.id === chatStore.lastCharacterId
    )
    if (lastChar) {
      await chatStore.selectCharacter(lastChar)
    }
  }
  
  loadCurrentCharacterAvatar()
})

onUnmounted(() => {
  showMenuDropdown.value = false
  backgroundLoadVersion++
  if (currentCharacterBgObjectUrl) URL.revokeObjectURL(currentCharacterBgObjectUrl)
  if (currentCustomBgObjectUrl) URL.revokeObjectURL(currentCustomBgObjectUrl)
  currentCharacterBgObjectUrl = null
  currentCustomBgObjectUrl = null
})

;(window as any).triggerSlash = async (text: string) => {
  console.log('triggerSlash called from UI:', text)
  if (!text) return
  await chatStore.sendMessage(text)
}
</script>
