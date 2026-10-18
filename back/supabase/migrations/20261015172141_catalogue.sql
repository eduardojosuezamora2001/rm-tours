-- JSON content is structured bilingual text, never executable HTML.
create function public.is_localized(value jsonb) returns boolean language sql immutable strict set search_path = '' as $$
  select coalesce(jsonb_typeof(value) = 'object' and jsonb_typeof(value->'es') = 'string' and jsonb_typeof(value->'en') = 'string', false);
$$;
create function public.complete_localized(value jsonb) returns boolean language sql immutable strict set search_path = '' as $$
  select public.is_localized(value) and length(trim(value->>'es')) > 0 and length(trim(value->>'en')) > 0;
$$;
create function public.is_localized_list(value jsonb) returns boolean language sql immutable strict set search_path = '' as $$
  select coalesce(jsonb_typeof(value) = 'object' and jsonb_typeof(value->'es') = 'array' and jsonb_typeof(value->'en') = 'array'
    and not jsonb_path_exists(value, '$.*[*] ? (@.type() != "string")'), false);
$$;
create function public.is_owner() returns boolean language sql stable set search_path = '' as $$
  select (select auth.uid()) is not null and coalesce((select auth.jwt())->'app_metadata'->>'role' = 'owner', false);
$$;
create function public.complete_localized_list(value jsonb) returns boolean language sql immutable strict set search_path = '' as $$
  select case when public.is_localized_list(value) then
    jsonb_array_length(value->'es') > 0 and jsonb_array_length(value->'es') = jsonb_array_length(value->'en')
    and not exists (select 1 from jsonb_array_elements((value->'es') || (value->'en')) item where length(trim(item #>> '{}')) = 0)
  else false end;
$$;

create table public.tours (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (length(slug) <= 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_localized(name)),
  summary jsonb not null check (public.is_localized(summary)),
  destination text not null check (destination in ('paquera','tambor','montezuma','santa-teresa')),
  category text not null check (category in ('ocean','nature','night','adventure','fishing')),
  duration_minutes integer not null check (duration_minutes between 1 and 43200),
  meeting_point jsonb not null check (public.is_localized(meeting_point)),
  schedules text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tours_public_catalog on public.tours (destination, category, position) where status = 'published';
create table public.tour_plans (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  name jsonb not null check (public.is_localized(name)),
  description jsonb not null check (public.is_localized(description)),
  services jsonb not null default '{"es":[],"en":[]}' check (public.is_localized_list(services)),
  price_cents integer check (price_cents between 0 and 100000000),
  price_unit text not null default 'person' check (price_unit in ('person','group','hour')),
  active boolean not null default true,
  position integer not null default 0 check (position >= 0)
);
create index tour_plans_tour on public.tour_plans (tour_id, position);
create table public.tour_sections (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  type text not null check (type in ('description','gallery','included','rules','notice')),
  title jsonb not null check (public.is_localized(title)),
  body jsonb not null check (public.is_localized(body)),
  items jsonb not null default '{"es":[],"en":[]}' check (public.is_localized_list(items)),
  visible boolean not null default true,
  position integer not null default 0 check (position >= 0),
  unique (id, tour_id)
);
create index tour_sections_tour on public.tour_sections (tour_id, position);
create table public.tour_media (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  path text not null unique,
  alt jsonb not null check (public.is_localized(alt)),
  section_id uuid,
  position integer not null default 0 check (position >= 0),
  foreign key (section_id, tour_id) references public.tour_sections(id, tour_id) on delete cascade,
  check (path ~ ('^' || tour_id::text || '/[0-9a-f-]+\.(webp|jpg|png)$'))
);
create index tour_media_tour on public.tour_media (tour_id, position);
create index tour_media_section on public.tour_media (section_id, tour_id);
create view public.catalog_tours with (security_invoker = true) as
  select t.id, t.slug, t.name, t.summary, t.destination, t.category, t.duration_minutes, t.position, t.featured,
    (select min(p.price_cents) from public.tour_plans p where p.tour_id = t.id and p.active) as minimum_price
  from public.tours t where t.status = 'published';
grant select on public.catalog_tours to anon, authenticated;
create table public.site_settings (
  id integer primary key default 1 check (id = 1),
  whatsapp text not null default '' check (whatsapp = '' or whatsapp ~ '^[1-9][0-9]{7,14}$'),
  email text not null default '',
  location jsonb not null default '{"es":"","en":""}' check (public.is_localized(location)),
  hours jsonb not null default '{"es":"","en":""}' check (public.is_localized(hours)),
  intro jsonb not null default '{"es":"","en":""}' check (public.is_localized(intro))
);
insert into public.site_settings (id) values (1);
create table public.legal_pages (
  slug text primary key check (slug in ('privacy','terms')),
  title jsonb not null default '{"es":"","en":""}' check (public.is_localized(title)),
  body jsonb not null default '{"es":"","en":""}' check (public.is_localized(body)),
  published boolean not null default false,
  check (not published or public.complete_localized(title) and public.complete_localized(body))
);
insert into public.legal_pages (slug) values ('privacy'), ('terms');

alter table public.tours enable row level security;
alter table public.tour_plans enable row level security;
alter table public.tour_sections enable row level security;
alter table public.tour_media enable row level security;
alter table public.site_settings enable row level security;
alter table public.legal_pages enable row level security;

create policy public_tours on public.tours for select to anon, authenticated using (status = 'published');
create policy owner_tours on public.tours for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy public_plans on public.tour_plans for select to anon, authenticated using (active and exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published'));
create policy owner_plans on public.tour_plans for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy public_sections on public.tour_sections for select to anon, authenticated using (visible and exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published'));
create policy owner_sections on public.tour_sections for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy public_media on public.tour_media for select to anon, authenticated using (
  exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published')
  and (section_id is null or exists (select 1 from public.tour_sections s where s.id = section_id and s.visible))
);
create policy owner_media on public.tour_media for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy public_settings on public.site_settings for select to anon, authenticated using (true);
create policy owner_settings on public.site_settings for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy public_legal on public.legal_pages for select to anon, authenticated using (published);
create policy owner_legal on public.legal_pages for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
grant select on public.tours, public.tour_plans, public.tour_sections, public.tour_media, public.site_settings, public.legal_pages to anon, authenticated;
grant insert, update, delete on public.tours, public.tour_plans, public.tour_sections, public.tour_media, public.site_settings, public.legal_pages to authenticated;

-- SECURITY INVOKER: transaction and API never bypass RLS.
create function public.save_tour(p_document jsonb) returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare
  tour_uuid uuid := (p_document->>'id')::uuid;
  current_updated timestamptz;
  saved_updated timestamptz := clock_timestamp();
  item jsonb;
begin
  if not public.is_owner() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  -- Serialize creates and edits for the same UUID, including two first saves.
  perform pg_advisory_xact_lock(hashtextextended(tour_uuid::text, 0));
  select updated_at into current_updated from public.tours where id = tour_uuid for update;
  if current_updated is not null and (p_document->>'updated_at' = '' or current_updated <> (p_document->>'updated_at')::timestamptz) then raise exception 'EDIT_CONFLICT'; end if;
  insert into public.tours (id,slug,name,summary,destination,category,duration_minutes,meeting_point,schedules,status,featured,position,updated_at)
  values (tour_uuid,p_document->>'slug',p_document->'name',p_document->'summary',p_document->>'destination',p_document->>'category',(p_document->>'duration_minutes')::integer,p_document->'meeting_point',array(select jsonb_array_elements_text(p_document->'schedules')),p_document->>'status',(p_document->>'featured')::boolean,(p_document->>'position')::integer,saved_updated)
  on conflict (id) do update set slug=excluded.slug,name=excluded.name,summary=excluded.summary,destination=excluded.destination,category=excluded.category,duration_minutes=excluded.duration_minutes,meeting_point=excluded.meeting_point,schedules=excluded.schedules,status=excluded.status,featured=excluded.featured,position=excluded.position,updated_at=excluded.updated_at;
  delete from public.tour_media where tour_id = tour_uuid;
  delete from public.tour_sections where tour_id = tour_uuid;
  delete from public.tour_plans where tour_id = tour_uuid;
  for item in select * from jsonb_array_elements(p_document->'plans') loop
    insert into public.tour_plans (id,tour_id,name,description,services,price_cents,price_unit,active,position)
    values ((item->>'id')::uuid,tour_uuid,item->'name',item->'description',item->'services',(item->>'price_cents')::integer,item->>'price_unit',(item->>'active')::boolean,(item->>'position')::integer);
  end loop;
  for item in select * from jsonb_array_elements(p_document->'sections') loop
    insert into public.tour_sections (id,tour_id,type,title,body,items,visible,position)
    values ((item->>'id')::uuid,tour_uuid,item->>'type',item->'title',item->'body',item->'items',(item->>'visible')::boolean,(item->>'position')::integer);
  end loop;
  for item in select * from jsonb_array_elements(p_document->'media') loop
    if item->>'section_id' is not null and not exists (select 1 from public.tour_sections s where s.id = (item->>'section_id')::uuid and s.tour_id = tour_uuid and s.type = 'gallery') then raise exception 'INVALID_GALLERY'; end if;
    insert into public.tour_media (id,tour_id,path,alt,section_id,position)
    values ((item->>'id')::uuid,tour_uuid,item->>'path',item->'alt',(item->>'section_id')::uuid,(item->>'position')::integer);
  end loop;
  return saved_updated;
end;
$$;
revoke all on function public.save_tour(jsonb) from public, anon;
grant execute on function public.save_tour(jsonb) to authenticated;

create function public.validate_published_tour() returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  target uuid;
  tour public.tours;
begin
  if tg_table_name = 'tours' then target := coalesce(new.id, old.id); else target := coalesce(new.tour_id, old.tour_id); end if;
  select * into tour from public.tours where id = target;
  if tour.id is null or tour.status <> 'published' then return null; end if;
  if not public.complete_localized(tour.name) or not public.complete_localized(tour.summary) or not public.complete_localized(tour.meeting_point) then raise exception 'TOUR_TRANSLATIONS_REQUIRED'; end if;
  if not exists (select 1 from public.tour_plans where tour_id = target and active) then raise exception 'ACTIVE_PLAN_REQUIRED'; end if;
  if exists (select 1 from public.tour_plans p where p.tour_id = target and p.active and (not public.complete_localized(p.name) or not public.complete_localized(p.description) or not public.complete_localized_list(p.services))) then raise exception 'PLAN_TRANSLATIONS_REQUIRED'; end if;
  if not exists (select 1 from public.tour_media where tour_id = target and section_id is null) then raise exception 'COVER_REQUIRED'; end if;
  if exists (select 1 from public.tour_media where tour_id = target and not public.complete_localized(alt)) then raise exception 'IMAGE_TRANSLATIONS_REQUIRED'; end if;
  if exists (select 1 from public.tour_sections s where s.tour_id = target and s.visible and (
    not public.complete_localized(s.title)
    or jsonb_array_length(s.items->'es') <> jsonb_array_length(s.items->'en')
    or (jsonb_array_length(s.items->'es') > 0 and not public.complete_localized_list(s.items))
    or (s.type = 'gallery' and not exists (select 1 from public.tour_media m where m.section_id = s.id))
    or (s.type <> 'gallery' and not public.complete_localized(s.body) and (jsonb_array_length(s.items->'es') = 0 or jsonb_array_length(s.items->'en') = 0))
  )) then raise exception 'SECTION_TRANSLATIONS_REQUIRED'; end if;
  return null;
end;
$$;
create constraint trigger validate_tour after insert or update or delete on public.tours deferrable initially deferred for each row execute function public.validate_published_tour();
create constraint trigger validate_plans after insert or update or delete on public.tour_plans deferrable initially deferred for each row execute function public.validate_published_tour();
create constraint trigger validate_sections after insert or update or delete on public.tour_sections deferrable initially deferred for each row execute function public.validate_published_tour();
create constraint trigger validate_media after insert or update or delete on public.tour_media deferrable initially deferred for each row execute function public.validate_published_tour();

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('tour-media','tour-media',false,5242880,array['image/webp','image/jpeg','image/png']);
create policy owner_storage on storage.objects for all to authenticated using (bucket_id = 'tour-media' and (select public.is_owner())) with check (bucket_id = 'tour-media' and (select public.is_owner()));
create policy published_storage on storage.objects for select to anon, authenticated using (
  bucket_id = 'tour-media' and exists (select 1 from public.tour_media m join public.tours t on t.id = m.tour_id where m.path = storage.objects.name and t.status = 'published' and (m.section_id is null or exists (select 1 from public.tour_sections s where s.id = m.section_id and s.visible)))
);
