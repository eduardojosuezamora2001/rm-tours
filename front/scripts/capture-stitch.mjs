import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
const browser = await chromium.launch()
const out = '../.impeccable/review/stitch'
await fs.mkdir(out, { recursive: true })
const screens = {
  home: '9c2671ea77f1488ba46ab3410d54d3ab',
  catalog: '61d46cf5d8c548d081dad5101cd27de6',
  detail: 'cea7a57b40944a608fd7abf54e5a32ba',
  admin: 'ce1dcd1953be4a37aad150307919c9af',
  mobileHome: 'de3538226ad6447f9d9c84a0d3cda6f1',
  mobileCatalog: 'aad1dd39ddc243f79879de0debcdbb44',
  mobileDetail: 'ef6bb58f6d2c4e40b2208e3e51c6a4c1',
}
for (const [name, id] of Object.entries(screens)) {
  const mobile = name.startsWith('mobile'),
    width = mobile ? 390 : name === 'admin' ? 1280 : 1323
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:5173/desing/stitch/' + id + '.png')
  await page.addStyleTag({
    content:
      'html,body{margin:0;padding:0;background:white}img{display:block!important;width:100%!important;height:auto!important;max-width:none!important;margin:0!important;cursor:default!important}',
  })
  await page.screenshot({ path: out + '/' + name + '-reference-top.png' })
  if (!mobile) {
    await page.evaluate(() => window.scrollTo(0, 1000))
    await page.screenshot({ path: out + '/' + name + '-reference-middle.png' })
  }
  await page.close()
}
for (const [name, path] of Object.entries({
  home: '/es',
  catalog: '/es/tours',
  detail: '/es/tours/bioluminiscencia-paquera',
}))
  for (const width of [1323, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 })
    await page.goto('http://127.0.0.1:5173' + path)
    await page.waitForLoadState('networkidle')
    await page.evaluate(async () => {
      await document.fonts.ready
      const images = [...document.images]
      await Promise.all(
        images.filter((i) => i.loading !== 'lazy').map((i) => i.decode().catch(() => {})),
      )
    })
    await page.screenshot({ path: out + '/' + name + '-' + width + '-build-top.png' })
    await page.evaluate(async () => {
      for (const image of document.images) image.loading = 'eager'
      await Promise.all([...document.images].map((image) => image.decode().catch(() => {})))
      document.activeElement?.blur()
      window.scrollTo(0, 0)
    })
    await page.screenshot({
      path: out + '/' + name + '-' + width + '-build-full.png',
      fullPage: true,
    })
    console.log(
      name,
      width,
      await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        fonts: document.fonts.check('24px "Material Symbols Outlined"'),
      })),
    )
    await page.close()
  }
await browser.close()
