/* Generates public/sitemap.xml at build time (prebuild npm script).
   Bun loads .env automatically. Degrades to static routes only if Supabase
   env is missing. Every STATIC_ROUTE must exist in src/App.tsx. */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const DOMAIN = (process.env.VITE_SITE_URL || "https://PLACEHOLDER-DOMAIN.tld").replace(/\/$/, "");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const STATIC_ROUTES = ["/", "/boutique", "/politique", "/contact"];

async function fetchRows(path, params) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("YOUR-PROJECT")) {
    return [];
  }
  const url = `${SUPABASE_URL}/rest/v1/${path}?${params}`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function urlEntry(loc, changefreq, priority) {
  return `  <url>\n    <loc>${DOMAIN}${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

const [products, categories] = await Promise.all([
  fetchRows("products", "select=slug,updated_at&status=eq.active"),
  fetchRows("categories", "select=slug"),
]);

const entries = [
  ...STATIC_ROUTES.map((r) => urlEntry(r, "weekly", r === "/" ? "1.0" : "0.7")),
  ...categories.map((c) => urlEntry(`/boutique/${c.slug}`, "weekly", "0.6")),
  ...products.map((p) => urlEntry(`/produit/${p.slug}`, "daily", "0.8")),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join(
  "\n",
)}\n</urlset>\n`;

const out = fileURLToPath(new URL("../public/sitemap.xml", import.meta.url));
await writeFile(out, xml, "utf8");
console.log(`sitemap.xml — ${entries.length} URLs (${products.length} products)`);
