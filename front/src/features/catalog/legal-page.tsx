import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useLang, useLegal } from './queries'
import { Metadata } from '@/components/metadata'
import { ErrorState, Loading } from '@/components/feedback'
import { ApiError } from '@/lib/api'
export default function LegalPage() {
  const slug = useLocation().pathname.endsWith('/privacidad') ? 'privacy' : 'terms'
  const { t } = useTranslation('legal')
  const { t: common } = useTranslation()
  const lang = useLang()
  const query = useLegal(slug)
  return (
    <div className="container page-pad legal-copy">
      <Metadata title={common(slug)} />
      <h1>{query.data?.title[lang] || common(slug)}</h1>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        query.error instanceof ApiError && query.error.code === 'NOT_FOUND' ? (
          <p>{t('unavailable')}</p>
        ) : (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        )
      ) : (
        <div className="whitespace-pre-line">{query.data.body[lang]}</div>
      )}
    </div>
  )
}
