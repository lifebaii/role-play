<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div 
      class="rounded-2xl shadow-lg shadow-[var(--theme-primary)]/5 border border-theme-border overflow-hidden bg-[var(--theme-card-bg)]"
    >
      <button
        type="button"
        @click="toggleSection('basic')"
        class="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-[var(--theme-card-hover)] transition-colors"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-semibold text-theme-text-primary">基本信息</h2>
            <p class="text-xs text-theme-text-secondary">角色名称、描述</p>
          </div>
        </div>
        <svg 
          class="w-5 h-5 text-theme-text-secondary transition-transform duration-300 flex-shrink-0" 
          :class="{ 'rotate-180': expandedSections.basic }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div 
        v-show="expandedSections.basic"
        class="px-4 sm:px-6 pb-4 sm:pb-6"
      >
        <div class="space-y-4">
          <div>
            <label class="flex items-center gap-2 text-sm font-medium text-theme-text-primary mb-2">
              <span class="text-[var(--theme-danger)]">*</span>
              角色名称
            </label>
            <input
              v-model="form.name"
              type="text"
              class="w-full px-4 py-3 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all duration-200"
              :class="{ 'bg-[var(--theme-card-hover)] cursor-not-allowed': viewOnly }"
              placeholder="输入角色名称..."
              :disabled="viewOnly"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">角色描述</label>
            <textarea
              ref="descriptionTextarea"
              v-model="form.description"
              class="w-full px-4 py-3 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all duration-200 resize-none overflow-y-auto"
              :class="{ 'bg-[var(--theme-card-hover)] cursor-not-allowed': viewOnly }"
              placeholder="简短描述这个角色..."
              :disabled="viewOnly"
              @input="autoResize($event.target as HTMLTextAreaElement)"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">标签</label>
            <div class="space-y-3">
              <div v-if="form.tags.length > 0" class="flex flex-wrap gap-2">
                <span
                  v-for="(tag, index) in form.tags"
                  :key="index"
                  class="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-secondary)]/10 text-theme-text-accent rounded-full text-sm border border-[var(--theme-primary)]/20"
                >
                  {{ tag }}
                  <button
                    v-if="!viewOnly"
                    type="button"
                    @click="removeTag(index)"
                    class="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[var(--theme-danger)]/20 hover:text-[var(--theme-danger)] transition-colors"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </div>
              <div v-if="!viewOnly" class="flex gap-2">
                <input
                  v-model="newTagInput"
                  type="text"
                  class="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-2.5 chat-input-field border border-theme-border rounded-lg sm:rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all duration-200 text-sm"
                  placeholder="输入新标签..."
                  @keydown.enter.prevent="addTag"
                />
                <button
                  type="button"
                  @click="addTag"
                  class="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-lg sm:rounded-xl hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-secondary-dark)] transition-all duration-200 font-medium text-sm whitespace-nowrap"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-theme-text-primary mb-2">备注</label>
            <textarea
              ref="creatorNotesTextarea"
              v-model="form.creator_notes"
              class="w-full px-4 py-3 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all duration-200 resize-none overflow-y-auto"
              :class="{ 'bg-[var(--theme-card-hover)] cursor-not-allowed': viewOnly }"
              placeholder="输入备注信息..."
              :disabled="viewOnly"
              @input="autoResize($event.target as HTMLTextAreaElement)"
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <div 
      class="rounded-2xl shadow-lg shadow-[var(--theme-primary)]/5 border border-theme-border overflow-hidden bg-[var(--theme-card-bg)]"
    >
      <button
        type="button"
        @click="toggleSection('character')"
        class="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-[var(--theme-card-hover)] transition-colors"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--theme-secondary)] to-[var(--theme-accent)] flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-semibold text-theme-text-primary">角色设定</h2>
            <p class="text-xs text-theme-text-secondary">人设、场景、开场白、Temperature</p>
          </div>
        </div>
        <svg 
          class="w-5 h-5 text-theme-text-secondary transition-transform duration-300 flex-shrink-0" 
          :class="{ 'rotate-180': expandedSections.character }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div 
        v-show="expandedSections.character"
        class="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6"
      >
        <div>
          <label class="flex items-center gap-2 text-sm font-medium text-theme-text-primary mb-2">
            <span class="w-6 h-6 rounded-full bg-[var(--theme-secondary)]/15 flex items-center justify-center text-xs font-bold text-theme-text-accent">1</span>
            人设
          </label>
          <textarea
            ref="personalityTextarea"
            v-model="form.personality"
            class="w-full px-4 py-3 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-secondary)] focus:border-transparent transition-all duration-200 resize-none overflow-y-auto"
            :class="{ 'bg-[var(--theme-card-hover)] cursor-not-allowed': viewOnly }"
            placeholder="描述角色的性格、特点、背景故事..."
            :disabled="viewOnly"
            @input="autoResize($event.target as HTMLTextAreaElement)"
          ></textarea>
        </div>
        
        <div>
          <label class="flex items-center gap-2 text-sm font-medium text-theme-text-primary mb-2">
            <span class="w-6 h-6 rounded-full bg-[var(--theme-accent)]/15 flex items-center justify-center text-xs font-bold text-theme-text-accent">2</span>
            场景设定
          </label>
          <textarea
            ref="scenarioTextarea"
            v-model="form.scenario"
            class="w-full px-4 py-3 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all duration-200 resize-none overflow-y-auto"
            :class="{ 'bg-[var(--theme-card-hover)] cursor-not-allowed': viewOnly }"
            placeholder="描述角色所处的场景和环境..."
            :disabled="viewOnly"
            @input="autoResize($event.target as HTMLTextAreaElement)"
          ></textarea>
        </div>
        
        <div>
          <label class="flex items-center gap-2 text-sm font-medium text-theme-text-primary mb-2">
            <span class="w-6 h-6 rounded-full bg-[var(--theme-primary)]/15 flex items-center justify-center text-xs font-bold text-theme-text-accent">3</span>
            开场白
          </label>
          <textarea
            ref="first_mesTextarea"
            v-model="form.first_mes"
            class="w-full px-4 py-3 chat-input-field border border-theme-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary/60 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all duration-200 resize-none overflow-y-auto"
            :class="{ 'bg-[var(--theme-card-hover)] cursor-not-allowed': viewOnly }"
            placeholder="角色初次见面时说的话..."
            :disabled="viewOnly"
            @input="autoResize($event.target as HTMLTextAreaElement)"
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-theme-text-primary mb-2">Temperature</label>
          <div class="space-y-3">
            <input
              v-model.number="form.temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="w-full h-2 bg-[var(--theme-card-hover)] rounded-lg appearance-none cursor-pointer accent-[var(--theme-primary)] range-slider"
              :disabled="viewOnly"
            />
            <div class="flex justify-between items-center">
              <span class="text-sm text-theme-text-secondary">0.0</span>
              <input
                v-model.number="form.temperature"
                type="number"
                min="0"
                max="1"
                step="0.1"
                class="w-20 px-3 py-1.5 chat-input-field border border-theme-border rounded-lg text-center text-theme-text-primary focus:ring-2 focus:ring-[var(--theme-primary)]"
                :class="{ 'bg-[var(--theme-card-hover)] cursor-not-allowed': viewOnly }"
                :disabled="viewOnly"
              />
              <span class="text-sm text-theme-text-secondary">1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div 
      class="rounded-2xl shadow-lg shadow-[var(--theme-primary)]/5 border border-theme-border overflow-hidden bg-[var(--theme-card-bg)]"
    >
      <button
        type="button"
        @click="toggleSection('worldInfo')"
        class="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-[var(--theme-card-hover)] transition-colors"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-light)] flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-semibold text-theme-text-primary">世界书</h2>
            <p class="text-xs text-theme-text-secondary">{{ form.character_book.entries.length }} 个条目</p>
          </div>
        </div>
        <svg 
          class="w-5 h-5 text-theme-text-secondary transition-transform duration-300 flex-shrink-0" 
          :class="{ 'rotate-180': expandedSections.worldInfo }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div 
        v-show="expandedSections.worldInfo"
        class="px-4 sm:px-6 pb-4 sm:pb-6"
      >
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div></div>
          <button
            v-if="!viewOnly"
            type="button"
            @click="openWorldInfoEditor()"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-light)] text-white rounded-xl hover:from-[var(--theme-accent-dark)] hover:to-[var(--theme-accent)] transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加条目
          </button>
        </div>
        
        <div v-if="form.character_book.entries.length === 0" class="text-center py-12">
          <div class="w-16 h-16 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p class="text-theme-text-secondary mb-2">暂无世界书条目</p>
          <p class="text-sm text-theme-text-secondary/70">点击上方按钮添加新条目</p>
        </div>
        
        <draggable
          v-model="form.character_book.entries"
          item-key="comment"
          class="space-y-3"
          ghost-class="opacity-50"
          animation="200"
          handle=".drag-handle"
        >
          <template #item="{ element, index }">
            <div
              class="group bg-[var(--theme-card-hover)] border border-theme-border rounded-xl p-4"
            >
              <div class="flex items-start gap-3">
                <div class="drag-handle flex-shrink-0 w-8 h-8 flex items-center justify-center text-theme-text-secondary hover:text-[var(--theme-accent)] cursor-move">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      v-model="element.enabled"
                      class="w-4 h-4 rounded border-theme-border bg-[var(--theme-input-bg)] text-[var(--theme-accent)] focus:ring-[var(--theme-accent)]"
                    />
                    <span class="font-medium text-theme-text-primary truncate">{{ element.comment || '未命名条目' }}</span>
                  </div>
                  <div class="text-xs text-theme-text-secondary">
                    关键词: {{ Array.isArray(element.keys) ? element.keys.join(', ') : element.keys || '无' }}
                  </div>
                  <div v-if="!viewOnly" class="flex gap-2 mt-3">
                    <button
                      type="button"
                      @click="openWorldInfoEditor(index)"
                      class="px-3 py-1 text-xs text-theme-text-accent hover:bg-[var(--theme-accent)]/10 rounded-lg"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      @click="removeWorldInfo(index)"
                      class="px-3 py-1 text-xs text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] rounded-lg"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <div 
      class="rounded-2xl shadow-lg shadow-[var(--theme-primary)]/5 border border-theme-border overflow-hidden bg-[var(--theme-card-bg)]"
    >
      <button
        type="button"
        @click="toggleSection('regex')"
        class="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-[var(--theme-card-hover)] transition-colors"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--theme-primary-light)] to-[var(--theme-primary)] flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-semibold text-theme-text-primary">正则脚本</h2>
            <p class="text-xs text-theme-text-secondary">{{ form.regex_scripts.length }} 个脚本</p>
          </div>
        </div>
        <svg 
          class="w-5 h-5 text-theme-text-secondary transition-transform duration-300 flex-shrink-0" 
          :class="{ 'rotate-180': expandedSections.regex }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div 
        v-show="expandedSections.regex"
        class="px-4 sm:px-6 pb-4 sm:pb-6"
      >
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div></div>
          <button
            v-if="!viewOnly"
            type="button"
            @click="openRegexEditor()"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--theme-primary-light)] to-[var(--theme-primary)] text-white rounded-xl hover:from-[var(--theme-primary)] hover:to-[var(--theme-primary-dark)] transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加脚本
          </button>
        </div>
        
        <div v-if="form.regex_scripts.length === 0" class="text-center py-12">
          <div class="w-16 h-16 rounded-full bg-[var(--theme-card-hover)] flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <p class="text-theme-text-secondary mb-2">暂无正则脚本</p>
          <p class="text-sm text-theme-text-secondary/70">点击上方按钮添加新脚本</p>
        </div>
        
        <draggable
          v-model="form.regex_scripts"
          item-key="scriptName"
          class="space-y-3"
          ghost-class="opacity-50"
          animation="200"
          handle=".drag-handle"
        >
          <template #item="{ element, index }">
            <div
              class="group bg-[var(--theme-card-hover)] border border-theme-border rounded-xl p-4"
            >
              <div class="flex items-start gap-3">
                <div class="drag-handle flex-shrink-0 w-8 h-8 flex items-center justify-center text-theme-text-secondary hover:text-[var(--theme-primary)] cursor-move">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      :checked="!element.disabled"
                      class="w-4 h-4 rounded border-theme-border bg-[var(--theme-input-bg)] text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
                      @change="element.disabled = !element.disabled"
                    />
                    <span class="font-medium text-theme-text-primary truncate">{{ element.name || element.scriptName || '未命名脚本' }}</span>
                  </div>
                  <div class="text-xs text-theme-text-secondary font-mono bg-[var(--theme-input-bg)] px-2 py-1 rounded inline-block">
                    {{ element.regex || element.findRegex || '无正则表达式' }}
                  </div>
                  <div v-if="!viewOnly" class="flex gap-2 mt-3">
                    <button
                      type="button"
                      @click="openRegexEditor(index)"
                      class="px-3 py-1 text-xs text-theme-text-accent hover:bg-[var(--theme-primary)]/10 rounded-lg"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      @click="removeRegex(index)"
                      class="px-3 py-1 text-xs text-[var(--theme-danger)] hover:bg-[var(--theme-danger-bg)] rounded-lg"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </form>

  <WorldInfoEditor
    v-model:visible="showWorldInfoEditor"
    :editing-data="editingWorldInfoIndex !== undefined ? form.character_book.entries[editingWorldInfoIndex] : undefined"
    @save="saveWorldInfoEditing"
  />

  <RegexEditor
    v-model:visible="showRegexEditor"
    :editing-data="editingRegexIndex !== undefined ? form.regex_scripts[editingRegexIndex] : undefined"
    @save="saveRegexEditing"
  />

  <ExportFormatModal
    v-model:visible="showExportFormatModal"
    :source-type="exportSourceType"
    @select="handleExportFormatSelect"
  />

  <CharacterImageEditor
    v-model:visible="showImageEditor"
    :character-id="characterId"
    @save="handleImageSave"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue'
import draggable from 'vuedraggable'
import WorldInfoEditor from './WorldInfoEditor.vue'
import RegexEditor from './RegexEditor.vue'
import ExportFormatModal from './ExportFormatModal.vue'
import CharacterImageEditor from './CharacterImageEditor.vue'
import { exportCharacterFile, getCharacterSourceType, getCharacterBlob, saveCharacterImage } from '@/utils/localFriendStorage'
import { exportCharacterAsPng, parseCharacterFromPng, downloadBlob } from '@/utils/characterImport'
import { charactersApi } from '@/api'
import { useDialog } from '@/composables/useDialog'
import { debugPrintBlob, debugPrintFile } from '@/utils/debugCharacterFile'

const { showDangerConfirm, showErrorAlert } = useDialog()

interface CharacterFormData {
  id?: string
  name: string
  description: string
  avatar: string
  first_mes: string
  personality: string
  scenario: string
  system_prompt: string
  creator_notes: string
  temperature: number
  character_book: { entries: any[] }
  regex_scripts: any[]
  tags: string[]
}

const props = defineProps<{
  modelValue?: CharacterFormData
  characterId?: string
  isEdit?: boolean
  isUserCreated?: boolean
  isOnlineCharacter?: boolean
  isAdminMode?: boolean
  showAdminFields?: boolean
  viewOnly?: boolean
  saving?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: CharacterFormData): void
  (e: 'submit', value: CharacterFormData): void
  (e: 'cancel'): void
  (e: 'delete'): void
  (e: 'export'): void
  (e: 'imageSaved', characterId: string): void
}>()

const isLoading = computed(() => props.saving ?? false)

const expandedSections = reactive({
  basic: true,
  character: false,
  worldInfo: false,
  regex: false
})

const showWorldInfoEditor = ref(false)
const editingWorldInfoIndex = ref<number | undefined>(undefined)

const showRegexEditor = ref(false)
const editingRegexIndex = ref<number | undefined>(undefined)

const showExportFormatModal = ref(false)
const exportSourceType = ref<'image' | 'json'>('json')

const showImageEditor = ref(false)
const isSavingImage = ref(false)

const newTagInput = ref('')

const form = ref<CharacterFormData>({
  name: '',
  description: '',
  avatar: '',
  first_mes: '',
  personality: '',
  scenario: '',
  system_prompt: '',
  creator_notes: '',
  temperature: 1,
  character_book: { entries: [] },
  regex_scripts: [],
  tags: []
})

const descriptionTextarea = ref<HTMLTextAreaElement | null>(null)
const personalityTextarea = ref<HTMLTextAreaElement | null>(null)
const scenarioTextarea = ref<HTMLTextAreaElement | null>(null)
const first_mesTextarea = ref<HTMLTextAreaElement | null>(null)
const creatorNotesTextarea = ref<HTMLTextAreaElement | null>(null)

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    form.value = {
      ...newValue,
      temperature: newValue.temperature ?? 1,
      character_book: { entries: newValue.character_book?.entries || [] },
      regex_scripts: newValue.extensions?.regex_scripts || [],
      tags: newValue.tags || []
    }
    nextTick(() => resizeAllTextareas())
  }
}, { immediate: true })

function resizeAllTextareas() {
  const textareas = [
    descriptionTextarea.value,
    personalityTextarea.value,
    scenarioTextarea.value,
    first_mesTextarea.value,
    creatorNotesTextarea.value
  ]
  const maxHeight = 300
  textareas.forEach(textarea => {
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight + 8, maxHeight)
      textarea.style.height = newHeight + 'px'
    }
  })
}

async function toggleSection(section: keyof typeof expandedSections) {
  expandedSections[section] = !expandedSections[section]
  if (expandedSections[section]) {
    await nextTick()
    resizeAllTextareas()
  }
}

function autoResize(textarea: HTMLTextAreaElement) {
  const maxHeight = 300
  textarea.style.height = 'auto'
  const newHeight = Math.min(textarea.scrollHeight + 8, maxHeight)
  textarea.style.height = newHeight + 'px'
}

function getDefaultWorldInfo() {
  return {
    keys: [],
    content: '',
    enabled: true,
    comment: '',
    position: 'at_depth',
    depth: 4,
    order: 100,
    useRegex: false,
    matchWholeWords: false,
    caseSensitive: false,
    scanDepth: 2,
    probability: 100,
    useProbability: false,
    selectiveLogic: 0,
    group: '',
    groupWeight: 1,
    constant: false,
    preferential: false,
    sticky: 0,
    cooldown: 0,
    delay: 0,
    secondary_keys: []
  }
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

function addTag() {
  const tag = newTagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    newTagInput.value = ''
  }
}

function removeTag(index: number) {
  form.value.tags.splice(index, 1)
}

function openWorldInfoEditor(index?: number) {
  editingWorldInfoIndex.value = index
  showWorldInfoEditor.value = true
}

function saveWorldInfoEditing(data: any) {
  if (editingWorldInfoIndex.value !== undefined) {
    form.value.character_book.entries[editingWorldInfoIndex.value] = { ...data, enabled: form.value.character_book.entries[editingWorldInfoIndex.value]?.enabled ?? true }
  } else {
    form.value.character_book.entries.push({ ...data, enabled: true })
  }
  editingWorldInfoIndex.value = undefined
}

async function removeWorldInfo(index: number) {
  const confirmed = await showDangerConfirm('确定要删除这个世界书条目吗？')
  if (confirmed) {
    form.value.character_book.entries.splice(index, 1)
  }
}

function openRegexEditor(index?: number) {
  editingRegexIndex.value = index
  showRegexEditor.value = true
}

function saveRegexEditing(data: any) {
  if (editingRegexIndex.value !== undefined) {
    const existing = form.value.regex_scripts[editingRegexIndex.value]
    form.value.regex_scripts[editingRegexIndex.value] = { ...data, enabled: existing?.enabled ?? true }
  } else {
    form.value.regex_scripts.push({ ...data, enabled: true })
  }
  // 同时也更新 extensions.regex_scripts，保持一致性
  form.value.extensions = {
    ...form.value.extensions,
    regex_scripts: form.value.regex_scripts
  }
  editingRegexIndex.value = undefined
}

async function removeRegex(index: number) {
  const confirmed = await showDangerConfirm('确定要删除这个正则脚本吗？')
  if (confirmed) {
    form.value.regex_scripts.splice(index, 1)
    form.value.extensions = {
      ...form.value.extensions,
      regex_scripts: form.value.regex_scripts
    }
  }
}

async function handleSubmit() {
  const submitData = {
    ...form.value,
    extensions: {
      ...form.value.extensions,
      regex_scripts: form.value.regex_scripts
    }
  }
  emit('update:modelValue', submitData)
  emit('submit', submitData)
}

function handleDelete() {
  emit('delete')
}

async function handleExport() {
  try {
    const charId = props.characterId
    if (!charId) {
      exportSourceType.value = 'json'
      showExportFormatModal.value = true
      return
    }

    exportSourceType.value = await getCharacterSourceType(charId)
    showExportFormatModal.value = true
  } catch (error) {
    console.error('导出失败:', error)
    await showErrorAlert('导出角色失败，请重试')
  }
}

async function handleExportFormatSelect(format: 'image' | 'json') {
  try {
    const charId = props.characterId
    
    if (!charId) {
      if (format === 'json') {
        const exportData = {
          spec: 'chara_card_v2',
          spec_version: '2.0',
          data: { ...form.value }
        }
        const jsonString = JSON.stringify(exportData, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        const fileName = form.value.name ? `${form.value.name}.json` : 'character.json'
        await debugPrintBlob(blob, fileName, '导出JSON')
        downloadBlob(blob, fileName)
      } else {
        if (!form.value.avatar) {
          await showErrorAlert('无法生成图片：缺少头像数据')
          return
        }
        const pngBlob = await exportCharacterAsPng({ data: form.value, role_play: { id: '' } })
        if (pngBlob) {
          const fileName = form.value.name ? `${form.value.name}.png` : 'character.png'
          await debugPrintBlob(pngBlob, fileName, '导出图片')
          downloadBlob(pngBlob, fileName)
        } else {
          await showErrorAlert('无法生成图片：头像数据格式不支持')
        }
      }
      return
    }

    const sourceType = exportSourceType.value

    if (sourceType === 'image' && format === 'image') {
      const result = await exportCharacterFile(charId)
      if (!result) {
        await showErrorAlert('导出角色失败，未找到角色数据')
        return
      }
      await debugPrintBlob(result.blob, result.fileName, '导出图片')
      downloadBlob(result.blob, result.fileName)
    } else if (sourceType === 'image' && format === 'json') {
      const blob = await getCharacterBlob(charId)
      if (!blob) {
        await showErrorAlert('导出角色失败，未找到角色数据')
        return
      }
      const file = new File([blob], 'character.png', { type: blob.type || 'image/png' })
      const { data } = await parseCharacterFromPng(file)
      if (data) {
        const exportData = {
          spec: 'chara_card_v2',
          spec_version: '2.0',
          data: data.data || data
        }
        const jsonString = JSON.stringify(exportData, null, 2)
        const jsonBlob = new Blob([jsonString], { type: 'application/json' })
        const name = data.data?.name || data.name || 'character'
        const fileName = `${name}.json`
        await debugPrintBlob(jsonBlob, fileName, '导出JSON')
        downloadBlob(jsonBlob, fileName)
      } else {
        await showErrorAlert('无法解析图片中的角色数据')
      }
    } else if (sourceType === 'json' && format === 'json') {
      const result = await exportCharacterFile(charId)
      if (!result) {
        await showErrorAlert('导出角色失败，未找到角色数据')
        return
      }
      await debugPrintBlob(result.blob, result.fileName, '导出JSON')
      downloadBlob(result.blob, result.fileName)
    } else if (sourceType === 'json' && format === 'image') {
      const result = await exportCharacterFile(charId)
      if (!result) {
        await showErrorAlert('导出角色失败，未找到角色数据')
        return
      }
      const text = await result.blob.text()
      const charData = JSON.parse(text)
      const normalizedData = charData.data || charData
      
      if (!normalizedData.avatar) {
        await showErrorAlert('无法生成图片：缺少头像数据')
        return
      }
      
      const pngBlob = await exportCharacterAsPng({ data: normalizedData, role_play: { id: charId } })
      if (pngBlob) {
        const name = normalizedData.name || 'character'
        const fileName = `${name}.png`
        await debugPrintBlob(pngBlob, fileName, '导出图片')
        downloadBlob(pngBlob, fileName)
      } else {
        await showErrorAlert('无法生成图片：头像数据格式不支持')
      }
    }
  } catch (error) {
    console.error('导出失败:', error)
    await showErrorAlert('导出角色失败，请重试')
  }
}

async function handleImageSave(file: File) {
  if (!props.characterId) return
  
  isSavingImage.value = true
  try {
    if (props.isAdminMode) {
      const result = await charactersApi.uploadCharacterImage(props.characterId, file)
      if (!result) {
        await showErrorAlert('保存角色图片失败，请重试')
      } else {
        emit('imageSaved', props.characterId)
      }
    } else {
      const characterData = {
        name: form.value.name,
        description: form.value.description,
        avatar: form.value.avatar,
        first_mes: form.value.first_mes,
        personality: form.value.personality,
        scenario: form.value.scenario,
        system_prompt: form.value.system_prompt,
        creator_notes: form.value.creator_notes,
        temperature: form.value.temperature,
        character_book: form.value.character_book,
        regex_scripts: form.value.regex_scripts,
        tags: form.value.tags
      }
      
      const success = await saveCharacterImage(props.characterId, file, characterData)
      
      if (!success) {
        await showErrorAlert('保存角色图片失败，请重试')
      } else {
        emit('imageSaved', props.characterId)
      }
    }
  } catch (error) {
    console.error('保存角色图片失败:', error)
    await showErrorAlert('保存角色图片失败，请重试')
  } finally {
    isSavingImage.value = false
  }
}

defineExpose({
  form,
  handleSubmit,
  handleExport,
  handleDelete,
  showImageEditor,
  isSavingImage,
  reset: () => {
    form.value = {
      name: '',
      description: '',
      avatar: '',
      first_mes: '',
      personality: '',
      scenario: '',
      system_prompt: '',
      creator_notes: '',
      temperature: 1,
      character_book: { entries: [] },
      regex_scripts: [],
      tags: []
    }
  }
})
</script>

<style scoped>
.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  cursor: pointer;
  box-shadow: 0 2px 6px var(--theme-primary);
}

.range-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px var(--theme-primary);
}
</style>
