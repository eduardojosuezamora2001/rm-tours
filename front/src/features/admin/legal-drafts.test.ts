import { describe, expect, it } from 'vitest'
import type { LegalPage } from '../../../../shared/contracts'
import { pendingLegalDetails, withLegalDraft } from './legal-drafts'

describe('legal drafts', () => {
  for (const slug of ['privacy', 'terms'] as const) {
    it(`prepares an unpublished bilingual ${slug} draft within editor limits`, () => {
      const page = withLegalDraft({
        slug,
        title: { es: '', en: '' },
        body: { es: '', en: '' },
        published: false,
      })
      expect(page.published).toBe(false)
      expect(pendingLegalDetails(page)).toContain('[DOMICILIO]')
      expect(page.body.es).toContain('rmtours@gmail.com')
      for (const lang of ['es', 'en'] as const) {
        expect(page.title[lang].length).toBeGreaterThan(0)
        expect(page.body[lang].length).toBeGreaterThan(2000)
        expect(page.body[lang].length).toBeLessThanOrEqual(10000)
      }
      const markers = (text: string) => [...new Set(text.match(/\[[A-Z_]+\]/g))].sort()
      expect(markers(page.body.es)).toEqual(markers(page.body.en))
    })
  }

  it('preserves existing documents, including a partially translated draft', () => {
    const existing: LegalPage = {
      slug: 'privacy',
      title: { es: 'Mi política', en: '' },
      body: { es: 'Texto aprobado', en: '' },
      published: false,
    }
    expect(withLegalDraft(existing)).toBe(existing)
    expect(pendingLegalDetails(existing)).toEqual([])
  })
})
