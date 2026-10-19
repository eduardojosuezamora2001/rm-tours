import { EMPTY_SELECT_VALUE } from '@/lib/select-values'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Plus, Trash2, TriangleAlert } from 'lucide-react'
import {
  blankList,
  blankText,
  sectionTypes,
  type Plan,
  type Tour,
  type TourSection,
} from '../../../../shared/contracts'
import { BilingualField, ListField } from './fields'
import { optimizeImage } from './image'
import { ImageUpload } from './image-upload'
import { request, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { SelectField } from '@/components/select-field'
import { SelectItem } from '@/components/ui/select'
import { ErrorState } from '@/components/feedback'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
function MoveButtons({
  index,
  count,
  move,
  remove,
  canRemove = true,
}: {
  index: number
  count: number
  move: (from: number, to: number) => void
  remove: () => void
  canRemove?: boolean
}) {
  const { t } = useTranslation('admin', { lng: 'es' })
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={index === 0}
        aria-label={t('up')}
        onClick={() => move(index, index - 1)}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={index === count - 1}
        aria-label={t('down')}
        onClick={() => move(index, index + 1)}
      >
        <ArrowDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canRemove}
        aria-label={t('delete')}
        onClick={remove}
      >
        <Trash2 />
      </Button>
    </div>
  )
}
function reorder<T>(items: T[], from: number, to: number): T[] {
  const copy = [...items]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}
export function PlansEditor({ tour, update }: { tour: Tour; update: (tour: Tour) => void }) {
  const { t } = useTranslation('admin', { lng: 'es' })
  function change(index: number, value: Partial<Plan>) {
    update({ ...tour, plans: tour.plans.map((p, i) => (i === index ? { ...p, ...value } : p)) })
  }
  return (
    <div className="editor-stack">
      {tour.plans.map((plan, index) => (
        <section className="editor-panel" key={plan.id}>
          <div className="editor-panel-heading">
            <h2>{plan.name.es || t('plans')}</h2>
            <MoveButtons
              index={index}
              count={tour.plans.length}
              move={(from, to) => update({ ...tour, plans: reorder(tour.plans, from, to) })}
              remove={() => update({ ...tour, plans: tour.plans.filter((p) => p.id !== plan.id) })}
              canRemove={tour.plans.length > 1}
            />
          </div>
          <FieldGroup>
            <BilingualField
              label={t('name')}
              value={plan.name}
              onChange={(name) => change(index, { name })}
            />
            <BilingualField
              label={t('description')}
              multiline
              value={plan.description}
              onChange={(description) => change(index, { description })}
            />
            <ListField
              label={t('services')}
              value={plan.services}
              onChange={(services) => change(index, { services })}
            />
            <FieldGroup className="form-grid">
              <Field>
                <FieldLabel htmlFor={`price-${plan.id}`}>{t('price')}</FieldLabel>
                <Input
                  id={`price-${plan.id}`}
                  type="number"
                  min={0}
                  max={1000000}
                  step="0.01"
                  value={plan.price_cents === null ? '' : plan.price_cents / 100}
                  onChange={(e) =>
                    change(index, {
                      price_cents:
                        e.target.value === '' ? null : Math.round(Number(e.target.value) * 100),
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`unit-${plan.id}`}>{t('unit')}</FieldLabel>
                <SelectField
                  id={`unit-${plan.id}`}
                  value={plan.price_unit}
                  onValueChange={(value) =>
                    change(index, { price_unit: value as Plan['price_unit'] })
                  }
                >
                  {(['person', 'group', 'hour'] as const).map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {t(unit)}
                    </SelectItem>
                  ))}
                </SelectField>
              </Field>
            </FieldGroup>
            <Field orientation="horizontal">
              <Checkbox
                id={`active-${plan.id}`}
                checked={plan.active}
                onCheckedChange={(value) => change(index, { active: value === true })}
              />
              <FieldLabel htmlFor={`active-${plan.id}`}>{t('active')}</FieldLabel>
            </Field>
          </FieldGroup>
        </section>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={tour.plans.length >= 30}
        onClick={() =>
          update({
            ...tour,
            plans: [
              ...tour.plans,
              {
                id: crypto.randomUUID(),
                name: blankText(),
                description: blankText(),
                services: blankList(),
                price_cents: null,
                price_unit: 'person',
                active: true,
                position: tour.plans.length,
              },
            ],
          })
        }
      >
        <Plus data-icon="inline-start" />
        {t('addPlan')}
      </Button>
    </div>
  )
}
export function SectionsEditor({ tour, update }: { tour: Tour; update: (tour: Tour) => void }) {
  const { t } = useTranslation('admin', { lng: 'es' })
  const [type, setType] = useState<TourSection['type']>('description')
  const [removingSection, setRemovingSection] = useState<string | null>(null)
  function change(index: number, value: Partial<TourSection>) {
    update({
      ...tour,
      sections: tour.sections.map((s, i) => (i === index ? { ...s, ...value } : s)),
    })
  }
  return (
    <div className="editor-stack">
      {tour.sections.map((section, index) => (
        <section className="editor-panel" key={section.id}>
          <div className="editor-panel-heading">
            <h2>{t(`sectionTypes.${section.type}`)}</h2>
            <MoveButtons
              index={index}
              count={tour.sections.length}
              move={(from, to) => update({ ...tour, sections: reorder(tour.sections, from, to) })}
              remove={() => setRemovingSection(section.id)}
            />
          </div>
          <FieldGroup>
            <BilingualField
              label={t('sectionTitle')}
              value={section.title}
              onChange={(title) => change(index, { title })}
            />
            {section.type !== 'gallery' && (
              <>
                <BilingualField
                  label={t('body')}
                  multiline
                  value={section.body}
                  onChange={(body) => change(index, { body })}
                />
                <ListField
                  label={t('items')}
                  value={section.items}
                  onChange={(items) => change(index, { items })}
                />
              </>
            )}
            <Field orientation="horizontal">
              <Checkbox
                id={`visible-${section.id}`}
                checked={section.visible}
                onCheckedChange={(value) => change(index, { visible: value === true })}
              />
              <FieldLabel htmlFor={`visible-${section.id}`}>{t('visible')}</FieldLabel>
            </Field>
          </FieldGroup>
        </section>
      ))}
      <ConfirmationDialog
        open={removingSection !== null}
        onOpenChange={(open) => {
          if (!open) setRemovingSection(null)
        }}
        title={t('removeSectionTitle')}
        description={t('confirmRemoveSection')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={() => {
          update({
            ...tour,
            sections: tour.sections.filter((section) => section.id !== removingSection),
            media: tour.media.filter((media) => media.section_id !== removingSection),
          })
          setRemovingSection(null)
        }}
      />
      <FieldGroup className="form-grid">
        <Field>
          <FieldLabel htmlFor="section-type">{t('sections')}</FieldLabel>
          <SelectField
            id="section-type"
            value={type}
            onValueChange={(value) => setType(value as typeof type)}
          >
            {sectionTypes.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`sectionTypes.${value}`)}
              </SelectItem>
            ))}
          </SelectField>
        </Field>
        <Button
          type="button"
          variant="outline"
          disabled={tour.sections.length >= 50}
          onClick={() =>
            update({
              ...tour,
              sections: [
                ...tour.sections,
                {
                  id: crypto.randomUUID(),
                  type,
                  title: blankText(),
                  body: blankText(),
                  items: blankList(),
                  visible: true,
                  position: tour.sections.length,
                },
              ],
            })
          }
        >
          <Plus data-icon="inline-start" />
          {t('addSection')}
        </Button>
      </FieldGroup>
    </div>
  )
}
export function MediaEditor({
  tour,
  update,
  onBusy,
}: {
  tour: Tour
  update: (tour: Tour) => void
  onBusy: (busy: boolean) => void
}) {
  const { t } = useTranslation('admin', { lng: 'es' })
  const coverId = tour.media.find((media) => !media.section_id)?.id
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  async function upload(file: File) {
    setBusy(true)
    onBusy(true)
    setError(null)
    try {
      const optimized = await optimizeImage(file)
      const body = new FormData()
      body.set('file', optimized.main)
      if (optimized.thumbnail) body.set('thumbnail', optimized.thumbnail)
      body.set('tourId', tour.id)
      const media = await request<{ id: string; path: string; url: string; thumbnail_url: string }>(
        '/admin/uploads',
        { method: 'POST', body },
        true,
      )
      update({
        ...tour,
        media: [
          ...tour.media,
          { ...media, alt: blankText(), section_id: null, position: tour.media.length },
        ],
      })
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('INVALID_UPLOAD'))
    } finally {
      setBusy(false)
      onBusy(false)
    }
  }
  return (
    <div className="editor-stack">
      <ImageUpload busy={busy} full={tour.media.length >= 50} onUpload={upload} />
      {error !== null && <ErrorState error={error} />}
      {tour.media.map((media, index) => (
        <section
          key={media.id}
          className={cn('editor-panel media-editor', media.id === coverId && 'media-editor-cover')}
        >
          <img src={media.url} alt={media.alt.es} width="320" height="220" />
          <FieldGroup>
            {media.id === coverId ? (
              <Alert variant="warning" role="status">
                <TriangleAlert aria-hidden="true" />
                <AlertTitle>{t('catalogCover')}</AlertTitle>
                <AlertDescription>{t('coverNotice')}</AlertDescription>
              </Alert>
            ) : (
              !media.section_id && <Badge variant="outline">{t('detailGallery')}</Badge>
            )}
            <BilingualField
              label={t('alt')}
              value={media.alt}
              onChange={(alt) =>
                update({
                  ...tour,
                  media: tour.media.map((m) => (m.id === media.id ? { ...m, alt } : m)),
                })
              }
            />
            <Field>
              <FieldLabel htmlFor={`gallery-${media.id}`}>{t('section')}</FieldLabel>
              <SelectField
                id={`gallery-${media.id}`}
                value={media.section_id ?? ''}
                onValueChange={(value) =>
                  update({
                    ...tour,
                    media: tour.media.map((m) =>
                      m.id === media.id ? { ...m, section_id: value || null } : m,
                    ),
                  })
                }
              >
                <SelectItem value={EMPTY_SELECT_VALUE}>{t('cover')}</SelectItem>
                {tour.sections
                  .filter((s) => s.type === 'gallery')
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title.es || t('sections')}
                    </SelectItem>
                  ))}
              </SelectField>
            </Field>
            <MoveButtons
              index={index}
              count={tour.media.length}
              move={(from, to) => update({ ...tour, media: reorder(tour.media, from, to) })}
              remove={() => update({ ...tour, media: tour.media.filter((m) => m.id !== media.id) })}
            />
          </FieldGroup>
        </section>
      ))}
    </div>
  )
}
