import { chooseSelect } from './select'
import { test, expect } from './fixtures'
import { testTours } from '../../shared/testing/tours'
test('owner manages bilingual tour, plans, sections, preview, settings and legal pages', async ({
  page,
}, testInfo) => {
  test.setTimeout(180000)
  const openNavigation = async () => {
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
      await expect(page.getByRole('navigation', { name: 'Gestión' })).toBeVisible()
    }
  }
  const tours = structuredClone(testTours)
  let settings = {
    whatsapp: '',
    email: '',
    location: { es: '', en: '' },
    hours: { es: '', en: '' },
    intro: { es: '', en: '' },
  }
  let legal = [
    { slug: 'privacy', title: { es: '', en: '' }, body: { es: '', en: '' }, published: false },
    { slug: 'terms', title: { es: '', en: '' }, body: { es: '', en: '' }, published: false },
  ]
  const user = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'owner@example.com',
    app_metadata: { role: 'owner' },
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
  }
  let authenticated = false
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1', '')
    if (path === '/auth/login') {
      expect(request.postDataJSON()).toEqual({
        email: 'owner@example.com',
        password: 'synthetic-test-password',
      })
      expect(request.headers()['x-rm-request']).toBe('1')
      authenticated = true
      return route.fulfill({
        json: { id: user.id },
        headers: { 'Set-Cookie': 'rm_test_session=opaque; HttpOnly; SameSite=Lax; Path=/' },
      })
    }
    if (path === '/auth/logout') {
      authenticated = false
      return route.fulfill({
        status: 204,
        headers: { 'Set-Cookie': 'rm_test_session=; Max-Age=0; Path=/' },
      })
    }
    if (path === '/auth/recover') return route.fulfill({ status: 202 })
    if (path.startsWith('/admin/') && !authenticated)
      return route.fulfill({ status: 401, json: { error: { code: 'UNAUTHORIZED' } } })
    if (path === '/admin/session') {
      expect(request.headers()['cookie']).toContain('rm_test_session=opaque')
      expect(request.headers()['authorization']).toBeUndefined()
      return route.fulfill({ json: { id: user.id } })
    }
    if (path === '/admin/media-optimization') return route.fulfill({ json: [] })
    if (path === '/admin/uploads') {
      const id = '77777777-7777-4777-8777-777777777777'
      return route.fulfill({
        status: 201,
        json: {
          id,
          path: `${tours.at(-1)!.id}/${id}.webp`,
          url: `/api/v1/admin/media/${tours.at(-1)!.id}/${id}.webp`,
        },
      })
    }
    if (path === '/admin/tours' && request.method() === 'GET') return route.fulfill({ json: tours })
    if (path.startsWith('/admin/tours/')) {
      const id = path.split('/').at(-1)!
      if (request.method() === 'PUT') {
        const tour = request.postDataJSON()
        tour.updated_at = new Date().toISOString()
        tour.media = tour.media.map((m: { path: string }) => ({
          ...m,
          url: `/api/v1/admin/media/${m.path}`,
        }))
        const index = tours.findIndex((t) => t.id === id)
        if (index < 0) tours.push(tour)
        else tours[index] = tour
        return route.fulfill({ json: { id, updated_at: tour.updated_at } })
      }
      if (request.method() === 'DELETE') {
        const index = tours.findIndex((t) => t.id === id)
        tours.splice(index, 1)
        return route.fulfill({ status: 204 })
      }
      const tour = tours.find((t) => t.id === id)
      return route.fulfill({
        status: tour ? 200 : 404,
        json: tour ?? { error: { code: 'NOT_FOUND' } },
      })
    }
    if (path === '/settings') return route.fulfill({ json: settings })
    if (path === '/admin/settings') {
      settings = request.postDataJSON()
      return route.fulfill({ json: settings })
    }
    if (path === '/admin/legal') return route.fulfill({ json: legal })
    if (path.startsWith('/admin/legal/')) {
      const value = request.postDataJSON()
      legal = legal.map((p) => (p.slug === value.slug ? value : p))
      return route.fulfill({ json: value })
    }
    return route.fallback()
  })
  await page.goto('/admin-tours/login')
  await page.locator('#auth-email').fill('owner@example.com')
  await page.locator('#auth-password').fill('synthetic-test-password')
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Gestión de Tours y Experiencias' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Gestión de Tours y Experiencias' })).toBeVisible()
  expect(await page.evaluate(() => document.cookie)).not.toContain('rm_test_session')
  expect(
    await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('sb-'))),
  ).toEqual([])
  await page.screenshot({
    path: `../.impeccable/review/admin-list-${testInfo.project.name}.png`,
    fullPage: true,
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.getByRole('button', { name: 'Cambiar tema', exact: true }).click()
  await page.screenshot({
    path: `../.impeccable/review/admin-list-dark-${testInfo.project.name}.png`,
    fullPage: true,
  })
  if (testInfo.project.name === 'mobile') {
    await expect(page.getByRole('navigation', { name: 'Gestión' })).not.toBeVisible()
    await openNavigation()
    await expect(page.getByRole('link', { name: 'Páginas legales', exact: true })).toBeVisible()
    await page.screenshot({ path: '../.impeccable/review/admin-sidebar-mobile.png' })
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Abrir menú', exact: true })).toBeFocused()
  } else {
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
    await expect(page.locator('[data-collapsible="icon"]')).toBeVisible()
    await expect
      .poll(
        async () => (await page.locator('[data-slot="sidebar-container"]').boundingBox())?.width,
      )
      .toBe(48)
    await page.screenshot({ path: '../.impeccable/review/admin-sidebar-collapsed-desktop.png' })
    await page.getByRole('button', { name: 'Administración', exact: true }).click()
    await expect(page.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Cambiar tema', exact: true }).click()
  await page.getByRole('link', { name: 'Editar', exact: true }).first().click()
  await expect(page).toHaveURL(new RegExp(`/admin-tours/tours/${testTours[0].id}$`))
  await page.reload()
  await expect(page.locator('#tour-duration')).toHaveValue(String(testTours[0].duration_minutes))
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0)
  await expect(page.locator('.admin-tour-list')).toHaveCount(0)
  expect(
    await page
      .locator('.stitch-tour-editor')
      .evaluate((element) => element.getBoundingClientRect().width >= window.innerWidth - 64),
  ).toBe(true)
  await page.getByRole('tab', { name: 'Fotografías', exact: true }).click()
  const cover = page.locator('.media-editor-cover')
  await expect(cover).toHaveCount(1)
  await expect(cover).toHaveCSS('border-top-width', '2px')
  await expect(cover.getByRole('status')).toContainText('Esta imagen se utilizará como portada')
  await cover
    .getByRole('status')
    .evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.screenshot({
    path: `../.impeccable/review/admin-cover-warning-light-${testInfo.project.name}.png`,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Cambiar tema', exact: true }).click()
  await cover
    .getByRole('status')
    .evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.screenshot({
    path: `../.impeccable/review/admin-cover-warning-dark-${testInfo.project.name}.png`,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Cambiar tema', exact: true }).click()
  await cover.getByRole('button', { name: 'Bajar', exact: true }).click()
  await expect(cover.locator('img')).toHaveAttribute('src', testTours[0].media[1].url!)
  await page
    .locator('.media-editor')
    .nth(1)
    .getByRole('button', { name: 'Subir', exact: true })
    .click()
  await expect(cover.locator('img')).toHaveAttribute('src', testTours[0].media[0].url!)
  await page.getByRole('tab', { name: 'Planes', exact: true }).click()
  await page.getByRole('button', { name: 'Agregar plan' }).click()
  await expect(page.locator('.editor-panel')).toHaveCount(2)
  await page.getByRole('tab', { name: 'Secciones', exact: true }).click()
  await page.getByRole('button', { name: 'Agregar sección' }).click()
  await expect(page.locator('.editor-panel')).toHaveCount(testTours[0].sections.length + 1)
  await page
    .locator('.editor-panel')
    .last()
    .getByRole('button', { name: 'Eliminar', exact: true })
    .click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.locator('.editor-panel')).toHaveCount(testTours[0].sections.length + 1)
  await page
    .locator('.editor-panel')
    .last()
    .getByRole('button', { name: 'Eliminar', exact: true })
    .click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(page.locator('.editor-panel')).toHaveCount(testTours[0].sections.length)
  await page.getByRole('link', { name: 'Volver al catálogo', exact: true }).click()
  await expect(page.getByRole('alertdialog', { name: 'Cambios sin guardar' })).toBeVisible()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Secciones', exact: true })).toBeVisible()
  // Save a draft, which may intentionally have incomplete translations.
  await page.getByRole('tab', { name: 'Información general' }).click()
  await chooseSelect(page.locator('#tour-status'), 'Borrador')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByText('Cambios guardados', { exact: true })).toBeVisible()
  await page.locator('#tour-duration').fill('123')
  await page.getByRole('link', { name: 'Volver al catálogo', exact: true }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Descartar y salir', exact: true })
    .click()
  await expect(page).toHaveURL(/\/admin-tours$/)
  await page.getByRole('link', { name: 'Editar', exact: true }).first().click()
  await expect(page.locator('#tour-duration')).toHaveValue(String(testTours[0].duration_minutes))
  await page.getByRole('link', { name: 'Vista previa' }).click()
  await expect(page.getByText('Vista previa privada', { exact: false })).toBeVisible()
  await page.screenshot({
    path: `../.impeccable/review/admin-preview-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await openNavigation()
  await page
    .getByRole('navigation', { name: 'Gestión' })
    .getByRole('link', { name: 'Contacto y sitio', exact: true })
    .click()
  await page.locator('#settings-whatsapp').fill('50688880000')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect.poll(() => settings.whatsapp).toBe('50688880000')
  await openNavigation()
  await page
    .getByRole('navigation', { name: 'Gestión' })
    .getByRole('link', { name: 'Páginas legales', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'Privacidad', exact: true })).toBeVisible()
  const privacy = page
    .locator('form')
    .filter({ has: page.getByRole('heading', { name: 'Privacidad', exact: true }) })
  await expect(privacy.getByLabel('Contenido · ES')).toHaveValue(/Responsable y contacto/)
  await expect(privacy.getByLabel('Contenido · EN')).toHaveValue(/Controller and contact/)
  await expect(privacy.getByRole('checkbox')).toBeDisabled()
  await privacy.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect.poll(() => legal[0].body.es).toContain('[DOMICILIO]')
  expect(legal[0].published).toBe(false)
  const terms = page
    .locator('form')
    .filter({ has: page.getByRole('heading', { name: 'Términos y condiciones', exact: true }) })
  await expect(terms.getByLabel('Contenido · ES')).toHaveValue(/Cancelaciones|cancelaciones/)
  await expect(terms.getByRole('checkbox')).toBeDisabled()
  await privacy.getByLabel('Título de sección · ES').fill('Privacidad')
  await privacy.getByLabel('Título de sección · EN').fill('Privacy')
  await privacy.getByLabel('Contenido · ES').fill('Documento de prueba.')
  await privacy.getByLabel('Contenido · EN').fill('Test document.')
  await privacy.getByRole('checkbox').check()
  await privacy.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect.poll(() => legal[0].published).toBe(true)

  await openNavigation()
  await page
    .getByRole('navigation', { name: 'Gestión' })
    .getByRole('link', { name: 'Catálogo & Precios', exact: true })
    .click()
  await page
    .locator('.admin-workspace-content')
    .getByRole('link', { name: 'Crear tour', exact: true })
    .click()
  await expect(page).toHaveURL(/\/admin-tours\/tours\/new$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0)
  await page.getByLabel('Nombre · ES', { exact: true }).fill('Tour de prueba')
  await page.getByLabel('Nombre · EN', { exact: true }).fill('Test tour')
  await page.getByLabel('Resumen · ES').fill('Experiencia de prueba')
  await page.getByLabel('Resumen · EN').fill('Test experience')
  await page.locator('#tour-slug').fill('tour-de-prueba')
  await page.getByLabel('Punto de encuentro · ES').fill('Paquera')
  await page.getByLabel('Punto de encuentro · EN').fill('Paquera')
  await page.getByRole('button', { name: 'Cambiar tema', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByLabel('Nombre · ES', { exact: true })).toHaveValue('Tour de prueba')
  await expect(page).toHaveURL(/\/admin-tours\/tours\/new$/)
  await page.getByRole('button', { name: 'Cambiar tema', exact: true }).click()
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    ;(document.activeElement as HTMLElement)?.blur()
  })
  await page.mouse.move(0, 0)
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)
  await page.screenshot({
    path: `../.impeccable/review/admin-editor-${testInfo.project.name}.png`,
    fullPage: false,
  })
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page).toHaveURL(/\/admin-tours\/tours\/[0-9a-f-]{36}$/)
  await chooseSelect(page.locator('#tour-status'), 'Publicado')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByText('Agrega una imagen de portada.', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Planes', exact: true }).click()
  await page.getByLabel('Descripción · ES', { exact: true }).fill('Plan de prueba')
  await page.getByLabel('Descripción · EN', { exact: true }).fill('Test plan')
  await page.getByLabel('Servicios (uno por línea) · ES').fill('Guía')
  await page.getByLabel('Servicios (uno por línea) · EN').fill('Guide')
  await page.getByRole('tab', { name: 'Fotografías', exact: true }).click()
  await page.locator('#image-upload').setInputFiles({
    name: 'invalid.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not an image'),
  })
  await expect(
    page.getByText('Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.', { exact: true }),
  ).toBeVisible()
  await page.locator('#image-upload').setInputFiles('../shared/testing/tour.jpg')
  await expect(page.getByLabel('Descripción accesible · ES')).toBeVisible()
  await expect(page.getByText('Portada (primera imagen)', { exact: true })).toBeVisible()
  await expect(page.getByText(/La primera imagen será utilizada como portada/)).toBeVisible()
  await page.getByLabel('Descripción accesible · ES').fill('Playa de prueba')
  await page.getByLabel('Descripción accesible · EN').fill('Test beach')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect.poll(() => tours.find((t) => t.slug === 'tour-de-prueba')?.status).toBe('published')
  await page.getByRole('link', { name: 'Volver al catálogo', exact: true }).click()
  await openNavigation()
  await page
    .getByRole('navigation', { name: 'Gestión' })
    .getByRole('link', { name: 'Catálogo & Precios', exact: true })
    .click()
  const created = page.locator('.admin-tour-list article').filter({ hasText: 'Tour de prueba' })
  await created.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(created).toHaveCount(0)
  await openNavigation()
  await page.getByRole('button', { name: 'Administración', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/\/admin-tours\/login$/)
  await page.getByRole('link', { name: 'Recuperar contraseña' }).click()
  await page.locator('#auth-email').fill('owner@example.com')
  await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click()
  await expect(
    page.getByText(
      'Si el correo corresponde a una cuenta, recibirás las instrucciones de recuperación.',
    ),
  ).toBeVisible()
})
