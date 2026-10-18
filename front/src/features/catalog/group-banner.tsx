import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useLang } from './queries'
import { Button } from '@/components/ui/button'
import { StitchIcon } from '@/components/stitch-icon'
export function GroupBanner() {
  const { t } = useTranslation('catalog')
  const lang = useLang()
  return (
    <section id="contact" className="stitch-container stitch-group-section">
      <div className="stitch-group-banner">
        <div>
          <span className="stitch-kicker">
            <StitchIcon name="groups" />
            {t('design.combineLabel')}
          </span>
          <h2>{t('design.combineTitle')}</h2>
          <p>{t('design.combineBody')}</p>
          <div className="stitch-group-features">
            <span>
              <StitchIcon name="check_circle" />
              {t('design.usd')}
            </span>
            <span>
              <StitchIcon name="check_circle" />
              {t('design.manualConfirmation')}
            </span>
          </div>
        </div>
        <div className="stitch-group-action">
          <Button asChild size="lg" variant="secondary">
            <Link to={`/${lang}/cotizar`}>
              <StitchIcon name="chat" />
              {t('design.combineAction')}
            </Link>
          </Button>
          <small>{t('design.combineNote')}</small>
        </div>
      </div>
    </section>
  )
}
