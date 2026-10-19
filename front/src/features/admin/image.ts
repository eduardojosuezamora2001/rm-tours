import { worthwhileImageSavings } from '../../../../shared/image-optimization'

async function renderImage(image: ImageBitmap, width: number, height: number, quality: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('INVALID_UPLOAD')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality),
  )
  if (!blob || blob.type !== 'image/webp') throw new Error('INVALID_UPLOAD')
  return new File([blob], 'tour.webp', { type: blob.type })
}

export async function createThumbnail(file: Blob) {
  const image = await createImageBitmap(file)
  try {
    if (image.width * image.height > 40_000_000) throw new Error('INVALID_UPLOAD')
    const scale = Math.min(1, 640 / image.width, 1920 / image.height)
    const thumbnail = await renderImage(image, image.width * scale, image.height * scale, 0.8)
    return scale === 1 && file.type === 'image/webp' && file.size <= thumbnail.size
      ? new File([file], 'tour.webp', { type: file.type }) : thumbnail
  } finally {
    image.close()
  }
}

export async function optimizeImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
    throw new Error('INVALID_UPLOAD')
  const image = await createImageBitmap(file)
  try {
    if (image.width * image.height > 40_000_000) throw new Error('INVALID_UPLOAD')
    const scale = Math.min(1, 1920 / Math.max(image.width, image.height))
    const optimized = await renderImage(image, image.width * scale, image.height * scale, 0.85)
    // Preserve existing WebPs and avoid lossy conversions for negligible savings.
    const worthwhile = worthwhileImageSavings(file.size, optimized.size)
    const main = scale === 1 && (file.type === 'image/webp' || !worthwhile) ? file : optimized
    const thumbScale = Math.min(1, 640 / image.width, 1920 / image.height)
    const thumbnail = await renderImage(image, image.width * thumbScale, image.height * thumbScale, 0.8)
    const usefulThumbnail = worthwhileImageSavings(main.size, thumbnail.size)
    return { main, thumbnail: usefulThumbnail ? thumbnail : null }
  } finally {
    image.close()
  }
}
