import type { Language } from '../../../shared/contracts'
export const locale = (lang: Language) => (lang === 'es' ? 'es-CR' : 'en-US')
export const money = (cents: number, lang: Language) =>
  new Intl.NumberFormat(locale(lang), {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'code',
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100)
export function todayDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  return `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}-${parts.find((p) => p.type === 'day')!.value}`
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function calendarDate(value: string, lang: Language) {
  return validDate(value)
    ? new Intl.DateTimeFormat(locale(lang), { dateStyle: 'long', timeZone: 'UTC' }).format(
        new Date(`${value}T12:00:00Z`),
      )
    : value
}
