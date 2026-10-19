import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { LegalPage } from '../../../../shared/contracts'
import { request } from '@/lib/api'
import { BilingualField } from './fields'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { ErrorState, Loading } from '@/components/feedback'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { pendingLegalDetails, withLegalDraft } from './legal-drafts'
function DocumentForm({ initial }: { initial: LegalPage }) {
  const { t } = useTranslation('admin', { lng: 'es' })
  const [page, setPage] = useState(() => withLegalDraft(initial))
  const pending = pendingLegalDetails(page)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const client = useQueryClient()
  return (
    <form
      className="editor-panel"
      onSubmit={async (e) => {
        e.preventDefault()
        if (page.published && pending.length > 0) return
        setBusy(true)
        setError(null)
        try {
          await request(
            `/admin/legal/${page.slug}`,
            { method: 'PUT', body: JSON.stringify(page) },
            true,
          )
          await Promise.all([
            client.invalidateQueries({ queryKey: ['admin-legal'] }),
            client.invalidateQueries({ queryKey: ['legal'] }),
          ])
          toast.success(t('saved'))
        } catch (err) {
          setError(err)
        } finally {
          setBusy(false)
        }
      }}
    >
      <div className="editor-panel-heading">
        <h2>{t(page.slug)}</h2>
        <Button disabled={busy || (page.published && pending.length > 0)}>{t('save')}</Button>
      </div>
      {error !== null && <ErrorState error={error} />}
      {pending.length > 0 && (
        <Alert>
          <AlertTitle>{t('legalDraftTitle')}</AlertTitle>
          <AlertDescription>
            <p>{t('legalDraftBody')}</p>
            <p className="break-words">{pending.join(', ')}</p>
          </AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <BilingualField
          label={t('sectionTitle')}
          value={page.title}
          onChange={(title) => setPage({ ...page, title })}
        />
        <BilingualField
          multiline
          label={t('body')}
          value={page.body}
          onChange={(body) => setPage({ ...page, body })}
        />
        <Field orientation="horizontal">
          <Checkbox
            id={`publish-${page.slug}`}
            checked={page.published}
            disabled={pending.length > 0 && !page.published}
            onCheckedChange={(value) => setPage({ ...page, published: value === true })}
          />
          <FieldLabel htmlFor={`publish-${page.slug}`}>{t('published')}</FieldLabel>
        </Field>
      </FieldGroup>
    </form>
  )
}
export default function LegalEditor() {
  const { t } = useTranslation('admin', { lng: 'es' })
  const query = useQuery({
    queryKey: ['admin-legal'],
    queryFn: ({ signal }) => request<LegalPage[]>('/admin/legal', { signal }, true),
  })
  return (
    <>
      <div className="admin-heading">
        <h1>{t('legal')}</h1>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <div className="editor-stack">
          {(['privacy', 'terms'] as const).map((slug) => {
            const page = query.data.find((item) => item.slug === slug) ?? {
              slug,
              title: { es: '', en: '' },
              body: { es: '', en: '' },
              published: false,
            }
            return <DocumentForm key={slug} initial={page} />
          })}
        </div>
      )}
    </>
  )
}
