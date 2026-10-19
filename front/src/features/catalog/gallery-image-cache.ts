export type DecodedGalleryImage = { src: string; width: number; height: number }

type Entry = {
  controller: AbortController
  promise?: Promise<DecodedGalleryImage>
  src?: string
  bytes: number
}

/** A bounded, memory-only cache owned by one tour page, including private previews. */
export class GalleryImageCache {
  private entries = new Map<string, Entry>()
  private nearby = new Map<object, Set<string>>()
  private disposed = false

  retain(sources: string[], owner: object = this) {
    this.nearby.set(owner, new Set(sources))
    this.trim()
  }

  release(owner: object) {
    this.nearby.delete(owner)
    this.trim()
  }

  load(source: string, priority: RequestPriority = 'low'): Promise<DecodedGalleryImage> {
    if (this.disposed) return Promise.reject(new DOMException('Viewer closed', 'AbortError'))
    const cached = this.entries.get(source)
    if (cached?.promise) {
      this.entries.delete(source)
      this.entries.set(source, cached)
      return cached.promise
    }

    const entry: Entry = { controller: new AbortController(), bytes: 0 }
    const { signal } = entry.controller
    entry.promise = (async () => {
      // Let StrictMode's synchronous cleanup cancel the discarded mount before fetching.
      await Promise.resolve()
      signal.throwIfAborted()
      const response = await fetch(source, { signal, credentials: 'same-origin', priority })
      if (!response.ok) throw new Error('Image unavailable')
      const blob = await response.blob()
      signal.throwIfAborted()
      entry.src = URL.createObjectURL(blob)
      entry.bytes = blob.size
      const image = new Image()
      image.src = entry.src
      // Warming only the HTTP cache is ineffective for our no-store image responses.
      // Decode the retained blob before it is needed for the next paint.
      await image.decode()
      signal.throwIfAborted()
      this.trim()
      return { src: entry.src, width: image.naturalWidth, height: image.naturalHeight }
    })().catch((error: unknown) => {
      if (this.entries.get(source) === entry) this.remove(source, entry)
      throw error
    })
    this.entries.set(source, entry)
    this.trim()
    return entry.promise
  }

  dispose() {
    this.disposed = true
    for (const [source, entry] of this.entries) this.remove(source, entry)
    this.nearby.clear()
  }

  private remove(source: string, entry: Entry) {
    this.entries.delete(source)
    entry.controller.abort()
    if (entry.src) URL.revokeObjectURL(entry.src)
  }

  private trim() {
    const retained = new Set(Array.from(this.nearby.values()).flatMap((sources) => [...sources]))
    let bytes = Array.from(this.entries.values()).reduce((total, entry) => total + entry.bytes, 0)
    for (const [source, entry] of this.entries) {
      if (this.entries.size <= 6 && bytes <= 24 * 1024 * 1024) break
      if (retained.has(source)) continue
      bytes -= entry.bytes
      this.remove(source, entry)
    }
  }
}
