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

test('shadcn theme popup supports keyboard navigation and dark mode accessibility', async ({
  page,
}, testInfo) => {
  await page.goto('/es')
  const theme = page.getByRole('combobox', { name: 'Cambiar tema', exact: true })
  await theme.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('listbox')).toBeVisible()
  await expect(page.getByRole('option', { name: 'Claro', exact: true })).toBeFocused()
  await page.keyboard.press('End')
  await expect(page.getByRole('option', { name: 'Oscuro', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(theme).toHaveText('Oscuro')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await theme.click()
  await expect(page.getByRole('option', { name: 'Oscuro', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('option', { name: 'Oscuro', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('option', { name: 'Oscuro', exact: true })).toBeFocused()
  // Closed-page audits cover the full document. Radix temporarily hides the background
  // while its open Select traps focus, so audit the active popup separately here.
  const accessibility = await new AxeBuilder({ page })
    .include('[data-slot="select-content"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(accessibility.violations).toEqual([])
  await page.screenshot({
    path: `../.impeccable/review/themes/select-dark-${testInfo.project.name}.png`,
  })
  await page.keyboard.press('Escape')
  await expect(theme).toBeFocused()
})
