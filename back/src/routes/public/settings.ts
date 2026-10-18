import { Hono } from 'hono'
import type { AppEnv } from '../../env'
import { database } from '../../db'

export const publicSettingsRoutes = new Hono<AppEnv>()
publicSettingsRoutes.get('/settings', async (c) => {
  const { data, error } = await database(c.env).from('site_settings')
    .select('whatsapp,email,location,hours,intro').eq('id', 1).single()
  if (error) return c.json({ error: { code: 'SETTINGS_UNAVAILABLE' } }, 503)
  c.header('Cache-Control', 'public, max-age=30')
  return c.json(data)
})
