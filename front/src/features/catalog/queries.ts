import { useQuery } from '@tanstack/react-query'
import { request } from '@/lib/api'
import { useParams } from 'react-router'
import type {
  Language,
  Tour,
  TourFilters,
  TourList,
  SiteSettings,
  LegalPage,
} from '../../../../shared/contracts'
export const useLang = (): Language => (useParams().lang === 'en' ? 'en' : 'es')
export function useTours(filters: TourFilters) {
  const lang = useLang()
  return useQuery({
    queryKey: ['tours', lang, filters],
    queryFn: async ({ signal }): Promise<TourList> => {
      return request(
        `/tours?${new URLSearchParams({ ...filters, page: String(filters.page), lang })}`,
        { signal },
      )
    },
  })
}
export function useTour(slug: string) {
  const lang = useLang()
  return useQuery<Tour>({
    queryKey: ['tour', lang, slug],
    // Every tour contains both translations. Keep its form mounted during a language change.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === slug ? previous : undefined,
    enabled: !!slug,
    queryFn: async ({ signal }): Promise<Tour> => {
      return request(`/tours/${encodeURIComponent(slug)}?lang=${lang}`, { signal })
    },
  })
}
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async ({ signal }): Promise<SiteSettings> => {
      return request('/settings', { signal })
    },
  })
}
export function useLegal(slug: 'privacy' | 'terms') {
  const lang = useLang()
  return useQuery({
    queryKey: ['legal', lang, slug],
    queryFn: ({ signal }) => request<LegalPage>(`/legal/${slug}`, { signal }),
  })
}
