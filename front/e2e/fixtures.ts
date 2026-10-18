import { test as base, expect } from '@playwright/test'
import { testTours } from '../../shared/testing/tours'
import { filterTours, type TourFilters } from '../../shared/contracts'
import { readFile } from 'node:fs/promises'

export const test = base.extend<{ backendOnly: void }>({
  backendOnly: [
    async ({ page }, use) => {
      const direct: string[] = []
      page.on('request', (request) => {
        if (/https?:\/\/[^/]*\.supabase\.(co|in)\//.test(request.url())) direct.push(request.url())
      })
      // No browser test should accidentally authenticate against the real local backend.
      await page.route('**/api/v1/**', (route) => {
        const url = new URL(route.request().url())
        const path = url.pathname.replace('/api/v1', '')
        if (path === '/settings')
          return route.fulfill({
            json: {
              whatsapp: '',
              email: '',
              location: { es: '', en: '' },
              hours: { es: '', en: '' },
              intro: { es: '', en: '' },
            },
          })
        if (path === '/tour-options')
          return route.fulfill({
            json: testTours.map(({ id, slug, name }) => ({ id, slug, name })),
          })
        if (path === '/tours')
          return route.fulfill({
            json: filterTours(
              testTours,
              {
                q: url.searchParams.get('q') ?? '',
                destination: url.searchParams.get('destination') ?? '',
                category: url.searchParams.get('category') ?? '',
                sort: (url.searchParams.get('sort') ?? 'recommended') as TourFilters['sort'],
                page: Number(url.searchParams.get('page') ?? 1),
              },
              url.searchParams.get('lang') === 'en' ? 'en' : 'es',
            ),
          })
        if (path.startsWith('/tours/')) {
          const tour = testTours.find(
            (item) => item.slug === decodeURIComponent(path.slice('/tours/'.length)),
          )
          if (tour) return route.fulfill({ json: tour })
        }
        return route.fulfill({
          status: route.request().url().includes('/admin/') ? 401 : 404,
          json: {
            error: {
              code: route.request().url().includes('/admin/') ? 'UNAUTHORIZED' : 'NOT_FOUND',
            },
          },
        })
      })
      await page.route(/\/api\/v1\/(?:admin\/)?media\//, async (route) =>
        route.fulfill({
          contentType: 'image/jpeg',
          body: await readFile(new URL('../../shared/testing/tour.jpg', import.meta.url)),
        }),
      )
      await use()
      expect(direct, 'The browser must only use the backend for Supabase resources').toEqual([])
    },
    { auto: true },
  ],
})
export { expect }
