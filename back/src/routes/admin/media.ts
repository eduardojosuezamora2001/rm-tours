import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../../env'
import { mediaUrl, thumbnailPath, mainWebpPath } from '../../media-url'
import type { database } from '../../db'
import { worthwhileImageSavings } from '../../../../shared/image-optimization'
import { serveMedia } from '../media'
export const adminMediaRoutes = new Hono<AppEnv>()
adminMediaRoutes.get('/media/:tourId/:file', (c) => serveMedia(c, true))

async function imageBytes(file: unknown, thumbnail = false) {
  if (!(file instanceof File)) return null
  const formats: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }
  const extension = formats[file.type]
  if (!extension || (thumbnail && extension !== 'webp') || file.size > (thumbnail ? 1024 * 1024 : 5 * 1024 * 1024) || file.size < 12) return null
  const bytes = new Uint8Array(await file.arrayBuffer())
  const text = new TextDecoder()
  const matches = extension === 'jpg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : extension === 'png' ? bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
      : text.decode(bytes.slice(0, 4)) === 'RIFF' && text.decode(bytes.slice(8, 12)) === 'WEBP'
  return matches ? { bytes, extension, contentType: file.type } : null
}

adminMediaRoutes.post('/uploads', async (c) => {
  const body = await c.req.parseBody()
  const file = body.file
  const tourId = body.tourId
  if (!(file instanceof File) || !z.uuid().safeParse(tourId).success) return c.json({ error: { code: 'INVALID_UPLOAD' } }, 400)
  const main = await imageBytes(file)
  const thumbnail = body.thumbnail === undefined ? null : await imageBytes(body.thumbnail, true)
  if (!main || (body.thumbnail !== undefined && !thumbnail)) return c.json({ error: { code: 'INVALID_UPLOAD' } }, 400)
  const id = crypto.randomUUID()
  const path = `${tourId}/${id}.${main.extension}`
  const db = c.get('db')
  const bucket = db.storage.from('tour-media')
  const { error } = await bucket.upload(path, main.bytes, { contentType: main.contentType, upsert: false })
  if (error) throw error
  if (thumbnail) {
    const { error: thumbnailError } = await bucket.upload(thumbnailPath(path), thumbnail.bytes, { contentType: 'image/webp', upsert: false })
    if (thumbnailError) {
      await bucket.remove([path])
      throw thumbnailError
    }
  }
  return c.json({ id, path, url: mediaUrl(path, true), thumbnail_url: mediaUrl(path, true, true) }, 201)
})

// Only owners reach these endpoints. Existing originals and catalogue documents are untouched.
async function pendingImages(db: ReturnType<typeof database>, includeMain = false) {
  const { data: media, error } = await db.from('tour_media').select('path,tour_id')
  if (error) throw error
  const missing: { path: string; url: string; needs_main: boolean; needs_thumbnail: boolean }[] = []
  for (const tourId of new Set((media ?? []).map((m) => m.tour_id as string))) {
    const files = new Set<string>()
    for (let offset = 0; ; offset += 1000) {
      const { data, error: listError } = await db.storage.from('tour-media').list(tourId, { limit: 1000, offset })
      if (listError) throw listError
      for (const file of data) files.add(`${tourId}/${file.name}`)
      if (data.length < 1000) break
    }
    for (const item of (media ?? []).filter((m) => m.tour_id === tourId)) {
      const needs_main = includeMain && /\.(jpg|png)$/i.test(item.path) && !files.has(mainWebpPath(item.path))
      const needs_thumbnail = !files.has(thumbnailPath(item.path))
      if (needs_main || needs_thumbnail) missing.push({
        path: item.path, url: `${mediaUrl(item.path, true)}${needs_main ? '?variant=source' : ''}`, needs_main, needs_thumbnail,
      })
    }
  }
  return missing
}

adminMediaRoutes.get('/media-optimization', async (c) => c.json(await pendingImages(c.get('db'), true)))
adminMediaRoutes.get('/media-thumbnails', async (c) => {
  const missing = await pendingImages(c.get('db'))
  return c.json(missing.map(({ path }) => ({ path, url: mediaUrl(path, true) })))
})

adminMediaRoutes.post('/media-webp', async (c) => {
  const body = await c.req.parseBody()
  if (typeof body.path !== 'string' || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png)$/i.test(body.path))
    return c.json({ error: { code: 'INVALID_UPLOAD' } }, 400)
  const optimized = await imageBytes(body.file)
  if (!optimized || optimized.contentType !== 'image/webp') return c.json({ error: { code: 'INVALID_UPLOAD' } }, 400)
  const db = c.get('db')
  const { data: media, error: lookupError } = await db.from('tour_media').select('id').eq('path', body.path).maybeSingle()
  if (lookupError) throw lookupError
  if (!media) return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  const bucket = db.storage.from('tour-media')
  const { data: original, error: sourceError } = await bucket.download(body.path)
  if (sourceError) throw sourceError
  if (!original) return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  // Compare actual stored bytes on the server; never trust a size supplied by the browser.
  if (!worthwhileImageSavings(original.size, optimized.bytes.byteLength))
    return c.json({ converted: false, saved_bytes: 0 })
  const { error } = await bucket.upload(mainWebpPath(body.path), optimized.bytes, { contentType: 'image/webp', upsert: false })
  if (error && String(error.statusCode) === '409') return c.json({ converted: false, saved_bytes: 0 })
  if (error) throw error
  return c.json({ converted: true, saved_bytes: original.size - optimized.bytes.byteLength }, 201)
})

adminMediaRoutes.post('/media-thumbnails', async (c) => {
  const body = await c.req.parseBody()
  if (typeof body.path !== 'string' || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg|png)$/i.test(body.path))
    return c.json({ error: { code: 'INVALID_UPLOAD' } }, 400)
  const thumbnail = await imageBytes(body.file, true)
  if (!thumbnail) return c.json({ error: { code: 'INVALID_UPLOAD' } }, 400)
  const db = c.get('db')
  const { data: media, error: lookupError } = await db.from('tour_media').select('id').eq('path', body.path).maybeSingle()
  if (lookupError) throw lookupError
  if (!media) return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  const { error } = await db.storage.from('tour-media').upload(thumbnailPath(body.path), thumbnail.bytes, { contentType: 'image/webp', upsert: false })
  // Another tab may have completed this same image; never replace its file.
  if (error && String(error.statusCode) !== '409') throw error
  return c.json({ thumbnail_url: mediaUrl(body.path, true, true) }, 201)
})
