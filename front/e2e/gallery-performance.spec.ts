import { readFile } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
import { test, expect } from './fixtures'
import { testTours } from '../../shared/testing/tours'

const tour = {
  ...testTours[0],
  media: testTours[0].media.map((photo) => ({ ...photo, thumbnail_url: `${photo.url}?variant=card` })),
}

test('preloads adjacent photos and switches without downloading them again', async ({ page }, testInfo) => {
  const bytes = await readFile(new URL('../../shared/testing/tour.jpg', import.meta.url))
  const requests = new Map<string, number>()
  const completed = new Set<string>()
  let prematurePreload = false
  await page.addInitScript(() => {
    const active = new Set<string>()
    const create = URL.createObjectURL.bind(URL)
    const revoke = URL.revokeObjectURL.bind(URL)
    Object.assign(window, { viewerObjectUrls: active })
    URL.createObjectURL = (blob) => {
      const url = create(blob)
      active.add(url)
      return url
    }
    URL.revokeObjectURL = (url) => { active.delete(url); revoke(url) }
  })
  await page.route('**/api/v1/tours/bioluminiscencia-paquera*', (route) => route.fulfill({ json: tour }))
  await page.route('**/api/v1/media/**', async (route) => {
    const request = route.request()
    const source = new URL(request.url()).pathname
    const viewer = request.resourceType() === 'fetch'
    if (viewer) {
      if (source !== tour.media[0].url && !completed.has(tour.media[0].url!)) prematurePreload = true
      requests.set(source, (requests.get(source) ?? 0) + 1)
      await new Promise((resolve) => setTimeout(resolve, 800))
    }
    await route.fulfill({ contentType: 'image/jpeg', body: bytes, headers: { 'Cache-Control': 'private, no-store' } })
    if (viewer) completed.add(source)
  })
  await page.goto('/en/tours/bioluminiscencia-paquera')
  await page.locator('#quote-name').fill('Preserved enquiry')
  await expect(page.locator('.tour-gallery-main img')).toHaveAttribute('alt', tour.media[0].alt.en)
  await expect.poll(() => completed.has(tour.media[1].url!) && completed.has(tour.media.at(-1)!.url!)).toBe(true)
  expect([...requests.keys()].sort()).toEqual([tour.media[0].url, tour.media[1].url, tour.media.at(-1)!.url].sort())
  expect(prematurePreload).toBe(false)

  const galleryLatency = await page.evaluate(async (alt) => {
    const gallery = document.querySelector('.tour-gallery')!
    const start = performance.now()
    gallery.querySelector<HTMLButtonElement>('button[aria-label="Next"]')!.click()
    await new Promise<void>((resolve) => {
      function painted() {
        const image = gallery.querySelector<HTMLImageElement>('.tour-gallery-main img')
        if (image?.alt === alt && image.complete && image.naturalWidth > 0) resolve()
        else requestAnimationFrame(painted)
      }
      requestAnimationFrame(painted)
    })
    return performance.now() - start
  }, tour.media[1].alt.en)
  expect(galleryLatency).toBeLessThan(400)
  console.log(`${testInfo.project.name}: inline gallery photo painted in ${galleryLatency.toFixed(1)}ms with 800ms image responses`)
  await expect(page.locator('.tour-gallery-count')).toHaveText('2 / 6')
  await expect(page.getByRole('radio', { name: 'Show photo 2', exact: true })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radio', { name: 'Show photo 6', exact: true }).click()
  await expect(page.locator('.tour-gallery-main img')).toHaveAttribute('alt', tour.media.at(-1)!.alt.en)
  await page.locator('.tour-gallery').getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.tour-gallery-main img')).toHaveAttribute('alt', tour.media[0].alt.en)
  await page.getByRole('button', { name: 'View photo 1', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('img', { name: tour.media[0].alt.en })).toBeVisible()

  const latency = await page.evaluate(async (alt) => {
    const dialog = document.querySelector('[role="dialog"]')!
    const start = performance.now()
    dialog.querySelector<HTMLButtonElement>('button[aria-label="Next"]')!.click()
    await new Promise<void>((resolve) => {
      function painted() {
        const image = dialog.querySelector('img')
        if (image?.alt === alt && image.complete && image.naturalWidth > 0) resolve()
        else requestAnimationFrame(painted)
      }
      requestAnimationFrame(painted)
    })
    return performance.now() - start
  }, tour.media[1].alt.en)
  expect(latency).toBeLessThan(400)
  console.log(`${testInfo.project.name}: cached photo painted in ${latency.toFixed(1)}ms with 800ms image responses`)

  await page.keyboard.press('ArrowLeft')
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', tour.media[0].alt.en)
  await page.keyboard.press('ArrowLeft')
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', tour.media.at(-1)!.alt.en)
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', tour.media[1].alt.en)
  expect(requests.get(tour.media[0].url!)).toBe(1)
  expect(requests.get(tour.media[1].url!)).toBe(1)
  expect(requests.get(tour.media.at(-1)!.url!)).toBe(1)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('#quote-name')).toHaveValue('Preserved enquiry')
  // Closing the modal keeps the page's decoded photos reusable; leaving the tour releases them.
  expect(await page.evaluate(() => (window as unknown as { viewerObjectUrls: Set<string> }).viewerObjectUrls.size)).toBeGreaterThan(0)
  await page.locator('a[href="/en/tours"]:visible').first().click()
  await expect(page.locator('.tour-gallery')).toHaveCount(0)
  expect(await page.evaluate(() => (window as unknown as { viewerObjectUrls: Set<string> }).viewerObjectUrls.size)).toBe(0)
})

test('inline gallery retries failures and keeps the latest thumbnail during slow downloads', async ({ page }, testInfo) => {
  const bytes = await readFile(new URL('../../shared/testing/tour.jpg', import.meta.url))
  let failSecond = true
  let thirdCompleted = false
  await page.route('**/api/v1/tours/bioluminiscencia-paquera*', (route) => route.fulfill({ json: tour }))
  await page.route('**/api/v1/media/**', async (route) => {
    const source = new URL(route.request().url()).pathname
    const original = route.request().resourceType() === 'fetch'
    if (original && source === tour.media[1].url && failSecond) return route.fulfill({ status: 503 })
    if (original) await new Promise((resolve) => setTimeout(resolve, source === tour.media[2].url ? 1500 : 100))
    await route.fulfill({ contentType: 'image/jpeg', body: bytes, headers: { 'Cache-Control': 'private, no-store' } })
    if (original && source === tour.media[2].url) thirdCompleted = true
  })
  await page.goto('/en/tours/bioluminiscencia-paquera')
  const gallery = page.locator('.tour-gallery')
  await expect(gallery.getByRole('img')).toHaveAttribute('alt', tour.media[0].alt.en)
  await page.locator('#quote-name').fill('Enquiry stays in memory')
  await gallery.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(gallery.getByText('This photo could not be loaded.')).toBeVisible()
  failSecond = false
  await gallery.getByRole('button', { name: 'Try again' }).click()
  await expect(gallery.getByRole('img')).toHaveAttribute('alt', tour.media[1].alt.en)
  await page.getByRole('radio', { name: 'Show photo 3', exact: true }).click()
  await page.getByRole('radio', { name: 'Show photo 4', exact: true }).click()
  await expect(gallery.getByRole('img')).toHaveAttribute('alt', tour.media[3].alt.en)
  await expect.poll(() => thirdCompleted).toBe(true)
  await expect(gallery.getByRole('img')).toHaveAttribute('alt', tour.media[3].alt.en)
  await expect(gallery.locator('.tour-gallery-stage')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('#quote-name')).toHaveValue('Enquiry stays in memory')
  await gallery.screenshot({ path: `../.impeccable/review/inline-gallery-${testInfo.project.name}-light.png` })
  await page.getByRole('button', { name: 'Change theme', exact: true }).click()
  await gallery.screenshot({ path: `../.impeccable/review/inline-gallery-${testInfo.project.name}-dark.png` })
  const accessibility = await new AxeBuilder({ page }).include('.tour-gallery').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(accessibility.violations).toEqual([])
})

test('handles failed images and rapid arrows without showing stale photos', async ({ page }, testInfo) => {
  const bytes = await readFile(new URL('../../shared/testing/tour.jpg', import.meta.url))
  let failSecond = true
  let thirdCompleted = false
  await page.route('**/api/v1/tours/bioluminiscencia-paquera*', (route) => route.fulfill({ json: tour }))
  await page.route('**/api/v1/media/**', async (route) => {
    const source = new URL(route.request().url()).pathname
    const viewer = route.request().resourceType() === 'fetch'
    if (viewer && source === tour.media[1].url && failSecond) {
      return route.fulfill({ status: 503 })
    }
    if (viewer) await new Promise((resolve) => setTimeout(resolve, source === tour.media[2].url ? 1500 : 100))
    await route.fulfill({ contentType: 'image/jpeg', body: bytes, headers: { 'Cache-Control': 'private, no-store' } })
    if (viewer && source === tour.media[2].url) thirdCompleted = true
  })
  await page.goto('/en/tours/bioluminiscencia-paquera')
  await page.getByRole('button', { name: 'View photo 1', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('img')).toBeVisible()
  await dialog.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(dialog.getByText('This photo could not be loaded.')).toBeVisible()
  failSecond = false
  await dialog.getByRole('button', { name: 'Try again' }).click()
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', tour.media[1].alt.en)
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', tour.media[3].alt.en)
  await expect(dialog.getByText('4 / 6')).toBeVisible()
  await expect.poll(() => thirdCompleted).toBe(true)
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', tour.media[3].alt.en)
  await expect(dialog.locator('[aria-busy]')).toHaveAttribute('aria-busy', 'false')
  await page.screenshot({ path: `../.impeccable/review/photo-viewer-${testInfo.project.name}-light.png` })
  const accessibility = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(accessibility.violations).toEqual([])
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Change theme', exact: true }).click()
  await page.getByRole('button', { name: 'View photo 1', exact: true }).click()
  await expect(dialog.getByRole('img')).toBeVisible()
  await page.screenshot({ path: `../.impeccable/review/photo-viewer-${testInfo.project.name}-dark.png` })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
