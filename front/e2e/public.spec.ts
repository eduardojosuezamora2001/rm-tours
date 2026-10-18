import { chooseSelect } from './select'
import { test, expect } from './fixtures'
import AxeBuilder from '@axe-core/playwright'
import { mkdir } from 'node:fs/promises'
import { testTours } from '../../shared/testing/tours'
const review = '../.impeccable/review'
test('detail enquiry preserves its plan and personal data when changing language', async ({
  page,
}, testInfo) => {
  const plan = '10000000-0000-4000-8000-000000000001'
  await page.goto(`/es/tours/bioluminiscencia-paquera?plan=${plan}`)
  await expect(page.locator('#quote-name')).toBeVisible()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({
    path: `${review}/detail-bio-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await page.locator('#quote-name').fill('Consulta en memoria')
  await chooseSelect(page.getByRole('combobox', { name: 'Cambiar idioma', exact: true }), 'EN')
  await expect(page.locator('#quote-name')).toHaveValue('Consulta en memoria')
  await expect(page.locator('#quote-plan')).toHaveText('General')
  await expect(page).toHaveURL(new RegExp(`/en/tours/bioluminiscencia-paquera\\?plan=${plan}`))
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})
test('catalogue filters, URL state, languages, accessibility and responsive layout', async ({
  page,
}, testInfo) => {
  await page.goto('/es/tours')
  await expect(page.getByRole('heading', { name: 'Catálogo de Tours & Aventuras' })).toBeVisible()
  await expect(page.locator('.tour-card')).toHaveCount(8)
  await page.getByRole('radio', { name: 'Paquera', exact: true }).click()
  await expect(page.locator('.tour-card')).toHaveCount(3)
  await expect(page).toHaveURL(/destination=paquera/)
  await chooseSelect(page.getByRole('combobox', { name: 'Cambiar idioma', exact: true }), 'EN')
  await expect(page.getByRole('heading', { name: 'Tours & Adventures Catalogue' })).toBeVisible()
  await expect(page).toHaveURL(/\/en\/tours\?destination=paquera/)
  await page.reload()
  await expect(page.getByRole('radio', { name: 'Paquera', exact: true })).toBeChecked()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(accessibility.violations).toEqual([])
  await page.getByRole('radio', { name: 'All', exact: true }).first().click()
  await page.locator('.tour-card:visible').last().scrollIntoViewIfNeeded()
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('.tour-photo img')).every(
      (image) =>
        (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
    ),
  )
  await mkdir(review, { recursive: true })
  await page.evaluate(() => {
    ;(document.activeElement as HTMLElement)?.blur()
    window.scrollTo({ top: 0, behavior: 'instant' })
  })
  await page.screenshot({
    path: `${review}/${testInfo.project.name === 'mobile' ? 'mobile' : 'desktop'}.png`,
    fullPage: true,
  })
})
test('quote retains personal data when switching language and prepares a message without persisting it', async ({
  page,
}, testInfo) => {
  await page.goto('/es/cotizar?tour=bioluminiscencia-paquera')
  await page.locator('#quote-name').fill('Ana Prueba')
  await page.locator('#quote-phone').fill('+50688880000')
  await page.locator('#quote-email').fill('test@example.com')
  await page.locator('#quote-date').fill('2099-10-15')
  await page.locator('#quote-nationality').fill('Costa Rica')
  await chooseSelect(page.getByRole('combobox', { name: 'Cambiar idioma', exact: true }), 'EN')
  await expect(page.locator('#quote-name')).toHaveValue('Ana Prueba')
  await expect(page.locator('#quote-email')).toHaveValue('test@example.com')
  await page.locator('#quote-consent').check()
  await page.getByRole('button', { name: 'Prepare request' }).click()
  await expect(page.getByRole('heading', { name: 'Your request is ready' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Your request is ready' })).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Your request is ready' })).toBeInViewport()
  await expect(page.locator('pre')).toContainText('Ana Prueba')
  await expect(page.locator('pre')).toContainText('/en/tours/bioluminiscencia-paquera')
  await expect(page).not.toHaveURL(/Ana|test%40|2099/)
  expect(
    await page.evaluate(() =>
      [JSON.stringify(localStorage), JSON.stringify(sessionStorage)].join(' '),
    ),
  ).not.toContain('Ana Prueba')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(accessibility.violations).toEqual([])
  await page.evaluate(() => {
    ;(document.activeElement as HTMLElement)?.blur()
    window.scrollTo({ top: 0, behavior: 'instant' })
  })
  await page.screenshot({ path: `${review}/quote-${testInfo.project.name}.png`, fullPage: true })
})
test('detail, gallery, direct English access and private administration entry', async ({
  page,
}, testInfo) => {
  await page.goto('/en')
  await expect(
    page.getByRole('heading', { name: 'Discover the magic of the Nicoya Peninsula' }),
  ).toBeVisible()
  await page.locator('.tour-card:visible').last().scrollIntoViewIfNeeded()
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('img'))
      .filter((image) => image.getClientRects().length > 0)
      .every((image) => image.complete && image.naturalWidth > 0),
  )
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: `${review}/home-${testInfo.project.name}.png`, fullPage: true })
  await page.goto('/en/tours/isla-tortuga')
  await expect(page.getByRole('heading', { name: 'Isla Tortuga & turquoise waters' })).toBeVisible()
  await page.getByRole('button', { name: 'View photo 1' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.evaluate(() => {
    ;(document.activeElement as HTMLElement)?.blur()
    window.scrollTo({ top: 0, behavior: 'instant' })
  })
  await page.screenshot({ path: `${review}/detail-${testInfo.project.name}.png`, fullPage: true })
  await page.goto('/en/tours/bioluminiscencia-paquera')
  await expect
    .poll(() =>
      page
        .locator('.stitch-gallery-photo img')
        .first()
        .evaluate((image) => (image as HTMLImageElement).currentSrc),
    )
    .toContain(testTours[0].media[testInfo.project.name === 'mobile' ? 5 : 2].url!)
  await page.getByRole('button', { name: 'View photo 1' }).click()
  await expect(
    page.getByRole('dialog').getByText(testInfo.project.name === 'mobile' ? '4 / 4' : '1 / 4'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(
    page.getByRole('dialog').getByText(testInfo.project.name === 'mobile' ? '1 / 4' : '2 / 4'),
  ).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(
    page.getByRole('dialog').getByText(testInfo.project.name === 'mobile' ? '4 / 4' : '1 / 4'),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goto('/admin-tours')
  await expect(page).toHaveURL(/\/admin-tours\/login$/)
  await expect(page.getByRole('heading', { name: 'Bienvenida a RM Tours' })).toBeVisible()
  await expect(page.getByText('Crear cuenta')).toHaveCount(0)
})
