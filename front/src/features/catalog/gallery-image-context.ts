import { createContext } from 'react'
import type { GalleryImageCache } from './gallery-image-cache'

export const GalleryImageContext = createContext<(() => GalleryImageCache) | null>(null)
