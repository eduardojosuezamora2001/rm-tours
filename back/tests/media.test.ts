import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import type { AppEnv } from '../src/env'
import { mediaPaths, thumbnailPath, mainWebpPath } from '../src/media-url'
import { worthwhileImageSavings } from '../../shared/image-optimization'

const { sign } = vi.hoisted(() => ({ sign: vi.fn() }))
vi.mock('../src/db', () => ({ database: () => ({ storage: { from: () => ({ createSignedUrl: sign }) } }) }))
import { mediaRoutes } from '../src/routes/media'

const path = '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg'
const app = new Hono<AppEnv>().route('/api/v1', mediaRoutes)
beforeEach(() => {
  vi.restoreAllMocks()
  sign.mockReset()
})

describe('image variants', () => {
  it('streams the stored thumbnail with its WebP MIME and private cache policy', async () => {
    sign.mockResolvedValue({ data: { signedUrl: 'https://storage.example/thumbnail' }, error: null })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('webp'))
    const result = await app.request(`/api/v1/media/${path}?variant=card`)
    expect(sign).toHaveBeenCalledWith(thumbnailPath(path), 60)
    expect(result.status).toBe(200)
    expect(result.headers.get('content-type')).toBe('image/webp')
    expect(result.headers.get('cache-control')).toBe('private, no-store')
  })
  it('falls back to the authorized original for an older upload', async () => {
    sign.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
      .mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
      .mockResolvedValueOnce({ data: { signedUrl: 'https://storage.example/original' }, error: null })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('jpeg'))
    const result = await app.request(`/api/v1/media/${path}?variant=card`)
    expect(result.status).toBe(200)
    expect(result.headers.get('content-type')).toBe('image/jpeg')
    expect(sign).toHaveBeenLastCalledWith(path, 60)
  })
  it('serves a converted WebP for the unchanged catalogue URL and reports the actual MIME', async () => {
    sign.mockResolvedValue({ data: { signedUrl: 'https://storage.example/main-webp' }, error: null })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('webp'))
    const result = await app.request(`/api/v1/media/${path}`)
    expect(result.status).toBe(200)
    expect(result.headers.get('content-type')).toBe('image/webp')
    expect(sign).toHaveBeenCalledExactlyOnceWith(mainWebpPath(path), 60)
  })
  it('falls back from a missing thumbnail to the optimized main image', async () => {
    sign.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
      .mockResolvedValueOnce({ data: { signedUrl: 'https://storage.example/main-webp' }, error: null })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('webp'))
    const result = await app.request(`/api/v1/media/${path}?variant=card`)
    expect(result.headers.get('content-type')).toBe('image/webp')
    expect(sign).toHaveBeenLastCalledWith(mainWebpPath(path), 60)
  })
  it('rejects the source-only administrative variant on public routes', async () => {
    expect((await app.request(`/api/v1/media/${path}?variant=source`)).status).toBe(404)
    expect(sign).not.toHaveBeenCalled()
  })
  it('does not fetch inaccessible originals or thumbnails', async () => {
    sign.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const fetch = vi.spyOn(globalThis, 'fetch')
    const result = await app.request(`/api/v1/media/${path}?variant=card`)
    expect(result.status).toBe(404)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('rejects unknown variants without storage access', async () => {
    expect((await app.request(`/api/v1/media/${path}?variant=arbitrary`)).status).toBe(404)
    expect(sign).not.toHaveBeenCalled()
  })
  it('includes all sizes in removal without changing the original path', () => {
    expect(mediaPaths([path])).toEqual([path, `${path}.card.webp`, `${path}.main.webp`])
  })
  it('requires both a percentage and absolute saving', () => {
    expect(worthwhileImageSavings(30000, 27000)).toBe(true)
    expect(worthwhileImageSavings(20000, 18000)).toBe(false)
    expect(worthwhileImageSavings(30000, 29000)).toBe(false)
    expect(worthwhileImageSavings(30000, 40000)).toBe(false)
  })
})
