import { Hono } from 'hono'
import type { AppEnv } from '../../env'
import { database, tourSelect, withMedia } from '../../db'
import type { Tour } from '../../../../shared/contracts'

export const catalogRoutes = new Hono<AppEnv>()

catalogRoutes.get('/tour-options', async (c) => {
  const { data, error } = await database(c.env)
    .from('tours').select('id,slug,name').eq('status', 'published').order('position').limit(1000)
  if (error) throw error
  return c.json(data)
})

catalogRoutes.get('/tours', async (c) => {
  const db = database(c.env)
  const lang = c.req.query('lang') === 'en' ? 'en' : 'es'
  const sort = c.req.query('sort')
  const page = Math.min(10000, Math.max(1, Math.floor(Number(c.req.query('page')) || 1)))
  const pageSize = 9
  let search = db.from('catalog_tours').select('id', { count: 'exact' })
  if (c.req.query('destination')) search = search.eq('destination', c.req.query('destination')!)
  if (c.req.query('category')) search = search.eq('category', c.req.query('category')!)
  const text = (c.req.query('q') ?? '').slice(0, 150).replace(/[^\p{L}\p{N}\s-]/gu, '').trim()
  if (text) search = search.or(`name->>${lang}.ilike.%${text}%,summary->>${lang}.ilike.%${text}%`)
  search = sort === 'price-asc'
    ? search.order('minimum_price', { ascending: true, nullsFirst: false })
    : sort === 'duration-desc'
      ? search.order('duration_minutes', { ascending: false })
      : search.order('featured', { ascending: false }).order('position')
  const { data: ids, error: searchError, count } = await search.order('slug').range((page - 1) * pageSize, page * pageSize - 1)
  if (searchError) throw searchError
  if (!ids.length) return c.json({ items: [], total: count ?? 0, page, pageSize })
  const { data, error } = await db.from('tours').select('*,plans:tour_plans(*),media:tour_media(*)')
    .in('id', ids.map((item) => item.id)).eq('status', 'published').is('media.section_id', null)
  if (error) throw error
  const ordered = ids.map((item) => data.find((tour) => tour.id === item.id)).filter(Boolean)
    .map((tour) => ({ ...tour, sections: [] })) as Tour[]
  c.header('Cache-Control', 'public, max-age=30')
  return c.json({ total: count ?? 0, page, pageSize, items: await withMedia(ordered) })
})

catalogRoutes.get('/tours/:slug', async (c) => {
  const db = database(c.env)
  const { data, error } = await db.from('tours').select(tourSelect).eq('slug', c.req.param('slug'))
    .eq('status', 'published').maybeSingle()
  if (error) throw error
  if (!data) return c.json({ error: { code: 'NOT_FOUND' } }, 404)
  return c.json((await withMedia([data as Tour]))[0])
})
