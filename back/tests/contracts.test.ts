import { describe, expect, it } from 'vitest'
import { withMedia } from '../src/db'
import { tourSchema } from '../src/schemas'
import { testTours } from '../../shared/testing/tours'
describe('read/write contracts', () => {
  it('serializes database rows without internal fields so a saved tour can be edited again', async () => {
    const tour = structuredClone(testTours[0])
    Object.assign(tour, { created_at: '2026-10-15T00:00:00Z' })
    tour.plans.forEach((plan) => Object.assign(plan, { tour_id: tour.id }))
    tour.sections.forEach((section) => Object.assign(section, { tour_id: tour.id }))
    tour.media.forEach((media) => {
      media.path = `${tour.id}/${media.id}.webp`
    })
    const [result] = await withMedia([tour], true)
    expect(result.media[0].url).toBe(`/api/v1/admin/media/${tour.media[0].path}`)
    const [published] = await withMedia([tour])
    expect(published.media[0].url).toBe(`/api/v1/media/${tour.media[0].path}`)
    const document = {
      ...result,
      media: result.media.map(({ id, path, alt, section_id, position }) => ({
        id,
        path,
        alt,
        section_id,
        position,
      })),
    }
    expect(tourSchema.safeParse(document).error).toBeUndefined()
    expect(result).not.toHaveProperty('created_at')
    expect(result.plans[0]).not.toHaveProperty('tour_id')
  })
  it('rejects fractional prices, invalid image paths and cross-tour references', () => {
    const tour = structuredClone(testTours[0])
    tour.media = []
    tour.plans[0].price_cents = 12.5
    expect(tourSchema.safeParse(tour).success).toBe(false)
    tour.plans[0].price_cents = null
    expect(tourSchema.safeParse(tour).success).toBe(true)
    tour.media = [{ ...testTours[0].media[0], path: '../other-tour/image.webp' }]
    expect(tourSchema.safeParse(tour).success).toBe(false)
  })
})
