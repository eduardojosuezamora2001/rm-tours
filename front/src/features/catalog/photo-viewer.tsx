import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Language, TourMedia } from '../../../../shared/contracts'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useGalleryImage } from './use-gallery-image'
import './photo-viewer.css'

export function PhotoViewer({ images, initialPhoto, lang }: {
  images: TourMedia[]
  initialPhoto: string
  lang: Language
}) {
  const { t } = useTranslation('tour')
  const { t: catalog } = useTranslation('catalog')
  const { t: common } = useTranslation()
  const [position, setPosition] = useState(() => Math.max(0, images.findIndex((m) => m.id === initialPhoto)))
  const index = Math.min(position, images.length - 1)
  const { loaded, displayed, pending, failed, retry } = useGalleryImage(images, index)
  function move(direction: number) {
    setPosition((current) => (current + direction + images.length) % images.length)
  }

  return (
    <DialogContent
      className="photo-dialog"
      closeLabel={common('close')}
      aria-describedby={undefined}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          move(event.key === 'ArrowLeft' ? -1 : 1)
        }
      }}
    >
      <DialogHeader><DialogTitle>{t('gallery')}</DialogTitle></DialogHeader>
      <div className="photo-viewer-stage" aria-busy={pending}>
        {failed ? (
          <Alert>
            <AlertTitle>{t('imageFailed')}</AlertTitle>
            <Button variant="outline" onClick={retry}>
              {common('retry')}
            </Button>
          </Alert>
        ) : loaded ? (
          <img
            src={loaded.src}
            alt={displayed?.alt[lang] ?? ''}
            width={loaded.width}
            height={loaded.height}
          />
        ) : <Skeleton className="absolute inset-0" />}
        {pending && <Spinner className="absolute" aria-label={common('loading')} />}
      </div>
      {images.length > 1 && (
        <div className="stitch-photo-navigation">
          <Button variant="soft" size="icon" aria-label={catalog('previous')} onClick={() => move(-1)}>
            <ChevronLeft />
          </Button>
          <span aria-live="polite">{index + 1} / {images.length}</span>
          <Button variant="soft" size="icon" aria-label={catalog('next')} onClick={() => move(1)}>
            <ChevronRight />
          </Button>
        </div>
      )}
    </DialogContent>
  )
}
