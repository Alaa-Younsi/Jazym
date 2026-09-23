-- Admin uploads were failing for every image and every video.
--
-- Three causes, all of them here:
--
-- 1. NO storage policy ever granted staff INSERT on `product-images`. The only
--    policy this project had was 0021's anon one for `customer-uploads`, so a
--    logged-in admin hit "new row violates row-level security policy" on every
--    upload. The bucket itself existed (created by hand in the dashboard), which
--    is why nothing looked obviously missing.
-- 2. The `product-videos` bucket was never created at all — VideoField's default
--    bucket returned NoSuchBucket.
-- 3. Neither bucket was provisioned by a migration, so a fresh environment could
--    never reproduce the working one.
--
-- Gate: is_admin() — any ACTIVE staff member, not a per-section check. Five
-- different sections upload into product-images (products, categories, panels,
-- landing, reviews); what a worker may then ATTACH that file to is already
-- governed per-section by the table policies. Writing bytes into a public
-- bucket is not the privileged step.
--
-- Guarded with to_regclass so the migration still applies on the bare Postgres
-- the `bun run test:db` harness uses, which has no `storage` schema.

do $$
begin
  if to_regclass('storage.buckets') is not null then
    -- Images: the client already downscales to ~1400px WebP before upload
    -- (compressImage in src/lib/image.ts), so 10 MB is generous headroom for
    -- an original that failed to compress rather than a target.
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'product-images', 'product-images', true, 10485760,
      array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    )
    on conflict (id) do update set
      public             = true,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

    -- Video: 15 MB, matching MAX_VIDEO_BYTES in src/lib/video.ts. Keep the two
    -- in step — a file the form accepts must not be refused by the API.
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'product-videos', 'product-videos', true, 15728640,
      array['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
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

  -- Public read. Both buckets are public, so the object endpoint already serves
  -- them without consulting RLS; this policy is what lets the dashboard list
  -- and re-read them through the authenticated client.
  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname = 'public read store media'
  ) then
    create policy "public read store media" on storage.objects
      for select to anon, authenticated
      using (bucket_id in ('product-images', 'product-videos'));
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname = 'admin upload store media'
  ) then
    create policy "admin upload store media" on storage.objects
      for insert to authenticated
      with check (bucket_id in ('product-images', 'product-videos') and public.is_admin());
  end if;

  -- Replacing an image uploads to a FRESH uuid path (see uploadToBucket), so
  -- update is not on the hot path — it is here so a re-upload to the same key
  -- doesn't fail, and so the bucket stays manageable from the dashboard.
  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname = 'admin update store media'
  ) then
    create policy "admin update store media" on storage.objects
      for update to authenticated
      using (bucket_id in ('product-images', 'product-videos') and public.is_admin())
      with check (bucket_id in ('product-images', 'product-videos') and public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname = 'admin delete store media'
  ) then
    create policy "admin delete store media" on storage.objects
      for delete to authenticated
      using (bucket_id in ('product-images', 'product-videos') and public.is_admin());
  end if;

  -- Customer covers (0021) are written by anon and never read back through the
  -- authenticated client, but staff DO need to delete an abusive upload.
  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname = 'admin delete customer uploads'
  ) then
    create policy "admin delete customer uploads" on storage.objects
      for delete to authenticated
      using (bucket_id = 'customer-uploads' and public.is_admin());
  end if;
end $$;
