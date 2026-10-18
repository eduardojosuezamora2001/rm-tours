import type { Tour } from '../../../../shared/contracts'

/** Unassigned photos: catalogue cover, home cover, then detail gallery.
 * The fourth gallery image optionally supplies the mobile detail hero.
 */
export function tourMedia(tour: Tour) {
  const photos = tour.media
    .filter((media) => !media.section_id)
    .toSorted((a, b) => a.position - b.position)
  const cover = photos[0]
  const featured = photos[1] ?? cover
  const gallery = photos.length > 2 ? photos.slice(2) : photos.length > 1 ? photos.slice(1) : photos
  const mobileHero = gallery[3] ?? gallery[0]
  return { cover, featured, gallery, mobileHero }
}
