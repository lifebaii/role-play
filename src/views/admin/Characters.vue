<template>
  <CharacterList
    :characters="adminStore.characters"
    :show-import="characterSource === 'admin'"
    :show-drag-handle="characterSource === 'admin'"
    :show-share-toggle="true"
    :loading="isLoading"
    :total="adminStore.charactersTotal"
    :page="adminStore.charactersPage"
    :page-size="adminStore.charactersPageSize"
    :total-pages="adminStore.charactersTotalPages"
    @select="handleSelect"
    @edit="handleEdit"
    @delete="handleDelete"
    @create="handleCreate"
    @import="handleImport"
    @reorder="handleReorder"
    @toggle-share="handleToggleShare"
    @page-change="handlePageChange"
    @search="handleSearch"
    @sort-change="handleSortChange"
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
      </div>
    </template>
  </CharacterList>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import CharacterList from '@/components/CharacterList.vue'
import { charactersApi } from '@/api'

const router = useRouter()
const adminStore = useAdminStore()
const isImporting = ref(false)
const isDeleting = ref(false)
const isLoading = ref(false)
const characterSource = ref<'admin' | 'user'>('admin')
const searchQuery = ref('')
const sortBy = ref('updatedAt')

onMounted(() => {
  loadCharacters()
})

async function loadCharacters(page = 1) {
  isLoading.value = true
  try {
    await adminStore.loadCharacters({
      source: characterSource.value,
      page,
      pageSize: adminStore.charactersPageSize,
      search: searchQuery.value || undefined,
      sortBy: sortBy.value
    })
  } finally {
    isLoading.value = false
  }
}

function handleSourceChange(source: 'admin' | 'user') {
  characterSource.value = source
  loadCharacters(1)
}

function handlePageChange(page: number) {
  loadCharacters(page)
}

function handleSearch(query: string) {
  searchQuery.value = query
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

  function getCharacterCreatedAt(character: any): number | undefined {
    return character.role_play?.createdAt || character.createdAt
  }

  function getCharacterBook(character: any): any {
    return character.data?.character_book || character.character_book
  }

  function getCharacterRegexScripts(character: any): any[] {
    return character.data?.extensions?.regex_scripts || character.extensions?.regex_scripts || []
  }

  async function handleDelete(character: any) {
  if (confirm('确定要删除这个角色吗？此操作不可撤销。')) {
    isDeleting.value = true
    try {
      const id = getCharacterId(character)
      const result = await adminStore.deleteCharacter(id)
      
      if (result && result.warning) {
        alert(`角色已删除，但存在警告: ${result.warning}`)
      }
    } catch (error: any) {
      alert('删除失败: ' + (error.message || '未知错误'))
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
      
      alert(message)
    } else {
      let errorMessage = `所有 ${result.failed} 个文件导入失败`
      if (result.failedFiles && result.failedFiles.length > 0) {
        errorMessage += ':\n' + result.failedFiles.map(f => `- ${f.filename}: ${f.error}`).join('\n')
      }
      alert(errorMessage)
    }
  } catch (error: any) {
    console.error('[Admin Import] Import failed:', error)
    alert('导入失败: ' + (error.message || '未知错误'))
  } finally {
    isImporting.value = false
    ;(event.target as HTMLInputElement).value = ''
  }
}
</script>
