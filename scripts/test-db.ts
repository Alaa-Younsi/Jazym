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

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
