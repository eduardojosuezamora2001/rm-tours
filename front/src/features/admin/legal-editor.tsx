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
function DocumentForm({ initial }: { initial: LegalPage }) {
  const { t } = useTranslation('admin', { lng: 'es' })
  const [page, setPage] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const client = useQueryClient()
  return (
    <form
      className="editor-panel"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
          await request(
            `/admin/legal/${page.slug}`,
            { method: 'PUT', body: JSON.stringify(page) },
            true,
          )
          await client.invalidateQueries({ queryKey: ['legal'] })
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
        <Button disabled={busy}>{t('save')}</Button>
      </div>
      {error !== null && <ErrorState error={error} />}
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
          {query.data.map((page) => (
            <DocumentForm key={page.slug} initial={page} />
          ))}
        </div>
      )}
    </>
  )
}
