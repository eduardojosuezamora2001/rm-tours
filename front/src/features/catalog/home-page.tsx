import { EMPTY_SELECT_VALUE } from '@/lib/select-values'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { destinations, categories } from '../../../../shared/contracts'
import { useLang, useTours } from './queries'
import { TourCard } from './tour-card'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { SelectField } from '@/components/select-field'
import { SelectItem } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Metadata } from '@/components/metadata'
import { StitchIcon } from '@/components/stitch-icon'
import { ErrorState, Loading } from '@/components/feedback'
import { GroupBanner } from './group-banner'
export default function HomePage() {
  const { t } = useTranslation('catalog')
  const { t: common } = useTranslation()
  const lang = useLang()
  const navigate = useNavigate()
  const [destination, setDestination] = useState('')
  const [category, setCategory] = useState('')
  const [featuredCategory, setFeaturedCategory] = useState('')
  const query = useTours({
    q: '',
    destination: '',
    category: featuredCategory,
    sort: 'recommended',
    page: 1,
  })
  const tags = ['paqueraTag', 'tamborTag', 'montezumaTag', 'santaTeresaTag'] as const
  return (
    <>
      <Metadata title={t('heroTitle')} description={t('heroBody')} />
      <section className="stitch-home-hero">
        <picture className="stitch-hero-picture">
          <source media="(max-width:767px)" srcSet="/brand/nicoya-mobile.jpg" />
          <img src="/brand/nicoya-hero.jpg" alt="" width="1600" height="900" fetchPriority="high" />
        </picture>
        <div className="stitch-hero-scrim" />
        <div className="stitch-container stitch-hero-content">
          <div className="stitch-hero-copy">
            <Badge variant="outline" className="stitch-hero-badge">
              <StitchIcon name="explore" />
              {t('design.region')}
            </Badge>
            <h1>
              {t('design.heroLead')} <span>{t('design.heroPlace')}</span>
            </h1>
            <p>{t('heroBody')}</p>
            <div className="stitch-mobile-hero-tags">
              <span>
                <StitchIcon name="chat" />
                {t('design.localContact')}
              </span>
              <span>
                <StitchIcon name="payments" />
                {t('design.usd')}
              </span>
            </div>
          </div>
          <form
            className="stitch-hero-console"
            onSubmit={(e) => {
              e.preventDefault()
              const search = new URLSearchParams()
              if (destination) search.set('destination', destination)
              if (category) search.set('category', category)
              navigate(`/${lang}/tours${search.size ? '?' + search : ''}`)
            }}
          >
            <div className="stitch-console-heading">
              <StitchIcon name="explore" />
              {t('design.planAdventure')}
            </div>
            <FieldGroup className="stitch-hero-fields">
              <Field>
                <FieldLabel htmlFor="hero-destination">
                  <StitchIcon name="location_on" />
                  {t('destination')}
                </FieldLabel>
                <SelectField
                  id="hero-destination"
                  value={destination}
                  onValueChange={(value) => setDestination(value)}
                >
                  <SelectItem value={EMPTY_SELECT_VALUE}>{t('allDestinations')}</SelectItem>
                  {destinations.map((d) => (
                    <SelectItem key={d} value={d}>
                      {common(`destinations.${d}`)}
                    </SelectItem>
                  ))}
                </SelectField>
              </Field>
              <Field>
                <FieldLabel htmlFor="hero-category">
                  <StitchIcon name="explore" />
                  {t('category')}
                </FieldLabel>
                <SelectField
                  id="hero-category"
                  value={category}
                  onValueChange={(value) => setCategory(value)}
                >
                  <SelectItem value={EMPTY_SELECT_VALUE}>{t('allCategories')}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {common(`categories.${c}`)}
                    </SelectItem>
                  ))}
                </SelectField>
              </Field>
              <Button type="submit" variant="coral" size="lg">
                <StitchIcon name="search" />
                {t('design.explore')}
              </Button>
            </FieldGroup>
            <div className="stitch-quick-search">
              <span>{t('design.popular')}:</span>
              {(
                [
                  {
                    label: 'quickNight',
                    destination: 'paquera',
                    category: 'night',
                    icon: 'auto_awesome',
                  },
                  {
                    label: 'quickIsland',
                    destination: 'paquera',
                    category: 'ocean',
                    icon: 'beach_access',
                  },
                  {
                    label: 'quickSunset',
                    destination: 'tambor',
                    category: 'ocean',
                    icon: 'wb_twilight',
                  },
                ] as const
              ).map((item) => (
                <Link
                  key={item.label}
                  to={`/${lang}/tours?destination=${item.destination}&category=${item.category}`}
                >
                  <StitchIcon name={item.icon} />
                  {t(`design.${item.label}`)}
                </Link>
              ))}
            </div>
          </form>
          <div className="stitch-hero-stats">
            {(
              [
                { icon: 'location_on', value: '4', label: 'destinationMobile' },
                { icon: 'chat', value: 'WhatsApp', label: 'localContact' },
                { icon: 'payments', value: 'USD', label: 'noPayment' },
                { icon: 'translate', value: 'ES / EN', label: 'languages' },
              ] as const
            ).map((item) => (
              <div key={item.icon}>
                <StitchIcon name={item.icon} />
                <strong>{item.value}</strong>
                <span>{t(`design.${item.label}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="destinations" className="stitch-destinations-section">
        <div className="stitch-container">
          <div className="stitch-section-heading">
            <div>
              <span className="stitch-kicker">{t('design.territory')}</span>
              <h2>
                <span className="stitch-desktop-text">{t('design.destinationTitle')}</span>
                <span className="stitch-mobile-text">{t('design.destinationMobile')}</span>
              </h2>
            </div>
            <p>{t('design.destinationBody')}</p>
          </div>
          <div className="stitch-destination-grid">
            {destinations.map((d, i) => (
              <Link className="stitch-destination" key={d} to={`/${lang}/tours?destination=${d}`}>
                <picture>
                  <source
                    media="(max-width:767px)"
                    srcSet={`/brand/mobile-destination-${i + 1}.jpg`}
                  />
                  <img
                    src={`/brand/destination-${i + 1}.jpg`}
                    alt=""
                    width="520"
                    height="520"
                    loading="lazy"
                  />
                </picture>
                <span className="stitch-destination-overlay">{common(`destinations.${d}`)}</span>
                <div>
                  <span>{t(`design.${tags[i]}`)}</span>
                  <h3>
                    <span className="stitch-desktop-text">
                      {common(`destinations.${d}`)}
                      {d === 'paquera' ? ' & Curú' : ''}
                    </span>
                    <span className="stitch-mobile-text">{t(`design.destinationNames.${d}`)}</span>
                  </h3>
                  <small>
                    {t('design.viewExperiences')}
                    <StitchIcon name="arrow_forward" />
                  </small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="stitch-container stitch-featured" id="tours-section">
        <div className="stitch-section-heading">
          <div>
            <span className="stitch-kicker">{t('design.region')}</span>
            <h2>{t('featured')}</h2>
          </div>
          <ToggleGroup
            type="single"
            value={featuredCategory || 'all'}
            onValueChange={(v) => setFeaturedCategory(v === 'all' ? '' : v)}
            className="stitch-category-tabs"
            aria-label={t('category')}
          >
            <ToggleGroupItem value="all">{t('design.all')}</ToggleGroupItem>
            {categories.slice(0, 4).map((c) => (
              <ToggleGroupItem key={c} value={c}>
                {common(`categories.${c}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : !query.data.items.length ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{t('empty')}</EmptyTitle>
              <EmptyDescription>{t('emptyBody')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="stitch-tour-grid stitch-home-tours">
            {query.data.items.slice(0, 6).map((tour) => (
              <TourCard key={tour.id} tour={tour} variant="home" />
            ))}
          </div>
        )}
        <div className="stitch-all-tours">
          <Button asChild variant="soft">
            <Link to={`/${lang}/tours`}>
              {t('all')}
              <StitchIcon name="arrow_forward" />
            </Link>
          </Button>
        </div>
      </section>
      <section className="stitch-meeting-section">
        <div className="stitch-container stitch-meeting-grid">
          <div>
            <span className="stitch-kicker">{t('design.meetingLabel')}</span>
            <h2>{t('design.meetingTitle')}</h2>
            <p>{t('design.meetingBody')}</p>
            <div className="stitch-meeting-places">
              {destinations.map((d) => (
                <Link key={d} to={`/${lang}/tours?destination=${d}`}>
                  <StitchIcon name="location_on" />
                  <span>{common(`destinations.${d}`)}</span>
                  <StitchIcon name="arrow_forward" />
                </Link>
              ))}
            </div>
          </div>
          <img
            className="stitch-region-photo"
            src="/brand/region-map.jpg"
            alt={t('design.mapAlt')}
            width="900"
            height="700"
            loading="lazy"
          />
        </div>
      </section>
      <section id="how" className="stitch-container stitch-how">
        <div className="stitch-centered-heading">
          <span className="stitch-kicker">{t('design.whyLabel')}</span>
          <h2>{t('design.whyTitle')}</h2>
          <p>{t('design.whyBody')}</p>
        </div>
        <div className="stitch-how-grid">
          {(
            [
              { icon: 'explore', title: 'howChoose', body: 'howChooseBody' },
              { icon: 'edit_calendar', title: 'howQuote', body: 'howQuoteBody' },
              { icon: 'chat', title: 'howTalk', body: 'howTalkBody' },
              { icon: 'check_circle', title: 'howConfirm', body: 'howConfirmBody' },
            ] as const
          ).map((item) => (
            <div key={item.title}>
              <div className="stitch-how-icon">
                <StitchIcon name={item.icon} />
              </div>
              <h3>{t(item.title)}</h3>
              <p>{t(item.body)}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="stitch-desktop-home-ending">
        <GroupBanner />
      </div>
      <section id="mobile-how" className="stitch-mobile-assurance stitch-container">
        <div>
          <StitchIcon name="support_agent" />
          <span>
            <strong>{t('design.localContact')}</strong>
            <p>{t('design.assistanceBody')}</p>
          </span>
        </div>
      </section>
      <section id="faq" className="stitch-faq">
        <div className="stitch-container">
          <div className="stitch-centered-heading">
            <span className="stitch-kicker">{t('design.faqLabel')}</span>
            <h2>
              <span className="stitch-desktop-text">{t('design.faqTitle')}</span>
              <span className="stitch-mobile-text">{t('design.mobileFaq')}</span>
            </h2>
          </div>
          <Accordion type="single" collapsible className="stitch-faq-list">
            {(['faq1', 'faq2', 'faq3', 'faq4'] as const).map((key) => (
              <AccordionItem value={key} key={key}>
                <AccordionTrigger>{t(`design.${key}`)}</AccordionTrigger>
                <AccordionContent>{t(`design.${key}Body`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      <section id="mobile-contact" className="stitch-mobile-assistance stitch-container">
        <div className="stitch-mobile-contact-panel">
          <span className="stitch-support-icon">
            <StitchIcon name="support_agent" />
          </span>
          <h2>{t('design.readyNicoya')}</h2>
          <p>{t('design.assistanceBody')}</p>
          <Button asChild variant="secondary" size="lg">
            <Link to={`/${lang}/cotizar`}>
              <StitchIcon name="chat" />
              {t('design.talkCoordinator')}
            </Link>
          </Button>
          <small>{t('design.manualConfirmation')}</small>
        </div>
      </section>
    </>
  )
}
