<template>
  <div class="min-h-screen bg-[var(--theme-bg-start)] py-6 sm:py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <CharacterForm
        ref="characterFormRef"
        :model-value="formData"
        :character-id="isEdit ? route.params.id as string : undefined"
        :is-edit="isEdit"
        :is-admin-mode="true"
        :show-admin-fields="true"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import CharacterForm from '@/components/CharacterForm.vue'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()

const isEdit = computed(() => !!route.params.id)
const isLoading = ref(false)
const characterFormRef = ref<InstanceType<typeof CharacterForm> | null>(null)

// 表单数据，保持旧格式的扁平结构
const formData = ref({
  name: '',
  description: '',
  avatar: '',
  first_mes: '',
  personality: '',
  scenario: '',
  system_prompt: '',
  creator_notes: '',
  temperature: 1,
  character_book: { entries: [] as any[] },
  regex_scripts: [] as any[],
  shared: false,
  tags: [] as string[]
})

// 获取角色ID的辅助函数
function getCharacterId(character: any): string {
  return character?.role_play?.id || character?.id || ''
}

// 获取角色数据部分（适配新旧结构）
function getCharacterData(character: any): any {
  if (character?.data) {
    return character.data
  }
  return character
}

// 获取角色元数据部分
function getCharacterMeta(character: any): any {
  if (character?.role_play) {
    return character.role_play
  }
  return character
}

onMounted(async () => {
  adminStore.showSaveButton(handleSave)
  
  if (isEdit.value) {
    // 先尝试从列表页已加载的数据中直接获取角色
    let character = adminStore.characters.find(c => getCharacterId(c) === route.params.id)
    
    // 如果列表中没有找到，再调用接口获取
    if (!character) {
      character = await adminStore.loadCharacterDetail(route.params.id as string)
    }
    
    if (character) {
      const data = getCharacterData(character)
      const meta = getCharacterMeta(character)
      
      formData.value = {
        name: data.name || '',
        description: data.description || '',
        avatar: data.avatar || '',
        first_mes: data.first_mes || data.greeting || '',
        greeting: data.first_mes || data.greeting || '',
        personality: data.personality || '',
        scenario: data.scenario || '',
        system_prompt: data.system_prompt || '',
        creator_notes: data.creator_notes || '',
        temperature: data.temperature ?? 1,
        character_book: data.character_book || { entries: data.world_info || [] },
        regex_scripts: data.regex_scripts || [],
        shared: meta.shared || false,
        tags: data.tags || []
      }
    }
  }
})

onUnmounted(() => {
  adminStore.hideSaveButton()
})

async function handleSave() {
  if (characterFormRef.value) {
    await handleSubmit(characterFormRef.value.form)
  }
}

async function handleSubmit(data: any) {
  try {
    isLoading.value = true
    
    // 将表单数据转换为新格式
    const payload = {
      data: {
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        first_mes: data.first_mes || data.greeting,
        greeting: data.first_mes || data.greeting,
        personality: data.personality,
        scenario: data.scenario,
        system_prompt: data.system_prompt,
        creator_notes: data.creator_notes,
        temperature: data.temperature ?? 1,
        character_book: data.character_book || { entries: data.world_info || [] },
        regex_scripts: data.regex_scripts || [],
        tags: data.tags || []
      }
    }
    
    if (isEdit.value) {
      await adminStore.updateCharacter(route.params.id as string, payload)
    } else {
      await adminStore.createCharacter(payload)
    }
    alert('保存成功')
    router.push('/admin/characters')
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  } finally {
    isLoading.value = false
  }
}

function handleCancel() {
  router.push('/admin/characters')
}
</script>