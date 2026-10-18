import { Hono } from 'hono'
import { z } from 'zod'
import {
  authClient,
  clearRecoveryVerifier,
  clearSession,
  hasRecoveryVerifier,
  isOwner,
  saveSession,
  sessionFromRequest,
} from '../auth'
import type { AppEnv } from '../env'

export const authRoutes = new Hono<AppEnv>()
authRoutes.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store')
  c.header('Referrer-Policy', 'no-referrer')
  await next()
})
authRoutes.post('/login', async (c) => {
  const input = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(1024) })
    .safeParse(await c.req.json())
  if (!input.success) return c.json({ error: { code: 'VALIDATION_ERROR' } }, 400)
  const client = authClient(c)
  const { data, error } = await client.auth.signInWithPassword(input.data)
  if (error || !data.session || !data.user) {
    clearSession(c)
    return c.json(
      { error: { code: error?.status === 429 ? 'RATE_LIMITED' : 'UNAUTHORIZED' } },
      error?.status === 429 ? 429 : 401,
    )
  }
  if (!isOwner(data.user)) {
    await client.auth.signOut({ scope: 'local' })
    clearSession(c)
    return c.json({ error: { code: 'FORBIDDEN' } }, 403)
  }
  clearSession(c, 'recovery')
  clearRecoveryVerifier(c)
  saveSession(c, data.session)
  return c.json({ id: data.user.id })
})
authRoutes.post('/logout', async (c) => {
  // Clear cookies even if the upstream session has already expired or is unavailable.
  try {
    const session = await sessionFromRequest(c)
    if (session?.refresh) {
      await session.client.auth.setSession({
        access_token: session.access,
        refresh_token: session.refresh,
      })
      await session.client.auth.signOut({ scope: 'local' })
    }
  } catch {
    console.error(
      JSON.stringify({ requestId: c.get('requestId'), code: 'SIGNOUT_UPSTREAM_UNAVAILABLE' }),
    )
  } finally {
    clearSession(c)
    clearSession(c, 'recovery')
    clearRecoveryVerifier(c)
  }
  return c.body(null, 204)
})
authRoutes.post('/recover', async (c) => {
  const input = z.object({ email: z.email().max(254) }).safeParse(await c.req.json())
  if (!input.success) return c.json({ error: { code: 'VALIDATION_ERROR' } }, 400)
  const origin = c.req.header('Origin')!
  const { error } = await authClient(c, true).auth.resetPasswordForEmail(input.data.email, {
    redirectTo: `${origin}/admin-tours/reset-password`,
  })
  if (error)
    return c.json(
      { error: { code: error.status === 429 ? 'RATE_LIMITED' : 'GENERIC' } },
      error.status === 429 ? 429 : 502,
    )
  return c.body(null, 202)
})
authRoutes.get('/callback', async (c) => {
  const code = c.req.query('code')
  if (code && code.length <= 2048 && hasRecoveryVerifier(c)) {
    const { data, error } = await authClient(c, true).auth.exchangeCodeForSession(code)
    if (!error && data.session && data.user && isOwner(data.user)) {
      saveSession(c, data.session, 'recovery')
      return c.redirect('/admin-tours/reset-password', 303)
    }
  }
  clearSession(c, 'recovery')
  clearRecoveryVerifier(c)
  return c.redirect('/admin-tours/recover?error=invalid_link', 303)
})
authRoutes.post('/reset-password', async (c) => {
  const input = z.object({ password: z.string().min(12).max(1024) }).safeParse(await c.req.json())
  if (!input.success) return c.json({ error: { code: 'VALIDATION_ERROR' } }, 400)
  const session = await sessionFromRequest(c, 'recovery')
  if (!session || !session.refresh) return c.json({ error: { code: 'UNAUTHORIZED' } }, 401)
  if (!isOwner(session.user)) return c.json({ error: { code: 'FORBIDDEN' } }, 403)
  const loaded = await session.client.auth.setSession({
    access_token: session.access,
    refresh_token: session.refresh,
  })
  if (loaded.error) return c.json({ error: { code: 'UNAUTHORIZED' } }, 401)
  const { error } = await session.client.auth.updateUser(input.data)
  if (error) return c.json({ error: { code: 'GENERIC' } }, 400)
  await session.client.auth.signOut({ scope: 'global' })
  clearSession(c, 'recovery')
  clearSession(c)
  return c.body(null, 204)
})
