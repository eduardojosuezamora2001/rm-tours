import { test, expect } from './fixtures'

test('password recovery exchanges its code through the backend and uses HttpOnly cookies', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/callback?code=one-time-code', (route) =>
    route.fulfill({
      status: 303,
      headers: {
        Location: '/admin-tours/reset-password',
        'Set-Cookie': 'rm_recovery=opaque; HttpOnly; SameSite=Lax; Path=/',
      },
    }),
  )
  await page.route('**/api/v1/auth/reset-password', (route) => {
    expect(route.request().postDataJSON()).toEqual({ password: 'new-synthetic-password' })
    expect(route.request().headers()['x-rm-request']).toBe('1')
    expect(route.request().headers()['cookie']).toContain('rm_recovery=opaque')
    expect(route.request().headers()['authorization']).toBeUndefined()
    return route.fulfill({
      status: 204,
      headers: { 'Set-Cookie': 'rm_recovery=; Max-Age=0; Path=/' },
    })
  })
  await page.goto('/admin-tours/reset-password?code=one-time-code')
  await expect(page).toHaveURL(/\/admin-tours\/reset-password$/)
  await expect(page.locator('#auth-password')).toBeVisible()
  expect(await page.evaluate(() => document.cookie)).not.toContain('rm_recovery')
  await page.locator('#auth-password').fill('new-synthetic-password')
  await page.getByRole('button', { name: 'Guardar nueva contraseña' }).click()
  await expect(page.getByText('Contraseña actualizada.', { exact: true })).toBeVisible()
  expect(await page.context().cookies()).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ name: 'rm_recovery' })]),
  )
})

test('a backend outage offers retry instead of reporting insufficient permissions', async ({
  page,
}) => {
  let unavailable = true
  await page.route('**/api/v1/admin/session', (route) =>
    route.fulfill({
      status: unavailable ? 503 : 401,
      json: { error: { code: unavailable ? 'GENERIC' : 'UNAUTHORIZED' } },
    }),
  )
  await page.goto('/admin-tours')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByText('Esta cuenta no tiene permisos de administración.')).toHaveCount(0)
  unavailable = false
  await page.getByRole('button', { name: 'Volver a intentar' }).click()
  await expect(page).toHaveURL(/\/admin-tours\/login$/)
  await expect(page.locator('#auth-email')).toBeVisible()
})
