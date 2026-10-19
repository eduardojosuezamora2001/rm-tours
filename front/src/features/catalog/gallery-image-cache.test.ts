import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GalleryImageCache } from './gallery-image-cache'

beforeEach(() => {
  let serial = 0
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:photo-${++serial}`)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.stubGlobal('Image', class {
    src = ''
    naturalWidth = 1920
    naturalHeight = 1200
    decode = () => Promise.resolve()
  })
  vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['photo'], { type: 'image/webp' }))))
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('gallery image lifecycle', () => {
  it('retains each surface’s visible image when another surface navigates', async () => {
    const cache = new GalleryImageCache()
    const gallery = {}
    const modal = {}
    cache.retain(['/cover.jpg'], gallery)
    const cover = await cache.load('/cover.jpg')
    for (let index = 0; index < 10; index++) {
      cache.retain([`/photo-${index}.jpg`], modal)
      await cache.load(`/photo-${index}.jpg`)
    }
    expect(await cache.load('/cover.jpg')).toBe(cover)
    expect(fetch).toHaveBeenCalledTimes(11)
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(cover.src)
    cache.release(modal)
    cache.release(gallery)
    cache.dispose()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(cover.src)
  })
  it('shares in-flight downloads and decoded images, then releases them on close', async () => {
    const cache = new GalleryImageCache()
    const first = cache.load('/photo.jpg', 'high')
    const second = cache.load('/photo.jpg')
    expect(second).toBe(first)
    expect(await first).toEqual({ src: 'blob:photo-1', width: 1920, height: 1200 })
    expect(await cache.load('/photo.jpg')).toEqual(await first)
    expect(fetch).toHaveBeenCalledTimes(1)
    cache.dispose()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo-1')
    await expect(cache.load('/photo.jpg')).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('bounds retained images and downloads an evicted photo again when needed', async () => {
    const cache = new GalleryImageCache()
    for (let index = 0; index < 10; index++) {
      cache.retain([`/photo-${index}.jpg`])
      await cache.load(`/photo-${index}.jpg`)
    }
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(4)
    cache.retain(['/photo-0.jpg'])
    expect((await cache.load('/photo-0.jpg')).src).toBe('blob:photo-11')
    expect(fetch).toHaveBeenCalledTimes(11)
    cache.dispose()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(11)
  })

  it('also bounds compressed bytes for large photos', async () => {
    vi.spyOn(Blob.prototype, 'size', 'get').mockReturnValue(10 * 1024 * 1024)
    const cache = new GalleryImageCache()
    for (let index = 0; index < 5; index++) {
      cache.retain([`/large-${index}.jpg`])
      await cache.load(`/large-${index}.jpg`)
    }
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3)
    cache.dispose()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(5)
  })

  it('does not fetch when disposed before the download starts', async () => {
    const cache = new GalleryImageCache()
    const loading = cache.load('/cancelled.jpg')
    cache.dispose()
    await expect(loading).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetch).not.toHaveBeenCalled()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('aborts unfinished downloads when the viewer closes', async () => {
    vi.mocked(fetch).mockImplementation((_source, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('Closed', 'AbortError')))
    }))
    const cache = new GalleryImageCache()
    const loading = cache.load('/slow.jpg')
    await Promise.resolve()
    expect(fetch).toHaveBeenCalledTimes(1)
    cache.dispose()
    await expect(loading).rejects.toMatchObject({ name: 'AbortError' })
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('releases undecodable data and allows retrying the same photo', async () => {
    const decode = vi.fn().mockRejectedValueOnce(new Error('Corrupt image')).mockResolvedValue(undefined)
    vi.stubGlobal('Image', class {
      src = ''
      naturalWidth = 640
      naturalHeight = 400
      decode = decode
    })
    const cache = new GalleryImageCache()
    await expect(cache.load('/retry.jpg')).rejects.toThrow('Corrupt image')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo-1')
    expect((await cache.load('/retry.jpg')).src).toBe('blob:photo-2')
    expect(fetch).toHaveBeenCalledTimes(2)
    cache.dispose()
  })
})
