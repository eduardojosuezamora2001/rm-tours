export const languages = ['es', 'en'] as const
export type Language = (typeof languages)[number]
export type Localized = Record<Language, string>
export type LocalizedList = Record<Language, string[]>
export const destinations = ['paquera', 'tambor', 'montezuma', 'santa-teresa'] as const
export const categories = ['ocean', 'nature', 'night', 'adventure', 'fishing'] as const
export const sectionTypes = ['description', 'gallery', 'included', 'rules', 'notice'] as const
export type TourStatus = 'draft' | 'published' | 'archived'
export type SectionType = (typeof sectionTypes)[number]
export interface Plan {
  id: string
  name: Localized
  description: Localized
  services: LocalizedList
  price_cents: number | null
  price_unit: 'person' | 'group' | 'hour'
  active: boolean
  position: number
}
export interface TourSection {
  id: string
  type: SectionType
  title: Localized
  body: Localized
  items: LocalizedList
  visible: boolean
  position: number
}
export interface TourMedia {
  id: string
  path: string
  alt: Localized
  section_id: string | null
  position: number
  url?: string
}
export interface Tour {
  id: string
  slug: string
  name: Localized
  summary: Localized
  destination: (typeof destinations)[number]
  category: (typeof categories)[number]
  duration_minutes: number
  meeting_point: Localized
  schedules: string[]
  status: TourStatus
  featured: boolean
  position: number
  updated_at: string
  plans: Plan[]
  sections: TourSection[]
  media: TourMedia[]
}
export interface SiteSettings {
  whatsapp: string
  email: string
  location: Localized
  hours: Localized
  intro: Localized
}
export interface LegalPage {
  slug: 'privacy' | 'terms'
  title: Localized
  body: Localized
  published: boolean
}
export interface TourFilters {
  q: string
  destination: string
  category: string
  sort: 'recommended' | 'price-asc' | 'duration-desc'
  page: number
}
export interface TourList {
  items: Tour[]
  total: number
  page: number
  pageSize: number
}
export const blankText = (): Localized => ({ es: '', en: '' })
export const blankList = (): LocalizedList => ({ es: [], en: [] })
export function lowestPrice(tour: Pick<Tour, 'plans'>): number | null {
  const prices = tour.plans
    .filter((p) => p.active && p.price_cents !== null)
    .map((p) => p.price_cents as number)
  return prices.length ? Math.min(...prices) : null
}
export function publicationErrors(tour: Tour): string[] {
  const errors: string[] = []
  const complete = (value: Localized) => languages.every((lang) => value[lang].trim().length > 0)
  if (!complete(tour.name) || !complete(tour.summary) || !complete(tour.meeting_point))
    errors.push('TOUR_TRANSLATIONS_REQUIRED')
  const active = tour.plans.filter((p) => p.active)
  if (!active.length) errors.push('ACTIVE_PLAN_REQUIRED')
  if (
    active.some(
      (p) =>
        !complete(p.name) ||
        !complete(p.description) ||
        !p.services.es.length ||
        !p.services.en.length ||
        p.services.es.length !== p.services.en.length,
    )
  )
    errors.push('PLAN_TRANSLATIONS_REQUIRED')
  if (!tour.media.some((m) => m.section_id === null)) errors.push('COVER_REQUIRED')
  if (tour.media.some((m) => !complete(m.alt))) errors.push('IMAGE_TRANSLATIONS_REQUIRED')
  if (
    tour.sections.some(
      (s) =>
        s.visible &&
        (!complete(s.title) ||
          (s.type === 'gallery'
            ? !tour.media.some((m) => m.section_id === s.id)
            : !complete(s.body) && (!s.items.es.length || !s.items.en.length)) ||
          s.items.es.length !== s.items.en.length),
    )
  )
    errors.push('SECTION_TRANSLATIONS_REQUIRED')
  return errors
}
export function filterTours(
  tours: Tour[],
  filters: TourFilters,
  lang: Language,
  pageSize = 9,
): TourList {
  const query = filters.q.trim().toLocaleLowerCase()
  const items = tours.filter(
    (t) =>
      t.status === 'published' &&
      (!filters.destination || t.destination === filters.destination) &&
      (!filters.category || t.category === filters.category) &&
      (!query || `${t.name[lang]} ${t.summary[lang]}`.toLocaleLowerCase().includes(query)),
  )
  items.sort((a, b) =>
    filters.sort === 'price-asc'
      ? (lowestPrice(a) ?? Infinity) - (lowestPrice(b) ?? Infinity)
      : filters.sort === 'duration-desc'
        ? b.duration_minutes - a.duration_minutes
        : Number(b.featured) - Number(a.featured) ||
          a.position - b.position ||
          a.slug.localeCompare(b.slug),
  )
  const page = Math.max(1, filters.page)
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  }
}
