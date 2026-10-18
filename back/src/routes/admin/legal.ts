import { Hono } from 'hono'
import type { AppEnv } from '../../env'
import { legalSchema } from '../../schemas'
export const adminLegalRoutes = new Hono<AppEnv>()
adminLegalRoutes.get('/legal', async (c) => {
  const { data, error } = await c.get('db').from('legal_pages').select('slug,title,body,published').order('slug')
  if (error) throw error
  return c.json(data)
})
adminLegalRoutes.put('/legal/:slug', async (c) => {
  const result = legalSchema.safeParse(await c.req.json())
  if (!result.success || result.data.slug !== c.req.param('slug')) return c.json({ error: { code: 'VALIDATION_ERROR' } }, 400)
  const { error } = await c.get('db').from('legal_pages').upsert(result.data)
  if (error) throw error
  return c.json(result.data)
})
