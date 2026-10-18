import { describe, expect, it } from 'vitest'
const resources = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*/*.json', {
  eager: true,
})
function keys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value)
    .flatMap(([key, item]) =>
      typeof item === 'object' && item !== null
        ? keys(item as Record<string, unknown>, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    )
    .sort()
}
describe('translation resources', () => {
  for (const ns of ['common', 'catalog', 'tour', 'quote', 'legal', 'auth', 'admin'])
    it(`provides matching Spanish and English keys for ${ns}`, () => {
      const es = resources[`./locales/es/${ns}.json`].default
      const en = resources[`./locales/en/${ns}.json`].default
      expect(keys(es)).toEqual(keys(en))
      for (const resource of [es, en]) expect(JSON.stringify(resource)).not.toContain(':""')
    })
})
