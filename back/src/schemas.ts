import { z } from 'zod'
import { categories, destinations, sectionTypes } from '../../shared/contracts'
const text = z.string().trim().max(10000)
const localized = z.object({ es: text, en: text }).strict()
const list = z
  .object({
    es: z.array(z.string().trim().min(1).max(1000)).max(50),
    en: z.array(z.string().trim().min(1).max(1000)).max(50),
  })
  .strict()
const id = z.uuid()
const position = z.number().int().min(0).max(10000)
export const tourSchema = z
  .object({
    id,
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: localized,
    summary: localized,
    meeting_point: localized,
    destination: z.enum(destinations),
    category: z.enum(categories),
    duration_minutes: z.number().int().min(1).max(43200),
    schedules: z.array(z.string().trim().min(1).max(100)).max(20),
    status: z.enum(['draft', 'published', 'archived']),
    featured: z.boolean(),
    position,
    updated_at: z.string().max(50),
    plans: z
      .array(
        z
          .object({
            id,
            name: localized,
            description: localized,
            services: list,
            price_cents: z.number().int().min(0).max(100000000).nullable(),
            price_unit: z.enum(['person', 'group', 'hour']),
            active: z.boolean(),
            position,
          })
          .strict(),
      )
      .min(1)
      .max(30),
    sections: z
      .array(
        z
          .object({
            id,
            type: z.enum(sectionTypes),
            title: localized,
            body: localized,
            items: list,
            visible: z.boolean(),
            position,
          })
          .strict(),
      )
      .max(50),
    media: z
      .array(
        z
          .object({
            id,
            path: z.string().max(250),
            alt: localized,
            section_id: id.nullable(),
            position,
          })
          .strict(),
      )
      .max(50),
  })
  .strict()
  .superRefine((tour, ctx) => {
    for (const key of ['plans', 'sections', 'media'] as const)
      if (new Set(tour[key].map((item) => item.id)).size !== tour[key].length)
        ctx.addIssue({ code: 'custom', message: 'DUPLICATE_ID', path: [key] })
    for (const media of tour.media) {
      if (!new RegExp(`^${tour.id}/[0-9a-f-]+\\.(webp|jpg|png)$`).test(media.path))
        ctx.addIssue({ code: 'custom', message: 'INVALID_MEDIA_PATH', path: ['media'] })
      if (
        media.section_id &&
        !tour.sections.some((s) => s.id === media.section_id && s.type === 'gallery')
      )
        ctx.addIssue({ code: 'custom', message: 'INVALID_GALLERY', path: ['media'] })
    }
  })
export const settingsSchema = z
  .object({
    whatsapp: z.string().regex(/^$|^[1-9]\d{7,14}$/),
    email: z.union([z.email(), z.literal('')]),
    location: localized,
    hours: localized,
    intro: localized,
  })
  .strict()
export const legalSchema = z
  .object({
    slug: z.enum(['privacy', 'terms']),
    title: localized,
    body: localized,
    published: z.boolean(),
  })
  .strict()
  .refine(
    (page) =>
      !page.published ||
      (Object.values(page.title).every(Boolean) && Object.values(page.body).every(Boolean)),
    { message: 'LEGAL_TRANSLATIONS_REQUIRED' },
  )
