import { ref } from 'vue'
import { getFriendAvatar, getFriendName, getFriendDescription, clearAllBlobUrls, type LocalFriend } from '@/utils/localFriendStorage'

export function useAvatar() {
  const avatarUrl = ref<string | undefined>(undefined)
  const isLoading = ref(false)

  const loadAvatar = async (character: LocalFriend | any) => {
    if (!character) {
      avatarUrl.value = undefined
      return
    }

    isLoading.value = true
    
    try {
      let url: string | undefined
      
      if (character.role_play?.id) {
        url = await getFriendAvatar(character as LocalFriend)
      } else if (character.avatar?.startsWith('data:')) {
        url = character.avatar
      } else if (character.avatar) {
        url = character.avatar
      }
      
      avatarUrl.value = url
    } catch (e) {
      console.error('Failed to load avatar:', e)
      avatarUrl.value = character.avatar
    } finally {
      isLoading.value = false
    }
  }

  return {
    avatarUrl,
    isLoading,
    loadAvatar
  }
}

export function getAvatarUrl(character: any): string | undefined {
  if (!character) return undefined
  
  if (character.avatar?.startsWith('data:')) {
    return character.avatar
  }
  
  return character.avatar
}

export async function preloadAvatars(characters: any[]) {
  for (const char of characters) {
    if (char.role_play?.id) {
      try {
        await getFriendAvatar(char as LocalFriend)
      } catch (e) {
        console.error('Failed to preload friend avatar:', e)
      }
    }
  }
}

export function clearAvatarCache() {
  clearAllBlobUrls()
}

export function getCharacterDisplayName(character: any): string {
  if (character.role_play?.id) {
    return getFriendName(character)
  }
  if (character.data && character.data.name) {
    return character.data.name
  }
  return character.name || 'Unknown'
}

export function getCharacterDisplayDescription(character: any): string {
  if (character.role_play?.id) {
    return getFriendDescription(character)
  }
  if (character.data && character.data.description) {
    return character.data.description
  }
  return character.description || ''
}
