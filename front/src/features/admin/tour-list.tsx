import { EMPTY_SELECT_VALUE } from '@/lib/select-values'
import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Eye, Trash2 } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAdminTours } from './queries'
import { MediaOptimization } from './media-optimization'
import { request } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { SelectField } from '@/components/select-field'
import { SelectItem } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { ErrorState, Loading } from '@/components/feedback'
import { StitchIcon } from '@/components/stitch-icon'
import { destinations, lowestPrice } from '../../../../shared/contracts'
import { money } from '@/i18n/format'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
export default function AdminTourList() {
  const { t } = useTranslation('admin', { lng: 'es' })
  const { t: common } = useTranslation('common', { lng: 'es' })
  const [{ q, status, destination }, setFilters] = useQueryStates({
    q: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
    destination: parseAsString.withDefault(''),
  })
  const query = useAdminTours()
  const client = useQueryClient()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  async function remove() {
    if (!deleting) return
    setBusy(true)
    try {
      await request(`/admin/tours/${deleting}`, { method: 'DELETE' }, true)
      await client.invalidateQueries()
      toast.success(t('deleted'))
      setDeleting(null)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }
  const tours = query.data?.filter(
    (t) =>
      (!status || t.status === status) &&
      (!destination || t.destination === destination) &&
      `${t.name.es} ${t.name.en}`.toLowerCase().includes(q.toLowerCase()),
  )
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>
            <StitchIcon name="anchor" />
            {t('catalog')}
          </h1>
          <p>{t('catalogBody')}</p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/admin-tours/tours/new">
            <Plus data-icon="inline-start" />
            {t('new')}
          </Link>
        </Button>
      </div>
      {query.isSuccess && <MediaOptimization />}
      <div className="stitch-admin-metrics">
        {(
          [
            {
              key: 'publishedCount',
              icon: 'kayaking',
              value: query.data?.filter((t) => t.status === 'published').length,
              hint: 'catalogReady',
            },
            {
              key: 'draftCount',
              icon: 'edit_note',
              value: query.data?.filter((t) => t.status === 'draft').length,
              hint: 'draftHint',
            },
            {
              key: 'archivedCount',
              icon: 'inventory_2',
              value: query.data?.filter((t) => t.status === 'archived').length,
              hint: 'archiveHint',
            },
            {
              key: 'planCount',
              icon: 'sailing',
              value: query.data?.reduce(
                (sum, t) => sum + t.plans.filter((p) => p.active).length,
                0,
              ),
              hint: 'planHint',
            },
          ] as const
        ).map((item) => (
          <div key={item.key}>
            <div>
              <span>{t(item.key)}</span>
              <strong>{item.value ?? '—'}</strong>
              <small>{t(item.hint)}</small>
            </div>
            <StitchIcon name={item.icon} />
          </div>
        ))}
      </div>
      <div className="stitch-admin-controls">
        <ToggleGroup
          type="single"
          value={destination || 'all'}
          onValueChange={(v) => void setFilters({ destination: v === 'all' ? '' : v })}
          className="stitch-location-tabs"
          aria-label={t('destination')}
        >
          <ToggleGroupItem value="all">{t('zoneAll')}</ToggleGroupItem>
          {destinations.map((d) => (
            <ToggleGroupItem key={d} value={d}>
              {common(`destinations.${d}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <FieldGroup className="admin-filters">
          <Field>
            <FieldLabel htmlFor="admin-search">{t('search')}</FieldLabel>
            <Input
              id="admin-search"
              value={q}
              onChange={(e) => void setFilters({ q: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="admin-status">{t('status')}</FieldLabel>
            <SelectField
              id="admin-status"
              value={status}
              onValueChange={(value) => void setFilters({ status: value })}
            >
              <SelectItem value={EMPTY_SELECT_VALUE}>{t('all')}</SelectItem>
              {(['draft', 'published', 'archived'] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {t(s)}
                </SelectItem>
              ))}
            </SelectField>
          </Field>
        </FieldGroup>
      </div>
      {error !== null && <ErrorState error={error} />}
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : tours?.length ? (
        <div className="admin-tour-list stitch-admin-tour-grid">
          {tours.map((tour) => (
            <Card asChild key={tour.id}>
              <article>
                <div className="admin-tour-thumb">
                  <Badge variant="outline" className="stitch-admin-tour-zone">
                    {common(`destinations.${tour.destination}`)}
                  </Badge>
                  <Badge
                    className="stitch-admin-tour-status"
                    variant={tour.status === 'published' ? 'secondary' : 'outline'}
                  >
                    {t(tour.status)}
                  </Badge>
                  {tour.media.find((m) => !m.section_id)?.url && (
                    <img
                      src={tour.media.find((m) => !m.section_id)?.thumbnail_url ?? tour.media.find((m) => !m.section_id)?.url}
                      alt=""
                      width="240"
                      height="160"
                      loading="lazy"
                    />
                  )}
                </div>
                <CardHeader className="admin-tour-summary">
                  <CardTitle asChild>
                    <h2>{tour.name.es || tour.slug}</h2>
                  </CardTitle>
                  <CardDescription asChild>
                    <p>{tour.summary.es}</p>
                  </CardDescription>
                </CardHeader>
                <CardContent className="admin-tour-details">
                  <div className="stitch-admin-tour-services">
                    {tour.plans
                      .find((p) => p.active)
                      ?.services.es.slice(0, 3)
                      .map((service, i) => (
                        <Badge variant="service" key={i}>
                          {service}
                        </Badge>
                      ))}
                  </div>
                  <div className="stitch-admin-tour-schedule">
                    <StitchIcon name="schedule" />
                    <span>{common('hours', { count: tour.duration_minutes / 60 })}</span>
                    <span>{tour.schedules.join(' · ')}</span>
                  </div>
                </CardContent>
                <CardFooter className="admin-tour-actions">
                  <strong className="stitch-admin-tour-price">
                    {lowestPrice(tour) === null
                      ? common('askPrice')
                      : money(lowestPrice(tour)!, 'es')}
                  </strong>
                  <div className="stitch-admin-action-group">
                    <Button asChild variant="soft">
                      <Link to={`/admin-tours/tours/${tour.id}`}>
                        <Pencil data-icon="inline-start" />
                        {t('edit')}
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" aria-label={t('preview')}>
                      <Link to={`/admin-tours/preview/${tour.id}`}>
                        <Eye />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('delete')}
                      onClick={() => setDeleting(tour.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </CardFooter>
              </article>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('empty')}</EmptyTitle>
            <EmptyDescription>{t('emptyBody')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault()
                void remove()
              }}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
