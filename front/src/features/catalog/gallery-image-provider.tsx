import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { GalleryImageCache } from './gallery-image-cache'
import { GalleryImageContext } from './gallery-image-context'

export function GalleryImageProvider({ children }: { children: ReactNode }) {
  const cache = useRef<GalleryImageCache | null>(null)
  const getCache = useCallback(() => {
    cache.current ??= new GalleryImageCache()
    return cache.current
  }, [])

  useEffect(() => () => {
    cache.current?.dispose()
    cache.current = null
  }, [])

  return <GalleryImageContext value={getCache}>{children}</GalleryImageContext>
}
