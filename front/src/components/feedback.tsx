import { useTranslation } from 'react-i18next'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
export function Loading() {
  const { t } = useTranslation()
  return (
    <div className="container page-pad" role="status" aria-label={t('loading')}>
      <Skeleton className="h-12 w-2/3" />
      <div className="tour-grid mt-8">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-80 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const { t, i18n } = useTranslation()
  const key = `errors.${error instanceof ApiError ? error.code : 'GENERIC'}`
  return (
    <Alert variant="destructive">
      <AlertTitle>
        {i18n.exists(key) ? i18n.t(key as 'errors.GENERIC') : t('errors.GENERIC')}
      </AlertTitle>
      <AlertDescription>
        {retry && (
          <Button variant="outline" onClick={retry}>
            {t('retry')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
