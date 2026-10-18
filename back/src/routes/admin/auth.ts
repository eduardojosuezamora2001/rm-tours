import type { MiddlewareHandler } from 'hono'
import { database } from '../../db'
import type { AppEnv } from '../../env'
import { isOwner, sessionFromRequest } from '../../auth'

export const requireOwner: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.header('Cache-Control', 'no-store')
  const session = await sessionFromRequest(c)
  if (!session) return c.json({ error: { code: 'UNAUTHORIZED' } }, 401)
  if (!isOwner(session.user)) return c.json({ error: { code: 'FORBIDDEN' } }, 403)
  c.set('db', database(c.env, session.access))
  c.set('userId', session.user.id)
  await next()
}
