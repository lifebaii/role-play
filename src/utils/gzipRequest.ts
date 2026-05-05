import pako from 'pako'

const COMPRESSION_THRESHOLD = 10 * 1024

export interface CompressedBody {
  body: Uint8Array
  headers: { 'Content-Type': string; 'Content-Encoding': string }
}

export interface CompressionResult {
  body: string | Uint8Array
  headers: Record<string, string>
  compressed: boolean
  originalSize: number
  compressedSize: number
}

export function shouldCompress(data: any): boolean {
  const jsonStr = JSON.stringify(data)
  return jsonStr.length > COMPRESSION_THRESHOLD
}

export function compressBody(data: any): CompressionResult {
  const jsonStr = JSON.stringify(data)
  const originalSize = new Blob([jsonStr]).size
  
  if (originalSize <= COMPRESSION_THRESHOLD) {
    return {
      body: jsonStr,
      headers: { 'Content-Type': 'application/json' },
      compressed: false,
      originalSize,
      compressedSize: originalSize
    }
  }
  
  const compressed = pako.gzip(jsonStr)
  const compressedSize = compressed.length
  
  return {
    body: compressed,
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip'
    },
    compressed: true,
    originalSize,
    compressedSize
  }
}

export function getCompressionStats(): { threshold: number; thresholdKB: string } {
  return {
    threshold: COMPRESSION_THRESHOLD,
    thresholdKB: `${(COMPRESSION_THRESHOLD / 1024).toFixed(0)}KB`
  }
}
