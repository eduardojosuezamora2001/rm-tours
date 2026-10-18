import { Hono, type Context } from 'hono'
import type { AppEnv } from '../env'
import { database } from '../db'

export const mediaRoutes = new Hono<AppEnv>()
export async function serveMedia(c: Context<AppEnv>, admin = false) {
  const path = `${c.req.param('tourId')}/${c.req.param('file')}`
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg|png)$/i.test(path))
    return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  // RLS authorizes access before the backend obtains a short-lived, server-only URL.
  const db = admin ? c.get('db') : database(c.env)
  const { data, error } = await db.storage.from('tour-media').createSignedUrl(path, 60)
  if (error || !data) return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  // Workers supports manual/follow. Reject redirects through the status check below.
  const upstream = await fetch(data.signedUrl, { redirect: 'manual' })
  if (!upstream.ok || !upstream.body) return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  const mime = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png' }[
    path.split('.').at(-1)!.toLowerCase()
  ]!
  c.header('Content-Type', mime)
  c.header('Cache-Control', 'private, no-store')
  c.header('X-Content-Type-Options', 'nosniff')
  return c.body(upstream.body)
}
mediaRoutes.get('/media/:tourId/:file', (c) => serveMedia(c))
