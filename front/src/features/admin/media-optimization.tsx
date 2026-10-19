import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageDown } from 'lucide-react'
import { request } from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { createThumbnail, optimizeImage } from './image'
import { worthwhileImageSavings } from '../../../../shared/image-optimization'

export function MediaOptimization() {
  const { t } = useTranslation('admin', { lng: 'es' })
  const [attempt, setAttempt] = useState(0)
  const [progress, setProgress] = useState({ total: 0, done: 0, failed: 0, converted: 0, savedBytes: 0, running: false })

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    async function run() {
      try {
        const missing = await request<{ path: string; url: string; needs_main: boolean; needs_thumbnail: boolean }[]>(
          '/admin/media-optimization', { signal }, true,
        )
        if (signal.aborted || !missing.length) return
        let done = 0
        let failed = 0
        let converted = 0
        let savedBytes = 0
        setProgress({ total: missing.length, done, failed, converted, savedBytes, running: true })
        // One decoded image at a time keeps the admin usable on mobile.
        for (const media of missing) {
          if (signal.aborted) return
          try {
            const response = await fetch(media.url, { signal, credentials: 'same-origin' })
            if (!response.ok) throw new Error('INVALID_UPLOAD')
            const original = await response.blob()
            let main: Blob = original
            let thumbnail: File | null = null
            if (media.needs_main) {
              const optimized = await optimizeImage(new File([original], 'original', { type: original.type }))
              if (optimized.main.type === 'image/webp' && worthwhileImageSavings(original.size, optimized.main.size)) {
                if (signal.aborted) return
                const body = new FormData()
                body.set('path', media.path)
                body.set('file', optimized.main)
                const result = await request<{ converted: boolean; saved_bytes: number }>(
                  '/admin/media-webp', { method: 'POST', body, signal }, true,
                )
                main = optimized.main
                if (result.converted) {
                  converted++
                  savedBytes += result.saved_bytes
                }
              }
              thumbnail = optimized.thumbnail
            }
            if (signal.aborted) return
            if (media.needs_thumbnail) {
              thumbnail ??= await createThumbnail(main)
              if (signal.aborted) return
              if (worthwhileImageSavings(main.size, thumbnail.size)) {
                const body = new FormData()
                body.set('path', media.path)
                body.set('file', thumbnail)
                await request('/admin/media-thumbnails', { method: 'POST', body, signal }, true)
              }
            }
          } catch {
            if (signal.aborted) return
            failed++
          }
          done++
          setProgress({ total: missing.length, done, failed, converted, savedBytes, running: true })
        }
        setProgress({ total: missing.length, done, failed, converted, savedBytes, running: false })
      } catch {
        if (!signal.aborted) setProgress({ total: 0, done: 0, failed: 1, converted: 0, savedBytes: 0, running: false })
      }
    }
    void run()
    return () => controller.abort()
  }, [attempt])

  if (!progress.total && !progress.failed) return null
  return (
    <Alert>
      <ImageDown />
      <AlertTitle>{t('thumbnailTitle')}</AlertTitle>
      <AlertDescription aria-live="polite">
        <p>{progress.running
          ? t('thumbnailProgress', { done: progress.done, total: progress.total })
          : progress.failed ? t('thumbnailFailed') : t('thumbnailComplete', { count: progress.done })}</p>
        <p>{t('thumbnailOriginals')}</p>
        {progress.converted > 0 && <p>{t('webpSavings', {
          count: progress.converted,
          kilobytes: Math.round(progress.savedBytes / 1024),
        })}</p>}
        {!progress.running && progress.failed > 0 && (
          <Button variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)}>
            {t('thumbnailRetry')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
