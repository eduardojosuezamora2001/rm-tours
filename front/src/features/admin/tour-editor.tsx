import { useCallback, useEffect, useState } from 'react'
import { Link, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Eye, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  categories,
  destinations,
  publicationErrors,
  type Tour,
} from '../../../../shared/contracts'
import { useAdminTour } from './queries'
import { newTour } from './new-tour'
import { BilingualField } from './fields'
import { PlansEditor, SectionsEditor, MediaEditor } from './tour-editor-parts'
import { request, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { SelectField } from '@/components/select-field'
import { SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ErrorState, Loading } from '@/components/feedback'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
function Editor({ initial }: { initial: Tour }) {
  const { t } = useTranslation('admin', { lng: 'es' })
  const { t: common } = useTranslation('common', { lng: 'es' })
  const [tour, setTour] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [publication, setPublication] = useState<string[]>([])
  const navigate = useNavigate()
  const client = useQueryClient()
  const blocker = useBlocker(dirty && !saving)
  useBeforeUnload(
    useCallback(
      (event) => {
        if (dirty) event.preventDefault()
      },
      [dirty],
    ),
  )
  const update = (value: Tour) => {
    setTour(value)
    setDirty(true)
  }
  async function save() {
    const cleanList = (list: { es: string[]; en: string[] }) => ({
      es: list.es.map((s) => s.trim()).filter(Boolean),
      en: list.en.map((s) => s.trim()).filter(Boolean),
    })
    const document: Tour = {
      ...tour,
      schedules: tour.schedules.map((s) => s.trim()).filter(Boolean),
      plans: tour.plans.map((p, position) => ({ ...p, position, services: cleanList(p.services) })),
      sections: tour.sections.map((s, position) => ({ ...s, position, items: cleanList(s.items) })),
      media: tour.media.map((m, position) => ({
        id: m.id,
        path: m.path,
        alt: m.alt,
        section_id: m.section_id,
        position,
      })),
    }
    const errors = document.status === 'published' ? publicationErrors(document) : []
    setPublication(errors)
    if (errors.length) return
    setSaving(true)
    setError(null)
    try {
      const result = await request<{ id: string; updated_at: string }>(
        `/admin/tours/${tour.id}`,
        { method: 'PUT', body: JSON.stringify(document) },
        true,
      )
      setTour((current) => ({ ...current, updated_at: result.updated_at }))
      setDirty(false)
      await client.invalidateQueries()
      toast.success(t('saved'))
      if (!initial.updated_at) navigate(`/admin-tours/tours/${result.id}`, { replace: true })
    } catch (err) {
      setError(err)
      if (err instanceof ApiError) setPublication(err.details)
    } finally {
      setSaving(false)
    }
  }
  return (
    <form
      className="stitch-tour-editor"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <header className="tour-editor-header">
        <div className="tour-editor-heading">
          <div className="tour-editor-heading-tools">
            <Button asChild variant="ghost">
              <Link to="/admin-tours">
                <ArrowLeft data-icon="inline-start" />
                {t('backToCatalog')}
              </Link>
            </Button>
            <ThemeToggle />
          </div>
          <h1>{tour.name.es || t('new')}</h1>
        </div>
        <div className="tour-editor-actions">
          <Button asChild variant="outline" disabled={!tour.updated_at || dirty}>
            <Link
              aria-disabled={!tour.updated_at || dirty}
              onClick={(e) => {
                if (!tour.updated_at || dirty) e.preventDefault()
              }}
              to={`/admin-tours/preview/${tour.id}`}
            >
              <Eye data-icon="inline-start" />
              {t('preview')}
            </Link>
          </Button>
          <Button type="submit" disabled={saving || uploading}>
            <Save data-icon="inline-start" />
            {saving ? common('loading') : t('save')}
          </Button>
        </div>
      </header>
      {error !== null && <ErrorState error={error} />}
      {publication.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>{t('complete')}</AlertTitle>
          <AlertDescription>
            <ul>
              {publication.map((code) => (
                <li key={code}>
                  {t(`errors.${code}` as 'errors.COVER_REQUIRED', { defaultValue: code })}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      <ConfirmationDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset()
        }}
        title={t('unsavedTitle')}
        description={t('unsaved')}
        confirmLabel={t('discardChanges')}
        cancelLabel={t('cancel')}
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed()
        }}
      />
      <Tabs defaultValue="general">
        <TabsList className="editor-tabs">
          {(['general', 'plans', 'sections', 'photos'] as const).map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {t(tab)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="general">
          <section className="editor-panel">
            <FieldGroup>
              <BilingualField
                label={t('name')}
                value={tour.name}
                onChange={(name) => update({ ...tour, name })}
              />
              <BilingualField
                label={t('summary')}
                multiline
                value={tour.summary}
                onChange={(summary) => update({ ...tour, summary })}
              />
              <Field>
                <FieldLabel htmlFor="tour-slug">{t('slug')}</FieldLabel>
                <Input
                  id="tour-slug"
                  value={tour.slug}
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength={100}
                  onChange={(e) => update({ ...tour, slug: e.target.value })}
                />
              </Field>
              <FieldGroup className="form-grid">
                <Field>
                  <FieldLabel htmlFor="tour-destination">{t('destination')}</FieldLabel>
                  <SelectField
                    id="tour-destination"
                    value={tour.destination}
                    onValueChange={(value) =>
                      update({ ...tour, destination: value as Tour['destination'] })
                    }
                  >
                    {destinations.map((d) => (
                      <SelectItem key={d} value={d}>
                        {common(`destinations.${d}`)}
                      </SelectItem>
                    ))}
                  </SelectField>
                </Field>
                <Field>
                  <FieldLabel htmlFor="tour-category">{t('category')}</FieldLabel>
                  <SelectField
                    id="tour-category"
                    value={tour.category}
                    onValueChange={(value) =>
                      update({ ...tour, category: value as Tour['category'] })
                    }
                  >
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {common(`categories.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectField>
                </Field>
                <Field>
                  <FieldLabel htmlFor="tour-duration">{t('duration')}</FieldLabel>
                  <Input
                    id="tour-duration"
                    type="number"
                    min={1}
                    max={43200}
                    value={tour.duration_minutes}
                    onChange={(e) => update({ ...tour, duration_minutes: Number(e.target.value) })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tour-status">{t('status')}</FieldLabel>
                  <SelectField
                    id="tour-status"
                    value={tour.status}
                    onValueChange={(value) => update({ ...tour, status: value as Tour['status'] })}
                  >
                    {(['draft', 'published', 'archived'] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(s)}
                      </SelectItem>
                    ))}
                  </SelectField>
                </Field>
              </FieldGroup>
              <BilingualField
                label={t('meeting')}
                value={tour.meeting_point}
                onChange={(meeting_point) => update({ ...tour, meeting_point })}
              />
              <Field>
                <FieldLabel htmlFor="tour-schedules">{t('schedules')}</FieldLabel>
                <Textarea
                  id="tour-schedules"
                  value={tour.schedules.join('\n')}
                  onChange={(e) => update({ ...tour, schedules: e.target.value.split('\n') })}
                />
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="tour-featured"
                  checked={tour.featured}
                  onCheckedChange={(value) => update({ ...tour, featured: value === true })}
                />
                <FieldLabel htmlFor="tour-featured">{t('featured')}</FieldLabel>
              </Field>
            </FieldGroup>
          </section>
        </TabsContent>
        <TabsContent value="plans">
          <PlansEditor tour={tour} update={update} />
        </TabsContent>
        <TabsContent value="sections">
          <SectionsEditor tour={tour} update={update} />
        </TabsContent>
        <TabsContent value="photos">
          <MediaEditor tour={tour} update={update} onBusy={setUploading} />
        </TabsContent>
      </Tabs>
    </form>
  )
}
export default function TourEditor() {
  const { id = 'new' } = useParams()
  const { t, i18n } = useTranslation('admin', { lng: 'es' })
  useEffect(() => {
    void i18n.changeLanguage('es')
    document.documentElement.lang = 'es'
  }, [i18n])
  useEffect(() => {
    document.title = `${id === 'new' ? t('new') : t('edit')} · RM Tours`
  }, [id, t])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])
  const query = useAdminTour(id)
  const [fresh] = useState(newTour)
  return (
    <main className="tour-editor-page">
      {id === 'new' ? (
        <Editor key="new" initial={fresh} />
      ) : query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <Editor key={id} initial={query.data} />
      )}
    </main>
  )
}
