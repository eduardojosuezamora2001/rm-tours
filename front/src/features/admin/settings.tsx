import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { SiteSettings } from '../../../../shared/contracts'
import { useSettings } from '@/features/catalog/queries'
import { request } from '@/lib/api'
import { BilingualField } from './fields'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ErrorState, Loading } from '@/components/feedback'
function SettingsForm({ initial }: { initial: SiteSettings }) {
  const { t } = useTranslation('admin', { lng: 'es' })
  const [settings, setSettings] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const client = useQueryClient()
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
          await request('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) }, true)
          await client.invalidateQueries({ queryKey: ['settings'] })
          toast.success(t('saved'))
        } catch (err) {
          setError(err)
        } finally {
          setBusy(false)
        }
      }}
    >
      <div className="admin-heading">
        <h1>{t('settings')}</h1>
        <Button disabled={busy}>{t('save')}</Button>
      </div>
      {error !== null && <ErrorState error={error} />}
      <section className="editor-panel">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="settings-whatsapp">{t('whatsapp')}</FieldLabel>
            <Input
              id="settings-whatsapp"
              value={settings.whatsapp}
              pattern="[1-9][0-9]{7,14}"
              onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
            />
            <FieldDescription>{t('whatsappHelp')}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-email">{t('email')}</FieldLabel>
            <Input
              id="settings-email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
          </Field>
          {(['location', 'hours', 'intro'] as const).map((key) => (
            <BilingualField
              key={key}
              label={t(key)}
              multiline={key === 'intro'}
              value={settings[key]}
              onChange={(value) => setSettings({ ...settings, [key]: value })}
            />
          ))}
        </FieldGroup>
      </section>
    </form>
  )
}
export default function SettingsPage() {
  const query = useSettings()
  return query.isPending ? (
    <Loading />
  ) : query.isError ? (
    <ErrorState error={query.error} retry={() => void query.refetch()} />
  ) : (
    <SettingsForm initial={query.data} />
  )
}
