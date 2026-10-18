import { describe, expect, it } from 'vitest'
import app from '../src/index'
const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test',
  ALLOWED_ORIGINS: 'https://rmtours.example',
}
describe('API boundaries', () => {
  it('reports configuration errors without exposing credentials', async () => {
    const response = await app.request('/api/v1/tours', {}, {})
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: { code: 'NOT_CONFIGURED' } })
  })
  it('rejects administrative access before database queries', async () => {
    const response = await app.request('/api/v1/admin/tours', {}, env)
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
  it('allows CORS only for the configured frontend', async () => {
    const allowed = await app.request(
      '/api/v1/tours',
      {
        method: 'OPTIONS',
        headers: { Origin: 'https://rmtours.example', 'Access-Control-Request-Method': 'GET' },
      },
      env,
    )
    const blocked = await app.request(
      '/api/v1/tours',
      { method: 'OPTIONS', headers: { Origin: 'https://untrusted.example' } },
      env,
    )
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://rmtours.example')
    expect(blocked.headers.get('access-control-allow-origin')).toBeNull()
  })
})
