import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../../env'
import { tourSelect, withMedia } from '../../db'
import { tourSchema } from '../../schemas'
import { publicationErrors, type Tour } from '../../../../shared/contracts'
import { mediaPaths } from '../../media-url'

export const adminTourRoutes = new Hono<AppEnv>()
adminTourRoutes.get('/tours', async (c) => {
  const { data, error } = await c.get('db').from('tours').select(tourSelect).order('updated_at', { ascending: false })
  if (error) throw error
  return c.json(await withMedia(data as Tour[], true))
})
adminTourRoutes.get('/tours/:id', async (c) => {
  const id = c.req.param('id')
  if (!z.uuid().safeParse(id).success) return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  const { data, error } = await c.get('db').from('tours').select(tourSelect).eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  return c.json((await withMedia([data as Tour], true))[0])
})
adminTourRoutes.put('/tours/:id', async (c) => {
  const result = tourSchema.safeParse(await c.req.json())
  if (!result.success || result.data.id !== c.req.param('id')) return c.json({ error: { code: 'VALIDATION_ERROR' } }, 400)
  if (result.data.status === 'published') {
    const errors = publicationErrors(result.data)
    if (errors.length) return c.json({ error: { code: 'PUBLICATION_INCOMPLETE', details: errors } }, 422)
  }
  const db = c.get('db')
  const { data: previous } = await db.from('tour_media').select('path').eq('tour_id', result.data.id)
  const { data, error } = await db.rpc('save_tour', { p_document: result.data })
  if (error) {
    if (error.message.includes('EDIT_CONFLICT')) return c.json({ error: { code: 'EDIT_CONFLICT' } }, 409)
    if (error.code === '23505') return c.json({ error: { code: 'SLUG_EXISTS' } }, 409)
    throw error
  }
  const removed = (previous ?? []).map((m) => m.path as string).filter((path) => !result.data.media.some((m) => m.path === path))
  if (removed.length) c.executionCtx.waitUntil(db.storage.from('tour-media').remove(mediaPaths(removed)).then(({ error: cleanupError }) => {
    if (cleanupError) console.warn(JSON.stringify({ code: 'MEDIA_CLEANUP_FAILED', requestId: c.get('requestId') }))
  }))
  return c.json({ id: result.data.id, updated_at: data })
})
adminTourRoutes.delete('/tours/:id', async (c) => {
  const id = c.req.param('id')
  if (!z.uuid().safeParse(id).success) return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  const db = c.get('db')
  const { data: media } = await db.from('tour_media').select('path').eq('tour_id', id)
  const { error } = await db.from('tours').delete().eq('id', id)
  if (error) throw error
  if (media?.length) c.executionCtx.waitUntil(db.storage.from('tour-media').remove(mediaPaths(media.map((m) => m.path))).then(() => undefined))
  return c.body(null, 204)
})
