-- If you already ran the original 0015 before it was corrected, your DB still
-- has image URLs pointing at thumb.wikimedia.org (an on-demand thumbnailer
-- that rate-limits and isn't reliable for hotlinking from a live storefront).
-- Re-running 0015 does NOT fix this — its inserts are idempotent (skip rows
-- that already exist), so the bad URLs just sit there. This migration
-- corrects any that are already stored, in place. Safe/no-op if you applied
-- the already-fixed 0015 (nothing to update).

update public.product_images
set url = replace(url, 'thumb.wikimedia.org', 'upload.wikimedia.org')
where url like '%thumb.wikimedia.org%';

update public.categories
set image_url = replace(image_url, 'thumb.wikimedia.org', 'upload.wikimedia.org')
where image_url like '%thumb.wikimedia.org%';

update public.product_variants
set image_url = replace(image_url, 'thumb.wikimedia.org', 'upload.wikimedia.org')
where image_url like '%thumb.wikimedia.org%';
