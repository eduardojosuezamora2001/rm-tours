import { createClient, type Session } from '@supabase/supabase-js'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { AppEnv } from './env'

type Scope = 'session' | 'recovery'
const verifierKey = 'rm-tours-recovery-code-verifier'
export function hasRecoveryVerifier(c: Context<AppEnv>) {
  return !!getCookie(c, name(c, 'verifier'))
}
export function clearRecoveryVerifier(c: Context<AppEnv>) {
  deleteCookie(c, name(c, 'verifier'), cookieOptions(c))
}
function cookieOptions(c: Context<AppEnv>) {
  return {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax' as const,
    path: '/',
  }
}
function name(c: Context<AppEnv>, key: string) {
  return `${cookieOptions(c).secure ? '__Host-' : ''}rm_tours_${key}`
}
export function authClient(c: Context<AppEnv>, pkce = false) {
  return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: pkce,
      flowType: 'pkce',
      storageKey: 'rm-tours-recovery',
      storage: pkce
        ? {
            getItem: (key) =>
              key === verifierKey ? (getCookie(c, name(c, 'verifier')) ?? null) : null,
            setItem: (key, value) => {
              if (key === verifierKey)
                setCookie(c, name(c, 'verifier'), value, { ...cookieOptions(c), maxAge: 600 })
            },
            removeItem: (key) => {
              if (key === verifierKey) deleteCookie(c, name(c, 'verifier'), cookieOptions(c))
            },
          }
        : undefined,
    },
  })
}
export function saveSession(c: Context<AppEnv>, session: Session, scope: Scope = 'session') {
  const ttl = scope === 'recovery' ? 600 : 7 * 86400
  setCookie(c, name(c, `${scope}_access`), session.access_token, {
    ...cookieOptions(c),
    maxAge: Math.min(session.expires_in, ttl),
  })
  setCookie(c, name(c, `${scope}_refresh`), session.refresh_token, {
    ...cookieOptions(c),
    maxAge: ttl,
  })
}
export function clearSession(c: Context<AppEnv>, scope: Scope = 'session') {
  for (const key of ['access', 'refresh'])
    deleteCookie(c, name(c, `${scope}_${key}`), cookieOptions(c))
}
export async function sessionFromRequest(c: Context<AppEnv>, scope: Scope = 'session') {
  const client = authClient(c)
  let access = getCookie(c, name(c, `${scope}_access`))
  const refresh = getCookie(c, name(c, `${scope}_refresh`))
  if (access) {
    const { data, error } = await client.auth.getUser(access)
    if (!error && data.user) return { client, user: data.user, access, refresh }
    if (error && (error.status ?? 500) >= 500) throw new Error('AUTH_UNAVAILABLE')
  }
  if (refresh) {
    const { data, error } = await client.auth.refreshSession({ refresh_token: refresh })
    if (error && (error.status ?? 500) >= 500) throw new Error('AUTH_UNAVAILABLE')
    if (!error && data.session) {
      access = data.session.access_token
      const verified = await client.auth.getUser(access)
      if (verified.error && (verified.error.status ?? 500) >= 500)
        throw new Error('AUTH_UNAVAILABLE')
      if (!verified.error && verified.data.user) {
        saveSession(c, data.session, scope)
        return { client, user: verified.data.user, access, refresh: data.session.refresh_token }
      }
    }
  }
  clearSession(c, scope)
  return null
}
export function isOwner(user: { app_metadata: Record<string, unknown>; is_anonymous?: boolean }) {
  return !user.is_anonymous && user.app_metadata.role === 'owner'
}
