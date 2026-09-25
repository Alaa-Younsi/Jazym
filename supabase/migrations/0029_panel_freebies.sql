-- "Freebies" — downloadable files attached to a promo panel.
--
-- The client wanted free samples (PDFs, images, short videos) as an attention
-- grabber, delivered through the existing ad-panel section rather than as a
-- new page: a panel can now carry a set of files, and the storefront renders
-- them as a download strip under the banner. Any of the four slots can do it,
-- so the client decides where the giveaway lives by filling in that slot.
--
-- Files hang off the panel as jsonb rather than a child table. They are an
-- ordered list edited as a whole by one form and never queried independently
-- — the same reasoning as products.colors / products.variants.
--
--   [{ url, name_fr, name_ar, mime, size_bytes }]

alter table public.promo_panels
  add column if not exists files jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'promo_panels_files_check') then
    alter table public.promo_panels
      add constraint promo_panels_files_check check (
        jsonb_typeof(files) = 'array' and jsonb_array_length(files) <= 12
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: a bucket of its own
-- ---------------------------------------------------------------------------
-- Not product-images, for three reasons: these are documents and video, not
-- photos; they need a much larger size ceiling; and a giveaway the client
-- retires should be deletable without hunting through the product media.
--
-- ⚠ EGRESS. This is the one feature on the site where a single visitor can
-- pull tens of megabytes on purpose, and Supabase bills egress. A 25 MB
-- sample downloaded 200 times is 5 GB — the whole free monthly allowance. The
-- cap is deliberately tight and the admin form warns above 8 MB; if the client
-- wants to give away something big, host it elsewhere and use the panel's
-- link_url instead.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'freebies', 'freebies', true, 26214400,  -- 25 MB
      array[
        'application/pdf',
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/zip',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      -- Deliberately NOT text/html or image/svg+xml: the bucket is public, so
      -- either one would let a panel serve scripted content from a
      -- supabase.co URL. Adding a type later is a one-line update here.
    )
    on conflict (id) do update set
      public             = true,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;
end $$;

do $$
begin
  if to_regclass('storage.objects') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname = 'public read freebies'
  ) then
    create policy "public read freebies" on storage.objects
      for select to anon, authenticated using (bucket_id = 'freebies');
  end if;

  -- Writing is gated on the panels section specifically, unlike the shared
  -- product media in 0024: a freebie IS the panel's content, so whoever can
  -- edit panels can manage it, and nobody else needs to.
  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname = 'panels admin upload freebies'
  ) then
    create policy "panels admin upload freebies" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'freebies' and public.has_section('panels'));
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname = 'panels admin update freebies'
  ) then
    create policy "panels admin update freebies" on storage.objects
      for update to authenticated
      using (bucket_id = 'freebies' and public.has_section('panels'))
      with check (bucket_id = 'freebies' and public.has_section('panels'));
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname = 'panels admin delete freebies'
  ) then
    create policy "panels admin delete freebies" on storage.objects
      for delete to authenticated
      using (bucket_id = 'freebies' and public.has_section('panels'));
  end if;
end $$;
