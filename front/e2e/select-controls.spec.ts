import { test, expect } from './fixtures'
import AxeBuilder from '@axe-core/playwright'
import { chooseSelect } from './select'

test('shadcn selects filter, sort and restore empty choices without losing quote data', async ({
  page,
}) => {
  await page.goto('/es')
  await chooseSelect(page.locator('#hero-destination'), 'Paquera')
  await chooseSelect(page.locator('#hero-category'), 'Bajo las estrellas')
  await page.getByRole('button', { name: 'Explorar tours', exact: true }).click()
  await expect(page).toHaveURL(/destination=paquera&category=night/)
  await expect(page.locator('.tour-card')).toHaveCount(1)
  const sort = page.locator('[id="sort"]:visible, [id="sort-mobile"]:visible')
  await chooseSelect(sort, 'Menor precio')
  await expect(page).toHaveURL(/sort=price-asc/)

  await page.goto('/es/cotizar?tour=bioluminiscencia-paquera')
  await page.locator('#quote-name').fill('Datos en memoria')
  const schedule = page.locator('#quote-schedule')
  await schedule.click()
  await page
    .getByRole('option')
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
    .click()
  await expect(schedule).not.toHaveText('Sin preferencia')
  await chooseSelect(schedule, 'Sin preferencia')
  await expect(schedule).toHaveText('Sin preferencia')
  await expect(page.locator('#quote-name')).toHaveValue('Datos en memoria')
  await chooseSelect(page.locator('#quote-tour'), 'Selecciona una experiencia')
  await expect(page.locator('#quote-plan')).toBeDisabled()
  await expect(page.locator('#quote-name')).toHaveValue('Datos en memoria')
  await expect(page).not.toHaveURL(/__rm_tours_empty__/)
})

test('shadcn theme button supports keyboard toggling and dark mode accessibility', async ({
  page,
}, testInfo) => {
  await page.goto('/es')
  const theme = page.getByRole('button', { name: 'Cambiar tema', exact: true })
  await expect(theme).toHaveAttribute('aria-pressed', 'false')
  await expect(theme).toHaveAttribute('title', 'Oscuro')
  await theme.focus()
  await page.keyboard.press('Enter')
  await expect(theme).toHaveAttribute('aria-pressed', 'true')
  await expect(theme).toHaveAttribute('title', 'Claro')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await page.keyboard.press('Space')
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.keyboard.press('Enter')
  await expect(theme).toBeFocused()
  const accessibility = await new AxeBuilder({ page })
    .include('[aria-label="Cambiar tema"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(accessibility.violations).toEqual([])
  await page.screenshot({
    path: `../.impeccable/review/themes/toggle-dark-${testInfo.project.name}.png`,
  })
  await page.keyboard.press('Tab')
  await expect(theme).not.toBeFocused()
})
