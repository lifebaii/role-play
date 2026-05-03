<template>
  <CharacterList
    :characters="adminStore.characters"
    :show-import="true"
    :show-drag-handle="true"
    :show-share-toggle="true"
    @select="handleSelect"
    @edit="handleEdit"
    @delete="handleDelete"
    @create="handleCreate"
    @import="handleImport"
    @reorder="handleReorder"
    @toggle-share="handleToggleShare"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import CharacterList from '@/components/CharacterList.vue'
import { charactersApi } from '@/api'

const router = useRouter()
const adminStore = useAdminStore()
const isImporting = ref(false)

onMounted(() => {
  adminStore.loadCharacters()
})

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
    return character.data?.regex_scripts || character.regex_scripts || []
  }

  async function handleDelete(character: any) {
    if (confirm('确定要删除这个角色吗？')) {
      const id = getCharacterId(character)
      await adminStore.deleteCharacter(id)
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
    const result = await charactersApi.importFiles(Array.from(files))
    
    if (result.imported && result.imported > 0) {
      await adminStore.loadCharacters()
      
      let message = `成功导入 ${result.imported} 个角色`
      if (result.failCount && result.failCount > 0) {
        message += `，${result.failCount} 个文件导入失败`
      }
      alert(message)
    } else if (result.failCount && result.failCount > 0) {
      alert(`所有 ${result.failCount} 个文件导入失败，请检查文件格式`)
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