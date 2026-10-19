import type { Tour } from '../../../../shared/contracts'

/** Every main-gallery photo remains in the gallery; its first photo is the cover everywhere. */
export function tourMedia(tour: Tour) {
  const photos = tour.media
    .filter((media) => !media.section_id)
    .toSorted((a, b) => a.position - b.position)
  const cover = photos[0]
  const featured = cover
  const gallery = photos
  const mobileHero = cover
  return { cover, featured, gallery, mobileHero }
}
