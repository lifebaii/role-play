<template>
  <div class="chat-container flex bg-[var(--theme-bg-start)]">
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
      @edit-character="editUserCharacter"
      @select-character="selectCharacter"
      @import-character="onImportCharacter"
      @open-about="showAbout = true"
      @friend-characters-updated="handleFriendCharactersUpdated"
    />

    <div class="flex-1 flex flex-col min-w-0 relative overflow-hidden">
      <div v-if="chatStore.isLoading" class="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-3 bg-[var(--theme-card-bg)] p-8 rounded-2xl shadow-xl border border-theme-border">
          <div class="w-12 h-12 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin shadow-lg shadow-[var(--theme-primary)]/30"></div>
          <span class="text-theme-text-secondary font-medium">加载中...</span>
        </div>
      </div>

      <div v-if="!chatStore.isLoading && !chatStore.currentCharacter" class="flex-1 flex items-center justify-center">
        <div class="text-center px-4">
          <div class="w-32 h-32 mx-auto mb-6 animate-float">
            <img src="/pwa-512x512.png" alt="Logo" class="w-full h-full object-contain" style="filter: drop-shadow(0 25px 25px rgba(59, 130, 246, 0.3));" />
          </div>
          <h2 class="text-2xl font-bold gradient-text mb-2">开始你的故事</h2>
          <p class="text-theme-text-secondary mb-6">选择一个角色开始聊天</p>
          <button
            @click="sidebarOpen = true"
            class="px-6 py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] text-white rounded-xl font-semibold shadow-lg shadow-[var(--theme-primary)]/25 hover:shadow-xl hover:shadow-[var(--theme-primary)]/30 transition-all duration-200 transform hover:-translate-y-0.5 lg:hidden"
          >
            查看角色列表
          </button>
        </div>
      </div>

      <template v-else>
        <div class="absolute top-0 left-0 right-0 z-20 border-b border-theme-border overflow-hidden shadow-sm chat-header" style="padding-top: var(--safe-area-inset-top);">
          <div class="h-14 px-2 sm:px-4 flex items-center gap-2 sm:gap-3">
            <button
            @click="sidebarOpen = true"
            class="lg:hidden p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-theme-text-secondary flex-shrink-0 hover:bg-[var(--theme-primary)]/10 rounded-xl transition-all"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <AvatarImage
            :src="currentAvatarUrl"
            :name="chatStore.currentCharacter?.name || '?'"
            size="nav"
            rounded="lg"
            gradient="primary"
            class="flex-shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform"
            @click="openCharacterInfoFromCurrent"
          />
          <div class="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <div v-if="chatStore.isUpdatingInBackground" class="w-4 h-4 flex-shrink-0">
              <div class="w-4 h-4 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span 
              @click="openCharacterInfoFromCurrent"
              class="text-base sm:text-lg font-semibold text-theme-text-primary truncate cursor-pointer hover:text-theme-text-accent transition-colors"
            >
              {{ chatStore.currentCharacter?.name || '未知角色' }}
            </span>
          </div>
          <button
            ref="menuButtonRef"
            @click="showMenuDropdown = !showMenuDropdown"
            class="px-2 py-1.5 sm:px-3 sm:py-2 text-sm text-theme-text-secondary hover:bg-[var(--theme-primary)]/10 rounded-xl flex items-center gap-1 sm:gap-2 flex-shrink-0 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
            <span class="hidden sm:inline">菜单</span>
          </button>
          </div>
        </div>

        <div
          v-if="showMenuDropdown"
          class="fixed right-2 sm:right-4 top-16 sm:top-20 w-48 sm:w-52 menu-dropdown rounded-2xl shadow-xl shadow-[var(--theme-shadow)] border border-theme-border py-2 z-50"
          @click="showMenuDropdown = false"
        >
          <div class="px-4 py-3 border-b border-theme-border mb-1" @click.stop>
            <template v-if="showAuthEntry">
              <div class="text-xs font-semibold text-theme-text-secondary mb-2 uppercase tracking-wider">选择服务</div>
              <select
                :value="chatStore.useCustomModel ? 'custom' : 'builtin'"
                @change.stop="handleServiceSelect($event)"
                class="w-full px-3 py-2 text-sm border border-theme-border rounded-xl select-field focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] mb-3"
              >
                <option value="custom">自定义模型</option>
                <option value="builtin">内置模型服务</option>
              </select>
            </template>

            <div class="text-xs font-semibold text-theme-text-secondary mb-2 uppercase tracking-wider">选择模型</div>
            <template v-if="chatStore.useCustomModel || !showAuthEntry">
              <select
                :value="chatStore.customModelConfig?.default_model || ''"
                @change.stop="updateCustomModelConfig('default_model', ($event.target as HTMLSelectElement).value)"
                class="w-full px-3 py-2 text-sm border border-theme-border rounded-xl select-field focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"
              >
                <option value="">选择模型</option>
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
                配置自定义模型
              </button>
            </template>
            <template v-else>
              <template v-if="isLoadingBuiltinModels">
                <div class="flex items-center justify-center py-2 text-sm text-theme-text-secondary">
                  <svg class="w-4 h-4 animate-spin mr-2" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  加载模型列表...
                </div>
              </template>
              <template v-else-if="userStore.isAnonymous">
                <div class="text-sm text-theme-text-secondary mb-2">
                  请先登录以使用内置模型服务
                </div>
                <button
                  @click.stop="userStore.requireLogin()"
                  class="w-full px-3 py-2 text-sm bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  登录
                </button>
              </template>
              <template v-else-if="chatStore.uniqueModels.length === 0">
                <div class="text-sm text-theme-text-secondary mb-2">
                  暂无可用模型
                </div>
              </template>
              <template v-else>
                <select
                  :value="chatStore.selectedModel"
                  @change.stop="chatStore.setSelectedModel(($event.target as HTMLSelectElement).value)"
                  class="w-full px-3 py-2 text-sm border border-theme-border rounded-xl select-field focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"
                >
                  <option v-for="model in chatStore.uniqueModels" :key="model.id" :value="model.id">
                    {{ model.name }}{{ model.is_default ? ' (默认)' : '' }}
                  </option>
                </select>
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
              自动获取建议
            </span>
            <div class="ml-auto flex items-center">
              <div :class="autoFetchSuggestions ? 'w-10 h-5 bg-[var(--theme-success)] rounded-full relative' : 'w-10 h-5 bg-[var(--theme-card-hover)] rounded-full relative'">
                <div :class="autoFetchSuggestions ? 'absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all' : 'absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all'"></div>
              </div>
            </div>
          </button>
          <div class="border-t border-theme-border my-1"></div>
          <label class="w-full px-4 py-2.5 text-left text-sm text-theme-text-primary menu-dropdown-item cursor-pointer block flex items-center gap-3 transition-all">
            <div class="w-7 h-7 rounded-lg bg-[var(--theme-secondary)]/10 flex items-center justify-center text-theme-text-accent">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
            </div>
            <span>聊天记录导入</span>
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
            <span>聊天记录导出</span>
          </button>
          <button
            v-if="!userStore.isAnonymous"
            @click="showChatSync = true; showMenuDropdown = false"
            class="w-full px-4 py-2.5 text-left text-sm text-theme-text-primary menu-dropdown-item flex items-center gap-3 transition-all"
          >
            <div class="w-7 h-7 rounded-lg bg-[var(--theme-primary)]/10 flex items-center justify-center text-theme-text-accent">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
            </div>
            <span>聊天记录同步</span>
          </button>
          <div class="border-t border-theme-border my-1"></div>
          <button
            @click="confirmClearHistory"
            class="w-full px-4 py-2.5 text-left text-sm text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] flex items-center gap-3 transition-all"
          >
            <div class="w-7 h-7 rounded-lg bg-[var(--theme-danger-bg)] flex items-center justify-center text-[var(--theme-danger)]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </div>
            <span>清空聊天</span>
          </button>
        </div>

        <ChatMessages
          ref="chatMessagesRef"
          :messages="messages"
          :editing-index="editingIndex"
          :edit-content="editContent"
          :compiled-regex-scripts="compiledRegexScripts"
          @click="showSuggestions = false; showMenuDropdown = false"
          @copy="copyMessage"
          @edit="startEdit"
          @delete="deleteMessage"
          @regenerate-greeting="regenerateGreeting"
          @regenerate-from-assistant="regenerateFromAssistant"
          @regenerate-user="regenerateUserMessage"
          @save-edit="saveEdit"
          @send-edit="sendEdit"
          @cancel-edit="cancelEdit"
          @update:edit-content="editContent = $event"
        />

        <ChatInput
          :is-streaming="chatStore.isStreaming"
          :show-suggestions="showSuggestions"
          :suggestions="suggestions"
          :is-generating-suggestions="isGeneratingSuggestions"
          :auto-fetch-suggestions="autoFetchSuggestions"
          @submit="handleSubmit"
          @stop="chatStore.abortStream()"
          @fetch-suggestions="fetchSuggestions"
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
          <h2 class="text-lg sm:text-xl font-bold text-theme-text-primary mb-1 sm:mb-2">欢迎！</h2>
          <p class="text-theme-text-secondary text-xs sm:text-sm">设置一个你喜欢的称呼吧</p>
        </div>
        <input
          v-model="editingUserName"
          type="text"
          placeholder="输入你的称呼..."
          class="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-theme-border rounded-xl chat-input-field mb-4 sm:mb-6 text-center text-base sm:text-lg"
          @keyup.enter="saveUserName"
          autofocus
        />
        <button
          @click="saveUserName"
          class="w-full px-4 py-2 sm:px-6 sm:py-3 text-white bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm sm:text-base"
          :disabled="!editingUserName.trim()"
        >
          开始聊天 ✨
        </button>
      </div>
    </div>

    <div v-if="showRemoveFriendConfirm" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click.self="showRemoveFriendConfirm = false">
      <div class="chat-card rounded-2xl p-3 sm:p-6 max-w-md w-full shadow-2xl border border-theme-border">
        <h3 class="text-base sm:text-lg font-bold text-theme-text-primary mb-1 sm:mb-2">确认删除好友</h3>
        <p class="text-theme-text-secondary text-sm sm:text-base mb-4 sm:mb-6">确定要删除这位好友吗？删除后聊天记录也会一并删除。</p>
        <div class="flex gap-3">
          <button
            @click="showRemoveFriendConfirm = false"
            class="flex-1 px-4 py-2 chat-card text-theme-text-primary rounded-xl hover:bg-[var(--theme-card-hover)] transition-all"
          >
            取消
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
            <span>{{ isRemovingFriend ? '删除中...' : '确认删除' }}</span>
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
          <h3 class="text-base sm:text-lg font-bold text-theme-text-primary">出错了</h3>
        </div>
        <div class="mb-4 sm:mb-6">
          <p class="text-theme-text-secondary text-sm sm:text-base mb-2">错误信息：</p>
          <div class="bg-[var(--theme-danger-bg)] border border-[var(--theme-danger)]/30 rounded-xl p-3 sm:p-4 max-h-60 overflow-y-auto">
            <p class="text-[var(--theme-danger)] text-xs sm:text-sm whitespace-pre-wrap break-words">{{ errorMessage }}</p>
          </div>
        </div>
        <div class="flex justify-end">
          <button
            @click="showErrorDialog = false; chatStore.error = null;"
            class="px-6 py-2 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] transition-all shadow-lg hover:shadow-xl"
          >
            关闭
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

    <FriendSelector v-model:visible="showFriendSelector" @view-character="handleViewCharacter" />

    <ChatSyncModal
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
        <h3 class="text-base sm:text-lg font-semibold text-theme-text-primary mb-1 sm:mb-2">导入角色中...</h3>
        <p class="text-xs sm:text-sm text-theme-text-secondary">请稍候，正在处理您的角色数据</p>
      </div>
    </div>

    <div v-if="showAbout" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click="showAbout = false">
      <div class="chat-card rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl border border-theme-border" @click.stop>
        <div class="text-center">
          <div class="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br from-[var(--theme-primary)] via-[var(--theme-secondary)] to-[var(--theme-accent)] flex items-center justify-center shadow-lg">
            <span class="text-3xl sm:text-4xl">💬</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold gradient-text mb-1 sm:mb-2">ROLE PLAY</h2>
          <p class="text-xs sm:text-sm text-theme-text-secondary mb-4 sm:mb-6">沉浸式角色扮演聊天体验</p>
          
          <div class="text-left space-y-2 sm:space-y-3 text-xs sm:text-sm text-theme-text-primary mb-4 sm:mb-6">
            <p>🎭 与各种角色进行沉浸式对话</p>
            <p>✨ 支持自定义角色创建</p>
            <p>🌐 与好友分享角色</p>
            <p>🎨 支持亮色/暗色主题切换</p>
          </div>
          
          <div class="text-xs text-theme-text-secondary mb-3 sm:mb-4">
            版本 1.0.0
          </div>
          
          <button
            @click="showAbout = false"
            class="w-full py-2 sm:py-3 rounded-2xl font-semibold transition-all duration-200 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white hover:shadow-lg hover:shadow-[var(--theme-primary)]/30 text-sm sm:text-base"
          >
            关闭
          </button>
        </div>
      </div>
    </div>

    <CustomModelConfigModal
      v-model:visible="showCustomModelConfig"
      :use-custom-model="chatStore.useCustomModel"
      :config="chatStore.customModelConfig"
      :available-models="availableCustomModels"
      :is-fetching-models="isFetchingModels"
      :fetch-models-error="fetchModelsError"
      @toggle-use-custom-model="chatStore.setUseCustomModel(!chatStore.useCustomModel)"
      @update-config="updateCustomModelConfig"
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
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
import ChatSyncModal from './components/ChatSyncModal.vue'
import FriendSelector from '@/components/FriendSelector.vue'
import LoginModal from '@/components/LoginModal.vue'
import AvatarImage from '@/components/AvatarImage.vue'

import { useCharacter } from '@/composables/useCharacter'
import { useCustomModel } from '@/composables/useCustomModel'
import { useDialog } from '@/composables/useDialog'
import { getFriendAvatar, clearCharacterAvatarCache } from '@/utils/localFriendStorage'
import { config } from '@/utils/config'

const isDev = import.meta.env.DEV
const showAuthEntry = config.showAuthEntry
const devMarkerPosition = ref({ x: window.innerWidth - 50, y: window.innerHeight - 50 })
let isDragging = false
let dragOffset = { x: 0, y: 0 }
const { showDangerConfirm } = useDialog()

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
          console.error('解析缓存用户角色列表失败:', e)
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

const sidebarOpen = ref(false)
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
const showChatSync = ref(false)
const showAbout = ref(false)
const backgroundImageUrl = ref<string | null>(null)
let currentBgObjectUrl: string | null = null
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
  handleUpdateShared,
  loadOriginalCharacterData: originalLoadOriginalCharacterData,
  loadLikedCharacters,
  handleImportUserCharacter,
  updateToServer,
  updateFromServer
} = useCharacter()

async function handleLoadOriginalCharacterData() {
  try {
    const message = await originalLoadOriginalCharacterData()
    if (message) {
      showToast(message, 'success')
    }
  } catch (e: any) {
    showToast(e.message || '加载原角色数据失败', 'error')
  }
}

async function handleUpdateToServer(data: any) {
  try {
    await updateToServer(data)
    showToast('更新到服务器成功', 'success')
  } catch (e: any) {
    showToast(e.message || '更新到服务器失败', 'error')
  }
}

async function handleUpdateFromServer() {
  try {
    const result = await updateFromServer()
    if (result.success && result.message) {
      showToast(result.message, 'success')
    }
  } catch (e: any) {
    showToast(e.message || '从服务器更新失败', 'error')
  }
}

async function handleSaveCharacter(data: any) {
  try {
    const result = await saveCharacter(data)
    if (result.success && result.message) {
      showToast(result.message, 'success')
    }
  } catch (e: any) {
    showToast(e.message || '保存失败', 'error')
  }
}

async function onImportCharacter(event: Event) {
  try {
    const result = await handleImportUserCharacter(event)
    if (result) {
      let message = `成功导入 ${result.successCount} 个角色`
      if (result.failCount > 0) {
        message += `，${result.failCount} 个文件导入失败`
      }
      showToast(message, 'success')
    }
  } catch (e: any) {
    showToast(e.message || '导入失败', 'error')
  }
}

async function handleFriendCharactersUpdated(characters: any[]) {
  // 好友列表已经通过 localFriendStorage 更新，这里不需要额外处理
  // 保持 friendCharacters 的响应性即可
}

const {
  showCustomModelConfig,
  isFetchingModels,
  availableCustomModels,
  fetchModelsError,
  isLoadingBuiltinModels,
  fetchCustomModels,
  updateCustomModelConfig,
  handleServiceSelect,
  loadCustomModelsFromStorage
} = useCustomModel()

const messages = computed(() => chatStore.messages)

const editingIndex = ref(-1)
const editContent = ref('')
const showSuggestions = ref(false)
const suggestions = ref<string[]>([])
const isGeneratingSuggestions = ref(false)
const autoFetchSuggestions = ref(localStorage.getItem('role_play_auto_suggestions') === 'true')
let lastSuggestionsMessagesSnapshot: string = ''

const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message
  toastType.value = type
  setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}

function toggleAutoSuggestions() {
  autoFetchSuggestions.value = !autoFetchSuggestions.value
  localStorage.setItem('role_play_auto_suggestions', autoFetchSuggestions.value.toString())
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
  editingIndex.value = data.index
  editContent.value = data.content
}

function cancelEdit() {
  editingIndex.value = -1
  editContent.value = ''
}

function saveEdit(index: number) {
  chatStore.editMessage(index, editContent.value)
  cancelEdit()
  suggestions.value = []
  lastSuggestionsMessagesSnapshot = ''
  showSuggestions.value = false
}

function sendEdit(index: number) {
  const content = editContent.value.trim()
  if (!content) return
  
  chatStore.editMessage(index, content)
  cancelEdit()
  suggestions.value = []
  lastSuggestionsMessagesSnapshot = ''
  showSuggestions.value = false
  
  chatStore.regenerateFrom(index)
}

async function deleteMessage(index: number) {
  const confirmed = await showDangerConfirm('确定要删除这条消息吗？')
  if (confirmed) {
    chatStore.deleteMessage(index)
    suggestions.value = []
    lastSuggestionsMessagesSnapshot = ''
    showSuggestions.value = false
  }
}

function regenerateFromAssistant(index: number) {
  if (index > 0 && chatStore.messages[index - 1].role === 'user') {
    chatStore.regenerateFrom(index - 1)
    suggestions.value = []
    lastSuggestionsMessagesSnapshot = ''
    showSuggestions.value = false
  }
}

function regenerateUserMessage(index: number) {
  const msg = chatStore.messages[index]
  if (!msg || msg.role !== 'user') return
  chatStore.regenerateFrom(index)
}

async function regenerateGreeting() {
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
    showToast('生成开场白失败: ' + e.message, 'error')
  }
}

async function confirmClearHistory() {
  const confirmed = await showDangerConfirm('确定要清空聊天记录吗？')
  if (confirmed) {
    chatStore.clearHistory()
  }
}

async function handleExportChat() {
  try {
    await chatStore.exportChat()
  } catch (e: any) {
    showToast('导出失败: ' + e.message, 'error')
  }
}

async function handleImportChat(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  try {
    const count = await chatStore.importChat(file)
    showToast(`成功导入 ${count} 条消息`, 'success')
  } catch (e: any) {
    showToast('导入失败: ' + e.message, 'error')
  }
  
  ;(event.target as HTMLInputElement).value = ''
}

async function fetchSuggestions(options: { autoShow?: boolean, force?: boolean } = {}) {
  if (isGeneratingSuggestions.value) return
  
  // 检查自定义模型配置
  if (chatStore.useCustomModel) {
    const config = chatStore.customModelConfig
    if (!config?.api_url || !config?.api_key || !config?.default_model) {
      showToast('请先完成自定义模型配置（API地址、API密钥、模型名称）', 'error')
      return
    }
  }
  
  const { autoShow = true, force = false } = options
  
  const currentMessagesSnapshot = JSON.stringify(chatStore.messages.slice(-6))
  if (!force && suggestions.value.length > 0 && lastSuggestionsMessagesSnapshot === currentMessagesSnapshot) {
    if (autoShow) {
      showSuggestions.value = true
    }
    return
  }
  
  isGeneratingSuggestions.value = true
  if (autoShow) {
    showSuggestions.value = false
  }
  
  try {
    // 在前端构建上下文（不添加用户新消息）
    const contextResult = await chatStore.buildLocalContext(
      chatStore.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
      ''
    )
    
    const context = contextResult.messages
    
    // 添加建议生成提示
    const prompt = "请根据上述对话上下文，生成5个符合当前语境的简短用户回复建议，用于推动对话继续。回复建议要自然、简短、符合日常对话习惯。\n\n必须以严格的 JSON 数组格式返回，不要包含任何其他内容，格式示例：[\"建议1\", \"建议2\", \"建议3\", \"建议4\", \"建议5\"]"
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
        showToast('请先登录以使用内置模型服务', 'error')
        return
      }
      
      let modelToUse = chatStore.selectedModel
      if (!modelToUse) {
        modelToUse = chatStore.globalDefaultModel
      }
      
      if (!modelToUse) {
        showToast('请先选择一个模型', 'error')
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
    
    let content = response
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const match = content.match(/\[(.*)\]/s)
    if (match) {
      content = match[0]
    }
    
    let parsedSuggestions: string[] = []
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        parsedSuggestions = parsed.slice(0, 5)
      }
    } catch (e) {
      const lines = content.split('\n').filter(line => line.trim())
      parsedSuggestions = lines.slice(0, 5).map(line => line.replace(/^[\d\.\-\*]+\s*/, '').trim()).filter(s => s)
    }
    
    suggestions.value = parsedSuggestions
    if (autoShow) {
      showSuggestions.value = parsedSuggestions.length > 0
    }
    lastSuggestionsMessagesSnapshot = JSON.stringify(chatStore.messages.slice(-6))
  } catch (error: any) {
    console.error('Failed to fetch suggestions:', error)
    if (error.message === 'Insufficient quota') {
      setTimeout(() => {
        showToast('对话额度不足，请签到获取更多额度或联系管理员', 'error')
      }, 100)
    }
  } finally {
    isGeneratingSuggestions.value = false
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
  if (userStore.isAnonymous) {
    userStore.requireLogin()
  } else {
    showFriendSelector.value = true
  }
}

async function sendSuggestion(suggestion: string) {
  if (!chatStore.userName || chatStore.userName === '游客') {
    editingUserName.value = ''
    showUserNameDialog.value = true
    return
  }
  
  await chatStore.sendMessage(suggestion)
  showSuggestions.value = false
}

async function handleSubmit(text: string, clearInput: () => void) {
  if (!text.trim()) return
  
  if (!chatStore.userName || chatStore.userName === '游客') {
    editingUserName.value = ''
    showUserNameDialog.value = true
    return
  }
  
  const success = await chatStore.sendMessage(text)
  if (success) {
    clearInput()
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
    showToast('删除好友失败', 'error')
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
  }
}

function handleUpdateSharedFromModal(value: boolean) {
  editingCharacterMeta.value.shared = value
  userStore.loadLocalFriends()
}

function openCharacterInfoFromCurrent() {
  if (chatStore.currentCharacter) {
    editUserCharacter(chatStore.currentCharacter)
  }
}

async function loadBackground() {
  if (!chatStore.currentCharacter) {
    if (currentBgObjectUrl) {
      URL.revokeObjectURL(currentBgObjectUrl)
      currentBgObjectUrl = null
    }
    backgroundImageUrl.value = null
    return
  }

  const characterId = chatStore.currentCharacter.role_play?.id || chatStore.currentCharacter.id
  if (!characterId) {
    if (currentBgObjectUrl) {
      URL.revokeObjectURL(currentBgObjectUrl)
      currentBgObjectUrl = null
    }
    backgroundImageUrl.value = null
    return
  }

  try {
    const blob = await characterGet(characterId)
    if (blob && blob.type?.startsWith('image/')) {
      if (currentBgObjectUrl) {
        URL.revokeObjectURL(currentBgObjectUrl)
      }
      const url = URL.createObjectURL(blob)
      currentBgObjectUrl = url
      backgroundImageUrl.value = url
    } else {
      if (currentBgObjectUrl) {
        URL.revokeObjectURL(currentBgObjectUrl)
        currentBgObjectUrl = null
      }
      backgroundImageUrl.value = null
    }
  } catch (e) {
    console.error('Failed to load character background:', e)
    if (currentBgObjectUrl) {
      URL.revokeObjectURL(currentBgObjectUrl)
      currentBgObjectUrl = null
    }
    backgroundImageUrl.value = null
  }
}

async function handleSignin() {
  try {
    await userStore.signin()
  } catch (e: any) {
    showToast('签到失败: ' + e.message, 'error')
  }
}

let previousIsStreaming = chatStore.isStreaming
watch(() => chatStore.isStreaming, (isStreaming) => {
  if (previousIsStreaming && !isStreaming && autoFetchSuggestions.value) {
    setTimeout(() => {
      if (chatStore.error) return
      
      const lastMessage = chatStore.messages[chatStore.messages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        const content = lastMessage.content || ''
        if (!content.trim() || content.startsWith('[Error:')) {
          return
        }
      }
      
      fetchSuggestions({ autoShow: false })
    }, 300)
  }
  previousIsStreaming = isStreaming
})

watch(() => chatStore.error, (newError) => {
  if (newError) {
    showToast(newError, 'error')
    
    if (newError.includes('API Key') || 
        newError.includes('模型配置') ||
        newError.includes('API配置')) {
      showMenuDropdown.value = true
    }
    
    chatStore.error = null
  }
})

watch(() => chatStore.currentCharacter?.id, () => {
  loadCurrentCharacterAvatar()
  loadBackground()
})

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const tokenFromUrl = urlParams.get('token')

  if (tokenFromUrl) {
    try {
      await userStore.loginWithToken(tokenFromUrl)
      window.history.replaceState({}, document.title, window.location.pathname)
    } catch (error) {
      console.error('Failed to login with token:', error)
    }
  }

  chatStore.loadModels()
  if (userStore.isLoggedIn()) {
    await userStore.loadFriends()
  }
  
  if (userStore.isLoggedIn()) {
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
  if (currentBgObjectUrl) {
    URL.revokeObjectURL(currentBgObjectUrl)
    currentBgObjectUrl = null
  }
})

;(window as any).triggerSlash = async (text: string) => {
  console.log('triggerSlash called from UI:', text)
  if (!text) return
  await chatStore.sendMessage(text)
}
</script>
