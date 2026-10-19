import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import type { AppEnv } from '../src/env'
import type { database } from '../src/db'
import { adminMediaRoutes } from '../src/routes/admin/media'

const tourId = '11111111-1111-4111-8111-111111111111'
const path = `${tourId}/22222222-2222-4222-8222-222222222222.jpg`
const upload = vi.fn()
const remove = vi.fn()
const list = vi.fn()
const download = vi.fn()
const sign = vi.fn()
const maybeSingle = vi.fn()
const select = vi.fn()
const bucket = { upload, remove, list, download, createSignedUrl: sign }
const db = {
  storage: { from: () => bucket },
  from: () => ({ select }),
} as unknown as ReturnType<typeof database>
const app = new Hono<AppEnv>()
app.use('*', async (c, next) => { c.set('db', db); await next() })
app.route('/api/v1/admin', adminMediaRoutes)

function thumbnail() {
  return new File(['RIFF0000WEBP0000'], 'thumbnail.webp', { type: 'image/webp' })
}
function uploadBody() {
  const body = new FormData()
  body.set('tourId', tourId)
  body.set('file', new File([new Uint8Array([255, 216, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0])], 'photo.jpg', { type: 'image/jpeg' }))
  body.set('thumbnail', thumbnail())
  return body
}
beforeEach(() => {
  vi.resetAllMocks()
  upload.mockResolvedValue({ error: null })
  remove.mockResolvedValue({ error: null })
  maybeSingle.mockResolvedValue({ data: { id: 'image-id' }, error: null })
  select.mockReturnValue({ eq: () => ({ maybeSingle }) })
  download.mockResolvedValue({ data: new Blob([new Uint8Array(5000)], { type: 'image/jpeg' }), error: null })
})

describe('admin image uploads', () => {
  it('stores a main image and thumbnail as one catalogue photo', async () => {
    const response = await app.request('/api/v1/admin/uploads', { method: 'POST', body: uploadBody() })
    expect(response.status).toBe(201)
    const media = await response.json() as { path: string; url: string; thumbnail_url: string }
    expect(media.path).toMatch(new RegExp(`^${tourId}/[0-9a-f-]+\\.jpg$`))
    expect(media.thumbnail_url).toBe(`${media.url}?variant=card`)
    expect(upload.mock.calls.map((call) => call[0])).toEqual([media.path, `${media.path}.card.webp`])
    expect(upload.mock.calls[1][2]).toEqual({ contentType: 'image/webp', upsert: false })
  })
  it('validates both files before writing anything', async () => {
    const body = uploadBody()
    body.set('thumbnail', new File(['not a valid image'], 'fake.webp', { type: 'image/webp' }))
    const response = await app.request('/api/v1/admin/uploads', { method: 'POST', body })
    expect(response.status).toBe(400)
    expect(upload).not.toHaveBeenCalled()
  })
  it('removes the unattached main image when its thumbnail upload fails', async () => {
    upload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: new Error('storage unavailable') })
    const response = await app.request('/api/v1/admin/uploads', { method: 'POST', body: uploadBody() })
    expect(response.status).toBe(500)
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0][0]])
  })
  it('backfills only the derivative without replacing the original', async () => {
    const body = new FormData()
    body.set('path', path)
    body.set('file', thumbnail())
    const response = await app.request('/api/v1/admin/media-thumbnails', { method: 'POST', body })
    expect(response.status).toBe(201)
    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload.mock.calls[0][0]).toBe(`${path}.card.webp`)
    expect(upload.mock.calls[0][2].upsert).toBe(false)
    expect(remove).not.toHaveBeenCalled()
  })
  it('refuses to create variants for unattached files', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    const body = new FormData()
    body.set('path', path)
    body.set('file', thumbnail())
    const response = await app.request('/api/v1/admin/media-thumbnails', { method: 'POST', body })
    expect(response.status).toBe(404)
    expect(upload).not.toHaveBeenCalled()
  })
  it('skips completed files when resuming the batch', async () => {
    const second = `${tourId}/33333333-3333-4333-8333-333333333333.webp`
    select.mockResolvedValue({ data: [{ path, tour_id: tourId }, { path: second, tour_id: tourId }], error: null })
    list.mockResolvedValue({ data: [{ name: path.split('/')[1] }, { name: `${path.split('/')[1]}.card.webp` }, { name: second.split('/')[1] }], error: null })
    const response = await app.request('/api/v1/admin/media-thumbnails')
    expect(await response.json()).toEqual([{ path: second, url: `/api/v1/admin/media/${second}` }])
  })
  it('finds JPEG masters that still need conversion even if their thumbnail already exists', async () => {
    const second = `${tourId}/33333333-3333-4333-8333-333333333333.png`
    select.mockResolvedValue({ data: [{ path, tour_id: tourId }, { path: second, tour_id: tourId }], error: null })
    list.mockResolvedValue({ data: [path, `${path}.card.webp`, second, `${second}.main.webp`, `${second}.card.webp`].map((name) => ({ name: name.split('/')[1] })), error: null })
    const response = await app.request('/api/v1/admin/media-optimization')
    expect(await response.json()).toEqual([{ path, url: `/api/v1/admin/media/${path}?variant=source`, needs_main: true, needs_thumbnail: false }])
  })
  it('stores a smaller main WebP and keeps its source and catalogue record untouched', async () => {
    const body = new FormData()
    const file = thumbnail()
    body.set('path', path)
    body.set('file', file)
    const response = await app.request('/api/v1/admin/media-webp', { method: 'POST', body })
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ converted: true, saved_bytes: 5000 - file.size })
    expect(download).toHaveBeenCalledExactlyOnceWith(path)
    expect(upload.mock.calls.map((call) => call[0])).toEqual([`${path}.main.webp`])
    expect(upload.mock.calls[0][2]).toEqual({ contentType: 'image/webp', upsert: false })
    expect(remove).not.toHaveBeenCalled()
  })
  it('uses actual stored sizes to reject a conversion without meaningful savings', async () => {
    download.mockResolvedValue({ data: new Blob([new Uint8Array(2000)]), error: null })
    const body = new FormData()
    body.set('path', path)
    body.set('file', thumbnail())
    body.set('original_size', '1000000')
    const response = await app.request('/api/v1/admin/media-webp', { method: 'POST', body })
    expect(await response.json()).toEqual({ converted: false, saved_bytes: 0 })
    expect(upload).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })
  it('does not re-encode an existing WebP main image', async () => {
    const body = new FormData()
    body.set('path', path.replace('.jpg', '.webp'))
    body.set('file', thumbnail())
    expect((await app.request('/api/v1/admin/media-webp', { method: 'POST', body })).status).toBe(400)
    expect(upload).not.toHaveBeenCalled()
    expect(download).not.toHaveBeenCalled()
  })
  it('does not overwrite a WebP created concurrently by another tab', async () => {
    upload.mockResolvedValue({ error: { statusCode: '409' } })
    const body = new FormData()
    body.set('path', path)
    body.set('file', thumbnail())
    const response = await app.request('/api/v1/admin/media-webp', { method: 'POST', body })
    expect(await response.json()).toEqual({ converted: false, saved_bytes: 0 })
    expect(remove).not.toHaveBeenCalled()
  })
  it('provides the original source only through the authenticated source variant', async () => {
    sign.mockResolvedValue({ data: { signedUrl: 'https://storage.example/source' }, error: null })
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('jpeg'))
    try {
      const response = await app.request(`/api/v1/admin/media/${path}?variant=source`)
      expect(response.headers.get('content-type')).toBe('image/jpeg')
      expect(sign).toHaveBeenCalledExactlyOnceWith(path, 60)
    } finally {
      fetch.mockRestore()
    }
  })
})
