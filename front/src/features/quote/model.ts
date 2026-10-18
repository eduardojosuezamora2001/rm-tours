import { z } from 'zod'
import type { TFunction } from 'i18next'
import { calendarDate, todayDate, validDate } from '@/i18n/format'
import type { Language, Plan, Tour } from '../../../../shared/contracts'
export function quoteSchema(t: TFunction<'quote'>) {
  const required = z.string().trim().min(1, t('required')).max(150)
  return z.object({
    name: required,
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s()-]{8,25}$/, t('invalidPhone'))
      .refine(
        (v) => v.replace(/\D/g, '').length >= 8 && v.replace(/\D/g, '').length <= 15,
        t('invalidPhone'),
      ),
    email: z.email(t('invalidEmail')).max(254),
    date: z.string().refine((value) => validDate(value) && value >= todayDate(), t('invalidDate')),
    adults: z
      .number()
      .int(t('invalidCount', { min: 1 }))
      .min(1, t('invalidCount', { min: 1 }))
      .max(99, t('invalidCount', { min: 1 })),
    children: z
      .number()
      .int(t('invalidCount', { min: 0 }))
      .min(0, t('invalidCount', { min: 0 }))
      .max(99, t('invalidCount', { min: 0 })),
    nationality: required,
    schedule: z.string().max(100),
    notes: z.string().trim().max(1500),
    consent: z.boolean().refine(Boolean, t('consentRequired')),
  })
}
export type QuoteValues = z.infer<ReturnType<typeof quoteSchema>>
export function buildMessage(
  values: QuoteValues,
  tour: Tour,
  plan: Plan,
  lang: Language,
  t: TFunction<'quote'>,
  origin: string,
) {
  const fields: [string, string | number][] = [
    ['tour', tour.name[lang]],
    ['plan', plan.name[lang]],
    ['name', values.name],
    ['phone', values.phone],
    ['email', values.email],
    ['date', calendarDate(values.date, lang)],
    ['adults', values.adults],
    ['children', values.children],
    ['nationality', values.nationality],
  ]
  if (values.schedule) fields.push(['schedule', values.schedule])
  if (values.notes) fields.push(['notes', values.notes])
  return [
    t('messageIntro'),
    '',
    ...fields.map(([key, value]) => `${t(key as 'name')}: ${value}`),
    '',
    `${t('link')}: ${origin}/${lang}/tours/${tour.slug}`,
    '',
    t('messageEnd'),
  ].join('\n')
}
export function whatsappUrl(phone: string, message: string) {
  return /^[1-9]\d{7,14}$/.test(phone)
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : null
}
