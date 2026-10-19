import { lazy, Suspense, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useLang, useTour } from './queries'
import { tourMedia } from './media'
import { lowestPrice, type Tour } from '../../../../shared/contracts'
import { money } from '@/i18n/format'
import { Metadata } from '@/components/metadata'
import { ErrorState, Loading } from '@/components/feedback'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StitchIcon } from '@/components/stitch-icon'
import { TourGallery } from './tour-gallery'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
const QuoteForm = lazy(() => import('../quote/quote-page'))
export function TourContent({ tour, preview = false }: { tour: Tour; preview?: boolean }) {
  const { t } = useTranslation('tour')
  const { t: design } = useTranslation('catalog')
  const { t: common } = useTranslation()
  const lang = useLang()
  const [photo, setPhoto] = useState<string | null>(null)
  const [, setPlan] = useQueryState('plan', parseAsString.withDefault(''))
  const { gallery } = tourMedia(tour)
  const sections = tour.sections.filter((section) => section.visible || preview)
  const viewerImages = [
    ...gallery,
    ...tour.media.filter(
      (media) => media.section_id && sections.some((section) => section.id === media.section_id),
    ),
  ]
  const photoIndex = viewerImages.findIndex((media) => media.id === photo)
  const movePhoto = (direction: number) => {
    if (viewerImages.length)
      setPhoto(
        viewerImages[
          (Math.max(0, photoIndex) + direction + viewerImages.length) % viewerImages.length
        ].id,
      )
  }
  const destination = common(`destinations.${tour.destination}`)
  const suffix = `${lang === 'es' ? ' en ' : ' in '}${destination}`
  const mobileTitle = tour.name[lang].endsWith(suffix)
    ? tour.name[lang].slice(0, -suffix.length)
    : tour.name[lang]
  const price = lowestPrice(tour)
  return (
    <div className="stitch-detail">
      <Metadata title={tour.name[lang]} description={tour.summary[lang]} />
      {preview && (
        <div className="stitch-container">
          <Alert>
            <AlertTitle>{t('preview')}</AlertTitle>
          </Alert>
        </div>
      )}
      <Breadcrumb className="stitch-breadcrumb stitch-container" aria-label={common('back')}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={preview ? '/admin-tours' : `/${lang}`}>{common('home')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={preview ? '/admin-tours' : `/${lang}/tours`}>{common('tours')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tour.name[lang]}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <section className="stitch-container stitch-detail-top">
        <div className="stitch-detail-title">
          <div>
            <Badge variant="secondary">
              <StitchIcon name="explore" />
              {common(`categories.${tour.category}`)}
            </Badge>
            <span className="stitch-detail-location">
              <StitchIcon name="location_on" />
              {common(`destinations.${tour.destination}`)}
            </span>
            <h1>
              <span className="stitch-desktop-text">{tour.name[lang]}</span>
              <span className="stitch-mobile-text">{mobileTitle}</span>
            </h1>
            <p className="stitch-detail-teaser">{tour.summary[lang]}</p>
          </div>
          <Button
            variant="soft"
            onClick={() =>
              void navigator.clipboard
                .writeText(window.location.href)
                .then(() => toast.success(design('design.copied')))
                .catch(() => toast.error(design('design.copyError')))
            }
          >
            <StitchIcon name="share" />
            {design('design.share')}
          </Button>
        </div>
        <TourGallery key={tour.id} images={gallery} title={tour.name[lang]} lang={lang} onOpen={setPhoto} />
      </section>
      <div className="stitch-detail-body">
        <div className="stitch-container stitch-detail-columns">
          <div className="stitch-detail-copy">
            <div className="stitch-detail-facts">
              <div>
                <StitchIcon name="schedule" />
                <small>{t('duration')}</small>
                <strong>{common('hours', { count: tour.duration_minutes / 60 })}</strong>
              </div>
              {tour.schedules.length > 0 && (
                <div>
                  <StitchIcon name="routine" />
                  <small>{t('schedules')}</small>
                  <strong>{tour.schedules.join(' · ')}</strong>
                </div>
              )}
              <div>
                <StitchIcon name="pin_drop" />
                <small>{t('meeting')}</small>
                <strong>{tour.meeting_point[lang]}</strong>
              </div>
              <div>
                <StitchIcon name="sailing" />
                <small>{t('plans')}</small>
                <strong>
                  {tour.plans
                    .filter((p) => p.active || preview)
                    .map((p) => p.name[lang])
                    .join(' · ')}
                </strong>
              </div>
            </div>
            {!sections.some((section) => section.type === 'description') && (
              <section>
                <h2>{t('about')}</h2>
                <p>{tour.summary[lang]}</p>
              </section>
            )}
            {sections.map((section) => (
              <section
                className={`stitch-content-section stitch-content-${section.type}`}
                key={section.id}
              >
                {section.type === 'notice' ? (
                  <Alert>
                    <StitchIcon name="info" />
                    <AlertTitle>{section.title[lang]}</AlertTitle>
                    <p className="whitespace-pre-line">{section.body[lang]}</p>
                  </Alert>
                ) : (
                  <>
                    <h2>{section.title[lang]}</h2>
                    {section.body[lang] && (
                      <p className="whitespace-pre-line">{section.body[lang]}</p>
                    )}
                  </>
                )}
                {section.items[lang].length > 0 && (
                  <ul className="stitch-included-list">
                    {section.items[lang].map((text, index) => (
                      <li key={index}>
                        <StitchIcon name={section.type === 'rules' ? 'info' : 'check_circle'} />
                        {text}
                      </li>
                    ))}
                  </ul>
                )}
                {section.type === 'gallery' && (
                  <div className="section-gallery">
                    {tour.media
                      .filter((m) => m.section_id === section.id)
                      .map((media) => (
                        <Button
                          type="button"
                          variant="media"
                          size="media"
                          key={media.id}
                          onClick={() => setPhoto(media.id)}
                          aria-label={media.alt[lang]}
                        >
                          <img
                            src={media.url}
                            alt={media.alt[lang]}
                            width="640"
                            height="440"
                            loading="lazy"
                          />
                        </Button>
                      ))}
                  </div>
                )}
              </section>
            ))}
            <section>
              <h2>{t('plans')}</h2>
              <p>{t('plansBody')}</p>
              <div className="stitch-detail-plans">
                {tour.plans
                  .filter((p) => p.active || preview)
                  .map((plan) => (
                    <Card asChild key={plan.id}>
                      <article>
                        <CardHeader>
                          <CardTitle asChild>
                            <h3>{plan.name[lang]}</h3>
                          </CardTitle>
                          <CardDescription asChild>
                            <p>{plan.description[lang]}</p>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="stitch-included-list">
                            {plan.services[lang].map((service, index) => (
                              <li key={index}>
                                <StitchIcon name="check_circle" />
                                {service}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter className="stitch-plan-footer">
                          <strong>
                            {plan.price_cents === null
                              ? common('askPrice')
                              : money(plan.price_cents, lang)}
                          </strong>
                          <Button
                            disabled={preview || !plan.active}
                            variant="mint"
                            onClick={() => {
                              void setPlan(plan.id)
                              document
                                .getElementById('tour-enquiry')
                                ?.scrollIntoView({ block: 'start' })
                            }}
                          >
                            {t('select')}
                            <StitchIcon name="arrow_forward" />
                          </Button>
                        </CardFooter>
                      </article>
                    </Card>
                  ))}
              </div>
            </section>
          </div>
          <aside id="tour-enquiry" className="stitch-detail-enquiry">
            <div className="stitch-enquiry-price">
              <small>{common('from')}</small>
              <strong>{price === null ? common('askPrice') : money(price, lang)}</strong>
              <p>{t('indicative')}</p>
            </div>
            {preview ? (
              <p>{t('indicative')}</p>
            ) : (
              <Suspense fallback={<Loading />}>
                <QuoteForm embeddedTour={tour} />
              </Suspense>
            )}
          </aside>
        </div>
      </div>
      <section className="stitch-container stitch-detail-meeting">
        <div>
          <span className="stitch-kicker">{design('design.meetingTitleDetail')}</span>
          <h2>{common(`destinations.${tour.destination}`)}</h2>
          <p>{tour.meeting_point[lang]}</p>
        </div>
        <div className="stitch-meeting-note">
          <StitchIcon name="location_on" />
          <p>{t('indicative')}</p>
        </div>
      </section>
      {!preview && (
        <div className="stitch-mobile-tour-action">
          <div>
            <small>{common('from')}</small>
            <strong>{price === null ? common('askPrice') : money(price, lang)}</strong>
          </div>
          <Button asChild variant="secondary">
            <a href="#tour-enquiry">
              <StitchIcon name="chat" />
              {common('navQuote')}
            </a>
          </Button>
        </div>
      )}
      <Dialog
        open={photo !== null}
        onOpenChange={(open) => {
          if (!open) setPhoto(null)
        }}
      >
        <DialogContent
          className="photo-dialog"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault()
              movePhoto(event.key === 'ArrowLeft' ? -1 : 1)
            }
          }}
          closeLabel={common('close')}
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>{t('gallery')}</DialogTitle>
          </DialogHeader>
          {photo && (
            <img
              src={tour.media.find((m) => m.id === photo)?.url}
              alt={tour.media.find((m) => m.id === photo)?.alt[lang] ?? ''}
            />
          )}
          {viewerImages.length > 1 && (
            <div className="stitch-photo-navigation">
              <Button
                variant="soft"
                size="icon"
                aria-label={design('previous')}
                onClick={() => movePhoto(-1)}
              >
                <ChevronLeft />
              </Button>
              <span aria-live="polite">
                {photoIndex + 1} / {viewerImages.length}
              </span>
              <Button
                variant="soft"
                size="icon"
                aria-label={design('next')}
                onClick={() => movePhoto(1)}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default function TourDetail() {
  const { slug = '' } = useParams()
  const query = useTour(slug)
  return query.isPending ? (
    <Loading />
  ) : query.isError ? (
    <div className="container page-pad">
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    </div>
  ) : (
    <TourContent tour={query.data} />
  )
}
