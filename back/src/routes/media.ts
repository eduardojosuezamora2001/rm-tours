import { Hono, type Context } from 'hono'
import type { AppEnv } from '../env'
import { database } from '../db'
import { thumbnailPath, mainWebpPath } from '../media-url'

export const mediaRoutes = new Hono<AppEnv>()
export async function serveMedia(c: Context<AppEnv>, admin = false) {
  const path = `${c.req.param('tourId')}/${c.req.param('file')}`
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg|png)$/i.test(path))
    return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  // RLS authorizes access before the backend obtains a short-lived, server-only URL.
  const db = admin ? c.get('db') : database(c.env)
  const variant = c.req.query('variant')
  if (variant && variant !== 'card' && !(admin && variant === 'source'))
    return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  const bucket = db.storage.from('tour-media')
  const candidates = [
    ...(variant === 'card' ? [thumbnailPath(path)] : []),
    ...(variant !== 'source' && !path.endsWith('.webp') ? [mainWebpPath(path)] : []),
    path,
  ]
  // Prefer a lighter stored WebP; retain a working original throughout conversion.
  for (const selectedPath of candidates) {
    const signed = await bucket.createSignedUrl(selectedPath, 60)
    if (signed.error || !signed.data) continue
    // Workers supports manual/follow. Reject redirects through the status check.
    const upstream = await fetch(signed.data.signedUrl, { redirect: 'manual' })
    if (upstream.status >= 300 && upstream.status < 400) {
      await upstream.body?.cancel()
      return c.json({ error: { code: 'NOT_FOUND' } }, 404)
    }
    if (!upstream.ok || !upstream.body) {
      await upstream.body?.cancel()
      continue
    }
    const mime = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png' }[
      selectedPath.split('.').at(-1)!.toLowerCase()
    ]!
    c.header('Content-Type', mime)
    c.header('Cache-Control', 'private, no-store')
    c.header('X-Content-Type-Options', 'nosniff')
    return c.body(upstream.body)
  }
  return c.json({ error: { code: 'NOT_FOUND' } }, 404)
}
mediaRoutes.get('/media/:tourId/:file', (c) => serveMedia(c))
