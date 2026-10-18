import { blankList, blankText, type Tour } from '../../../../shared/contracts'
export function newTour(): Tour {
  return {
    id: crypto.randomUUID(),
    slug: '',
    name: blankText(),
    summary: blankText(),
    meeting_point: blankText(),
    destination: 'paquera',
    category: 'ocean',
    duration_minutes: 120,
    schedules: [],
    status: 'draft',
    featured: false,
    position: 0,
    updated_at: '',
    plans: [
      {
        id: crypto.randomUUID(),
        name: { es: 'General', en: 'General' },
        description: blankText(),
        services: blankList(),
        price_cents: null,
        price_unit: 'person',
        active: true,
        position: 0,
      },
    ],
    sections: [],
    media: [],
  }
}
