-- Jazym — PREVIEW-ONLY imagery.
-- Not a migration. Run it in the Supabase SQL editor to give the seeded
-- catalogue placeholder photos so the storefront + admin look populated.
--
-- Images are hot-linked from the Unsplash CDN (images.unsplash.com), which is
-- already whitelisted in the site CSP `img-src`. Replace them with real product
-- photos via /admin when you have them.
--
-- Safe to re-run (it clears its own rows first).
-- To remove all of it later:
--   delete from public.product_images where url like 'https://images.unsplash.com/%';
--   update public.categories set image_url = null where image_url like 'https://images.unsplash.com/%';

begin;

-- 1. Product images ---------------------------------------------------------
delete from public.product_images where url like 'https://images.unsplash.com/%';

with img(slug, url, alt, sort_order) as (values
  -- Cahiers de l'enseignant
  ('cahier-journal',                'https://images.unsplash.com/photo-1591195852468-03a01d1375d6?auto=format&fit=crop&w=1000&q=70', 'Cahier journal',                       0),
  ('cahier-journal',                'https://images.unsplash.com/photo-1554757387-fa0367573d09?auto=format&fit=crop&w=1000&q=70',     'Cahier journal — pages',               1),
  ('cahier-de-notes',               'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=1000&q=70',   'Cahier de notes',                      0),
  ('cahier-de-notes',               'https://images.unsplash.com/photo-1611079830811-865ff4428d17?auto=format&fit=crop&w=1000&q=70',   'Cahier de notes — couverture',         1),
  ('cahier-de-formation',           'https://images.unsplash.com/photo-1601001435957-74f0958a93fb?auto=format&fit=crop&w=1000&q=70',   'Cahier de formation',                  0),
  ('cahier-de-formation',           'https://images.unsplash.com/photo-1654542645651-5196f4931cd6?auto=format&fit=crop&w=1000&q=70',   'Cahier de formation — vue',            1),
  ('cahier-de-seminaires',          'https://images.unsplash.com/photo-1620811449164-f12a0f2ac40f?auto=format&fit=crop&w=1000&q=70',   'Cahier de séminaires',                 0),
  ('cahier-de-seminaires',          'https://images.unsplash.com/photo-1603188389888-7b80bd0a7e3e?auto=format&fit=crop&w=1000&q=70',   'Cahier de séminaires — vue',           1),
  ('cahier-de-fiches',              'https://images.unsplash.com/photo-1682686867361-24fe55e1845e?auto=format&fit=crop&w=1000&q=70',   'Cahier de fiches (planning)',          0),
  ('cahier-de-fiches',              'https://images.unsplash.com/photo-1591195852468-03a01d1375d6?auto=format&fit=crop&w=1000&q=70',   'Cahier de fiches — pages',             1),
  ('cahier-de-remediation',         'https://images.unsplash.com/photo-1647559709298-c0e3dcb47092?auto=format&fit=crop&w=1000&q=70',   'Cahier de remédiation',                0),
  ('cahier-de-remediation',         'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=1000&q=70',   'Cahier de remédiation — vue',          1),
  ('registre-appel',                'https://images.unsplash.com/photo-1554757387-fa0367573d09?auto=format&fit=crop&w=1000&q=70',       'Registre d''appel',                    0),
  ('registre-appel',                'https://images.unsplash.com/photo-1611079830811-865ff4428d17?auto=format&fit=crop&w=1000&q=70',   'Registre d''appel — couverture',       1),
  ('cahier-de-roulement',           'https://images.unsplash.com/photo-1603188389888-7b80bd0a7e3e?auto=format&fit=crop&w=1000&q=70',   'Cahier de roulement',                  0),
  ('cahier-de-roulement',           'https://images.unsplash.com/photo-1514429015793-8a42fb25e17f?auto=format&fit=crop&w=1000&q=70',   'Cahier de roulement — vue',            1),

  -- Accessoires & organisateurs
  ('organisateur-titularisation',   'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?auto=format&fit=crop&w=1000&q=70',      'Organisateur — comité de titularisation', 0),
  ('organisateur-titularisation',   'https://images.unsplash.com/photo-1633520833019-e34afd4b8fad?auto=format&fit=crop&w=1000&q=70',   'Organisateur — intercalaires',         1),
  ('porte-memoire-titularisation',  'https://images.unsplash.com/photo-1654610285929-a1b63280dd60?auto=format&fit=crop&w=1000&q=70',   'Porte-mémoire de titularisation',      0),
  ('porte-memoire-titularisation',  'https://images.unsplash.com/photo-1750935578389-6e1445f5fd8d?auto=format&fit=crop&w=1000&q=70',   'Porte-mémoire — vue',                  1),
  ('organisateur-tableau',          'https://images.unsplash.com/photo-1768158989131-64cbff67f292?auto=format&fit=crop&w=1000&q=70',   'Organisateur de tableau',              0),
  ('organisateur-tableau',          'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?auto=format&fit=crop&w=1000&q=70',      'Organisateur de tableau — vue',        1),

  -- Stratégies pédagogiques
  ('strategie-pigeon-voyageur',     'https://images.unsplash.com/photo-1776042449461-466fbc1aa3eb?auto=format&fit=crop&w=1000&q=70',   'Stratégie du pigeon voyageur',         0),
  ('strategie-pigeon-voyageur',     'https://images.unsplash.com/photo-1669286211114-9f17251fd0e3?auto=format&fit=crop&w=1000&q=70',   'Stratégie du pigeon voyageur — kit',   1),
  ('strategie-autre-moitie',        'https://images.unsplash.com/photo-1596994377882-589eeacdd977?auto=format&fit=crop&w=1000&q=70',   'Stratégie de l''autre moitié',         0),
  ('strategie-autre-moitie',        'https://images.unsplash.com/photo-1677602225011-8370b5013efc?auto=format&fit=crop&w=1000&q=70',   'Stratégie de l''autre moitié — kit',   1),
  ('strategie-train-de-mots',       'https://images.unsplash.com/photo-1647968047033-291b0cef669c?auto=format&fit=crop&w=1000&q=70',   'Stratégie du train de mots',           0),
  ('strategie-train-de-mots',       'https://images.unsplash.com/photo-1684233967170-fe1d3e323443?auto=format&fit=crop&w=1000&q=70',   'Stratégie du train de mots — kit',     1),
  ('strategie-theiere',             'https://images.unsplash.com/photo-1669286211114-9f17251fd0e3?auto=format&fit=crop&w=1000&q=70',   'Stratégie de la théière',              0),
  ('strategie-theiere',             'https://images.unsplash.com/photo-1647968047033-291b0cef669c?auto=format&fit=crop&w=1000&q=70',   'Stratégie de la théière — kit',        1),
  ('strategie-cadenas-cle',         'https://images.unsplash.com/photo-1678846851807-3fab5c774d14?auto=format&fit=crop&w=1000&q=70',   'Stratégie du cadenas et de la clé',    0),
  ('strategie-cadenas-cle',         'https://images.unsplash.com/photo-1677602224941-dd4acb68d31b?auto=format&fit=crop&w=1000&q=70',   'Stratégie du cadenas et de la clé — kit', 1),
  ('strategie-cinq-doigts',         'https://images.unsplash.com/photo-1784973387522-9968e2fd987d?auto=format&fit=crop&w=1000&q=70',   'Stratégie des cinq doigts',            0),
  ('strategie-cinq-doigts',         'https://images.unsplash.com/photo-1669286211114-9f17251fd0e3?auto=format&fit=crop&w=1000&q=70',   'Stratégie des cinq doigts — kit',      1),
  ('strategie-pop-corn',            'https://images.unsplash.com/photo-1678846851878-9a8445a4fb5d?auto=format&fit=crop&w=1000&q=70',   'Stratégie du pop-corn',                0),
  ('strategie-pop-corn',            'https://images.unsplash.com/photo-1678846851807-3fab5c774d14?auto=format&fit=crop&w=1000&q=70',   'Stratégie du pop-corn — kit',          1)
)
insert into public.product_images (product_id, url, alt, sort_order)
select p.id, i.url, i.alt, i.sort_order
from img i
join public.products p on p.slug = i.slug;

-- 2. Category cover images ------------------------------------------------
update public.categories set image_url = case slug
  when 'cahiers'     then 'https://images.unsplash.com/photo-1591195852468-03a01d1375d6?auto=format&fit=crop&w=1200&q=70'
  when 'accessoires' then 'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?auto=format&fit=crop&w=1200&q=70'
  when 'strategies'  then 'https://images.unsplash.com/photo-1669286211114-9f17251fd0e3?auto=format&fit=crop&w=1200&q=70'
end
where slug in ('cahiers', 'accessoires', 'strategies');

-- 3. Backfill thumbnails on existing order lines ------------------------
-- (place_order does this automatically for new orders; this catches the ones
--  already in the table.)
update public.order_items oi
set image_url = (
  select pi.url from public.product_images pi
  where pi.product_id = oi.product_id
  order by pi.sort_order
  limit 1
)
where oi.product_id is not null and oi.image_url is null;

commit;
