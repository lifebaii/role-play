import { parseCharacterFromPng } from './characterImport'

export function isDevMode(): boolean {
  return import.meta.env.DEV
}

export async function debugPrintFile(
  file: File,
  operationType: string = '文件操作'
): Promise<void> {
  if (!isDevMode()) return

  const isImage = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.png')

  console.group(`📁 [角色文件 - ${operationType}]`)
  console.log('📄 文件名:', file.name)
  console.log('📋 文件类型:', file.type)
  console.log('📏 文件大小:', `${(file.size / 1024).toFixed(2)} KB`)

  try {
    if (isImage) {
      console.log('📷 图片文件，解析内部数据...')
      const { data, hasEmbeddedData } = await parseCharacterFromPng(file)
      if (hasEmbeddedData && data) {
        console.log('✅ 解析成功，角色数据:')
        console.log(data)
      } else {
        console.log('⚠️  未找到嵌入的角色数据')
      }
    } else {
      console.log('📄 JSON文件，读取内容...')
      const text = await file.text()
      try {
        const jsonData = JSON.parse(text)
        console.log('✅ 解析成功，内容:')
        console.log(jsonData)
      } catch (e) {
        console.log('⚠️  JSON解析失败，原始内容:')
        console.log(text)
      }
    }
  } catch (e) {
    console.error('❌ 文件解析失败:', e)
  }

  console.groupEnd()
}

export async function debugPrintBlob(
  blob: Blob,
  fileName: string,
  operationType: string = '文件操作'
): Promise<void> {
  if (!isDevMode()) return

  const isImage = blob.type.startsWith('image/') || fileName.toLowerCase().endsWith('.png')

  console.group(`📁 [角色文件 - ${operationType}]`)
  console.log('📄 文件名:', fileName)
  console.log('📋 文件类型:', blob.type)
  console.log('📏 文件大小:', `${(blob.size / 1024).toFixed(2)} KB`)

  try {
    if (isImage) {
      console.log('📷 图片文件，解析内部数据...')
      const file = new File([blob], fileName, { type: blob.type })
      const { data, hasEmbeddedData } = await parseCharacterFromPng(file)
      if (hasEmbeddedData && data) {
        console.log('✅ 解析成功，角色数据:')
        console.log(data)
      } else {
        console.log('⚠️  未找到嵌入的角色数据')
      }
    } else {
      console.log('📄 JSON文件，读取内容...')
      const text = await blob.text()
      try {
        const jsonData = JSON.parse(text)
        console.log('✅ 解析成功，内容:')
        console.log(jsonData)
      } catch (e) {
        console.log('⚠️  JSON解析失败，原始内容:')
        console.log(text)
      }
    }
  } catch (e) {
    console.error('❌ 文件解析失败:', e)
  }

  console.groupEnd()
}

export async function debugPrintCharacterFile(
  fileOrBlob: File | Blob,
  fileName: string,
  operationType: string = '文件操作'
): Promise<void> {
  if (!isDevMode()) return

  if (fileOrBlob instanceof File) {
    await debugPrintFile(fileOrBlob, operationType)
  } else {
    await debugPrintBlob(fileOrBlob, fileName, operationType)
  }
}
