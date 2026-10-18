import { createClient } from '@supabase/supabase-js'
import type { Tour } from '../../shared/contracts'
import { mediaUrl } from './media-url'
export const tourSelect = '*,plans:tour_plans(*),sections:tour_sections(*),media:tour_media(*)'
export function database(env: CloudflareBindings, token?: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
export async function withMedia(
  tours: Tour[],
  admin = false,
): Promise<Tour[]> {
  return tours.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    summary: t.summary,
    destination: t.destination,
    category: t.category,
    duration_minutes: t.duration_minutes,
    meeting_point: t.meeting_point,
    schedules: t.schedules,
    status: t.status,
    featured: t.featured,
    position: t.position,
    updated_at: t.updated_at,
    plans: t.plans
      .filter((p) => admin || p.active)
      .sort((a, b) => a.position - b.position)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        services: p.services,
        price_cents: p.price_cents,
        price_unit: p.price_unit,
        active: p.active,
        position: p.position,
      })),
    sections: t.sections
      .filter((s) => admin || s.visible)
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        body: s.body,
        items: s.items,
        visible: s.visible,
        position: s.position,
      })),
    media: t.media
      .filter(
        (m) => admin || !m.section_id || t.sections.some((s) => s.id === m.section_id && s.visible),
      )
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        id: m.id,
        path: m.path,
        alt: m.alt,
        section_id: m.section_id,
        position: m.position,
        url: mediaUrl(m.path, admin),
      })),
  }))
}
