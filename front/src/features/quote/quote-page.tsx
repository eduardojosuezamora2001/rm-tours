import { EMPTY_SELECT_VALUE } from '@/lib/select-values'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAsString, useQueryStates } from 'nuqs'
import { useQuery } from '@tanstack/react-query'
import { Copy, MessageCircle, ArrowRight, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useLang, useSettings, useTour } from '@/features/catalog/queries'
import { request } from '@/lib/api'
import type { Tour } from '../../../../shared/contracts'
import { money, todayDate } from '@/i18n/format'
import { quoteSchema, buildMessage, whatsappUrl, type QuoteValues } from './model'
import { Metadata } from '@/components/metadata'
import { ErrorState } from '@/components/feedback'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldSet,
  FieldLegend,
  FieldDescription,
} from '@/components/ui/field'
import { SelectField } from '@/components/select-field'
import { SelectItem } from '@/components/ui/select'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
export default function QuotePage({ embeddedTour }: { embeddedTour?: Tour } = {}) {
  const { t } = useTranslation('quote')
  const { t: common } = useTranslation()
  const lang = useLang()
  const [{ tour: selectedSlug, plan: planId }, setSelection] = useQueryStates({
    tour: parseAsString.withDefault(''),
    plan: parseAsString.withDefault(''),
  })
  const options = useQuery({
    queryKey: ['tour-options', lang],
    queryFn: ({ signal }): Promise<Pick<Tour, 'id' | 'slug' | 'name'>[]> =>
      request('/tour-options', { signal }),
  })
  const slug = embeddedTour?.slug ?? selectedSlug
  const query = useTour(slug)
  const settings = useSettings()
  const tour = embeddedTour ?? query.data
  const plan =
    tour?.plans.find((p) => p.id === planId && p.active) ??
    (!planId ? tour?.plans.find((p) => p.active) : undefined)
  const schema = useMemo(() => quoteSchema(t), [t])
  const form = useForm<QuoteValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      date: '',
      adults: 1,
      children: 0,
      participants: [{ name: '', age: '' }],
      schedule: '',
      notes: '',
      consent: false,
    },
  })
  const { errors } = form.formState
  const participants = useFieldArray({ control: form.control, name: 'participants' })
  function changeCount(name: 'adults' | 'children', value: number) {
    form.setValue(name, value, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })
    const { adults, children } = form.getValues()
    if (
      Number.isInteger(adults) && adults >= 1 && adults <= 99 &&
      Number.isInteger(children) && children >= 0 && children <= 99
    ) {
      const total = adults + children
      const current = form.getValues('participants').length
      if (total > current) {
        participants.append(Array.from({ length: total - current }, () => ({ name: '', age: '' })), {
          shouldFocus: false,
        })
      } else if (total < current) {
        participants.remove(Array.from({ length: current - total }, (_, index) => total + index))
      }
    }
    setSubmitted(null)
  }
  const {
    trigger,
    formState: { isSubmitted },
  } = form
  useEffect(() => {
    if (isSubmitted) void trigger()
  }, [lang, trigger, isSubmitted])
  const [submitted, setSubmitted] = useState<QuoteValues | null>(null)
  const readyHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (submitted && readyHeading.current) {
      readyHeading.current.focus({ preventScroll: true })
      readyHeading.current.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [submitted])
  const [selectionError, setSelectionError] = useState(false)
  const [freshError, setFreshError] = useState<unknown>(null)
  const message =
    submitted && tour && plan
      ? buildMessage(submitted, tour, plan, lang, t, window.location.origin)
      : ''
  const url = whatsappUrl(settings.data?.whatsapp ?? '', message)
  async function submit(values: QuoteValues) {
    setFreshError(null)
    const refreshed = await query.refetch()
    if (refreshed.error) {
      setFreshError(refreshed.error)
      return
    }
    const current = refreshed.data
    if (
      !current ||
      current.status !== 'published' ||
      !current.plans.some((p) => p.id === plan?.id && p.active) ||
      (values.schedule && !current.schedules.includes(values.schedule))
    ) {
      setSelectionError(true)
      return
    }
    setSelectionError(false)
    setSubmitted(values)
  }
  const fields = [
    'name',
    'phone',
    'email',
    'date',
    'schedule',
    'adults',
    'children',
  ] as const
  return (
    <div
      className={embeddedTour ? 'stitch-embedded-quote' : 'container page-pad stitch-quote-page'}
    >
      {!embeddedTour && <Metadata title={t('title')} description={t('subtitle')} />}
      <div className="quote-heading">
        {embeddedTour ? <h2>{t('title')}</h2> : <h1>{t('title')}</h1>}
        <p>{t('subtitle')}</p>
      </div>
      <div className="quote-columns">
        <form noValidate onSubmit={form.handleSubmit(submit)} onChange={() => setSubmitted(null)}>
          <FieldGroup>
            {!embeddedTour && (
              <Field>
                <FieldLabel htmlFor="quote-tour">{t('tour')}</FieldLabel>
                <SelectField
                  id="quote-tour"
                  value={slug}
                  onValueChange={(value) => {
                    void setSelection({ tour: value, plan: '' })
                    setSubmitted(null)
                    form.setValue('schedule', '')
                  }}
                >
                  <SelectItem value={EMPTY_SELECT_VALUE}>{t('chooseTour')}</SelectItem>
                  {options.data?.map((option) => (
                    <SelectItem key={option.id} value={option.slug}>
                      {option.name[lang]}
                    </SelectItem>
                  ))}
                </SelectField>
              </Field>
            )}
            {options.isError && (
              <ErrorState error={options.error} retry={() => void options.refetch()} />
            )}
            {slug && query.isError && (
              <ErrorState error={query.error} retry={() => void query.refetch()} />
            )}
            <Field>
              <FieldLabel htmlFor="quote-plan">{t('plan')}</FieldLabel>
              <SelectField
                id="quote-plan"
                value={plan?.id ?? ''}
                onValueChange={(value) => {
                  void setSelection({ plan: value })
                  setSubmitted(null)
                }}
                disabled={!tour}
              >
                <SelectItem value={EMPTY_SELECT_VALUE} disabled>
                  {t('choosePlan')}
                </SelectItem>
                {tour?.plans
                  .filter((p) => p.active)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name[lang]}
                    </SelectItem>
                  ))}
              </SelectField>
            </Field>
            <FieldGroup className="form-grid">
              {fields.map((name) =>
                name === 'schedule' ? (
                  tour?.schedules.length ? (
                    <Field key={name} data-field="schedule">
                      <FieldLabel htmlFor="quote-schedule">{t('schedule')}</FieldLabel>
                      <Controller
                        control={form.control}
                        name="schedule"
                        render={({ field }) => (
                          <SelectField
                            id="quote-schedule"
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)
                              setSubmitted(null)
                            }}
                          >
                            <SelectItem value={EMPTY_SELECT_VALUE}>{t('anySchedule')}</SelectItem>
                            {tour.schedules.map((time) => (
                              <SelectItem value={time} key={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectField>
                        )}
                      />
                    </Field>
                  ) : null
                ) : (
                  <Field key={name} data-field={name} data-invalid={!!errors[name]}>
                    <FieldLabel htmlFor={`quote-${name}`}>{t(name)}</FieldLabel>
                    {name === 'adults' || name === 'children' ? (
                      <Controller
                        control={form.control}
                        name={name}
                        render={({ field }) => (
                          <InputGroup className="stitch-participant-control">
                            <InputGroupInput
                              id={`quote-${name}`}
                              type="number"
                              min={name === 'adults' ? 1 : 0}
                              max={99}
                              autoComplete="off"
                              aria-invalid={!!errors[name]}
                              aria-describedby={
                                errors[name] ? `error-${name}` : undefined
                              }
                              ref={field.ref}
                              name={field.name}
                              value={Number.isFinite(field.value) ? field.value : ''}
                              onBlur={field.onBlur}
                              onChange={(event) => changeCount(name, event.target.valueAsNumber)}
                            />
                            <InputGroupAddon align="inline-start">
                              <InputGroupButton
                                size="icon-sm"
                                type="button"
                                aria-label={t('decrease', { field: t(name) })}
                                disabled={field.value <= (name === 'adults' ? 1 : 0)}
                                onClick={() => {
                                  changeCount(
                                    name,
                                    Math.max(name === 'adults' ? 1 : 0, (field.value || 0) - 1),
                                  )
                                }}
                              >
                                <Minus />
                              </InputGroupButton>
                            </InputGroupAddon>
                            <InputGroupAddon align="inline-end">
                              <InputGroupButton
                                size="icon-sm"
                                type="button"
                                aria-label={t('increase', { field: t(name) })}
                                disabled={field.value >= 99}
                                onClick={() => {
                                  changeCount(name, Math.min(99, (field.value || 0) + 1))
                                }}
                              >
                                <Plus />
                              </InputGroupButton>
                            </InputGroupAddon>
                          </InputGroup>
                        )}
                      />
                    ) : (
                      <Input
                        id={`quote-${name}`}
                        aria-invalid={!!errors[name]}
                        aria-describedby={errors[name] ? `error-${name}` : undefined}
                        type={
                          name === 'email'
                            ? 'email'
                            : name === 'date'
                              ? 'date'
                              : name === 'phone'
                                ? 'tel'
                                : 'text'
                        }
                        autoComplete={
                          name === 'name'
                            ? 'name'
                            : name === 'phone'
                              ? 'tel'
                              : name === 'email'
                                ? 'email'
                                : 'off'
                        }
                        min={name === 'date' ? todayDate() : undefined}
                        {...form.register(name)}
                      />
                    )}
                    {errors[name] && (
                      <FieldError id={`error-${name}`}>
                        {errors[name]?.message}
                      </FieldError>
                    )}
                  </Field>
                ),
              )}
            </FieldGroup>
            <FieldSet>
              <FieldLegend>{t('participants')}</FieldLegend>
              <FieldDescription>{t('participantsDescription')}</FieldDescription>
              <FieldGroup>
                {participants.fields.map((participant, index) => (
                  <FieldSet key={participant.id} data-participant={index}>
                    <FieldLegend variant="label">
                      {t('participant', { number: index + 1 })}
                    </FieldLegend>
                    <FieldGroup className="form-grid">
                      {(['name', 'age'] as const).map((name) => {
                        const error = errors.participants?.[index]?.[name]
                        const id = `quote-participant-${index}-${name}`
                        return (
                          <Field key={name} data-invalid={!!error}>
                            <FieldLabel htmlFor={id}>{t(name)}</FieldLabel>
                            <Input
                              id={id}
                              type={name === 'age' ? 'number' : 'text'}
                              min={name === 'age' ? 0 : undefined}
                              max={name === 'age' ? 120 : undefined}
                              step={name === 'age' ? 1 : undefined}
                              maxLength={name === 'name' ? 150 : undefined}
                              autoComplete="off"
                              aria-invalid={!!error}
                              aria-describedby={error ? `${id}-error` : undefined}
                              {...form.register(`participants.${index}.${name}`)}
                            />
                            {error && <FieldError id={`${id}-error`}>{error.message}</FieldError>}
                          </Field>
                        )
                      })}
                    </FieldGroup>
                  </FieldSet>
                ))}
              </FieldGroup>
              {errors.participants?.root && (
                <FieldError>{errors.participants.root.message}</FieldError>
              )}
            </FieldSet>
            <Field>
              <FieldLabel htmlFor="quote-notes">{t('notes')}</FieldLabel>
              <Textarea id="quote-notes" rows={4} maxLength={1500} {...form.register('notes')} />
            </Field>
            <Controller
              control={form.control}
              name="consent"
              render={({ field }) => (
                <Field data-invalid={!!errors.consent}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="quote-consent"
                      checked={field.value}
                      aria-invalid={!!errors.consent}
                      onCheckedChange={(value) => {
                        field.onChange(value === true)
                        setSubmitted(null)
                      }}
                    />
                    <FieldLabel htmlFor="quote-consent">{t('consent')}</FieldLabel>
                  </div>
                  <Link className="text-sm underline" to={`/${lang}/privacidad`}>
                    {common('privacy')}
                  </Link>
                  {errors.consent && (
                    <FieldError>{errors.consent.message}</FieldError>
                  )}
                </Field>
              )}
            />
            {selectionError && (
              <Alert variant="destructive">
                <AlertTitle>{t('invalidSelection')}</AlertTitle>
              </Alert>
            )}
            {freshError !== null && <ErrorState error={freshError} />}
            <Button
              variant="coral"
              size="lg"
              type="submit"
              disabled={!tour || !plan || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? common('loading') : t('prepare')}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </FieldGroup>
        </form>
        {!embeddedTour && (
          <aside className="quote-summary">
            {tour && (
              <>
                {tour.media.find((m) => !m.section_id)?.url && (
                  <img
                    src={tour.media.find((m) => !m.section_id)?.url}
                    alt={tour.media.find((m) => !m.section_id)?.alt[lang] ?? ''}
                    width="640"
                    height="440"
                  />
                )}
                <h2>{tour.name[lang]}</h2>
                <p>{plan?.name[lang]}</p>
                <strong>
                  {plan?.price_cents === null || plan?.price_cents === undefined
                    ? common('askPrice')
                    : money(plan.price_cents, lang)}
                </strong>
              </>
            )}
            <p>{t('notice')}</p>
          </aside>
        )}
      </div>
      {submitted && (
        <section className="prepared-message" aria-live="polite">
          <h2 ref={readyHeading} tabIndex={-1}>
            {t('ready')}
          </h2>
          <p>{t('readyBody')}</p>
          <pre>{message}</pre>
          <div className="flex flex-wrap gap-3">
            {url ? (
              <Button asChild size="lg" variant="secondary">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <MessageCircle data-icon="inline-start" />
                  {t('continue')}
                </a>
              </Button>
            ) : (
              <Alert>
                <AlertTitle>{t('notConfigured')}</AlertTitle>
                <AlertDescription>{t('notice')}</AlertDescription>
              </Alert>
            )}
            <Button
              variant="outline"
              onClick={() =>
                void navigator.clipboard
                  .writeText(message)
                  .then(() => toast.success(t('copied')))
                  .catch(() => toast.error(t('copyFailed')))
              }
            >
              <Copy data-icon="inline-start" />
              {t('copy')}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
