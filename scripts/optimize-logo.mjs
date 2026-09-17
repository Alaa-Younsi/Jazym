/* Turn the client-supplied `_brand/jazym-logo.png` (a ~650 KB 1920² export with
   a lot of empty transparent margin) into the two small assets the site
   actually renders:

     public/jazym-logo.webp       — trimmed, 2x-density wordmark for light theme
     public/jazym-logo-dark.webp  — same art, re-lit for the dark theme

   The dark variant is NOT a plain `filter: invert()`: the wordmark is black
   calligraphy but the flower is the brand cornflower + gold. Inverting
   everything turns the flower orange. So we invert LIGHTNESS only on pixels
   that are near-greyscale (the lettering) and leave saturated pixels (the
   flower) exactly as they are.

   Run: `bun run scripts/optimize-logo.mjs` — only when the client sends a new
   logo file. Output is committed. */

import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const pub = (name) => fileURLToPath(new URL(`public/${name}`, root));

/* The pristine export lives in _brand/, not public/ — public/ ships verbatim
   to the CDN and nobody should ever download the 650 KB original. */
const SOURCE = fileURLToPath(new URL("_brand/jazym-logo.png", root));
/* Rendered at ~148px wide in the header; 2x covers retina without paying for
   the client's full-resolution export. */
const TARGET_WIDTH = 320;
/* Below this chroma a pixel counts as "lettering" and gets its lightness
   flipped; above it (the flower) is left untouched. */
const CHROMA_THRESHOLD = 28;

if (!existsSync(SOURCE)) {
  console.error("Missing _brand/jazym-logo.png — nothing to do.");
  process.exit(1);
}

/* trim() removes the transparent border; the source is mostly empty space. */
const base = sharp(SOURCE).trim({ threshold: 5 }).resize({
  width: TARGET_WIDTH,
  withoutEnlargement: true,
  fit: "inside",
});

const light = await base.clone().webp({ quality: 92, effort: 6 }).toBuffer();
await sharp(light).toFile(pub("jazym-logo.webp"));

/* Dark variant — operate on raw RGBA so we can be selective per pixel. */
const { data, info } = await base.clone().raw().toBuffer({ resolveWithObject: true });
const px = Buffer.from(data);
for (let i = 0; i < px.length; i += info.channels) {
  const r = px[i];
  const g = px[i + 1];
  const b = px[i + 2];
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  if (chroma <= CHROMA_THRESHOLD) {
    // Near-greyscale → lettering. Flip it toward the cream ink used on dark.
    px[i] = 255 - r;
    px[i + 1] = 255 - g;
    px[i + 2] = 255 - b;
  }
}

await sharp(px, { raw: { width: info.width, height: info.height, channels: info.channels } })
  .webp({ quality: 92, effort: 6 })
  .toFile(pub("jazym-logo-dark.webp"));

const meta = await sharp(pub("jazym-logo.webp")).metadata();
console.log(
  `jazym-logo.webp + jazym-logo-dark.webp → ${meta.width}×${meta.height}, ` +
    `${(light.length / 1024).toFixed(1)} KB (from ${TARGET_WIDTH}px trim).`,
);
