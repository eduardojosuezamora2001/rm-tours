import type { LegalPage } from '../../../../shared/contracts'
import drafts from './legal-drafts.json'

export function withLegalDraft(page: LegalPage): LegalPage {
  if (page.body.es.trim() || page.body.en.trim()) return page
  const draft = drafts[page.slug]
  return {
    ...page,
    title: { es: page.title.es || draft.title.es, en: page.title.en || draft.title.en },
    body: { ...draft.body },
    published: false,
  }
}

export function pendingLegalDetails(page: LegalPage): string[] {
  return [
    ...new Set(
      Object.values(page.title)
        .concat(Object.values(page.body))
        .join('\n')
        .match(/\[[A-Z_]+\]/g) ?? [],
    ),
  ]
}
