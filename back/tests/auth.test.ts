import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../src/index'

const origin = 'https://tours.example'
const env = {
  SUPABASE_URL: 'https://backend.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
  ALLOWED_ORIGINS: origin,
}
const owner = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  app_metadata: { role: 'owner' },
  user_metadata: {},
  aud: 'authenticated',
  email: 'owner@example.com',
}
const encode = (value: object | string) =>
  Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url')
const token = (expired = false) =>
  `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: owner.id, exp: Math.floor(Date.now() / 1000) + (expired ? -60 : 3600) })}.${encode('synthetic-signature')}`
const session = () => ({
  access_token: token(),
  refresh_token: 'rotated-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: owner,
})
const headers = { Origin: origin, 'X-RM-Request': '1', 'Content-Type': 'application/json' }
const cookies = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ')
const call = (path: string, init: RequestInit = {}) =>
  app.request(`${origin}/api/v1${path}`, init, env)
let user: typeof owner
let loginFails: boolean
let storageAllowed: boolean
let upstream: ReturnType<typeof vi.fn>

beforeEach(() => {
  user = structuredClone(owner)
  loginFails = false
  storageAllowed = true
  upstream = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    )
    if (url.pathname === '/auth/v1/token') {
      if (loginFails)
        return Response.json(
          { msg: 'Invalid credentials', error_code: 'invalid_credentials' },
          { status: 400 },
        )
      return Response.json({ ...session(), user })
    }
    if (url.pathname === '/auth/v1/user') {
      const authorization = new Headers(init?.headers).get('Authorization')
      if (authorization === `Bearer ${token(true)}`)
        return Response.json({ msg: 'expired', error_code: 'bad_jwt' }, { status: 401 })
      return Response.json(user)
    }
    if (url.pathname === '/auth/v1/recover') return Response.json({})
    if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 })
    if (url.pathname.includes('/storage/v1/object/sign/')) {
      if (!url.searchParams.has('token') && url.pathname.endsWith('.main.webp'))
        return Response.json({ message: 'Object not found' }, { status: 400 })
      if (url.searchParams.has('token'))
        return new Response(new Uint8Array([137, 80, 78, 71]), {
          headers: { 'Content-Type': 'image/png' },
        })
      return storageAllowed
        ? Response.json({ signedURL: `/object/sign/tour-media/test.png?token=server-only` })
        : Response.json({ message: 'Object not found' }, { status: 400 })
    }
    throw new Error(`Unexpected mocked request: ${url.pathname}`)
  })
  vi.stubGlobal('fetch', upstream)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('backend-owned authentication', () => {
  it('returns only identity and sets secure HttpOnly cookies; cookies authorize RLS requests', async () => {
    const response = await call('/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: owner.email, password: 'synthetic-password' }),
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: owner.id })
    const setCookies = response.headers.getSetCookie()
    expect(setCookies.filter((cookie) => cookie.includes('_session_'))).toHaveLength(2)
    for (const cookie of setCookies) {
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('Secure')
      expect(cookie).toContain('SameSite=Lax')
      expect(cookie).toContain('Path=/')
    }
    const check = await call('/admin/session', { headers: { Cookie: cookies(response) } })
    expect(check.status).toBe(200)
    expect(await check.json()).toEqual({ id: owner.id })
    expect(check.headers.get('cache-control')).toBe('no-store')
  })
  it('rejects invalid credentials and user_metadata owner impersonation', async () => {
    loginFails = true
    const bad = await call('/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: owner.email, password: 'incorrect' }),
    })
    expect(bad.status).toBe(401)
    loginFails = false
    user.app_metadata = { role: 'customer' }
    user.user_metadata = { role: 'owner' }
    const forbidden = await call('/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: owner.email, password: 'synthetic-password' }),
    })
    expect(forbidden.status).toBe(403)
    expect(forbidden.headers.getSetCookie().every((cookie) => cookie.includes('Max-Age=0'))).toBe(
      true,
    )
  })
  it('rejects cross-origin and unmarked mutations before contacting Supabase', async () => {
    const invalidHeaders: HeadersInit[] = [
      { ...headers, Origin: 'https://evil.example' },
      { Origin: origin },
      {},
    ]
    for (const invalid of invalidHeaders) {
      expect(
        (await call('/auth/login', { method: 'POST', headers: invalid, body: '{}' })).status,
      ).toBe(403)
    }
    expect(upstream).not.toHaveBeenCalled()
    expect(
      (await call('/admin/session', { headers: { Authorization: `Bearer ${token()}` } })).status,
    ).toBe(401)
  })
  it('renews expired/missing access cookies on the server and rotates refresh cookies', async () => {
    for (const access of ['', `__Host-rm_tours_session_access=${token(true)}; `]) {
      const response = await call('/admin/session', {
        headers: { Cookie: `${access}__Host-rm_tours_session_refresh=old-refresh` },
      })
      expect(response.status).toBe(200)
      expect(cookies(response)).toContain('rotated-refresh')
      expect(
        upstream.mock.calls.some(
          ([url, init]) =>
            String(url).includes('grant_type=refresh_token') &&
            String(init?.body).includes('old-refresh'),
        ),
      ).toBe(true)
    }
  })
  it('clears access and refresh cookies on logout', async () => {
    const response = await call('/auth/logout', {
      method: 'POST',
      headers: {
        ...headers,
        Cookie: `__Host-rm_tours_session_access=${token()}; __Host-rm_tours_session_refresh=refresh`,
      },
    })
    expect(response.status).toBe(204)
    expect(response.headers.getSetCookie()).toHaveLength(5)
    expect(response.headers.getSetCookie().every((cookie) => cookie.includes('Max-Age=0'))).toBe(
      true,
    )
    expect(upstream.mock.calls.some(([url]) => String(url).includes('/logout'))).toBe(true)
  })
  it('keeps the PKCE verifier in an HttpOnly cookie and isolates password recovery from admin access', async () => {
    const recovery = await call('/auth/recover', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: owner.email }),
    })
    expect(recovery.status).toBe(202)
    const verifierCookie = recovery.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith('__Host-rm_tours_verifier='))!
    expect(verifierCookie).toContain('HttpOnly')
    expect(verifierCookie).toContain('Max-Age=600')
    const emailRequest = upstream.mock.calls.find(([url]) => String(url).includes('/recover'))!
    expect(JSON.parse(String(emailRequest[1]?.body)).code_challenge).toBeTruthy()
    const callback = await call('/auth/callback?code=one-time-code', {
      headers: { Cookie: verifierCookie.split(';')[0] },
    })
    expect(callback.status).toBe(303)
    expect(callback.headers.get('location')).toBe('/admin-tours/reset-password')
    const exchange = upstream.mock.calls.find(([url]) => String(url).includes('grant_type=pkce'))!
    const exchangeBody = JSON.parse(String(exchange[1]?.body))
    expect(exchangeBody.auth_code).toBe('one-time-code')
    expect(exchangeBody.code_verifier).toBeTruthy()
    expect(cookies(callback)).toContain('_recovery_access=')
    expect(cookies(callback)).not.toContain('_session_access=')
    const denied = await call('/admin/session', { headers: { Cookie: cookies(callback) } })
    expect(denied.status).toBe(401)
    const reset = await call('/auth/reset-password', {
      method: 'POST',
      headers: { ...headers, Cookie: cookies(callback) },
      body: JSON.stringify({ password: 'new-synthetic-password' }),
    })
    expect(reset.status).toBe(204)
    expect(
      upstream.mock.calls.some(
        ([url, init]) => String(url).includes('/user') && init?.method === 'PUT',
      ),
    ).toBe(true)
  })
  it('requires a recovery session to change passwords', async () => {
    const reset = await call('/auth/reset-password', {
      method: 'POST',
      headers: {
        ...headers,
        Cookie: `__Host-rm_tours_session_access=${token()}; __Host-rm_tours_session_refresh=refresh`,
      },
      body: JSON.stringify({ password: 'new-synthetic-password' }),
    })
    expect(reset.status).toBe(401)
    expect(upstream).not.toHaveBeenCalled()
  })
  it('rejects recovery callbacks without the browser-bound PKCE verifier', async () => {
    const response = await call('/auth/callback?code=unbound-code')
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('/admin-tours/recover?error=invalid_link')
    expect(upstream).not.toHaveBeenCalled()
  })
})

describe('backend media streaming', () => {
  const path = `${owner.id}/${owner.id}.png`
  it('streams authorized images without exposing a Storage URL', async () => {
    const response = await call(`/media/${path}`)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]))
    expect(upstream.mock.calls.at(-1)?.[1]?.redirect).toBe('manual')
  })
  it('rejects upstream redirects without exposing signed URLs or following another host', async () => {
    upstream.mockImplementationOnce(async () =>
      Response.json({ signedURL: '/object/sign/tour-media/test.png?token=server-only' }),
    )
    upstream.mockImplementationOnce(
      async () =>
        new Response(null, {
          status: 302,
          headers: { Location: 'https://untrusted.example/image.png' },
        }),
    )
    const response = await call(`/media/${path}`)
    expect(response.status).toBe(404)
    expect(response.headers.get('location')).toBeNull()
    expect(upstream).toHaveBeenCalledTimes(2)
    expect(upstream.mock.calls.at(-1)?.[1]?.redirect).toBe('manual')
  })
  it('respects Storage RLS for private objects and rejects admin images without session', async () => {
    storageAllowed = false
    expect((await call(`/media/${path}`)).status).toBe(404)
    expect((await call(`/admin/media/${path}`)).status).toBe(401)
    expect((await call('/media/invalid/path.png')).status).toBe(404)
  })
})
