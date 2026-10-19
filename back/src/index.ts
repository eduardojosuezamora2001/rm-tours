import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import type { AppEnv } from './env'
import { publicRoutes } from './routes/public'
import { adminRoutes } from './routes/admin'
import { authRoutes } from './routes/auth'
import { mediaRoutes } from './routes/media'
const app = new Hono<AppEnv>()
app.use('*', secureHeaders())
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  c.header('X-Request-Id', c.get('requestId'))
  const started = Date.now()
  await next()
  console.log(
    JSON.stringify({
      requestId: c.get('requestId'),
      method: c.req.method,
      status: c.res.status,
      durationMs: Date.now() - started,
    }),
  )
})
app.use(
  '/api/*',
  cors({
    origin: (origin, c) =>
      (c.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((s: string) => s.trim())
        .includes(origin)
        ? origin
        : '',
    allowMethods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-RM-Request'],
    credentials: true,
    maxAge: 86400,
  }),
)
app.use(
  '/api/*',
  bodyLimit({
    // Main image (5 MB), thumbnail (1 MB), and multipart headers.
    maxSize: 7 * 1024 * 1024,
    onError: (c) => c.json({ error: { code: 'BODY_TOO_LARGE' } }, 413),
  }),
)
app.get('/health', (c) => c.json({ status: 'ok' }))
app.use('/api/*', async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const origin = c.req.header('Origin')
    const allowed = [new URL(c.req.url).origin, ...(c.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim())]
    if (!origin || !allowed.includes(origin) || c.req.header('X-RM-Request') !== '1')
      return c.json({ error: { code: 'FORBIDDEN' } }, 403)
  }
  await next()
})
app.use('/api/*', async (c, next) => {
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_PUBLISHABLE_KEY)
    return c.json({ error: { code: 'NOT_CONFIGURED' } }, 503)
  await next()
})
app.route('/api/v1/auth', authRoutes)
app.route('/api/v1', mediaRoutes)
app.route('/api/v1/admin', adminRoutes)
app.route('/api/v1', publicRoutes)
app.notFound((c) => c.json({ error: { code: 'NOT_FOUND' } }, 404))
app.onError((error, c) => {
  if (error instanceof SyntaxError) return c.json({ error: { code: 'VALIDATION_ERROR' } }, 400)
  console.error(JSON.stringify({ requestId: c.get('requestId'), code: 'INTERNAL_ERROR' }))
  return c.json({ error: { code: 'INTERNAL_ERROR' }, requestId: c.get('requestId') }, 500)
})
export default app
