import { readFile } from 'node:fs/promises'
import { test, expect } from './fixtures'
import { testTours } from '../../shared/testing/tours'

test('creates a small WebP without enlarging images or replacing a lighter original', async ({ page }) => {
  await page.goto('/es')
  const result = await page.evaluate(async () => {
    const { optimizeImage, createThumbnail } = await import('/src/features/admin/image.ts')
    const canvas = document.createElement('canvas')
    canvas.width = 2560
    canvas.height = 1600
    const context = canvas.getContext('2d')!
    const gradient = context.createLinearGradient(0, 0, 2560, 1600)
    gradient.addColorStop(0, '#003b49')
    gradient.addColorStop(1, '#f4a87d')
    context.fillStyle = gradient
    context.fillRect(0, 0, 2560, 1600)
    const png = await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!)))
    const file = new File([png], 'test.png', { type: 'image/png' })
    const optimized = await optimizeImage(file)
    const main = await createImageBitmap(optimized.main)
    const small = await createImageBitmap(optimized.thumbnail!)
    const repeated = await optimizeImage(optimized.thumbnail!)
    const unchanged = await createImageBitmap(await createThumbnail(optimized.thumbnail!))
    const result = {
      main: [main.width, main.height],
      thumbnail: [small.width, small.height],
      unchanged: [unchanged.width, unchanged.height],
      mime: optimized.thumbnail!.type,
      lighter: optimized.thumbnail!.size < optimized.main.size,
      preservesMain: repeated.main === optimized.thumbnail,
      avoidsUselessCopy: repeated.thumbnail === null,
    }
    main.close()
    small.close()
    unchanged.close()
    return result
  })
  expect(result).toEqual({ main: [1920, 1200], thumbnail: [640, 400], unchanged: [640, 400], mime: 'image/webp', lighter: true, preservesMain: true, avoidsUselessCopy: true })
})

test('backfills main WebPs and thumbnails once while preserving catalogue data', async ({ page }) => {
  const photo = { ...testTours[0].media[0], path: testTours[0].media[0].path.replace('.webp', '.jpg') }
  let completed = false
  let mainCompleted = false
  let mainUploads = 0
  let uploads = 0
  let documentWrites = 0
  await page.route('**/api/v1/admin/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1/admin', '')
    if (path === '/session') return route.fulfill({ json: { id: 'owner' } })
    if (path === '/tours') return route.fulfill({ json: testTours })
    if (path === '/media-optimization')
      return route.fulfill({ json: completed && mainCompleted ? [] : [{ path: photo.path, url: `/api/v1/admin/media/${photo.path}?variant=source`, needs_main: !mainCompleted, needs_thumbnail: !completed }] })
    if (path === '/media-webp') {
      expect(request.headers()['x-rm-request']).toBe('1')
      const body = await new Response(request.postDataBuffer()!, { headers: { 'Content-Type': request.headers()['content-type'] } }).formData()
      expect(body.get('path')).toBe(photo.path)
      const file = body.get('file') as File
      expect(file.type).toBe('image/webp')
      expect(file.size).toBeLessThan((await readFile(new URL('../../shared/testing/tour.jpg', import.meta.url))).length)
      mainUploads++
      mainCompleted = true
      return route.fulfill({ status: 201, json: { converted: true, saved_bytes: 4096 } })
    }
    if (path === '/media-thumbnails') {
      expect(request.headers()['x-rm-request']).toBe('1')
      const body = await new Response(request.postDataBuffer()!, { headers: { 'Content-Type': request.headers()['content-type'] } }).formData()
      expect(body.get('path')).toBe(photo.path)
      const file = body.get('file') as File
      expect(file.type).toBe('image/webp')
      const bytes = Buffer.from(await file.arrayBuffer())
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF')
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
      uploads++
      completed = true
      return route.fulfill({ status: 201, json: { thumbnail_url: `/api/v1/admin/media/${photo.path}?variant=card` } })
    }
    if (request.method() !== 'GET') documentWrites++
    if (path.startsWith('/media/')) return route.fulfill({ contentType: 'image/jpeg', body: await readFile(new URL('../../shared/testing/tour.jpg', import.meta.url)) })
    return route.fallback()
  })
  await page.goto('/admin-tours')
  await expect(page.getByText('Imágenes revisadas: 1. Se usan versiones WebP y miniaturas cuando reducen el peso.')).toBeVisible()
  await expect(page.getByText('Versiones principales WebP creadas: 1. Reducción al descargar estas fotos: 4 KB. Los respaldos siguen ocupando espacio.')).toBeVisible()
  expect(uploads).toBe(1)
  expect(mainUploads).toBe(1)
  expect(documentWrites).toBe(0)
  await page.reload()
  await expect(page.locator('.admin-tour-list')).toBeVisible()
  await expect.poll(() => uploads).toBe(1)
  expect(mainUploads).toBe(1)
  await expect(page.getByText('Optimización de imágenes', { exact: true })).toHaveCount(0)
})
