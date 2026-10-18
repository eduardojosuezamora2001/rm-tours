import { Hono } from 'hono'
import type { AppEnv } from '../../env'
import { requireOwner } from './auth'
import { adminSessionRoutes } from './session'
import { adminTourRoutes } from './tours'
import { adminMediaRoutes } from './media'
import { adminSettingsRoutes } from './settings'
import { adminLegalRoutes } from './legal'
export const adminRoutes = new Hono<AppEnv>()
adminRoutes.use('*', requireOwner)
adminRoutes.route('/', adminSessionRoutes)
adminRoutes.route('/', adminTourRoutes)
adminRoutes.route('/', adminMediaRoutes)
adminRoutes.route('/', adminSettingsRoutes)
adminRoutes.route('/', adminLegalRoutes)
