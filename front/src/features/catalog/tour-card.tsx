import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StitchIcon } from '@/components/stitch-icon'
import { lowestPrice, type Tour } from '../../../../shared/contracts'
import { money } from '@/i18n/format'
import { useLang } from './queries'
import { tourMedia } from './media'
import { cn } from '@/lib/utils'
export function TourCard({
  tour,
  priority = false,
  variant = 'catalog',
}: {
  tour: Tour
  priority?: boolean
  variant?: 'home' | 'catalog'
}) {
  const { t } = useTranslation()
  const lang = useLang()
  const price = lowestPrice(tour)
  const media = tourMedia(tour)
  const image = variant === 'home' ? media.featured : media.cover
  const plan = tour.plans.find((p) => p.active)
  return (
    <Card className={cn('tour-card stitch-card', variant === 'home' && 'stitch-home-card')}>
      <Link
        className="tour-photo"
        to={`/${lang}/tours/${tour.slug}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        {image?.url ? (
          <img
            src={image.url}
            alt=""
            width="640"
            height="400"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
          />
        ) : (
          <div className="photo-placeholder" />
        )}
        <Badge variant="outline">
          {variant === 'home'
            ? t(`destinations.${tour.destination}`)
            : t(`categories.${tour.category}`)}
        </Badge>
        <span className="stitch-card-duration">
          <StitchIcon name="schedule" />
          {t('hours', { count: tour.duration_minutes / 60 })}
        </span>
      </Link>
      <CardHeader>
        {variant === 'home' && (
          <div className="stitch-home-card-meta">
            <span>
              <StitchIcon name="schedule" />
              {t('hours', { count: tour.duration_minutes / 60 })}
            </span>
            {tour.schedules[0] && (
              <span>
                <StitchIcon name="routine" />
                {tour.schedules.join(' · ')}
              </span>
            )}
          </div>
        )}
        <span className="stitch-card-location">
          <StitchIcon name="place" />
          {t(`destinations.${tour.destination}`)}
        </span>
        <CardTitle>
          <Link to={`/${lang}/tours/${tour.slug}`}>{tour.name[lang]}</Link>
        </CardTitle>
        <CardDescription>{tour.summary[lang]}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="stitch-card-services">
          {tour.schedules[0] && (
            <span>
              <StitchIcon name="alarm" />
              {tour.schedules[0]}
            </span>
          )}
          {plan?.services[lang].slice(0, variant === 'home' ? 3 : 2).map((service, i) => (
            <Badge variant="service" key={i}>
              <StitchIcon name="check" />
              {service}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <div className="stitch-card-price">
          {price === null ? (
            <strong>{t('askPrice')}</strong>
          ) : (
            <>
              <small>{t('from')}</small>
              <strong>{money(price, lang)}</strong>
            </>
          )}
        </div>
        {variant === 'home' ? (
          <Button asChild variant="secondary">
            <Link to={`/${lang}/cotizar?tour=${tour.slug}`}>
              <StitchIcon name="chat" />
              {t('navQuote')}
            </Link>
          </Button>
        ) : (
          <div className="stitch-card-actions">
            <Button
              asChild
              variant="mint"
              size="icon"
              aria-label={`${t('quote')}: ${tour.name[lang]}`}
            >
              <Link to={`/${lang}/cotizar?tour=${tour.slug}`}>
                <StitchIcon name="chat" />
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/${lang}/tours/${tour.slug}`}>{t('details')}</Link>
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
