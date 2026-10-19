import { test, expect } from './fixtures'
test.use({
  channel: 'chromium',
  launchOptions: {
    ignoreDefaultArgs: ['--hide-scrollbars'],
    args: ['--disable-features=OverlayScrollbar,FluentOverlayScrollbar'],
  },
})

test('header language select and theme toggle preserve layout and scroll position', async ({
  page,
}, testInfo) => {
  await page.goto('/es')
  await page.addStyleTag({
    content: 'html::-webkit-scrollbar { width: 16px; } html { overflow-y: scroll; }',
  })
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.stitch-header-brand img')).toBeVisible({ timeout: 45000 })
  const measure = () =>
    page.evaluate(() => ({
      scroll: window.scrollY,
      gutter: window.innerWidth - document.documentElement.clientWidth,
      margin: getComputedStyle(document.body).marginRight,
      boxes: ['.stitch-header', '.stitch-header-brand', '.stitch-header-actions', '#main'].map(
        (selector) => {
          const box = document.querySelector(selector)!.getBoundingClientRect()
          return { x: box.x, y: box.y, width: box.width }
        },
      ),
    }))
  for (const top of [0, 400]) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top)
    for (const label of ['Cambiar idioma', 'Cambiar tema']) {
      const before = await measure()
      if (testInfo.project.name === 'desktop') expect(before.gutter).toBeGreaterThan(0)
      const isTheme = label === 'Cambiar tema'
      await page.getByRole(isTheme ? 'button' : 'combobox', { name: label, exact: true }).click()
      if (!isTheme) await expect(page.getByRole('listbox')).toBeVisible()
      const during = await measure()
      await testInfo.attach(`${label}-${top}`, {
        body: JSON.stringify({ before, during }),
        contentType: 'application/json',
      })
      expect(during.scroll).toBe(before.scroll)
      for (let i = 0; i < before.boxes.length; i++) {
        expect(Math.abs(during.boxes[i].x - before.boxes[i].x)).toBeLessThan(1)
        expect(Math.abs(during.boxes[i].y - before.boxes[i].y)).toBeLessThan(1)
        expect(Math.abs(during.boxes[i].width - before.boxes[i].width)).toBeLessThan(1)
      }
      if (!isTheme) {
        await page.keyboard.press('Escape')
        await expect(page.getByRole('listbox')).toBeHidden()
      }
      const after = await measure()
      expect(after.boxes).toEqual(before.boxes)
      expect(after.scroll).toBe(before.scroll)
    }
  }
})
