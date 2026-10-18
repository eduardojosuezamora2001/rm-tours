// Synthetic contract fixtures for automated tests only. Never import from application code.
import type { Tour } from '../contracts'

export function makeTestTour(index = 0, overrides: Partial<Tour> = {}): Tour {
  const suffix = String(index + 1).padStart(12, '0')
  const id = `00000000-0000-4000-8000-${suffix}`
  return {
    id,
    slug: `test-tour-${index + 1}`,
    name: { es: `Experiencia de prueba ${index + 1}`, en: `Test experience ${index + 1}` },
    summary: {
      es: 'Contenido sintético para pruebas automatizadas.',
      en: 'Synthetic content for automated tests.',
    },
    destination: 'paquera',
    category: 'night',
    duration_minutes: 120,
    meeting_point: { es: 'Punto de encuentro de prueba', en: 'Test meeting point' },
    schedules: ['18:00', '19:30'],
    status: 'published',
    featured: index === 0,
    position: index,
    updated_at: '2026-10-15T00:00:00Z',
    plans: [
      {
        id: `10000000-0000-4000-8000-${suffix}`,
        name: { es: 'General', en: 'General' },
        description: { es: 'Plan para pruebas de contratos.', en: 'Plan for contract tests.' },
        services: {
          es: ['Guía de prueba', 'Equipo de prueba'],
          en: ['Test guide', 'Test equipment'],
        },
        price_cents: 4500 + index * 500,
        price_unit: 'person',
        active: true,
        position: 0,
      },
    ],
    sections: [
      {
        id: `20000000-0000-4000-8000-${suffix}`,
        type: 'description',
        title: { es: 'Acerca del recorrido', en: 'About the experience' },
        body: {
          es: 'Descripción sintética para comprobar el detalle.',
          en: 'Synthetic description to test the detail page.',
        },
        items: { es: [], en: [] },
        visible: true,
        position: 0,
      },
    ],
    media: Array.from({ length: index === 0 ? 6 : 3 }, (_, position) => {
      const mediaId = `30000000-0000-4000-8000-${String(index * 10 + position + 1).padStart(12, '0')}`
      return {
        id: mediaId,
        path: `${id}/${mediaId}.jpg`,
        url: `/api/v1/media/${id}/${mediaId}.jpg`,
        alt: { es: `Fotografía de prueba ${position + 1}`, en: `Test photograph ${position + 1}` },
        section_id: null,
        position,
      }
    }),
    ...overrides,
  }
}

export const testTours: Tour[] = [
  makeTestTour(0, {
    slug: 'bioluminiscencia-paquera',
    name: { es: 'Bioluminiscencia en Paquera', en: 'Bioluminescence in Paquera' },
  }),
  makeTestTour(1, {
    slug: 'isla-tortuga',
    category: 'ocean',
    name: { es: 'Isla Tortuga', en: 'Isla Tortuga & turquoise waters' },
  }),
  makeTestTour(2, { slug: 'senderos-curu', category: 'nature' }),
  makeTestTour(3, { slug: 'bahia-tambor', destination: 'tambor', category: 'ocean' }),
  makeTestTour(4, { slug: 'cascadas-montezuma', destination: 'montezuma', category: 'nature' }),
  makeTestTour(5, {
    slug: 'surf-santa-teresa',
    destination: 'santa-teresa',
    category: 'adventure',
  }),
  makeTestTour(6, { slug: 'pesca-tambor', destination: 'tambor', category: 'fishing' }),
  makeTestTour(7, { slug: 'costa-mal-pais', destination: 'santa-teresa', category: 'nature' }),
]
