import { readFile } from 'node:fs/promises'
import { test, expect } from './fixtures'
import { testTours } from '../../shared/testing/tours'

test('owner can drop an image, see its preview, and finish its descriptions', async ({ page }, testInfo) => {
  const tour = { ...structuredClone(testTours[0]), status: 'draft', media: [] }
  let finishUpload: (() => void) | undefined
  let uploads = 0
  await page.route('**/api/v1/admin/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1/admin', '')
    if (path === '/session') return route.fulfill({ json: { id: 'owner' } })
    if (path === `/tours/${tour.id}`) return route.fulfill({ json: tour })
    if (path === '/uploads') {
      uploads++
      await new Promise<void>((resolve) => { finishUpload = resolve })
      const id = '77777777-7777-4777-8777-777777777777'
      return route.fulfill({ status: 201, json: { id, path: `${tour.id}/${id}.webp`, url: `/api/v1/admin/media/${tour.id}/${id}.webp` } })
    }
    return route.fallback()
  })
  await page.goto(`/admin-tours/tours/${tour.id}`)
  await page.getByRole('tab', { name: 'Fotografías', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Seleccionar imagen', exact: true })).toBeVisible()
  const zone = page.getByRole('region', { name: 'Agregar imagen', exact: true })
  await expect(zone).toContainText('Arrastra tu imagen aquí')
  const data = await readFile(new URL('../../shared/testing/tour.jpg', import.meta.url))
  const transfer = await page.evaluateHandle((bytes) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File([new Uint8Array(bytes)], 'playa.jpg', { type: 'image/jpeg' }))
    return transfer
  }, Array.from(data))
  await zone.dispatchEvent('dragenter', { dataTransfer: transfer })
  await expect(zone).toHaveClass(/image-dropzone-active/)
  await expect(zone).toContainText('Suelta la imagen para subirla')
  await zone.dispatchEvent('drop', { dataTransfer: transfer })
  await expect(page.locator('.image-upload-preview')).toContainText('playa.jpg')
  await expect.poll(() => page.locator('.image-upload-preview img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  await expect(page.getByRole('button', { name: 'Guardar cambios', exact: true })).toBeDisabled()
  await expect.poll(() => Boolean(finishUpload)).toBe(true)
  await zone.screenshot({ path: `../.impeccable/review/image-upload-${testInfo.project.name}-light.png`, animations: 'disabled' })
  await page.getByRole('button', { name: 'Cambiar tema', exact: true }).click()
  await zone.screenshot({ path: `../.impeccable/review/image-upload-${testInfo.project.name}-dark.png`, animations: 'disabled' })
  finishUpload!()
  await expect(page.getByLabel('Descripción accesible · ES', { exact: true })).toBeVisible()
  await expect(page.locator('.media-editor-cover')).toHaveCount(1)
  await expect(zone).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.image-upload-preview')).toHaveCount(0)
  expect(uploads).toBe(1)
  await transfer.dispose()
})
