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
  await expect(page.locator('#quote-nationality')).toHaveCount(0)
  await page.locator('#quote-participant-0-name').fill('Viajera de prueba')
  await page.locator('#quote-participant-0-age').fill('28')
  await chooseSelect(page.getByRole('combobox', { name: 'Cambiar idioma', exact: true }), 'EN')
  await expect(page.locator('#quote-name')).toHaveValue('Consulta en memoria')
  await expect(page.locator('#quote-participant-0-name')).toHaveValue('Viajera de prueba')
  await expect(page.locator('#quote-participant-0-age')).toHaveValue('28')
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
  await expect(page.locator('#quote-nationality')).toHaveCount(0)
  await page.locator('#quote-participant-0-name').fill('Ana Prueba')
  await page.locator('#quote-participant-0-age').fill('32')
  await page.getByRole('button', { name: 'Aumentar Adultos', exact: true }).click()
  await page.locator('#quote-participant-1-name').fill('José Prueba')
  await page.locator('#quote-participant-1-age').fill('34')
  await page.locator('#quote-children').fill('1')
  await page.locator('#quote-participant-2-name').fill('Bebé Prueba')
  await page.locator('#quote-participant-2-age').fill('0')
  await page.getByRole('button', { name: 'Aumentar Niños', exact: true }).click()
  await expect(page.locator('[data-participant]')).toHaveCount(4)
  await page.locator('#quote-participant-3-name').fill('Persona retirada')
  await page.locator('#quote-participant-3-age').fill('8')
  await page.getByRole('button', { name: 'Disminuir Niños', exact: true }).click()
  await expect(page.locator('[data-participant]')).toHaveCount(3)
  await expect(page.locator('#quote-participant-1-name')).toHaveValue('José Prueba')
  await chooseSelect(page.getByRole('combobox', { name: 'Cambiar idioma', exact: true }), 'EN')
  await expect(page.locator('#quote-name')).toHaveValue('Ana Prueba')
  await expect(page.locator('#quote-email')).toHaveValue('test@example.com')
  await expect(page.locator('#quote-participant-2-name')).toHaveValue('Bebé Prueba')
  await expect(page.locator('#quote-participant-2-age')).toHaveValue('0')
  await page.locator('#quote-consent').check()
  await page.locator('#quote-participant-2-age').fill('')
  await page.getByRole('button', { name: 'Prepare request' }).click()
  await expect(page.locator('#quote-participant-2-age')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Enter an age in whole years between 0 and 120.')).toBeVisible()
  await expect(page.locator('.prepared-message')).toHaveCount(0)
  await page.locator('#quote-participant-2-age').fill('0')
  await expect(page.locator('#quote-participant-2-age')).toHaveAttribute('aria-invalid', 'false')
  await page.getByRole('button', { name: 'Prepare request' }).click()
  await expect(page.getByRole('heading', { name: 'Your request is ready' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Your request is ready' })).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Your request is ready' })).toBeInViewport()
  await expect(page.locator('pre')).toContainText('Ana Prueba')
  await expect(page.locator('pre')).toContainText('Participant 2: José Prueba — Age (years): 34')
  await expect(page.locator('pre')).toContainText('Participant 3: Bebé Prueba — Age (years): 0')
  await expect(page.locator('pre')).not.toContainText('Persona retirada')
  await expect(page.locator('pre')).not.toContainText('Nationality')
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
  await page.locator('#quote-participant-1-age').fill('35')
  await expect(page.locator('.prepared-message')).toHaveCount(0)
  await page.getByRole('button', { name: 'Prepare request' }).click()
  await expect(page.locator('pre')).toContainText('Participant 2: José Prueba — Age (years): 35')
  await page.getByRole('button', { name: 'Change theme', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('group', { name: 'Trip participants', exact: true }).screenshot({
    path: `${review}/quote-participants-dark-${testInfo.project.name}.png`,
  })
  const darkAccessibility = await new AxeBuilder({ page })
    .include('form')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(darkAccessibility.violations).toEqual([])
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
  await expect(page.locator('.tour-gallery-main img')).toHaveAttribute('alt', testTours[0].media[0].alt.en)
  await page.getByRole('button', { name: 'View photo 1' }).click()
  await expect(page.getByRole('dialog').getByText('1 / 6')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByRole('dialog').getByText('2 / 6')).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('dialog').getByText('1 / 6')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goto('/admin-tours')
  await expect(page).toHaveURL(/\/admin-tours\/login$/)
  await expect(page.getByRole('heading', { name: 'Bienvenida a RM Tours' })).toBeVisible()
  await expect(page.getByText('Crear cuenta')).toHaveCount(0)
})

test('both photos remain available when a tour has only two images', async ({ page }, testInfo) => {
  const tour = { ...testTours[0], media: testTours[0].media.slice(0, 2) }
  await page.route(/\/api\/v1\/tours\/bioluminiscencia-paquera(?:\?|$)/, (route) =>
    route.fulfill({ json: tour }),
  )
  await page.goto('/en/tours/bioluminiscencia-paquera')
  await expect(page.locator('.tour-gallery-main')).toHaveCount(1)
  await expect(page.locator('.tour-gallery-thumbnail')).toHaveCount(2)
  await expect(page.locator('.tour-gallery-main img')).toHaveAttribute(
    'alt',
    tour.media[0].alt.en,
  )
  await expect(page.locator('.tour-gallery-count')).toHaveText('1 / 2')
  expect(await page.locator('.tour-gallery').evaluate((gallery) =>
    Math.abs(gallery.getBoundingClientRect().width - gallery.querySelector('.tour-gallery-stage')!.getBoundingClientRect().width) < 1,
  )).toBe(true)
  await page.screenshot({ path: `${review}/detail-two-photos-${testInfo.project.name}.png` })
  await page.getByRole('button', { name: 'View photo 1', exact: true }).click()
  await expect(page.getByRole('dialog').getByText('1 / 2')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByRole('dialog').getByText('2 / 2')).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('img')).toHaveAttribute('alt', tour.media[1].alt.en)
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('dialog').getByText('1 / 2')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('radio', { name: 'Show photo 2', exact: true }).click()
  await expect(page.locator('.tour-gallery-main img')).toHaveAttribute('alt', tour.media[1].alt.en)
  await expect(page.locator('.tour-gallery-count')).toHaveText('2 / 2')
  await expect(page.getByRole('radio', { name: 'Show photo 2', exact: true })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('button', { name: 'View photo 2', exact: true }).click()
  await expect(page.getByRole('dialog').getByText('2 / 2')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.locator('.tour-gallery').screenshot({ path: `${review}/gallery-thumbnails-${testInfo.project.name}-light.png`, animations: 'disabled' })
  await page.getByRole('button', { name: 'Change theme', exact: true }).click()
  await page.locator('.tour-gallery').screenshot({ path: `${review}/gallery-thumbnails-${testInfo.project.name}-dark.png`, animations: 'disabled' })
})
