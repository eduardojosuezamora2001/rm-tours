import { Hono } from 'hono'
import type { AppEnv } from '../../env'
import { database } from '../../db'

export const publicLegalRoutes = new Hono<AppEnv>()
publicLegalRoutes.get('/legal/:slug', async (c) => {
  const slug = c.req.param('slug')
  if (!['privacy', 'terms'].includes(slug)) return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  const { data, error } = await database(c.env).from('legal_pages')
    .select('slug,title,body,published').eq('slug', slug).eq('published', true).maybeSingle()
  if (error) throw error
  if (!data) return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  return c.json(data)
})
