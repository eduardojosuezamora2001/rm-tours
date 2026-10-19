import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import type { Tour } from '../../shared/contracts'
const db = new PGlite()
const owner = { sub: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', app_metadata: { role: 'owner' } }
const visitor = {
  sub: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  app_metadata: {},
  user_metadata: { role: 'owner' },
}
const bilingual = { es: 'Texto', en: 'Text' }
function document(): Tour {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'test-tour',
    name: bilingual,
    summary: bilingual,
    meeting_point: bilingual,
    destination: 'paquera',
    category: 'ocean',
    duration_minutes: 120,
    schedules: ['08:00'],
    status: 'published',
    featured: true,
    position: 0,
    updated_at: '',
    plans: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: bilingual,
        description: bilingual,
        services: { es: ['Servicio'], en: ['Service'] },
        price_cents: 0,
        price_unit: 'person',
        active: true,
        position: 0,
      },
    ],
    sections: [
      {
        id: '33333333-3333-4333-8333-333333333333',
        type: 'description',
        title: bilingual,
        body: bilingual,
        items: { es: [], en: [] },
        visible: false,
        position: 0,
      },
    ],
    media: [
      {
        id: '44444444-4444-4444-8444-444444444444',
        path: '11111111-1111-4111-8111-111111111111/44444444-4444-4444-8444-444444444444.webp',
        alt: bilingual,
        section_id: null,
        position: 0,
      },
    ],
  }
}
async function as(role: 'anon' | 'authenticated', claims = {}) {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)])
  await db.exec(`set role ${role}`)
}
async function save(tour: Tour) {
  return db.query<{ save_tour: string }>('select public.save_tour($1::jsonb)', [
    JSON.stringify(tour),
  ])
}
beforeAll(async () => {
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create schema auth; create schema storage;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth, storage to anon, authenticated;
    grant execute on all functions in schema auth to anon, authenticated;
    create table storage.buckets (id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to anon,authenticated;`)
  await db.exec(
    await readFile(
      new URL('../supabase/migrations/20261015172141_catalogue.sql', import.meta.url),
      'utf8',
    ),
  )
  await db.exec(await readFile(new URL('../supabase/migrations/20261019014321_media_thumbnails.sql', import.meta.url), 'utf8'))
  await db.exec(await readFile(new URL('../supabase/migrations/20261019020958_media_webp_masters.sql', import.meta.url), 'utf8'))
}, 30000)
beforeEach(async () => {
  await db.exec('reset role; truncate public.tours cascade; truncate storage.objects;')
  await as('authenticated', owner)
})
afterAll(async () => {
  await db.close()
})
describe('migration, transaction and RLS on PostgreSQL', () => {
  it('publishes atomically and exposes only visible children', async () => {
    await save(document())
    await as('anon')
    expect((await db.query('select * from public.tours')).rows).toHaveLength(1)
    expect((await db.query('select * from public.tour_sections')).rows).toHaveLength(0)
    expect((await db.query('select * from public.tour_plans')).rows).toHaveLength(1)
  })
  it('hides draft tours, plans and photographs from anonymous and other accounts', async () => {
    await save({ ...document(), status: 'draft' })
    for (const role of ['anon', 'authenticated'] as const) {
      await as(role, visitor)
      for (const table of ['tours', 'tour_plans', 'tour_sections', 'tour_media'])
        expect((await db.query(`select * from public.${table}`)).rows).toHaveLength(0)
      expect((await db.query('select * from public.catalog_tours')).rows).toHaveLength(0)
    }
  })
  it('does not trust a role in user_metadata and blocks direct writes and RPC', async () => {
    await as('authenticated', visitor)
    await expect(save(document())).rejects.toThrow('FORBIDDEN')
    expect(
      (await db.query("update public.site_settings set whatsapp='50688880000' returning id")).rows,
    ).toHaveLength(0)
    await expect(
      db.query("insert into public.legal_pages(slug) values ('privacy')"),
    ).rejects.toThrow()
    await as('anon')
    await expect(save(document())).rejects.toThrow()
  })
  it('rolls back incomplete publication and enforces completeness on direct writes', async () => {
    await expect(save({ ...document(), media: [] })).rejects.toThrow('COVER_REQUIRED')
    expect((await db.query('select * from public.tours')).rows).toHaveLength(0)
    await save(document())
    await expect(db.query('delete from public.tour_plans')).rejects.toThrow('ACTIVE_PLAN_REQUIRED')
    expect((await db.query('select * from public.tour_plans')).rows).toHaveLength(1)
  })
  it('rejects missing translations and cross-tour gallery references', async () => {
    const tour = document()
    tour.name = { es: 'Texto', en: '' }
    await expect(save(tour)).rejects.toThrow('TOUR_TRANSLATIONS_REQUIRED')
    await expect(
      db.query(
        "insert into public.tours(slug,name,summary,meeting_point,destination,category,duration_minutes) values('invalid','{\"es\":\"X\"}','{}','{}','paquera','ocean',120)",
      ),
    ).rejects.toThrow()
  })
  it('detects stale edits without losing existing children', async () => {
    const tour = document()
    await save(tour)
    await expect(save(tour)).rejects.toThrow('EDIT_CONFLICT')
    expect((await db.query('select * from public.tour_plans')).rows).toHaveLength(1)
  })
  it('saves a later edit atomically with the exact database timestamp', async () => {
    const tour = document()
    const first = await db.query<{ stamp: string }>(
      'select public.save_tour($1::jsonb)::text as stamp',
      [JSON.stringify(tour)],
    )
    tour.updated_at = first.rows[0].stamp
    tour.plans[0].price_cents = 1234
    await save(tour)
    expect(
      (await db.query<{ price_cents: number }>('select price_cents from public.tour_plans')).rows[0]
        .price_cents,
    ).toBe(1234)
  })
  it('rejects empty translated services even through direct RPC', async () => {
    const tour = document()
    tour.plans[0].services = { es: [''], en: [''] }
    await expect(save(tour)).rejects.toThrow('PLAN_TRANSLATIONS_REQUIRED')
  })
  it('protects private storage and exposes only photographs attached to published tours', async () => {
    const tour = document()
    await save(tour)
    await db.query(
      "insert into storage.objects(bucket_id,name) values('tour-media',$1),('tour-media','unattached.webp')",
      [tour.media[0].path],
    )
    await as('anon')
    expect((await db.query('select * from storage.objects')).rows).toHaveLength(1)
    await expect(
      db.query("insert into storage.objects(bucket_id,name) values('tour-media','bad.webp')"),
    ).rejects.toThrow()
  })
  it('gives thumbnails and WebP masters the same publication and section visibility as their originals', async () => {
    const tour = document()
    tour.sections[0].type = 'gallery'
    const original = tour.media[0].path
    const hidden = `${tour.id}/55555555-5555-4555-8555-555555555555.jpg`
    tour.media.push({ ...tour.media[0], id: '55555555-5555-4555-8555-555555555555', path: hidden, section_id: tour.sections[0].id, position: 1 })
    await save(tour)
    for (const name of [original, `${original}.card.webp`, `${original}.main.webp`, hidden, `${hidden}.card.webp`, `${hidden}.main.webp`, `${original}.fake.card.webp`, `${original}.fake.main.webp`, 'unattached.webp.card.webp', 'unattached.jpg.main.webp']) {
      await db.query("insert into storage.objects(bucket_id,name) values('tour-media',$1)", [name])
    }
    for (const claims of [{}, visitor]) {
      await as('authenticated', claims)
      expect((await db.query<{ name: string }>('select name from storage.objects order by name')).rows.map((r) => r.name)).toEqual([original, `${original}.card.webp`, `${original}.main.webp`])
    }
    await as('anon')
    expect((await db.query('select * from storage.objects')).rows).toHaveLength(3)
    await as('authenticated', owner)
    await db.query("update public.tours set status='draft' where id=$1", [tour.id])
    await as('anon')
    expect((await db.query('select * from storage.objects')).rows).toHaveLength(0)
    await as('authenticated', visitor)
    expect((await db.query('select * from storage.objects')).rows).toHaveLength(0)
  })
})
