/* Vercel Edge middleware: serve real Open Graph tags to social-share crawlers
   for /produit/:slug (they don't execute JS, so the SPA would preview every
   product link as the generic homepage card). Non-crawlers pass through
   untouched; any failure falls through. See skill Phase 7.

   Deploy requirement: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY must be set in
   the Vercel project env or this silently degrades to the generic card. */

import { next } from "@vercel/edge";

export const config = {
  matcher: "/produit/:slug*",
};

const SITE_URL = (process.env.VITE_SITE_URL || "https://PLACEHOLDER-DOMAIN.tld").replace(/\/$/, "");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? "";

const CRAWLER =
  /facebookexternalhit|facebot|WhatsApp|Twitterbot|TelegramBot|Discordbot|Slackbot|LinkedInBot|Pinterest|redditbot|Applebot|Googlebot|bingbot/i;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function middleware(request: Request): Promise<Response> {
  const ua = request.headers.get("user-agent") ?? "";
  if (!CRAWLER.test(ua)) return next();

  try {
    const url = new URL(request.url);
    const slug = url.pathname.split("/").filter(Boolean).pop() ?? "";
    if (!slug || !SUPABASE_URL || !SUPABASE_ANON_KEY) return next();

    const api = `${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(
      slug,
    )}&status=eq.active&select=name_fr,name_ar,description_fr,price,stock,product_images(url,sort_order)&limit=1`;

    const res = await fetch(api, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) return next();
    const rows = (await res.json()) as Array<{
      name_fr: string;
      description_fr: string | null;
      price: number;
      stock: number;
      product_images: { url: string; sort_order: number }[];
    }>;
    const product = rows[0];
    if (!product) return next();

    const title = `${product.name_fr} | Jazym`;
    const description =
      product.description_fr?.slice(0, 200) ??
      "Cahiers et fournitures pédagogiques — paiement à la livraison partout en Algérie.";
    const image =
      product.product_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url ??
      `${SITE_URL}/og-image.png`;
    const pageUrl = `${SITE_URL}/produit/${slug}`;
    const availability = product.stock > 0 ? "in stock" : "out of stock";

    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Jazym">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:image" content="${esc(image)}">
<meta property="product:price:amount" content="${product.price}">
<meta property="product:price:currency" content="DZD">
<meta property="product:availability" content="${availability}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="canonical" href="${esc(pageUrl)}">
</head><body><p>${esc(product.name_fr)}</p></body></html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return next();
  }
}
