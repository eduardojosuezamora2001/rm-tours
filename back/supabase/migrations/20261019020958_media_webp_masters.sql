-- Converted main images inherit the exact original's visibility; backups are retained.
create policy published_storage_webp_masters on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'tour-media'
  and right(storage.objects.name, 10) = '.main.webp'
  and exists (
    select 1
    from public.tour_media m
    join public.tours t on t.id = m.tour_id
    where m.path = left(storage.objects.name, -10)
      and t.status = 'published'
      and (
        m.section_id is null
        or exists (
          select 1 from public.tour_sections s
          where s.id = m.section_id and s.tour_id = m.tour_id and s.visible
        )
      )
  )
);
