import { fileSet, fileGet, fileDelete } from './db'

const THUMBNAIL_PREFIX = 'thumbnail_'

function generateThumbnailKey(category: string, name: string): string {
  return `${THUMBNAIL_PREFIX}${category}_${name}`
}

async function generateThumbnail(
  sourceBlob: Blob,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(sourceBlob)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let targetWidth = maxWidth
      let targetHeight = maxHeight

      const aspectRatio = img.naturalWidth / img.naturalHeight

      if (aspectRatio > 1) {
        targetHeight = Math.round(maxWidth / aspectRatio)
      } else {
        targetWidth = Math.round(maxHeight * aspectRatio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to generate thumbnail'))
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

async function generateCoverThumbnail(
  sourceBlob: Blob,
  width: number,
  height: number,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(sourceBlob)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      const sourceAspect = img.naturalWidth / img.naturalHeight
      const targetAspect = width / height

      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight

      if (sourceAspect > targetAspect) {
        sw = img.naturalHeight * targetAspect
        sx = (img.naturalWidth - sw) / 2
      } else {
        sh = img.naturalWidth / targetAspect
        sy = (img.naturalHeight - sh) / 2
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to generate thumbnail'))
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

async function getCachedThumbnail(category: string, name: string): Promise<Blob | null> {
  return fileGet(generateThumbnailKey(category, name))
}

async function getOrCreateThumbnail(
  category: string,
  name: string,
  sourceBlob: Blob,
  maxWidth: number,
  maxHeight: number,
  quality?: number
): Promise<Blob> {
  const cached = await getCachedThumbnail(category, name)
  if (cached) return cached

  const thumbnail = await generateThumbnail(sourceBlob, maxWidth, maxHeight, quality)
  await fileSet(generateThumbnailKey(category, name), thumbnail)
  return thumbnail
}

async function invalidateThumbnail(category: string, name: string): Promise<void> {
  await fileDelete(generateThumbnailKey(category, name))
}

async function getThumbnailUrl(category: string, name: string): Promise<string | null> {
  const blob = await getCachedThumbnail(category, name)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

async function createThumbnailUrl(
  category: string,
  name: string,
  sourceBlob: Blob,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  const thumbnail = await getOrCreateThumbnail(category, name, sourceBlob, maxWidth, maxHeight)
  return URL.createObjectURL(thumbnail)
}

export {
  generateThumbnail,
  generateCoverThumbnail,
  getCachedThumbnail,
  getOrCreateThumbnail,
  invalidateThumbnail,
  getThumbnailUrl,
  createThumbnailUrl,
  THUMBNAIL_PREFIX,
}
