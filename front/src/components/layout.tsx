import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams, useNavigate, Navigate } from 'react-router'
import { useOptimisticSearchParams } from 'nuqs/adapters/react-router/v8'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { SelectField } from '@/components/select-field'
import { SelectItem } from '@/components/ui/select'
import { ThemeToggle } from './theme-toggle'
import { StitchIcon } from './stitch-icon'
import { useLang, useSettings } from '@/features/catalog/queries'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/use-theme'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
export function Brand() {
  const { theme } = useTheme()
  return (
    <span className="stitch-brand">
      <img
        src={theme === 'dark' ? '/brand/logo-dark.svg' : '/brand/logo.svg'}
        alt="RM Tours"
        width="180"
        height="48"
      />
      <span className="stitch-brand-title">
        RM Tours<small>PENÍNSULA DE NICOYA</small>
      </span>
    </span>
  )
}
export function PublicLayout() {
  const { t, i18n } = useTranslation()
  const lang = useLang()
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const search = useOptimisticSearchParams().toString()
  const { data: settings } = useSettings()
  const [open, setOpen] = useState(false)
  const contentPath = location.pathname.replace(/^\/(es|en)/, '')
  const isTourDetail = /^\/tours\/[^/]+/.test(contentPath)
  useEffect(() => {
    void i18n.changeLanguage(lang)
    document.documentElement.lang = lang
  }, [lang, i18n])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [contentPath])
  useEffect(() => {
    if (!location.hash) return
    const scroll = () => {
      const id = location.hash.slice(1)
      const target = document.getElementById(id)
      const visible = target?.getClientRects().length
        ? target
        : document.getElementById('mobile-' + id)
      if (!visible) return false
      visible.scrollIntoView()
      return true
    }
    if (scroll()) return
    const observer = new MutationObserver(() => {
      if (scroll()) observer.disconnect()
    })
    observer.observe(document.getElementById('main') ?? document.body, {
      childList: true,
      subtree: true,
    })
    return () => observer.disconnect()
  }, [location.pathname, location.hash])
  if (!['es', 'en'].includes(params.lang ?? '')) return <Navigate to="/es" replace />
  const navigation = [
    <NavLink key="home" end to={`/${lang}`}>
      {t('home')}
    </NavLink>,
    <NavLink key="tours" to={`/${lang}/tours`}>
      {t('tours')}
    </NavLink>,
    <Link key="destinations" to={`/${lang}#destinations`}>
      {t('navDestinations')}
    </Link>,
    <Link key="how" to={`/${lang}#how`}>
      {t('navHow')}
    </Link>,
    <Link key="faq" to={`/${lang}#faq`}>
      {t('navFaq')}
    </Link>,
    <Link key="contact" to={`/${lang}#contact`}>
      {t('navContact')}
    </Link>,
  ]
  return (
    <>
      <a href="#main" className="skip-link">
        {t('skip')}
      </a>
      <header className={cn('stitch-header', isTourDetail && 'stitch-header-detail')}>
        <div className="stitch-header-inner">
          {isTourDetail && (
            <Link className="stitch-mobile-back" to={`/${lang}/tours`} aria-label={t('back')}>
              <StitchIcon name="arrow_back_ios_new" />
            </Link>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('stitch-menu', isTourDetail && 'stitch-detail-menu')}
                aria-label={t('menu')}
              >
                <StitchIcon name="menu" />
              </Button>
            </SheetTrigger>
            <SheetContent closeLabel={t('close')} aria-describedby={undefined} side="left">
              <SheetHeader>
                <SheetTitle>RM Tours</SheetTitle>
              </SheetHeader>
              <nav className="mobile-nav" aria-label={t('menu')} onClick={() => setOpen(false)}>
                {navigation}
                <Link to="/admin-tours">{t('adminAccess')}</Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Link className="stitch-header-brand" to={`/${lang}`} aria-label="RM Tours">
            <Brand />
          </Link>
          {isTourDetail && <span className="stitch-detail-header-title">{t('detailHeader')}</span>}
          <NavigationMenu viewport={false} className="stitch-desktop-nav" aria-label={t('menu')}>
            <NavigationMenuList>
              {navigation.map((link) => (
                <NavigationMenuItem key={link.key}>
                  <NavigationMenuLink asChild>{link}</NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="stitch-header-actions">
            <SelectField
              className="stitch-preference-select stitch-language-select"
              aria-label={t('language')}
              title={t('language')}
              value={lang}
              onValueChange={(value) => {
                const code = value
                if (code !== 'es' && code !== 'en') return
                void navigate(
                  location.pathname.replace(/^\/(es|en)/, `/${code}`) +
                    (search ? `?${search}` : '') +
                    location.hash,
                  { preventScrollReset: true },
                )
              }}
            >
              <SelectItem value="es" lang="es">
                ES
              </SelectItem>
              <SelectItem value="en" lang="en">
                EN
              </SelectItem>
            </SelectField>
            <ThemeToggle />
            {settings?.whatsapp ? (
              <Button asChild variant="mint" className="stitch-header-whatsapp">
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  aria-label={t('quote')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <StitchIcon name="chat" />
                  <span>WhatsApp: +{settings.whatsapp}</span>
                </a>
              </Button>
            ) : (
              <Button asChild variant="mint" className="stitch-header-whatsapp">
                <Link to={`/${lang}/cotizar`} aria-label={t('quote')}>
                  <StitchIcon name="chat" />
                  <span>{t('quote')}</span>
                </Link>
              </Button>
            )}
            <Button asChild variant="coral" className="stitch-header-cta">
              <Link to={`/${lang}/tours`}>{t('navPlans')}</Link>
            </Button>
            <Button asChild size="icon-sm" className="stitch-account">
              <Link to="/admin-tours" aria-label={t('adminAccess')}>
                <StitchIcon name="person" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className="stitch-main">
        <Outlet />
      </main>
      <footer className={cn('stitch-footer', !contentPath && 'stitch-home-footer')}>
        <div className="stitch-container stitch-footer-grid">
          <div>
            <Brand />
            <p>{settings?.intro[lang] || t('footer')}</p>
            <span className="inline-flex items-center gap-2">
              <StitchIcon name="location_on" />
              {settings?.location[lang] || t('tagline')}
            </span>
          </div>
          <nav aria-label={t('tours')}>
            <h2>{t('tours')}</h2>
            <Link to={`/${lang}/tours?destination=paquera`}>Paquera & Curú</Link>
            <Link to={`/${lang}/tours?destination=tambor`}>Bahía Tambor</Link>
            <Link to={`/${lang}/tours?destination=montezuma`}>Montezuma</Link>
            <Link to={`/${lang}/tours?destination=santa-teresa`}>Santa Teresa</Link>
          </nav>
          <nav aria-label={t('navInfo')}>
            <h2>{t('navInfo')}</h2>
            <Link to={`/${lang}#how`}>{t('navHow')}</Link>
            <Link to={`/${lang}#faq`}>{t('navFaq')}</Link>
            <Link to={`/${lang}/privacidad`}>{t('privacy')}</Link>
            <Link to={`/${lang}/terminos`}>{t('terms')}</Link>
          </nav>
          <div>
            <h2>{t('navContact')}</h2>
            <Link className="stitch-footer-chat" to={`/${lang}/cotizar`}>
              <StitchIcon name="chat" />
              {t('quote')}
            </Link>
            {settings?.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
            {settings?.hours[lang] && <p>{settings.hours[lang]}</p>}
            <span className="stitch-footer-currency">USD · {t('priceNotice')}</span>
          </div>
        </div>
        <div className="stitch-container">
          <nav className="stitch-mobile-legal" aria-label={t('navInfo')}>
            <Link to={`/${lang}/privacidad`}>{t('privacy')}</Link>
            <Link to={`/${lang}/terminos`}>{t('terms')}</Link>
          </nav>
          <Separator />
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} RM Tours. {t('copyright')}
            </span>
            <span>{t('tagline')}</span>
          </div>
        </div>
      </footer>
      <Button asChild variant="chat" size="lg" className="stitch-floating-chat">
        <Link to={`/${lang}/cotizar`}>
          <StitchIcon name="chat" />
          {t('chatHelp')}
        </Link>
      </Button>
      <nav
        className={cn('stitch-bottom-nav', isTourDetail && 'stitch-detail-bottom-nav')}
        aria-label={t('mobileNavigation')}
      >
        <NavLink end to={`/${lang}`}>
          <StitchIcon name="home" />
          {t('home')}
        </NavLink>
        <NavLink to={`/${lang}/tours`}>
          <StitchIcon name="explore" />
          {t('navExplore')}
        </NavLink>
        <NavLink to={`/${lang}/cotizar`}>
          <StitchIcon name="chat" />
          {t('navQuote')}
        </NavLink>
        <Link to={`/${lang}#contact`}>
          <StitchIcon name="support_agent" />
          {t('navContact')}
        </Link>
      </nav>
    </>
  )
}
