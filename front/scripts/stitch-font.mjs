import fs from 'node:fs/promises'
const icons = [
  'alarm',
  'anchor',
  'arrow_back_ios_new',
  'arrow_forward',
  'auto_awesome',
  'beach_access',
  'chat',
  'check',
  'check_circle',
  'chevron_right',
  'edit_calendar',
  'edit_note',
  'explore',
  'groups',
  'home',
  'info',
  'inventory_2',
  'kayaking',
  'location_on',
  'menu',
  'payments',
  'person',
  'photo_camera',
  'pin_drop',
  'place',
  'public',
  'routine',
  'sailing',
  'schedule',
  'search',
  'share',
  'support_agent',
  'swap_vert',
  'translate',
  'wb_twilight',
].sort()
const url =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&icon_names=' +
  icons.join(',') +
  '&display=block'
const css = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text()
const fontUrl = css.match(/https:\/\/fonts.gstatic.com\/[^)]+/)[0]
const response = await fetch(fontUrl)
if (!response.ok) throw new Error('Font download failed')
await fs.writeFile('public/brand/material-symbols.woff2', Buffer.from(await response.arrayBuffer()))
console.log('Subset:', (await fs.stat('public/brand/material-symbols.woff2')).size, 'bytes')
