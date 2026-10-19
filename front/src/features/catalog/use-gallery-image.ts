import { useContext, useEffect, useState } from 'react'
import type { TourMedia } from '../../../../shared/contracts'
import type { DecodedGalleryImage } from './gallery-image-cache'
import { GalleryImageContext } from './gallery-image-context'

export function useGalleryImage(images: TourMedia[], index: number, deferPreload = false) {
  const getCache = useContext(GalleryImageContext)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{
    id: string
    source: string | undefined
    image: DecodedGalleryImage | null
  } | null>(null)
  const selected = images[index]
  const id = selected?.id
  const source = selected?.url
  const previous = images[(index - 1 + images.length) % images.length]?.url
  const next = images[(index + 1) % images.length]?.url

  useEffect(() => {
    if (!getCache || !id) return
    const session = getCache()
    const owner = {}
    let active = true
    // Each surface protects its visible photo while sharing the same bounded cache.
    session.retain(source ? [source] : [], owner)
    function preload() {
      if (!active) return
      for (const nearby of new Set([next, previous])) {
        if (nearby && nearby !== source) void session.load(nearby).catch(() => {})
      }
    }
    const loading = source ? session.load(source, 'high') : Promise.reject(new Error('Missing image'))
    void loading.then(
      (image) => {
        if (active) setResult({ id, source, image })
        if (deferPreload) preload()
      },
      () => { if (active) setResult({ id, source, image: null }) },
    )
    // The page's first image gets the connection to itself; the modal can warm both neighbors immediately.
    if (!deferPreload) preload()
    return () => {
      active = false
      session.release(owner)
    }
  }, [getCache, id, source, next, previous, attempt, deferPreload])

  const pending = !!id && (result?.id !== id || result?.source !== source)
  return {
    loaded: result?.image,
    displayed: images.find((image) => image.id === result?.id),
    pending,
    failed: !pending && result?.image === null,
    retry: () => { setResult(null); setAttempt((value) => value + 1) },
  }
}
