import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const sourceImage = 'C:/Users/cc/Downloads/a010b535-0523-4023-9add-c1a2d6506891.png'
const publicDir = path.resolve('public')

const sizes = [
  { width: 64, height: 64, filename: 'favicon.png' },
  { width: 192, height: 192, filename: 'pwa-192x192.png' },
  { width: 512, height: 512, filename: 'pwa-512x512.png' }
]

async function processIcons() {
  console.log('Processing icons...')
  
  for (const size of sizes) {
    const outputPath = path.join(publicDir, size.filename)
    
    const { data, info } = await sharp(sourceImage)
      .ensureAlpha()
      .resize(size.width, size.height, { kernel: 'lanczos3' })
      .raw()
      .toBuffer({ resolveWithObject: true })
    
    const pixelArray = new Uint8ClampedArray(data)
    for (let i = 0; i < pixelArray.length; i += 4) {
      const r = pixelArray[i]
      const g = pixelArray[i + 1]
      const b = pixelArray[i + 2]
      if (r < 50 && g < 50 && b < 50) {
        pixelArray[i + 3] = 0
      }
    }
    
    await sharp(pixelArray, { raw: { width: info.width, height: info.height, channels: 4 } })
      .png({ quality: 85, compressionLevel: 9 })
      .toFile(outputPath)
    
    console.log(`✓ Created ${size.filename}`)
  }
  
  console.log('\nAll icons processed successfully!')
}

processIcons().catch(err => {
  console.error('Error processing icons:', err)
  process.exit(1)
})
