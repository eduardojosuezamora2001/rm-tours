import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, ChevronLeft, ChevronRight, Sailboat } from 'lucide-react'
import type { Language, TourMedia } from '../../../../shared/contracts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useGalleryImage } from './use-gallery-image'
import './tour-gallery.css'

export function TourGallery({ images, title, lang, onOpen }: {
  images: TourMedia[]
  title: string
  lang: Language
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation('tour')
  const { t: catalog } = useTranslation('catalog')
  const { t: common } = useTranslation()
  const [selected, setSelected] = useState<string | null>(null)
  const index = Math.max(0, images.findIndex((image) => image.id === selected))
  const image = images[index]
  const { loaded, displayed, pending, failed, retry } = useGalleryImage(images, index, true)
  if (!image) return <Empty><EmptyHeader><EmptyTitle>{t('galleryEmpty')}</EmptyTitle></EmptyHeader></Empty>

  function move(direction: number) {
    setSelected((current) => {
      const position = Math.max(0, images.findIndex((photo) => photo.id === current))
      return images[(position + direction + images.length) % images.length].id
    })
  }

  return (
    <figure className="tour-gallery" aria-label={t('gallery')}>
      <div className="tour-gallery-stage" aria-busy={pending}>
        {failed ? <Alert className="absolute inset-x-4 top-4 w-auto">
          <AlertTitle>{t('imageFailed')}</AlertTitle>
          <Button variant="outline" onClick={retry}>{common('retry')}</Button>
        </Alert> : <Button
          type="button" variant="media" size="media" className="tour-gallery-main"
          onClick={() => onOpen(image.id)} aria-label={t('image', { count: index + 1 })}
        >
          {loaded ? <img src={loaded.src} alt={displayed?.alt[lang] ?? ''} width={loaded.width} height={loaded.height} />
            : <Skeleton className="size-full" />}
        </Button>}
        {pending && <Spinner className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-label={common('loading')} />}
        <div className="tour-gallery-overlays">
          <Badge variant="photo-counter" className="tour-gallery-count" aria-live="polite" aria-atomic="true">
            <Camera aria-hidden="true" />{index + 1} / {images.length}
          </Badge>
          <Badge variant="photo-label" className="tour-gallery-label">
            <Sailboat aria-hidden="true" /><span>{title}</span>
          </Badge>
        </div>
        {images.length > 1 && <div className="tour-gallery-arrows">
          <Button type="button" variant="photo-overlay" size="icon" aria-label={catalog('previous')} onClick={() => move(-1)}><ChevronLeft /></Button>
          <Button type="button" variant="photo-overlay" size="icon" aria-label={catalog('next')} onClick={() => move(1)}><ChevronRight /></Button>
        </div>}
      </div>
      {images.length > 1 && <ToggleGroup
        type="single" variant="media" size="media" className="tour-gallery-thumbnails"
        value={image.id} onValueChange={(id) => { if (id) setSelected(id) }} aria-label={t('choosePhoto')}
      >
        {images.map((photo, photoIndex) => <ToggleGroupItem
          key={photo.id} value={photo.id} className="tour-gallery-thumbnail"
          aria-label={t('selectPhoto', { count: photoIndex + 1 })}
        >
          <img src={photo.thumbnail_url ?? photo.url} alt="" width="240" height="160" loading="lazy" />
        </ToggleGroupItem>)}
      </ToggleGroup>}
      {image.alt[lang] && <figcaption className="tour-gallery-description">{image.alt[lang]}</figcaption>}
    </figure>
  )
}
