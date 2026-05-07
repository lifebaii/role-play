<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999] p-4" @click.self="$emit('update:visible', false)" @click="showMoreActions = false">
    <div class="chat-card rounded-2xl max-w-2xl w-full overflow-hidden flex flex-col shadow-2xl border border-theme-border relative h-[min(90vh,calc(var(--vh,1vh)*90))]" style="max-height: min(90vh, calc(var(--vh, 1vh) * 90));" @click.stop>
      <!-- 背景图片层 -->
      <div 
        v-if="backgroundImageUrl"
        class="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        :style="{ backgroundImage: `url(${backgroundImageUrl})`, opacity: 0.3 }"
      ></div>
      <div 
        v-if="backgroundImageUrl"
        class="absolute inset-0 bg-[var(--theme-bg-start)]/70 pointer-events-none"
      ></div>
      
      <!-- 内容层 -->
      <div class="relative z-10 flex flex-col h-full">
        <div class="flex-1 overflow-y-auto overscroll-contain" data-scrollable="true" style="-webkit-overflow-scrolling: touch;">
        <div class="sticky top-0 z-10 p-3 sm:p-6 border-b border-theme-border/50 flex items-center justify-between bg-[var(--theme-card-bg)]/80 backdrop-blur-xl">
          <div class="flex items-center gap-2 sm:gap-3">
            <h2 class="text-base sm:text-xl font-bold gradient-text flex items-center gap-2">
              <template v-if="editingCharacter">
                <AvatarImage
                  :src="avatarUrl"
                  :name="characterData?.name || '?'"
                  size="sm"
                  rounded="md"
                  gradient="primary"
                  class="flex-shrink-0 shadow-md"
                />
              </template>
              <template v-else>
                <span class="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-md sm:rounded-lg flex items-center justify-center text-white text-xs sm:text-sm">+</span>
              </template>
              {{ isViewOnlyMode ? '查看角色' : (editingCharacter ? '编辑角色' : '创建角色') }}
            </h2>
            <span
              v-if="editingCharacter && !isLoadingCharacterDetail && !isLoadingMeta"
              :class="[
                'text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-medium inline-flex items-center gap-1',
                characterTypeClass
              ]"
            >
              <svg v-if="editingCharacterMeta.originalId" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
              <svg v-else-if="editingCharacterMeta.shared" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
              {{ characterTypeLabel }}
            </span>
            <span
              v-if="isLoadingSource"
              class="text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-medium inline-flex items-center gap-1 bg-[var(--theme-primary)]/10 text-theme-text-accent border border-[var(--theme-primary)]/20"
            >
              <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              加载源文件...
            </span>
          </div>
          <div class="flex items-center gap-1 sm:gap-2">
            <template v-if="editingCharacterMeta.originalId">
              <button
                @click="$emit('loadOriginal')"
                :disabled="isLoadingOriginal"
                class="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg v-if="isLoadingOriginal" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span class="hidden sm:inline">更新</span>
              </button>
            </template>
            <template v-if="showCommentSection">
              <button
                @click="$emit('toggleLike')"
                :disabled="isLikingInEdit"
                class="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="displayMeta.isLiked 
                  ? 'bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-light)] text-white hover:opacity-90' 
                  : 'bg-[var(--theme-card-hover)] text-theme-text-secondary hover:bg-[var(--theme-sidebar-hover)]'"
              >
                <svg v-if="isLikingInEdit" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" :fill="displayMeta.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                </svg>
                <span class="hidden sm:inline">{{ displayMeta.isLiked ? '已点赞' : '点赞' }}</span>
                <span class="text-xs opacity-80">{{ displayMeta.likeCount }}</span>
              </button>
            </template>
            <button @click="$emit('update:visible', false)" class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-[var(--theme-card-hover)] text-theme-text-secondary hover:text-theme-text-primary transition-all duration-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="p-3 sm:p-6">
          <!-- 查看模式加载状态 -->
          <div v-if="isViewOnlyMode && isLoadingViewData" class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 rounded-xl bg-[var(--theme-card-hover)] animate-pulse"></div>
              <div class="flex-1 space-y-2">
                <div class="h-5 bg-[var(--theme-card-hover)] rounded animate-pulse w-1/3"></div>
                <div class="h-4 bg-[var(--theme-card-hover)] rounded animate-pulse w-2/3"></div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="h-4 bg-[var(--theme-card-hover)] rounded animate-pulse"></div>
              <div class="h-4 bg-[var(--theme-card-hover)] rounded animate-pulse w-5/6"></div>
              <div class="h-4 bg-[var(--theme-card-hover)] rounded animate-pulse w-4/6"></div>
            </div>
            <div class="flex items-center justify-center py-4">
              <svg class="w-6 h-6 animate-spin text-[var(--theme-primary)]" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="ml-2 text-theme-text-secondary">加载角色数据...</span>
            </div>
          </div>
          
          <CharacterForm
            v-else
            ref="characterFormRef"
            :model-value="characterData"
            :character-id="editingCharacter?.role_play?.id || editingCharacter?.id"
            :is-edit="!!editingCharacter"
            :is-user-created="!editingCharacterMeta.originalId"
            :is-online-character="!!editingCharacterMeta.originalId"
            :show-admin-fields="false"
            :view-only="isViewOnlyMode"
            :saving="isSavingCharacter"
            @submit="$emit('save', $event)"
            @cancel="$emit('update:visible', false)"
            @delete="$emit('delete')"
            @image-saved="handleImageSaved"
          />
          
          <CommentSection
            v-if="showCommentSection && (getApiCharacterId())"
            :character-id="getApiCharacterId()"
            :show-original-hint="!!editingCharacterMeta.originalId"
            :initial-comment-count="displayMeta.commentCount"
          />
        </div>
        
        <div v-if="!isViewOnlyMode" class="sticky bottom-0 flex flex-row justify-between items-center gap-1.5 sm:gap-0 bg-[var(--theme-card-bg)]/80 backdrop-blur-xl border-t border-theme-border/50 px-3 sm:px-6 py-2.5 sm:py-4 z-10 shadow-[0_-4px_6px_-1px_var(--theme-shadow)]">
          <div v-if="editingCharacter" class="flex gap-1.5 sm:gap-3">
            <button
              type="button"
              @click="characterFormRef && (characterFormRef.showImageEditor = true)"
              :disabled="characterFormRef?.isSavingImage"
              :title="characterFormRef?.isSavingImage ? '保存中...' : '编辑图片'"
              class="px-2 py-1.5 sm:px-4 sm:py-2.5 text-theme-text-accent hover:bg-[var(--theme-primary)]/10 rounded-lg sm:rounded-xl transition-all duration-200 font-medium border border-[var(--theme-primary)]/20 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="characterFormRef?.isSavingImage" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="hidden sm:inline">{{ characterFormRef?.isSavingImage ? '保存中...' : '编辑图片' }}</span>
            </button>
            
            <div 
              v-if="!editingCharacterMeta.originalId"
              class="flex items-center gap-2 px-2 py-1.5 sm:px-3 rounded-lg bg-[var(--theme-card-hover)] border border-theme-border"
              :class="{ 'opacity-50': !canToggleShared || isUpdatingShared }"
              @click="handleSharedClick"
            >
              <span class="text-xs sm:text-sm text-theme-text-secondary">
                <template v-if="isLoadingMeta">
                  <svg class="w-3 h-3 animate-spin inline-block mr-1" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  加载中...
                </template>
                <template v-else>分享</template>
              </span>
              <label v-if="!isLoadingMeta" class="relative inline-flex items-center" :class="canToggleShared && !isUpdatingShared ? 'cursor-pointer' : 'cursor-not-allowed'">
                <input
                  :checked="displaySharedState"
                  @click="handleToggleShared"
                  type="checkbox"
                  :disabled="!canToggleShared || isUpdatingShared"
                  class="sr-only peer"
                />
                <div v-if="isUpdatingShared" class="w-9 h-5 flex items-center justify-center">
                  <svg class="w-3 h-3 animate-spin text-theme-primary" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div v-else class="w-9 h-5 bg-[var(--theme-card-hover)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--theme-primary)]/30 rounded-full peer" :class="{'peer-checked:bg-[var(--theme-primary)]': displaySharedState}">
                  <div class="absolute top-[2px] left-[2px] bg-white border-theme-border border rounded-full h-4 w-4 transition-all" :class="{'translate-x-full': displaySharedState}"></div>
                </div>
              </label>
            </div>
            
            <div class="relative">
              <button
                type="button"
                @click="showMoreActions = !showMoreActions"
                class="px-2 py-1.5 sm:px-4 sm:py-2.5 text-theme-text-accent hover:bg-[var(--theme-primary)]/10 rounded-lg sm:rounded-xl transition-all duration-200 font-medium border border-[var(--theme-primary)]/20 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                <span class="hidden sm:inline">更多</span>
              </button>
              
              <div
                v-if="showMoreActions"
                class="absolute bottom-full left-0 mb-2 min-w-[200px] bg-[var(--theme-menu-bg)] backdrop-blur-xl rounded-xl shadow-2xl border border-theme-border/30 overflow-hidden z-50"
                @click.stop
              >
                <button
                  type="button"
                  @click="characterFormRef?.handleExport(); showMoreActions = false"
                  :disabled="!!editingCharacterMeta.originalId"
                  class="w-full px-4 py-3 text-left text-sm text-theme-text-primary hover:bg-[var(--theme-card-hover)]/80 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg class="w-4 h-4 text-[var(--theme-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{{ editingCharacterMeta.originalId ? '在线添加的角色无法导出' : '导出角色' }}</span>
                </button>
                
                <div class="border-t border-theme-border/50"></div>
                
                <button
                  type="button"
                  @click="characterFormRef?.handleDelete(); showMoreActions = false"
                  class="w-full px-4 py-3 text-left text-sm text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)]/50 transition-colors flex items-center gap-3"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>删除角色</span>
                </button>
                
                <template v-if="isLoggedIn">
                  <div class="border-t border-theme-border/50"></div>
                  
                  <!-- 下载按钮：只要在服务器上存在就显示 -->
                  <button
            v-if="existsOnServer"
            type="button"
            :disabled="!editingCharacterMeta.shared || isUpdatingFromServer"
            @click="editingCharacterMeta.shared && handleUpdateFromServer()"
            :class="editingCharacterMeta.shared 
              ? 'w-full px-4 py-3 text-left text-sm text-theme-text-primary hover:bg-[var(--theme-card-hover)]/80 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed'
              : 'w-full px-4 py-3 text-sm text-theme-text-secondary flex items-center gap-3 cursor-not-allowed'"
          >
                    <svg v-if="editingCharacterMeta.shared && isUpdatingFromServer" class="w-4 h-4 animate-spin text-[var(--theme-primary)]" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-4 h-4" :class="editingCharacterMeta.shared ? 'text-[var(--theme-primary)]' : 'text-theme-text-secondary'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    <span>
                      {{ editingCharacterMeta.shared 
                        ? (isUpdatingFromServer ? '下载中...' : '下载') 
                        : '下载（分享已被取消）' }}
                    </span>
                  </button>
                  
                  <!-- 上传按钮：当 shared 为 true 且是所有者时显示 -->
                  <button
            v-if="editingCharacterMeta.shared && isOwnerOfCharacter"
            type="button"
            :disabled="isUpdatingToServer"
            @click="handleUpdateToServer()"
            class="w-full px-4 py-3 text-left text-sm text-theme-text-primary hover:bg-[var(--theme-card-hover)]/80 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
                    <svg v-if="isUpdatingToServer" class="w-4 h-4 animate-spin text-[var(--theme-primary)]" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-4 h-4 text-[var(--theme-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                    <span>{{ isUpdatingToServer ? '上传中...' : '上传' }}</span>
                  </button>
                </template>
                
                <div class="border-t border-theme-border/50"></div>
                
                <button
                  type="button"
                  @click="showMoreActions = false"
                  class="w-full px-4 py-3 text-left text-sm text-theme-text-secondary hover:bg-[var(--theme-card-hover)]/80 transition-colors flex items-center gap-3"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>取消</span>
                </button>
              </div>
            </div>
          </div>
          <div class="flex gap-1.5 sm:gap-4 sm:ml-auto">
            <button
              type="button"
              @click="$emit('update:visible', false)"
              class="px-3 py-1.5 sm:px-6 sm:py-2.5 chat-card text-theme-text-primary rounded-lg sm:rounded-xl hover:bg-[var(--theme-card-hover)] transition-all duration-200 font-medium border border-theme-border text-xs sm:text-sm"
            >
              取消
            </button>
            <button
              type="button"
              :disabled="isSavingCharacter"
              @click="characterFormRef?.handleSubmit()"
              class="px-3 py-1.5 sm:px-6 sm:py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-lg sm:rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              <span v-if="isSavingCharacter" class="flex items-center justify-center gap-1 sm:gap-2">
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span class="hidden sm:inline">保存中...</span>
                <span class="sm:hidden">...</span>
              </span>
              <span v-else>{{ editingCharacter ? '保存' : '创建' }}</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted, watchEffect } from 'vue'
import CharacterForm from '@/components/CharacterForm.vue'
import CommentSection from '@/components/CommentSection.vue'
import AvatarImage from '@/components/AvatarImage.vue'
import type { Character } from '@/types'
import { getFriendAvatar, clearCharacterAvatarCache, getCharacterBlob, updateFriendMetaShared, getFriendMetaById } from '@/utils/localFriendStorage'
import { characterGet } from '@/utils/db'
import { useUserStore } from '@/stores/user'
import { charactersApi } from '@/api'
import { useDialog } from '@/composables/useDialog'
import { debugPrintFile, debugPrintBlob } from '@/utils/debugCharacterFile'

const userStore = useUserStore()
const { showAlert, showConfirm, showErrorAlert } = useDialog()

interface MetaData {
  originalId: string | null
  shared: boolean
  likeCount: number
  commentCount: number
  isLiked: boolean
  originalMeta: MetaData | null
}

const characterFormRef = ref<InstanceType<typeof CharacterForm> | null>(null)
const localIsUpdatingShared = ref(false)
const showMoreActions = ref(false)
const backgroundBlobUrl = ref<string | null>(null)
const tempSharedState = ref<boolean | null>(null)

// 记录上次的上传/下载状态，用于检测操作完成
const prevIsUpdatingToServer = ref(false)
const prevIsUpdatingFromServer = ref(false)

const isLoggedIn = computed(() => userStore.isLoggedIn())

const displaySharedState = computed(() => {
  if (tempSharedState.value !== null) {
    return tempSharedState.value
  }
  return props.editingCharacterMeta.shared
})

async function loadBackgroundImage() {
  if (backgroundBlobUrl.value) {
    URL.revokeObjectURL(backgroundBlobUrl.value)
    backgroundBlobUrl.value = null
  }
  
  if (props.isViewOnlyMode) return
  
  const characterId = props.editingCharacter?.role_play?.id || props.editingCharacter?.id
  if (!characterId) return
  
  try {
    const blob = await characterGet(characterId)
    if (blob && blob.type.startsWith('image/')) {
      backgroundBlobUrl.value = URL.createObjectURL(blob)
    }
  } catch (e) {
    console.error('Failed to load background image:', e)
  }
}

function getApiCharacterId(): string | null {
  const charId = props.editingCharacter?.role_play?.id || props.editingCharacter?.id
  if (!charId) return null
  
  const friendMeta = getFriendMetaById(charId)
  const originalId = friendMeta?.originalId
  
  return originalId || props.editingCharacter?.role_play?.id || props.editingCharacter?.id || null
}

const backgroundImageUrl = computed(() => {
  if (props.isViewOnlyMode && props.sourceUrl) {
    return props.sourceUrl
  }
  if (!props.isViewOnlyMode && backgroundBlobUrl.value) {
    return backgroundBlobUrl.value
  }
  return null
})

const props = defineProps<{
  visible: boolean
  editingCharacter: Character | null
  editingCharacterMeta: MetaData
  displayMeta: {
    originalId: string | null
    shared: boolean
    likeCount: number
    commentCount: number
    isLiked: boolean
  }
  isViewOnlyMode: boolean
  isLoadingCharacterDetail: boolean
  isLoadingMeta: boolean
  isSavingCharacter: boolean
  isLoadingOriginal: boolean
  isLoadingSource: boolean
  isLoadingViewData: boolean
  isLikingInEdit: boolean
  existsOnServer: boolean
  isOwnerOfCharacter: boolean
  showCommentSection: boolean
  characterData: any
  isUpdatingToServer: boolean
  isUpdatingFromServer: boolean
  thumbnailUrl: string | null
  sourceUrl: string | null
}>()

const isUpdatingShared = computed(() => localIsUpdatingShared.value)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: any): void
  (e: 'delete'): void
  (e: 'loadOriginal'): void
  (e: 'toggleLike'): void
  (e: 'update:shared', value: boolean): void
  (e: 'avatarUpdated', characterId: string): void
  (e: 'updateToServer', data: any): void
  (e: 'updateFromServer'): void
}>()

const avatarUrl = ref<string | undefined>(undefined)

async function loadAvatar() {
  if (!props.editingCharacter) {
    avatarUrl.value = undefined
    return
  }
  
  // 查看模式：使用在线URL
  if (props.isViewOnlyMode && props.thumbnailUrl) {
    avatarUrl.value = props.thumbnailUrl
    return
  }
  
  // 编辑模式：使用本地头像
  try {
    const url = await getFriendAvatar(props.editingCharacter as any)
    avatarUrl.value = url
  } catch (e) {
    console.error('Failed to load avatar:', e)
    avatarUrl.value = undefined
  }
}

watch(() => props.editingCharacter, () => {
  loadAvatar()
  loadBackgroundImage()
}, { immediate: true })

watch(() => props.thumbnailUrl, () => {
  loadAvatar()
})

watch(() => props.visible, (visible) => {
  if (visible && props.editingCharacter) {
    loadAvatar()
    loadBackgroundImage()
  }
  showMoreActions.value = false
})

onUnmounted(() => {
  if (backgroundBlobUrl.value) {
    URL.revokeObjectURL(backgroundBlobUrl.value)
  }
})

function handleImageSaved(characterId: string) {
  clearCharacterAvatarCache(characterId)
  loadAvatar()
  loadBackgroundImage()
  emit('avatarUpdated', characterId)
}

async function handleUpdateToServer() {
  if (!props.characterData) return
  emit('updateToServer', props.characterData)
}

async function handleUpdateFromServer() {
  emit('updateFromServer')
}

function handleUpdateToServerWithClose() {
  showMoreActions = false;
  handleUpdateToServer();
}

function handleUpdateFromServerWithClose() {
  showMoreActions = false;
  handleUpdateFromServer();
}

const characterTypeLabel = computed(() => {
  if (!props.editingCharacter) return ''
  if (props.existsOnServer && !props.isOwnerOfCharacter) return '来自分享'
  if (props.editingCharacterMeta.originalId) return '来自分享'
  if (props.editingCharacterMeta.shared) return '已分享'
  return '私密'
})

const characterTypeClass = computed(() => {
  if (!props.editingCharacter) return ''
  if (props.existsOnServer && !props.isOwnerOfCharacter) {
    return 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20'
  }
  if (props.editingCharacterMeta.originalId) {
    return 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20'
  }
  if (props.editingCharacterMeta.shared) {
    return 'bg-[var(--theme-success-bg)] text-[var(--theme-success)] border border-[var(--theme-success)]/20'
  }
  return 'bg-[var(--theme-primary)]/10 text-theme-text-accent border border-[var(--theme-primary)]/20'
})

const canToggleShared = computed(() => {
  if (props.isLoadingMeta) return false
  if (!isLoggedIn.value) return false
  if (props.existsOnServer && !props.isOwnerOfCharacter) {
    return false
  }
  return true
})

const sharedDisabledReason = computed(() => {
  if (props.isLoadingMeta) return '正在加载角色信息...'
  if (!isLoggedIn.value) return '请先登录'
  if (props.existsOnServer && !props.isOwnerOfCharacter) {
    return '此角色不属于您'
  }
  return ''
})

async function handleSharedClick(event: MouseEvent) {
  if (!canToggleShared.value) {
    await showAlert(sharedDisabledReason.value)
    event.preventDefault()
    event.stopPropagation()
  }
}

async function handleToggleShared(event: Event) {
  // 阻止 checkbox 自动切换状态
  event.preventDefault()
  
  if (!isLoggedIn.value) {
    userStore.requireLogin()
    return
  }
  
  const characterId = props.editingCharacter?.role_play?.id
  const userId = userStore.user?.id
  
  if (!characterId || !userId) return
  
  const newSharedState = !props.editingCharacterMeta.shared
  
  if (newSharedState) {
    const confirmed = await showConfirm('分享后其他用户可以添加此角色，确定要分享吗？')
    if (!confirmed) {
      return
    }
  }
  
  // 显示临时的加载状态
  tempSharedState.value = newSharedState
  localIsUpdatingShared.value = true
  let hasError = false
  
  try {
    if (newSharedState) {
      const blob = await getCharacterBlob(characterId)
      if (!blob) {
        await showErrorAlert('无法获取角色数据')
        return
      }
      
      const characterName = props.editingCharacter?.data?.name || props.editingCharacter?.name || 'character'
      const isImage = blob.type.startsWith('image/')
      const fileName = isImage ? `${characterName}.png` : `${characterName}.json`
      const file = new File([blob], fileName, { type: blob.type })
      
      await debugPrintFile(file, '分享角色')
      
      const result = await charactersApi.importFiles([file], characterId, true)
      if (!result.success || result.imported === 0) {
        throw new Error(result.failedFiles?.[0]?.error || '上传失败')
      }
    } else {
      await charactersApi.updateUserCharacterShared(userId, characterId, false)
    }
    
    // 更新本地 friend_meta 中的 shared 状态
    updateFriendMetaShared(characterId, newSharedState)
    
    emit('update:shared', newSharedState)
  } catch (error: any) {
    console.error('更新分享状态失败:', error)
    await showErrorAlert('更新分享状态失败: ' + error.message)
    // 失败时回滚到原来的状态
    tempSharedState.value = null
    hasError = true
  } finally {
    localIsUpdatingShared.value = false
    // 成功后清除临时状态，让它从 props 读取最新状态
    if (!hasError) {
      tempSharedState.value = null
    }
  }
}

watch(() => props.visible, (visible) => {
  if (!visible) {
    // 关闭 modal 时清理临时状态
    tempSharedState.value = null
  }
})

// 监听上传状态变化，操作完成后关闭更多菜单
watch(() => props.isUpdatingToServer, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    showMoreActions.value = false
  }
  prevIsUpdatingToServer.value = newVal
})

// 监听下载状态变化，操作完成后关闭更多菜单
watch(() => props.isUpdatingFromServer, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    showMoreActions.value = false
  }
  prevIsUpdatingFromServer.value = newVal
})
</script>
