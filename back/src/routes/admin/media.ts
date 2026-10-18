import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../../env'
import { mediaUrl } from '../../media-url'
import { serveMedia } from '../media'
export const adminMediaRoutes = new Hono<AppEnv>()
adminMediaRoutes.get('/media/:tourId/:file', (c) => serveMedia(c, true))
adminMediaRoutes.post('/uploads', async (c) => {
  const body = await c.req.parseBody()
  const file = body.file
  const tourId = body.tourId
  if (!(file instanceof File) || !z.uuid().safeParse(tourId).success) return c.json({ error: { code: 'INVALID_UPLOAD' } }, 400)
  const formats: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }
  const extension = formats[file.type]
  if (!extension || file.size > 5 * 1024 * 1024 || file.size < 12) return c.json({ error: { code: 'INVALID_UPLOAD' } }, 400)
  const bytes = new Uint8Array(await file.arrayBuffer())
  const text = new TextDecoder()
  const matches = extension === 'jpg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : extension === 'png' ? bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
      : text.decode(bytes.slice(0, 4)) === 'RIFF' && text.decode(bytes.slice(8, 12)) === 'WEBP'
  if (!matches) return c.json({ error: { code: 'INVALID_UPLOAD' } }, 400)
  const id = crypto.randomUUID()
  const path = `${tourId}/${id}.${extension}`
  const db = c.get('db')
  const { error } = await db.storage.from('tour-media').upload(path, bytes, { contentType: file.type, upsert: false })
  if (error) throw error
  return c.json({ id, path, url: mediaUrl(path, true) }, 201)
})
