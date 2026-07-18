import { addOnlineFriend } from './localFriendStorage'

const INITIALIZED_KEY = 'role_play_default_characters_v1_initialized'

const DEFAULT_CHARACTERS = [
  {
    id: 'bundled-character-adis-lite-preview-v1',
    json: '1/v1.96万神的亚狄斯Lite•Preview.json',
    image: '1/v1.96万神的亚狄斯Lite•Preview.webp',
  },
  {
    id: 'bundled-character-release-that-witch-v1',
    json: '1/放开那个女巫.json',
    image: '1/放开那个女巫.webp',
  },
] as const

function resolvePublicAsset(path: string) {
  return new URL(path, document.baseURI).toString()
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('读取角色图片失败'))
    reader.readAsDataURL(blob)
  })
}

async function fetchRequired(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`加载默认角色资源失败：${response.status} ${url}`)
  return response
}

export async function initializeDefaultCharacters(): Promise<void> {
  if (localStorage.getItem(INITIALIZED_KEY) === 'true') return

  for (const character of DEFAULT_CHARACTERS) {
    const [jsonResponse, imageResponse] = await Promise.all([
      fetchRequired(resolvePublicAsset(character.json)),
      fetchRequired(resolvePublicAsset(character.image)),
    ])
    const [card, avatar] = await Promise.all([
      jsonResponse.json(),
      imageResponse.blob().then(blobToDataUrl),
    ])

    const data = card?.data || card
    if (!data?.name) throw new Error(`默认角色缺少名称：${character.json}`)

    await addOnlineFriend({
      ...card,
      data: {
        ...data,
        avatar,
      },
    }, character.id, 'import')
  }

  localStorage.setItem(INITIALIZED_KEY, 'true')
}
