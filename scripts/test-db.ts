/**
 * Database test suite — `bun run test:db`.
 *
 * Applies EVERY migration into an in-process Postgres (PGlite, WASM — no
 * Docker, no server), then runs identical carts through the SQL engine
 * (`apply_promotions`) and its TypeScript mirror (`quoteCart`) and asserts
 * they agree, plus an end-to-end `place_order` check.
 *
 * Two things this catches that nothing else does:
 *   1. a migration that does not apply cleanly on a fresh database;
 *   2. the pricing mirror in src/lib/promotions.ts drifting from the SQL.
 */
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePanel } from "@/hooks/usePromoPanels";
import { freebieDownloadUrl } from "@/lib/freebies";
import { normalizeProduct } from "@/lib/normalize";
import { quoteCart, type QuoteLineInput } from "@/lib/promotions";
import type { Category, Promotion } from "@/types/db";

const MIG_DIR = fileURLToPath(new URL("../supabase/migrations", import.meta.url));
const SKIP = new Set([
  "0008_seed.sql",
  "0015_cahiers_matiere_tree.sql",
  "0016_fix_wikimedia_image_hosts.sql",
]);

const db = new PGlite({ extensions: { pgcrypto } });

await db.exec(`
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
  create role anon; create role authenticated; create role service_role;
  create or replace function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create or replace function auth.role() returns text language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
`);

for (const f of readdirSync(MIG_DIR).filter((f) => f.endsWith(".sql")).sort()) {
  if (SKIP.has(f)) continue;
  await db.exec(readFileSync(join(MIG_DIR, f), "utf8"));
}

/* ---------------- fixtures ---------------- */

const catParent = "11111111-1111-1111-1111-111111111111";
const catChild = "22222222-2222-2222-2222-222222222222";
const catOther = "33333333-3333-3333-3333-333333333333";
const pA = "aaaaaaaa-0000-4000-8000-000000000001";
const pB = "aaaaaaaa-0000-4000-8000-000000000002";
const pC = "aaaaaaaa-0000-4000-8000-000000000003";

await db.exec(`
  insert into public.categories (id, slug, name_fr, name_ar, parent_id, sort_order) values
    ('${catParent}', 'parent', 'Parent', 'أب', null, 1),
    ('${catChild}',  'child',  'Enfant', 'ابن', '${catParent}', 1),
    ('${catOther}',  'other',  'Autre', 'آخر', null, 2);

  insert into public.products (id, slug, name_fr, name_ar, price, stock, category_id, status, quantity_offers) values
    ('${pA}', 'prod-a', 'Produit A', 'منتج أ', 1000, 100, '${catChild}', 'active', '[]'::jsonb),
    ('${pB}', 'prod-b', 'Produit B', 'منتج ب', 500,  100, '${catOther}', 'active', '[]'::jsonb),
    ('${pC}', 'prod-c', 'Produit C', 'منتج ج', 300,  100, '${catChild}', 'active',
       '[{"type":"free","buy":2,"get":1},{"type":"price","qty":4,"price":1000}]'::jsonb);
`);

const categories: Category[] = (
  await db.query<Category>("select * from public.categories")
).rows;

async function loadPromotions(): Promise<Promotion[]> {
  const { rows } = await db.query<Promotion>(`
    select id, name, type, active, priority,
           starts_at::text as starts_at, ends_at::text as ends_at,
           scope, category_ids, product_ids, buy_qty, get_qty, percent::float8 as percent,
           pack_items, pack_price::float8 as pack_price, label_fr, label_ar,
           created_at::text as created_at, updated_at::text as updated_at
    from public.promotions`);
  return rows.map((r) => ({
    ...r,
    category_ids: r.category_ids ?? [],
    product_ids: r.product_ids ?? [],
    pack_items: r.pack_items ?? [],
  }));
}

const OFFERS_C = [
  { type: "free" as const, buy: 2, get: 1 },
  { type: "price" as const, qty: 4, price: 1000 },
];

interface Cart {
  key: string;
  productId: string;
  categoryId: string | null;
  unitPrice: number;
  quantity: number;
  quantityOffers: QuoteLineInput["quantityOffers"];
}

const LINE_A = (q: number): Cart => ({
  key: "A",
  productId: pA,
  categoryId: catChild,
  unitPrice: 1000,
  quantity: q,
  quantityOffers: [],
});
const LINE_B = (q: number): Cart => ({
  key: "B",
  productId: pB,
  categoryId: catOther,
  unitPrice: 500,
  quantity: q,
  quantityOffers: [],
});
const LINE_C = (q: number): Cart => ({
  key: "C",
  productId: pC,
  categoryId: catChild,
  unitPrice: 300,
  quantity: q,
  quantityOffers: OFFERS_C,
});

/* ---------------- runner ---------------- */

let pass = 0;
let fail = 0;

async function scenario(
  name: string,
  promoSql: string,
  cart: Cart[],
  expected: { subtotal: number; discount: number },
) {
  await db.exec("delete from public.promotions;");
  if (promoSql.trim()) await db.exec(promoSql);
  const promotions = await loadPromotions();

  const payload = cart.map((l) => ({
    product_id: l.productId,
    category_id: l.categoryId,
    unit_price: l.unitPrice,
    quantity: l.quantity,
    quantity_offers: l.quantityOffers,
  }));

  const { rows } = await db.query<{ r: { subtotal: string; discount: string } }>(
    "select public.apply_promotions($1::jsonb) as r",
    [JSON.stringify(payload)],
  );
  const sql = {
    subtotal: Number(rows[0].r.subtotal),
    discount: Number(rows[0].r.discount),
  };
  const ts = quoteCart(cart, promotions, categories);

  const ok =
    sql.subtotal === expected.subtotal &&
    sql.discount === expected.discount &&
    ts.subtotal === expected.subtotal &&
    ts.discount === expected.discount;

  if (ok) {
    pass++;
    console.log(`  PASS  ${name}  (subtotal ${sql.subtotal}, discount ${sql.discount})`);
  } else {
    fail++;
    console.log(
      `  FAIL  ${name}\n        expected  subtotal=${expected.subtotal} discount=${expected.discount}` +
        `\n        sql       subtotal=${sql.subtotal} discount=${sql.discount}` +
        `\n        ts        subtotal=${ts.subtotal} discount=${ts.discount}`,
    );
  }
}

console.log("\npromotions engine — SQL vs TS parity\n");

await scenario("no promotions at all", "", [LINE_A(3)], { subtotal: 3000, discount: 0 });

await scenario(
  "product quantity_offers: buy 2 get 1, qty 6",
  "",
  [LINE_C(6)],
  // group=3 → 2 free → pay 4×300=1200. Bundle: 1×1000 + 2×300=1600. Best 1200.
  { subtotal: 1800, discount: 600 },
);

await scenario(
  "product quantity_offers: bundle wins at qty 4",
  "",
  [LINE_C(4)],
  // free: group 3 → 1 free → 3×300=900. bundle: 1×1000. Best 900.
  { subtotal: 1200, discount: 300 },
);

await scenario(
  "buy_x_get_y store-wide (buy 3 get 1) qty 8",
  `insert into public.promotions (name, type, active, scope, buy_qty, get_qty)
   values ('B3G1', 'buy_x_get_y', true, 'all', 3, 1);`,
  [LINE_A(8)],
  // group=4 → 2 free → pay 6×1000
  { subtotal: 8000, discount: 2000 },
);

await scenario(
  "buy_x_get_y is inert below the threshold",
  `insert into public.promotions (name, type, active, scope, buy_qty, get_qty)
   values ('B3G1', 'buy_x_get_y', true, 'all', 3, 1);`,
  [LINE_A(3)],
  { subtotal: 3000, discount: 0 },
);

await scenario(
  "buy_x_percent scoped to products, threshold met",
  `insert into public.promotions (name, type, active, scope, product_ids, buy_qty, percent)
   values ('2 achetés -20%', 'buy_x_percent', true, 'products', array['${pA}']::uuid[], 2, 20);`,
  [LINE_A(4), LINE_B(3)],
  // A: 4000 × 0.8 → −800. B not in scope.
  { subtotal: 5500, discount: 800 },
);

await scenario(
  "buy_x_percent below threshold does nothing",
  `insert into public.promotions (name, type, active, scope, product_ids, buy_qty, percent)
   values ('2 achetés -20%', 'buy_x_percent', true, 'products', array['${pA}']::uuid[], 2, 20);`,
  [LINE_A(1)],
  { subtotal: 1000, discount: 0 },
);

await scenario(
  "category_percent on the PARENT reaches a child-category product",
  `insert into public.promotions (name, type, active, category_ids, percent)
   values ('-30% rentrée', 'category_percent', true, array['${catParent}']::uuid[], 30);`,
  [LINE_A(2), LINE_B(2)],
  // A (child of parent): 2000 × 0.7 → −600. B (other): untouched.
  { subtotal: 3000, discount: 600 },
);

await scenario(
  "category_percent outside its window is ignored",
  `insert into public.promotions (name, type, active, category_ids, percent, starts_at, ends_at)
   values ('-30% passé', 'category_percent', true, array['${catParent}']::uuid[], 30,
           now() - interval '10 days', now() - interval '1 day');`,
  [LINE_A(2)],
  { subtotal: 2000, discount: 0 },
);

await scenario(
  "inactive promotion is ignored",
  `insert into public.promotions (name, type, active, category_ids, percent)
   values ('-30% off', 'category_percent', false, array['${catParent}']::uuid[], 30);`,
  [LINE_A(2)],
  { subtotal: 2000, discount: 0 },
);

await scenario(
  "pack: 1×A + 2×B for 1500, cart holds 2A + 5B",
  `insert into public.promotions (name, type, active, pack_items, pack_price)
   values ('Pack rentrée', 'pack', true,
     '[{"product_id":"${pA}","quantity":1},{"product_id":"${pB}","quantity":2}]'::jsonb, 1500);`,
  [LINE_A(2), LINE_B(5)],
  // times = min(2/1, 5/2) = 2 → consumes 2A + 4B, gross 2000+2000=4000, pack 3000 → −1000.
  // 1 B left over at 500, no other promo.
  { subtotal: 4500, discount: 1000 },
);

await scenario(
  "pack cannot form → no discount",
  `insert into public.promotions (name, type, active, pack_items, pack_price)
   values ('Pack rentrée', 'pack', true,
     '[{"product_id":"${pA}","quantity":1},{"product_id":"${pB}","quantity":2}]'::jsonb, 1500);`,
  [LINE_A(3)],
  { subtotal: 3000, discount: 0 },
);

await scenario(
  "pack consumes first, leftovers still take the best line offer",
  `insert into public.promotions (name, type, active, pack_items, pack_price)
     values ('Pack A+C', 'pack', true,
       '[{"product_id":"${pA}","quantity":1},{"product_id":"${pC}","quantity":1}]'::jsonb, 1000);
   insert into public.promotions (name, type, active, scope, percent, buy_qty)
     values ('-50% dès 1', 'buy_x_percent', true, 'all', 50, 1);`,
  [LINE_A(1), LINE_C(4)],
  // Pack: 1A + 1C consumed, gross 1300, pack 1000 → −300.
  // Leftover 3×C = 900 gross: own offer (buy2get1 → 2×300=600) vs −50% (450) → 450 → −450.
  { subtotal: 2200, discount: 750 },
);

await scenario(
  "two competing promotions — the cheaper one wins, they do not stack",
  `insert into public.promotions (name, type, active, scope, percent, buy_qty, priority)
     values ('-10%', 'buy_x_percent', true, 'all', 10, 1, 5);
   insert into public.promotions (name, type, active, scope, percent, buy_qty, priority)
     values ('-25%', 'buy_x_percent', true, 'all', 25, 1, 1);`,
  [LINE_A(2)],
  { subtotal: 2000, discount: 500 },
);

await scenario(
  "higher-priority pack claims the stock first",
  `insert into public.promotions (name, type, active, priority, pack_items, pack_price)
     values ('Pack prioritaire', 'pack', true, 10,
       '[{"product_id":"${pA}","quantity":2}]'::jsonb, 1500);
   insert into public.promotions (name, type, active, priority, pack_items, pack_price)
     values ('Pack secondaire', 'pack', true, 1,
       '[{"product_id":"${pA}","quantity":2}]'::jsonb, 1900);`,
  [LINE_A(3)],
  // Priority pack takes 2 → −500. 1 left, no promo.
  { subtotal: 3000, discount: 500 },
);

await scenario("empty cart", "", [], { subtotal: 0, discount: 0 });

/* ---------------- place_order end-to-end ---------------- */

console.log("\nplace_order end-to-end\n");

await db.exec(`
  delete from public.promotions;
  insert into public.promotions (name, type, active, category_ids, percent)
    values ('-30%', 'category_percent', true, array['${catParent}']::uuid[], 30);
  insert into public.delivery_prices (wilaya, home_price, office_price, active)
    values ('Alger', 400, 250, true)
    on conflict (wilaya) do update set home_price = 400, office_price = 250, active = true;
`);

const orderNo = await db.query<{ place_order: string }>(
  `select public.place_order($1::jsonb, $2::jsonb) as place_order`,
  [
    JSON.stringify([{ product_id: pA, quantity: 2 }]),
    JSON.stringify({
      customer_name: "Test Client",
      customer_phone: "0555123456",
      wilaya: "Alger",
      city: "Bab Ezzouar",
      delivery_type: "home",
      language: "fr",
    }),
  ],
);

const order = (
  await db.query<{ subtotal: string; discount: string; shipping: string; total: string }>(
    "select subtotal, discount, shipping, total from public.orders where order_number = $1",
    [orderNo.rows[0].place_order],
  )
).rows[0];

const expected = { subtotal: 2000, discount: 600, shipping: 400, total: 1800 };
const got = {
  subtotal: Number(order.subtotal),
  discount: Number(order.discount),
  shipping: Number(order.shipping),
  total: Number(order.total),
};
if (JSON.stringify(got) === JSON.stringify(expected)) {
  pass++;
  console.log(`  PASS  order charged ${JSON.stringify(got)}`);
} else {
  fail++;
  console.log(`  FAIL  order\n        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(got)}`);
}

// Stock must have been decremented by exactly the ordered quantity.
const stock = (
  await db.query<{ stock: number }>("select stock from public.products where id = $1", [pA])
).rows[0].stock;
if (stock === 98) {
  pass++;
  console.log("  PASS  stock decremented 100 → 98");
} else {
  fail++;
  console.log(`  FAIL  stock is ${stock}, expected 98`);
}

// price_cart must quote exactly what place_order charged (goods only).
const quote = (
  await db.query<{ r: { subtotal: string; discount: string } }>(
    "select public.price_cart($1::jsonb) as r",
    [JSON.stringify([{ product_id: pA, quantity: 2 }])],
  )
).rows[0].r;
if (Number(quote.subtotal) === 2000 && Number(quote.discount) === 600) {
  pass++;
  console.log("  PASS  price_cart quote matches the charged total");
} else {
  fail++;
  console.log(`  FAIL  price_cart quote ${JSON.stringify(quote)}`);
}

/* ---------------- Cahier variant chain (theme/stage/personalization/note) --------------- */

console.log("\nplace_order — required-group validation, custom_text/custom_upload, note\n");

async function expectError(label: string, promise: Promise<unknown>, code: string) {
  try {
    await promise;
    fail++;
    console.log(`  FAIL  ${label}\n        expected an error containing ${code}, got success`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes(code)) {
      pass++;
      console.log(`  PASS  ${label}`);
    } else {
      fail++;
      console.log(
        `  FAIL  ${label}\n        expected error containing ${code}\n        got      ${msg}`,
      );
    }
  }
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    fail++;
    console.log(
      `  FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(actual)}`,
    );
  }
}

const pD = "aaaaaaaa-0000-4000-8000-000000000004";

await db.exec(`
  insert into public.products (id, slug, name_fr, name_ar, price, stock, category_id, status, quantity_offers, variants) values
    ('${pD}', 'cahier-d', 'Cahier D', 'كراس د', 2000, 100, '${catOther}', 'active', '[]'::jsonb,
     '[
        {"name_fr":"Thème","name_ar":"الطابع","values":[
          {"value_fr":"Violet","value_ar":"بنفسجي"},
          {"value_fr":"Couverture personnalisée","value_ar":"غلاف مخصص","requires_upload":true}
        ]},
        {"name_fr":"Personnalisation","name_ar":"التخصيص","values":[
          {"value_fr":"Sans nom","value_ar":"بدون اسم"},
          {"value_fr":"Avec le nom","value_ar":"مع الاسم","requires_text":true}
        ]}
     ]'::jsonb);

  insert into public.product_variants
    (product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order) values
    ('${pD}', 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2000, 50, 0),
    ('${pD}', 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2500, 50, 1);
`);

const pdVariant = (
  await db.query<{ id: string }>(
    `select id from public.product_variants where product_id = $1 and option1_value_fr = '120 pages'`,
    [pD],
  )
).rows[0].id;

const pdCustomer = {
  customer_name: "Test Cahier",
  customer_phone: "0555987654",
  wilaya: "Alger",
  city: "Bab Ezzouar",
  delivery_type: "home",
  language: "fr",
};

function pdItem(overrides: Record<string, unknown>) {
  return { product_id: pD, variant_id: pdVariant, quantity: 1, variants: [], ...overrides };
}

async function pdPlaceOrder(overrides: Record<string, unknown>) {
  return db.query<{ place_order: string }>(
    `select public.place_order($1::jsonb, $2::jsonb) as place_order`,
    [JSON.stringify([pdItem(overrides)]), JSON.stringify(pdCustomer)],
  );
}

await expectError(
  "missing required variant groups rejected",
  pdPlaceOrder({ variants: [] }),
  "ERR_MISSING_SELECTION: variants",
);

await expectError(
  "requires_upload value without custom_upload_url rejected",
  pdPlaceOrder({
    variants: [
      { name_fr: "Thème", name_ar: "الطابع", value_fr: "Couverture personnalisée", value_ar: "غلاف مخصص" },
      { name_fr: "Personnalisation", name_ar: "التخصيص", value_fr: "Sans nom", value_ar: "بدون اسم" },
    ],
  }),
  "ERR_MISSING_SELECTION: custom_upload",
);

await expectError(
  "requires_upload value with a URL outside our bucket rejected",
  pdPlaceOrder({
    variants: [
      {
        name_fr: "Thème",
        name_ar: "الطابع",
        value_fr: "Couverture personnalisée",
        value_ar: "غلاف مخصص",
        custom_upload_url: "https://evil.example.com/not-our-bucket.png",
      },
      { name_fr: "Personnalisation", name_ar: "التخصيص", value_fr: "Sans nom", value_ar: "بدون اسم" },
    ],
  }),
  "ERR_INVALID_INPUT: custom_upload_url",
);

await expectError(
  "requires_text value without custom_text rejected",
  pdPlaceOrder({
    variants: [
      { name_fr: "Thème", name_ar: "الطابع", value_fr: "Violet", value_ar: "بنفسجي" },
      { name_fr: "Personnalisation", name_ar: "التخصيص", value_fr: "Avec le nom", value_ar: "مع الاسم" },
    ],
  }),
  "ERR_MISSING_SELECTION: custom_text",
);

await expectError(
  "forged variant value rejected",
  pdPlaceOrder({
    variants: [
      { name_fr: "Thème", name_ar: "الطابع", value_fr: "Couleur Inexistante", value_ar: "لون غير موجود" },
      { name_fr: "Personnalisation", name_ar: "التخصيص", value_fr: "Sans nom", value_ar: "بدون اسم" },
    ],
  }),
  "ERR_INVALID_INPUT: variant value",
);

// Fully valid: requires_text satisfied + an optional per-line note.
const orderNo5 = (
  await pdPlaceOrder({
    variants: [
      { name_fr: "Thème", name_ar: "الطابع", value_fr: "Violet", value_ar: "بنفسجي" },
      {
        name_fr: "Personnalisation",
        name_ar: "التخصيص",
        value_fr: "Avec le nom",
        value_ar: "مع الاسم",
        custom_text: "Youcef Benali",
      },
    ],
    note: "Livrer avant 18h",
  })
).rows[0].place_order;

const item5 = (
  await db.query<{ note: string | null; price: string; variant_id: string; variants: unknown }>(
    `select oi.note, oi.price, oi.variant_id, oi.variants
       from public.order_items oi join public.orders o on o.id = oi.order_id
      where o.order_number = $1`,
    [orderNo5],
  )
).rows[0];

assertEqual("valid order: note stored", item5.note, "Livrer avant 18h");
assertEqual("valid order: priced variant resolved", item5.variant_id, pdVariant);
assertEqual("valid order: price from the picked page-count row", Number(item5.price), 2000);
assertEqual(
  "valid order: custom_text propagated into variants jsonb",
  (item5.variants as { custom_text?: string }[]).find((v) => v.custom_text)?.custom_text,
  "Youcef Benali",
);

// Fully valid: requires_upload satisfied, note omitted (stays optional).
const orderNo6 = (
  await pdPlaceOrder({
    variants: [
      {
        name_fr: "Thème",
        name_ar: "الطابع",
        value_fr: "Couverture personnalisée",
        value_ar: "غلاف مخصص",
        custom_upload_url: "https://example.supabase.co/storage/v1/object/public/customer-uploads/custom-covers/abc.webp",
      },
      { name_fr: "Personnalisation", name_ar: "التخصيص", value_fr: "Sans nom", value_ar: "بدون اسم" },
    ],
  })
).rows[0].place_order;

const item6 = (
  await db.query<{ note: string | null; variants: unknown }>(
    `select oi.note, oi.variants
       from public.order_items oi join public.orders o on o.id = oi.order_id
      where o.order_number = $1`,
    [orderNo6],
  )
).rows[0];

assertEqual("note omitted stays null", item6.note, null);
assertEqual(
  "custom_upload_url propagated into variants jsonb",
  (item6.variants as { custom_upload_url?: string }[]).find((v) => v.custom_upload_url)
    ?.custom_upload_url,
  "https://example.supabase.co/storage/v1/object/public/customer-uploads/custom-covers/abc.webp",
);

/* ---------------- stock integrity across duplicate cart lines --------------- */

/* The cart keys a line by product + variant + colour + size + picks + note, so
   one product can legitimately occupy several lines (two personalised cahiers
   of the same page-count differ only by their note). Before 0023, place_order
   checked stock per line and decremented per line: stock 5 with two lines of 5
   was accepted and left the row at -5, and cancelling that order restocked one
   line instead of both. */

console.log("\nstock integrity — one product across several cart lines\n");

const pStock = "aaaaaaaa-0000-4000-8000-000000000005";
const pVarStock = "aaaaaaaa-0000-4000-8000-000000000006";
const vRow = "cccccccc-0000-4000-8000-000000000001";

await db.exec(`
  delete from public.promotions;
  insert into public.products (id, slug, name_fr, name_ar, price, stock, category_id, status)
    values ('${pStock}', 'prod-stock', 'Stock', 'مخزون', 1000, 5, '${catOther}', 'active');
  insert into public.products (id, slug, name_fr, name_ar, price, stock, category_id, status)
    values ('${pVarStock}', 'prod-var-stock', 'StockV', 'مخزون ع', 1000, 0, '${catOther}', 'active');
  insert into public.product_variants (id, product_id, option1_name_fr, option1_value_fr, price, stock, sort_order)
    values ('${vRow}', '${pVarStock}', 'Pages', '120 pages', 1000, 5, 0);
`);

const stockCustomer = (phone: string) => ({
  customer_name: "Test Client",
  customer_phone: phone,
  wilaya: "Alger",
  city: "Bab Ezzouar",
  delivery_type: "home",
  language: "fr",
});

function placeStockOrder(items: unknown[], phone: string) {
  return db.query<{ place_order: string }>(
    "select public.place_order($1::jsonb, $2::jsonb) as place_order",
    [JSON.stringify(items), JSON.stringify(stockCustomer(phone))],
  );
}

// Product-level: two lines of 5 against a stock of 5 must be refused outright.
await expectError(
  "two lines of the same product are summed against stock",
  placeStockOrder(
    [
      { product_id: pStock, quantity: 5, note: "Amine" },
      { product_id: pStock, quantity: 5, note: "Sara" },
    ],
    "0555100001",
  ),
  "ERR_STOCK",
);

assertEqual(
  "refused order left stock untouched",
  (await db.query<{ stock: number }>("select stock from public.products where id=$1", [pStock]))
    .rows[0].stock,
  5,
);

// Variant-level: same rule on the priced variant row.
await expectError(
  "two lines of the same variant are summed against variant stock",
  placeStockOrder(
    [
      { product_id: pVarStock, variant_id: vRow, quantity: 3, note: "Amine" },
      { product_id: pVarStock, variant_id: vRow, quantity: 3, note: "Sara" },
    ],
    "0555100002",
  ),
  "ERR_STOCK",
);

// What DOES fit across several lines still goes through, and decrements once
// per line for the full amount.
const splitOrder = (
  await placeStockOrder(
    [
      { product_id: pStock, quantity: 2, note: "Amine" },
      { product_id: pStock, quantity: 3, note: "Sara" },
    ],
    "0555100003",
  )
).rows[0].place_order;

assertEqual(
  "a cart that does fit decrements every line (5 → 0)",
  (await db.query<{ stock: number }>("select stock from public.products where id=$1", [pStock]))
    .rows[0].stock,
  0,
);

// Cancelling it must give back BOTH lines, not one.
await db.exec(`update public.orders set status='cancelled' where order_number='${splitOrder}'`);
assertEqual(
  "cancelling restocks every line (0 → 5)",
  (await db.query<{ stock: number }>("select stock from public.products where id=$1", [pStock]))
    .rows[0].stock,
  5,
);

// Same for variant-level restock.
const varOrder = (
  await placeStockOrder(
    [
      { product_id: pVarStock, variant_id: vRow, quantity: 2, note: "Amine" },
      { product_id: pVarStock, variant_id: vRow, quantity: 3, note: "Sara" },
    ],
    "0555100004",
  )
).rows[0].place_order;
assertEqual(
  "variant stock decremented across both lines (5 → 0)",
  (await db.query<{ stock: number }>("select stock from public.product_variants where id=$1", [
    vRow,
  ])).rows[0].stock,
  0,
);
await db.exec(`update public.orders set status='cancelled' where order_number='${varOrder}'`);
assertEqual(
  "cancelling restocks both variant lines (0 → 5)",
  (await db.query<{ stock: number }>("select stock from public.product_variants where id=$1", [
    vRow,
  ])).rows[0].stock,
  5,
);

/* ---------------- read-side normaliser round-trip --------------- */

/* Every flag on a variant group/value is OPTIONAL in types/db.ts, so a mapper
   that forgets one still type-checks and still lints — it just silently drops
   the field at runtime. That is exactly how requires_upload went missing: the
   storefront never rendered the upload control, yet place_order kept demanding
   the cover, so 104 products could not be ordered at all. Pin the round-trip. */

console.log("\nnormalizeProduct — variant flags survive the DB round-trip\n");

const pFlags = "aaaaaaaa-0000-4000-8000-000000000007";
await db.exec(`
  insert into public.products (id, slug, name_fr, name_ar, price, stock, status, variants) values
    ('${pFlags}', 'prod-flags', 'Flags', 'أعلام', 1000, 10, 'active',
     '[
        {"name_fr":"Thème","name_ar":"الطابع","before_price_variant":true,"values":[
          {"value_fr":"Violet","value_ar":"بنفسجي","swatch_hex":"#7c5cff"},
          {"value_fr":"Couverture personnalisée","value_ar":"غلاف مخصص","requires_upload":true}
        ]},
        {"name_fr":"Personnalisation","name_ar":"التخصيص","values":[
          {"value_fr":"Avec le nom","value_ar":"مع الاسم","requires_text":true}
        ]}
      ]'::jsonb);
`);

const rawFlags = (
  await db.query<Record<string, unknown>>("select * from public.products where id = $1", [pFlags])
).rows[0];
const flagGroups = normalizeProduct(rawFlags).variants;

assertEqual("group count preserved", flagGroups.length, 2);
assertEqual("before_price_variant survives", flagGroups[0].before_price_variant, true);
assertEqual("before_price_variant defaults to false", flagGroups[1].before_price_variant, false);
assertEqual("swatch_hex survives", flagGroups[0].values[0].swatch_hex, "#7c5cff");
assertEqual("requires_upload survives", flagGroups[0].values[1].requires_upload, true);
assertEqual("requires_upload defaults to false", flagGroups[0].values[0].requires_upload, false);
assertEqual("requires_text survives", flagGroups[1].values[0].requires_text, true);

/* ---------------- order notifications (0025) --------------- */

/* The claim RPC is the security boundary for a feature an ANONYMOUS browser
   triggers: it must hand out an order exactly once, and it must be unreachable
   from the anon/authenticated roles (granting it, by copying place_order's
   grant line, leaks the customer's phone number AND lets a prober permanently
   suppress the real notification). Both halves are pinned here. */

console.log("\norder notifications — claim is single-shot and service-role only\n");

const pNotif = "aaaaaaaa-0000-4000-8000-000000000008";
await db.exec(`
  delete from public.promotions;
  insert into public.products (id, slug, name_fr, name_ar, price, stock, category_id, status)
    values ('${pNotif}', 'prod-notif', 'Notif', 'إشعار', 1000, 50, '${catOther}', 'active');
`);

const notifOrder = (
  await db.query<{ place_order: string }>(
    "select public.place_order($1::jsonb,$2::jsonb) as place_order",
    [
      JSON.stringify([{ product_id: pNotif, quantity: 1 }]),
      JSON.stringify({
        customer_name: "Notif Client",
        customer_phone: "0555200001",
        wilaya: "Alger",
        city: "Bab Ezzouar",
        delivery_type: "home",
        language: "fr",
      }),
    ],
  )
).rows[0].place_order;

// A brand-new order is unclaimed, and the first claim returns its payload.
interface ClaimRow {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  item_count: number;
  total: string;
}
const firstClaim = (
  await db.query<ClaimRow>("select * from public.claim_order_notification($1)", [notifOrder])
).rows;
assertEqual("first claim returns the order", firstClaim.length, 1);
assertEqual("claim carries the line count", firstClaim[0]?.item_count, 1);
assertEqual("claim carries the customer", firstClaim[0]?.customer_name, "Notif Client");

// Second claim — a replay, a double-invoke, or a prober — gets nothing.
const secondClaim = (
  await db.query<ClaimRow>("select * from public.claim_order_notification($1)", [notifOrder])
).rows;
assertEqual("second claim returns nothing (single-shot)", secondClaim.length, 0);

// An order number that does not exist is indistinguishable from a claimed one.
const bogusClaim = (
  await db.query<ClaimRow>("select * from public.claim_order_notification($1)", [
    "JZ-20260101-DEADBEEF01",
  ])
).rows;
assertEqual("unknown order number returns nothing", bogusClaim.length, 0);

// A freshly placed order must start unclaimed, or it would never be sent.
// (The migration's backfill of pre-existing orders can't be exercised here —
// it runs at migration time, against an empty harness database.)
const freshOrder = (
  await db.query<{ place_order: string }>(
    "select public.place_order($1::jsonb,$2::jsonb) as place_order",
    [
      JSON.stringify([{ product_id: pNotif, quantity: 1 }]),
      JSON.stringify({
        customer_name: "Fresh Client",
        customer_phone: "0555200002",
        wilaya: "Alger",
        city: "Bab Ezzouar",
        delivery_type: "home",
        language: "fr",
      }),
    ],
  )
).rows[0].place_order;
assertEqual(
  "a new order starts unclaimed",
  (
    await db.query<{ n: number }>(
      "select count(*)::int as n from public.orders where order_number = $1 and notified_at is null",
      [freshOrder],
    )
  ).rows[0].n,
  1,
);

// The grant surface: anon and authenticated must NOT be able to execute it.
// The owner (postgres) always retains EXECUTE and is listed here; what
// matters is that neither PostgREST-facing role can reach it.
const grants = (
  await db.query<{ grantee: string }>(
    `select grantee from information_schema.role_routine_grants
      where routine_name = 'claim_order_notification' and privilege_type = 'EXECUTE'`,
  )
).rows.map((r) => r.grantee);
assertEqual("anon cannot execute the claim", grants.includes("anon"), false);
assertEqual("authenticated cannot execute the claim", grants.includes("authenticated"), false);
assertEqual("service_role can execute the claim", grants.includes("service_role"), true);

// And the prefs table is per-account, with no owner-reads-everyone policy.
const prefPolicies = (
  await db.query<{ policyname: string; cmd: string }>(
    `select policyname, cmd from pg_policies
      where schemaname = 'public' and tablename = 'admin_notification_prefs'`,
  )
).rows;
assertEqual("prefs expose exactly one self-scoped policy", prefPolicies.length, 1);

// 0026 removed the WhatsApp/CallMeBot channel. The columns must be gone, not
// merely unused — a dormant `callmebot_apikey` is a credential store nobody
// maintains, and a leftover column is what a later copy-paste revives.
const prefColumns = (
  await db.query<{ column_name: string }>(
    `select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'admin_notification_prefs'
      order by column_name`,
  )
).rows.map((r) => r.column_name);
assertEqual("email is the only channel left", prefColumns, [
  "email_enabled",
  "notify_email",
  "updated_at",
  "user_id",
]);

/* ---------------- theme subcategories + optional groups (0027/0028) --------------- */

/* 0028 is a destructive restructure that runs against real data, so it is
   exercised here against the SHAPE of the live catalogue: a matiere holding
   cahier kinds, each carrying the old mandatory "Theme" picker, plus one
   matiere-less legacy product sitting directly on the parent. */

console.log("\ntheme subcategories — restructure and optional custom cover\n");

const cahiersId = "dddddddd-1111-4000-8000-000000000001";
const matiereId = "dddddddd-1111-4000-8000-000000000002";
const kindA = "dddddddd-1111-4000-8000-000000000003";
const kindB = "dddddddd-1111-4000-8000-000000000004";
const legacyId = "dddddddd-1111-4000-8000-000000000005";

const LIVE_VARIANTS = JSON.stringify([
  {
    name_fr: "Thème",
    name_ar: "الطابع",
    before_price_variant: true,
    values: [
      { value_fr: "Violet", value_ar: "بنفسجي", swatch_hex: "#8B5CF6" },
      { value_fr: "Couverture personnalisée", value_ar: "غلاف مخصص", requires_upload: true },
    ],
  },
  {
    name_fr: "Personnalisation",
    name_ar: "التخصيص",
    values: [
      { value_fr: "Sans nom", value_ar: "بدون اسم" },
      { value_fr: "Avec le nom", value_ar: "مع الاسم", requires_text: true },
    ],
  },
]);

// Order matters, and it mirrors the real history: enforce_category_leaf_only
// refuses a product whose category already has children, so the 8 matiere-less
// rows on "Cahiers de l'enseignant" can only have been inserted BEFORE the
// matiere tree (0015) went in. Build the fixture the same way round.
await db.query(
  `insert into public.categories (id, slug, name_fr, name_ar, parent_id, sort_order)
   values ($1, 'cahiers', 'Cahiers enseignant', 'دفاتر', null, 9)`,
  [cahiersId],
);
await db.query(
  `insert into public.products (id, slug, name_fr, name_ar, price, stock, category_id, status, variants)
   values ($1,'cahier-journal','Cahier journal','الدفتر اليومي',2200,10,$2,'active',$3::jsonb)`,
  [legacyId, cahiersId, LIVE_VARIANTS],
);
await db.query(
  `insert into public.categories (id, slug, name_fr, name_ar, parent_id, sort_order)
   values ($1, 'langue-arabe', 'Langue arabe', 'اللغة العربية', $2, 1)`,
  [matiereId, cahiersId],
);
await db.query(
  `insert into public.products (id, slug, name_fr, name_ar, price, stock, category_id, status, variants)
   values ($1,'cahier-journal-langue-arabe','Cahier journal — Langue arabe','الدفتر اليومي',2200,40,$3,'active',$4::jsonb),
          ($2,'cahier-de-notes-langue-arabe','Cahier de notes — Langue arabe','دفتر النقاط',2000,40,$3,'active',$4::jsonb)`,
  [kindA, kindB, matiereId, LIVE_VARIANTS],
);
await db.query(
  `insert into public.product_images (product_id, url, sort_order) values ($1,'https://x/a.webp',0)`,
  [kindA],
);
await db.query(
  `insert into public.product_variants (product_id, option1_name_fr, option1_value_fr, price, stock, sku, sort_order)
   values ($1,'Nombre de pages','120 pages',2200,40,'JZ-120',0)`,
  [kindA],
);

// Apply 0028 exactly as it will run in production.
const MIG_0028 = readFileSync(join(MIG_DIR, "0028_theme_subcategories.sql"), "utf8");
await db.exec(MIG_0028);

assertEqual(
  "six themes created under the matiere",
  (
    await db.query<{ n: number }>(
      "select count(*)::int as n from public.categories where parent_id = $1",
      [matiereId],
    )
  ).rows[0].n,
  6,
);

assertEqual(
  "parent category no longer holds products directly",
  (
    await db.query<{ n: number }>(
      "select count(*)::int as n from public.products where category_id = $1",
      [cahiersId],
    )
  ).rows[0].n,
  0,
);

assertEqual(
  "legacy product landed under Toutes matieres > Violet",
  (
    await db.query<{ slug: string }>(
      `select c.slug from public.products p
         join public.categories c on c.id = p.category_id where p.id = $1`,
      [legacyId],
    )
  ).rows[0].slug,
  "toutes-matieres-violet",
);

assertEqual(
  "each kind fanned out across all six themes",
  (
    await db.query<{ n: number }>(
      `select count(*)::int as n from public.products p
         join public.categories c on c.id = p.category_id
        where c.parent_id = $1`,
      [matiereId],
    )
  ).rows[0].n,
  12,
);

// The ORIGINAL row is reused, so order_items.product_id keeps resolving.
const original = (
  await db.query<{ slug: string; name_fr: string; cat: string }>(
    `select p.slug, p.name_fr, c.slug as cat from public.products p
       join public.categories c on c.id = p.category_id where p.id = $1`,
    [kindA],
  )
).rows[0];
assertEqual(
  "original row reused as the violet one",
  original.slug,
  "cahier-journal-langue-arabe-violet",
);
assertEqual(
  "theme carried in the name for the packing slip",
  original.name_fr,
  "Cahier journal — Langue arabe · Violet",
);
assertEqual("original moved into its theme category", original.cat, "langue-arabe-violet");

const copy = (
  await db.query<{ id: string }>("select id from public.products where slug = $1", [
    "cahier-journal-langue-arabe-bleu",
  ])
).rows[0];
assertEqual(
  "copies carry the product images",
  (
    await db.query<{ n: number }>(
      "select count(*)::int as n from public.product_images where product_id = $1",
      [copy.id],
    )
  ).rows[0].n,
  1,
);
assertEqual(
  "copies get a per-theme SKU, not a duplicate",
  (
    await db.query<{ sku: string }>(
      "select sku from public.product_variants where product_id = $1",
      [copy.id],
    )
  ).rows[0].sku,
  "JZ-120-BLE",
);

const groups = (
  await db.query<{ variants: unknown }>("select variants from public.products where id = $1", [
    kindA,
  ])
).rows[0].variants as { name_fr: string; optional?: boolean; values: unknown[] }[];
assertEqual(
  "Theme picker removed",
  groups.some((g) => g.name_fr === "Thème"),
  false,
);
assertEqual(
  "other groups untouched",
  groups.some((g) => g.name_fr === "Personnalisation"),
  true,
);
const cover = groups.find((g) => g.name_fr === "Couverture personnalisée");
assertEqual("custom cover group added", !!cover, true);
assertEqual("custom cover is optional", cover?.optional, true);
assertEqual("custom cover is a single-value checkbox", cover?.values.length, 1);

// Re-running the restructure must be a no-op.
await db.exec(MIG_0028);
assertEqual(
  "0028 is idempotent",
  (
    await db.query<{ n: number }>(
      `select count(*)::int as n from public.products p
         join public.categories c on c.id = p.category_id where c.parent_id = $1`,
      [matiereId],
    )
  ).rows[0].n,
  12,
);

/* ---- 0030: the "Toutes matieres" branch is removed, nothing else ---- */

// An order for one of the doomed products must survive the delete.
const legacyOrder = "aaaaaaaa-0000-4000-8000-000000000030";
await db.query(
  `insert into public.orders (id, order_number, customer_name, customer_phone, wilaya, city, subtotal, shipping, total)
   values ($1,'JZ-TEST-0030','Test','0555000000','16 - Alger','Alger',2200,0,2200)`,
  [legacyOrder],
);
await db.query(
  `insert into public.order_items (order_id, product_id, name_fr, name_ar, price, quantity)
   values ($1,$2,'Cahier journal · Violet','الدفتر اليومي',2200,1)`,
  [legacyOrder, legacyId],
);

const MIG_0030 = readFileSync(join(MIG_DIR, "0030_remove_toutes_matieres.sql"), "utf8");
await db.exec(MIG_0030);

assertEqual(
  "Toutes matieres branch and its themes deleted",
  (
    await db.query<{ n: number }>(
      "select count(*)::int as n from public.categories where slug like 'toutes-matieres%'",
    )
  ).rows[0].n,
  0,
);
assertEqual(
  "legacy products deleted",
  (
    await db.query<{ n: number }>(
      "select count(*)::int as n from public.products where slug like 'cahier-journal-%' and slug not like '%langue-arabe%'",
    )
  ).rows[0].n,
  0,
);
assertEqual(
  "real matiere products untouched",
  (
    await db.query<{ n: number }>(
      `select count(*)::int as n from public.products p
         join public.categories c on c.id = p.category_id where c.parent_id = $1`,
      [matiereId],
    )
  ).rows[0].n,
  12,
);
const keptLine = (
  await db.query<{ product_id: string | null; name_fr: string }>(
    "select product_id, name_fr from public.order_items where order_id = $1",
    [legacyOrder],
  )
).rows[0];
assertEqual("past order line kept", keptLine?.name_fr, "Cahier journal · Violet");
assertEqual("past order line unlinked, not deleted", keptLine?.product_id, null);

await db.exec(MIG_0030);
assertEqual(
  "0030 is idempotent",
  (
    await db.query<{ n: number }>(
      "select count(*)::int as n from public.categories where parent_id = $1",
      [cahiersId],
    )
  ).rows[0].n,
  1,
);
await db.query("delete from public.orders where id = $1", [legacyOrder]);

/* ---- place_order: an optional group may be skipped, never half-filled ---- */

await db.exec(
  `insert into public.delivery_prices (wilaya, home_price, office_price, active)
     values ('Oran', 500, 300, true) on conflict (wilaya) do nothing;`,
);
const themedProduct = (
  await db.query<{ id: string }>("select id from public.products where slug = $1", [
    "cahier-de-notes-langue-arabe-rouge",
  ])
).rows[0].id;

function themedOrder(variants: unknown[], phone: string) {
  return db.query<{ place_order: string }>(
    "select public.place_order($1::jsonb,$2::jsonb) as place_order",
    [
      JSON.stringify([{ product_id: themedProduct, quantity: 1, variants }]),
      JSON.stringify({
        customer_name: "Theme Client",
        customer_phone: phone,
        wilaya: "Oran",
        city: "Es Senia",
        delivery_type: "home",
        language: "fr",
      }),
    ],
  );
}

const PERSO = {
  name_fr: "Personnalisation",
  name_ar: "التخصيص",
  value_fr: "Sans nom",
  value_ar: "بدون اسم",
};

assertEqual(
  "order without the optional cover is accepted",
  (await themedOrder([PERSO], "0555300001")).rows.length,
  1,
);

await expectError(
  "ticking the cover without uploading is rejected",
  themedOrder(
    [
      PERSO,
      { name_fr: "Couverture personnalisée", name_ar: "غلاف مخصص", value_fr: "Oui", value_ar: "نعم" },
    ],
    "0555300002",
  ),
  "ERR_MISSING_SELECTION: custom_upload",
);

await expectError(
  "a mandatory group is still required",
  themedOrder([], "0555300003"),
  "ERR_MISSING_SELECTION: variants",
);

/* ---------------- panel freebies (0029) --------------- */

console.log("\npanel freebies — downloadable files on a promo panel\n");

// The 4 slots are seeded by 0012; they exist already.
const freebiePanel = (
  await db.query<{ id: string }>("select id from public.promo_panels where slot = 'home_mid'"),
).rows[0].id;

const FILES = JSON.stringify([
  {
    url: "https://x.supabase.co/storage/v1/object/public/freebies/panels/a.pdf",
    name_fr: "Fiche de préparation",
    name_ar: "بطاقة التحضير",
    mime: "application/pdf",
    size_bytes: 482000,
  },
  {
    url: "https://x.supabase.co/storage/v1/object/public/freebies/panels/b.mp4",
    name_fr: "Démo vidéo",
    name_ar: "فيديو توضيحي",
    mime: "video/mp4",
    size_bytes: 3100000,
  },
]);

await db.query("update public.promo_panels set files = $1::jsonb, active = true where id = $2", [
  FILES,
  freebiePanel,
]);

assertEqual(
  "files persist on the panel",
  (
    await db.query<{ n: number }>(
      "select jsonb_array_length(files)::int as n from public.promo_panels where id = $1",
      [freebiePanel],
    )
  ).rows[0].n,
  2,
);

assertEqual(
  "panels default to an empty file list",
  (
    await db.query<{ n: number }>(
      "select jsonb_array_length(files)::int as n from public.promo_panels where slot = 'cart_drawer'",
    )
  ).rows[0].n,
  0,
);

// The cap is enforced in the database, not only in the editor.
await expectError(
  "more than 12 files is rejected",
  db.query("update public.promo_panels set files = $1::jsonb where id = $2", [
    JSON.stringify(
      Array.from({ length: 13 }, (_, i) => ({
        url: `https://x/${i}.pdf`,
        name_fr: `f${i}`,
        name_ar: `f${i}`,
        mime: "application/pdf",
        size_bytes: 1,
      })),
    ),
    freebiePanel,
  ]),
  "promo_panels_files_check",
);

await expectError(
  "a non-array files value is rejected",
  db.query("update public.promo_panels set files = $1::jsonb where id = $2", [
    JSON.stringify({ url: "nope" }),
    freebiePanel,
  ]),
  "promo_panels_files_check",
);

/* The read-side mapper is the part that has silently eaten fields twice in
   this project, so pin the round-trip rather than trusting the type. */
const rawPanel = (
  await db.query<Record<string, unknown>>("select * from public.promo_panels where id = $1", [
    freebiePanel,
  ])
).rows[0];
const mapped = normalizePanel(rawPanel);
assertEqual("normalizePanel carries the files through", mapped.files.length, 2);
assertEqual("file label survives", mapped.files[0]?.name_fr, "Fiche de préparation");
assertEqual("file mime survives", mapped.files[1]?.mime, "video/mp4");
assertEqual("file size survives", mapped.files[1]?.size_bytes, 3100000);

// A malformed entry is dropped rather than crashing the storefront.
await db.query("update public.promo_panels set files = $1::jsonb where id = $2", [
  JSON.stringify([{ name_fr: "no url here" }, { url: "https://x/ok.pdf", name_fr: "Ok" }]),
  freebiePanel,
]);
const cleaned = normalizePanel(
  (
    await db.query<Record<string, unknown>>("select * from public.promo_panels where id = $1", [
      freebiePanel,
    ])
  ).rows[0],
);
assertEqual("an entry with no url is dropped", cleaned.files.length, 1);
assertEqual("name_ar falls back to name_fr", cleaned.files[0]?.name_ar, "Ok");

// The download URL has to force Content-Disposition, or a PDF just opens.
const dl = freebieDownloadUrl(
  { url: "https://x/a.pdf", name_fr: "F", name_ar: "F", mime: "application/pdf", size_bytes: 1 },
  "Fiche de préparation",
);
assertEqual("download param is appended", dl.includes("?download="), true);
assertEqual(
  "saved filename keeps the extension",
  decodeURIComponent(dl.split("download=")[1]),
  "Fiche de preparation.pdf",
);

/* ---------------- 0032: cover / content groups + bulk group edit ---------------- */

console.log("\n0032 cover / content variant groups");

const pCov1 = "aaaaaaaa-0000-4000-8000-000000000321";
const pCov2 = "aaaaaaaa-0000-4000-8000-000000000322";
const covGroups = JSON.stringify([
  { name_fr: "Palier scolaire", name_ar: "x", values: [{ value_fr: "Primaire", value_ar: "x" }] },
  { name_fr: "Personnalisation", name_ar: "x", values: [{ value_fr: "Sans nom", value_ar: "x" }] },
]);
await db.query(
  `insert into public.products (id, slug, name_fr, name_ar, price, stock, category_id, status, variants)
   values ($1, 'cov-1', 'Cov 1', 'x', 1000, 10, $3, 'active', $4::jsonb),
          ($2, 'cov-2', 'Cov 2', 'x', 1000, 10, $3, 'active', $4::jsonb)`,
  [pCov1, pCov2, catChild, covGroups],
);
// Re-run the migration against the new rows: it must insert after Palier and
// be idempotent on a second run.
const mig0032 = readFileSync(join(MIG_DIR, "0032_cover_content_variants.sql"), "utf8");
await db.exec(mig0032);
await db.exec(mig0032);
const groupNames = async (id: string) =>
  (
    await db.query<{ n: string }>(
      "select t.e->>'name_fr' as n from public.products, jsonb_array_elements(variants) with ordinality t(e, o) where id = $1 order by t.o",
      [id],
    )
  ).rows.map((r) => r.n);
assertEqual("cover + content inserted after Palier, once", await groupNames(pCov1), [
  "Palier scolaire",
  "Couverture",
  "Contenu",
  "Personnalisation",
]);

const adminUser = "bbbbbbbb-0000-4000-8000-000000000032";
await db.query("insert into auth.users (id) values ($1)", [adminUser]);
await db.query("insert into public.admin_profiles (user_id, sections) values ($1, '{products}')", [
  adminUser,
]);

const newCover = {
  name_fr: "Couverture",
  name_ar: "الغلاف",
  before_price_variant: true,
  values: [
    { value_fr: "Rigide", value_ar: "x", image_url: "https://x/a.webp" },
    { value_fr: "Souple", value_ar: "x", image_url: "https://x/b.webp" },
  ],
};
await expectError(
  "bulk replace refused without the products section",
  db.query("select public.bulk_replace_variant_group('Couverture', $1::jsonb)", [
    JSON.stringify(newCover),
  ]),
  "ERR_FORBIDDEN",
);
await db.query("select set_config('request.jwt.claim.sub', $1, false)", [adminUser]);
const replaced = await db.query<{ n: number }>(
  "select public.bulk_replace_variant_group('Couverture', $1::jsonb) as n",
  [JSON.stringify(newCover)],
);
assertEqual("bulk replace touches every product with the group", replaced.rows[0]?.n, 2);
const cov2 = await db.query<{ same: boolean }>(
  "select variants->1 = $2::jsonb as same from public.products where id = $1",
  [pCov2, JSON.stringify(newCover)],
);
assertEqual("replaced group keeps its position and carries images", cov2.rows[0]?.same, true);
await expectError(
  "renaming onto another existing group name is refused",
  db.query("select public.bulk_replace_variant_group('Couverture', $1::jsonb)", [
    JSON.stringify({ ...newCover, name_fr: "Contenu" }),
  ]),
  "duplicate group name",
);
await db.query("select set_config('request.jwt.claim.sub', '', false)");

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
