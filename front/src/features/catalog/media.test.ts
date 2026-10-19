import { describe, expect, it } from 'vitest'
import { makeTestTour } from '../../../../shared/testing/tours'
import { tourMedia } from './media'

describe('tour media', () => {
  it('keeps both cover photos in a two-photo gallery', () => {
    const tour = makeTestTour()
    tour.media = tour.media.slice(0, 2)
    const media = tourMedia(tour)
    expect(media.gallery.map((photo) => photo.id)).toEqual(tour.media.map((photo) => photo.id))
    expect(media.cover).toBe(tour.media[0])
    expect(media.featured).toBe(media.cover)
    expect(media.mobileHero).toBe(media.cover)
  })

  it('uses the first position for every cover and retains every main-gallery photo', () => {
    const tour = makeTestTour()
    tour.media.reverse()
    const expected = tour.media.toSorted((a, b) => a.position - b.position)
    const media = tourMedia(tour)
    expect(media.gallery).toEqual(expected)
    expect(media.mobileHero).toBe(expected[0])
    expect(media.featured).toBe(expected[0])
    expect(tour.media[0]).toBe(expected.at(-1))
  })

  it('keeps section photos in their section rather than consuming a cover position', () => {
    const tour = makeTestTour()
    tour.media[0].section_id = tour.sections[0].id
    const media = tourMedia(tour)
    expect(media.cover).toBe(tour.media[1])
    expect(media.gallery).toHaveLength(tour.media.length - 1)
  })

  it('handles tours with no photos', () => {
    const media = tourMedia(makeTestTour(0, { media: [] }))
    expect(media.gallery).toEqual([])
    expect(media.cover).toBeUndefined()
    expect(media.featured).toBeUndefined()
    expect(media.mobileHero).toBeUndefined()
  })
})
