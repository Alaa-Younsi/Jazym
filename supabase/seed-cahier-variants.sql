-- Jazym — Cahier variant chain seed (Theme / Educational stage / Personalization).
-- Not a migration. Run it in the Supabase SQL editor AFTER
-- supabase/migrations/0021_cahier_personalization.sql has been applied.
--
-- Populates the three new required variant groups on every "Cahier" product
-- (style_code JZC-001..JZC-104 — cahier journal, cahier de notes, registre
-- d'appel, etc., across all 13 subjects): Thème (6 colour swatches + a
-- custom-cover upload option), Palier scolaire (Primaire / CEM / Lycée), and
-- Personnalisation (with or without a typed name). Only touches products
-- whose `variants` is still empty, so it's safe to re-run and never
-- overwrites a product you've since customised by hand in /admin.
--
-- Everything here (labels, swatch colours, which value requires text/upload)
-- is ordinary admin data — edit any of it afterward from
-- /admin/products/:id exactly like colors or sizes.
--
-- To undo (⚠ also wipes any manual edits made since seeding):
--   update public.products set variants = '[]'::jsonb where style_code like 'JZC-%';

begin;

update public.products
set variants = '[
  {
    "name_fr": "Thème",
    "name_ar": "الطابع",
    "before_price_variant": true,
    "values": [
      { "value_fr": "Violet", "value_ar": "بنفسجي", "swatch_hex": "#8B5CF6" },
      { "value_fr": "Bleu", "value_ar": "أزرق", "swatch_hex": "#3B82F6" },
      { "value_fr": "Rouge", "value_ar": "أحمر", "swatch_hex": "#EF4444" },
      { "value_fr": "Rose", "value_ar": "وردي", "swatch_hex": "#EC4899" },
      { "value_fr": "Marron", "value_ar": "بني", "swatch_hex": "#92400E" },
      { "value_fr": "Jaune", "value_ar": "أصفر", "swatch_hex": "#F59E0B" },
      { "value_fr": "Couverture personnalisée", "value_ar": "غلاف مخصص", "requires_upload": true }
    ]
  },
  {
    "name_fr": "Palier scolaire",
    "name_ar": "الطور الدراسي",
    "before_price_variant": true,
    "values": [
      { "value_fr": "Primaire", "value_ar": "الابتدائي" },
      { "value_fr": "CEM (Moyen)", "value_ar": "المتوسط" },
      { "value_fr": "Lycée", "value_ar": "الثانوي" }
    ]
  },
  {
    "name_fr": "Personnalisation",
    "name_ar": "التخصيص",
    "values": [
      { "value_fr": "Sans nom", "value_ar": "بدون اسم" },
      { "value_fr": "Avec le nom", "value_ar": "مع الاسم", "requires_text": true }
    ]
  }
]'::jsonb
where style_code like 'JZC-%'
  and coalesce(variants, '[]'::jsonb) = '[]'::jsonb;

commit;
