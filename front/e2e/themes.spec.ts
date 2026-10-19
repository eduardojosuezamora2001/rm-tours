import { chooseSelect } from './select'
import { test, expect } from './fixtures'
import AxeBuilder from '@axe-core/playwright'
import { mkdir } from 'node:fs/promises'

test('theme selection persists and keeps tour surfaces accessible in both languages', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000)
  const review = '../.impeccable/review/themes'
  await mkdir(review, { recursive: true })
  await page.goto('/es')
  const theme = page.getByRole('button', { name: 'Cambiar tema', exact: true })
  await expect(theme).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('combobox', { name: 'Cambiar idioma', exact: true })).toBeVisible()
  await page.screenshot({ path: `${review}/home-light-${testInfo.project.name}.png` })
  await theme.click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(theme).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveClass(/dark/)

  for (const [surface, url] of [
    ['home', '/es'],
    ['catalog', '/es/tours?destination=paquera'],
    ['detail', '/es/tours/bioluminiscencia-paquera'],
    ['quote', '/es/cotizar?tour=bioluminiscencia-paquera'],
  ]) {
    await page.goto(url)
    await expect(page.locator('h1')).toBeVisible()
    await expect(theme).toHaveAttribute('aria-pressed', 'true')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(accessibility.violations).toEqual([])
    await page.screenshot({
      path: `${review}/${surface}-dark-${testInfo.project.name}.png`,
      fullPage: true,
    })
  }

  await page.goto('/es/tours?destination=paquera#main')
  await chooseSelect(page.getByRole('combobox', { name: 'Cambiar idioma', exact: true }), 'EN')
  await expect(page).toHaveURL('/en/tours?destination=paquera#main')
  await expect(page.getByRole('button', { name: 'Change theme', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Change theme', exact: true }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Change theme', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  )

  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/es/tours/bioluminiscencia-paquera')
    await expect(theme).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
