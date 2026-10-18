import { JSDOM } from 'jsdom'
import fs from 'node:fs/promises'
const base = 'desing/stitch/'
const home = new JSDOM(await fs.readFile(base + '9c2671ea77f1488ba46ab3410d54d3ab.html', 'utf8'))
  .window.document
const mobile = new JSDOM(await fs.readFile(base + 'de3538226ad6447f9d9c84a0d3cda6f1.html', 'utf8'))
  .window.document
const detail = new JSDOM(await fs.readFile(base + 'cea7a57b40944a608fd7abf54e5a32ba.html', 'utf8'))
  .window.document
const mobileDetail = new JSDOM(
  await fs.readFile(base + 'ef6bb58f6d2c4e40b2208e3e51c6a4c1.html', 'utf8'),
).window.document
await fs.mkdir('public/brand', { recursive: true })
const backgrounds = [...home.querySelectorAll('[style*="background-image"]')]
const assets = backgrounds.slice(0, 5).map((e, i) => ({
  url: e.style.backgroundImage.slice(5, -2),
  file: i ? 'destination-' + i + '.jpg' : 'nicoya-hero.jpg',
  alt: e.getAttribute('data-alt'),
}))
assets.push({ url: mobile.querySelector('main img').src, file: 'nicoya-mobile.jpg' })
const mobileHero = mobileDetail.querySelector('#tour-carousel [style*="background-image"]')
assets.push({
  url: mobileHero.style.backgroundImage.slice(5, -2),
  file: 'bio-mobile.jpg',
  alt: mobileHero.getAttribute('data-alt'),
})
const map = home.querySelector('[data-location]')
assets.push({
  url: map.style.backgroundImage.slice(5, -2),
  file: 'region-map.jpg',
  alt: 'Illustrative Nicoya Peninsula map from Stitch',
})
for (const [i, element] of [
  ...home.querySelectorAll('#tour-cards-container article [style*="background-image"]'),
].entries())
  assets.push({
    url: element.style.backgroundImage.slice(5, -2),
    file: 'home-tour-' + i + '.jpg',
    alt: element.getAttribute('data-alt'),
  })
for (const [i, e] of [...mobile.querySelectorAll('[class*="min-w-[150px]"] img')].entries())
  assets.push({ url: e.src, file: 'mobile-destination-' + (i + 1) + '.jpg' })
await fs.copyFile(base + '2f9307579ab045a2bd481091a009e697.html', 'public/brand/logo.svg')
for (const [i, e] of [...detail.querySelectorAll('main section img')].slice(0, 3).entries())
  assets.push({ url: e.src, file: 'bio-' + i + '.jpg' })
for (const asset of assets) {
  try {
    await fs.access('public/brand/' + asset.file)
    if (!asset.file.startsWith('mobile-destination-')) continue
  } catch {}
  const r = await fetch(asset.url)
  if (!r.ok) throw new Error(asset.file + ' ' + r.status)
  await fs.writeFile('public/brand/' + asset.file, Buffer.from(await r.arrayBuffer()))
  console.log(asset.file)
}
await fs.writeFile(
  'public/brand/sources.json',
  JSON.stringify({ project: '4366171717337285856', assets }, null, 2),
)
const config = home.querySelector('#tailwind-config').textContent
const theme = JSON.parse(
  config
    .slice(config.indexOf('=') + 1)
    .trim()
    .replace(/;$/, '')
    .replace(/([{,]\s*)(darkMode|theme|extend):/g, '$1"$2":'),
).theme.extend
let css = '/* Exact tokens from Stitch project 4366171717337285856. */\n@theme {\n'
for (const [key, value] of Object.entries(theme.colors))
  if (!['primary', 'secondary', 'background', 'error'].includes(key))
    css += `  --color-${key}: ${value};\n`
for (const [key, value] of Object.entries(theme.fontFamily))
  css += `  --font-${key}: '${value[0]}', sans-serif;\n`
for (const [key, [size, props]] of Object.entries(theme.fontSize)) {
  css += `  --text-${key}: ${size};\n`
  for (const [prop, value] of Object.entries(props))
    css += `  --text-${key}--${{ lineHeight: 'line-height', fontWeight: 'font-weight', letterSpacing: 'letter-spacing' }[prop]}: ${value};\n`
}
css += '}\n'
await fs.writeFile('src/stitch-tokens.css', css)
