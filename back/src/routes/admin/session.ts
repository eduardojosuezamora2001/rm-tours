import { Hono } from 'hono'
import type { AppEnv } from '../../env'
export const adminSessionRoutes = new Hono<AppEnv>()
adminSessionRoutes.get('/session', (c) => c.json({ id: c.get('userId') }))
