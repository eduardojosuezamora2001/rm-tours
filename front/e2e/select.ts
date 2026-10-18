import { expect, type Locator } from '@playwright/test'

export async function chooseSelect(trigger: Locator, label: string) {
  await trigger.click()
  const page = trigger.page()
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.getByRole('option', { name: label, exact: true }).click()
  await expect(page.getByRole('listbox')).toBeHidden()
}
