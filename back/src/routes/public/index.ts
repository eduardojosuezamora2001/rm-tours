import { Hono } from 'hono'
import type { AppEnv } from '../../env'
import { catalogRoutes } from './catalog'
import { publicLegalRoutes } from './legal'
import { publicSettingsRoutes } from './settings'

export const publicRoutes = new Hono<AppEnv>()
publicRoutes.route('/', catalogRoutes)
publicRoutes.route('/', publicLegalRoutes)
publicRoutes.route('/', publicSettingsRoutes)
