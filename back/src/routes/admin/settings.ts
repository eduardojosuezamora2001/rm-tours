import { Hono } from 'hono'
import type { AppEnv } from '../../env'
import { settingsSchema } from '../../schemas'
export const adminSettingsRoutes = new Hono<AppEnv>()
adminSettingsRoutes.put('/settings', async (c) => {
  const result = settingsSchema.safeParse(await c.req.json())
  if (!result.success) return c.json({ error: { code: 'VALIDATION_ERROR' } }, 400)
  const { error } = await c.get('db').from('site_settings').upsert({ id: 1, ...result.data })
  if (error) throw error
  return c.json(result.data)
})
