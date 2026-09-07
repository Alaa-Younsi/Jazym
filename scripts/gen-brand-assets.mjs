/* One-off: derive the deployable icon set + OG image from the pristine brand
   logo in _brand/. Run: `bun run scripts/gen-brand-assets.mjs`.
   Re-run only when the client sends a new logo. Output goes to public/. */

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const brandLogo = fileURLToPath(new URL("_brand/logo.jpeg", root));
const pub = (name) => fileURLToPath(new URL(`public/${name}`, root));

if (!existsSync(brandLogo)) {
  console.error("Missing _brand/logo.jpeg — nothing to do.");
  process.exit(1);
}

const CREAM = { r: 251, g: 250, b: 247, alpha: 1 };
const BRAND = "#5b6fc7";
const GOLD = "#e8b84b";

// Flower mark as an SVG string (matches src/components/ui/FlowerMark.tsx).
const petals = [0, 72, 144, 216, 288]
  .map(
    (deg) =>
      `<ellipse cx="24" cy="12.5" rx="6.2" ry="9" transform="rotate(${deg} 24 24)" fill="${BRAND}"/>`,
  )
  .join("");
const flowerSvg = (size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">` +
  `<rect width="48" height="48" rx="10" fill="${CREAM.alpha ? "#fbfaf7" : "#fff"}"/>` +
  `<g>${petals}</g>` +
  `<circle cx="24" cy="24" r="4.4" fill="${GOLD}"/>` +
  `<circle cx="24" cy="24" r="1.7" fill="${BRAND}"/></svg>`;

async function writeFavicons() {
  for (const size of [16, 32]) {
    await sharp(Buffer.from(flowerSvg(size))).png().toFile(pub(`favicon-${size}.png`));
  }
  await sharp(Buffer.from(flowerSvg(180))).png().toFile(pub("apple-touch-icon.png"));
  // favicon.ico — 32px png renamed; browsers accept a PNG payload in .ico here,
  // and index.html also links favicon.svg / favicon-32.png explicitly.
  await sharp(Buffer.from(flowerSvg(32))).png().toFile(pub("favicon.ico"));
  const svg = flowerSvg(48).replace('rx="10" fill="#fbfaf7"', 'rx="10" fill="none"');
  await sharp(Buffer.from(svg)); // validate
  await import("node:fs/promises").then((fs) => fs.writeFile(pub("favicon.svg"), svg, "utf8"));
}

async function writeLogo() {
  // Trim the JPEG's white border, cap width at 512, emit webp.
  await sharp(brandLogo)
    .trim({ background: "#ffffff", threshold: 45 })
    .resize({ width: 512, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(pub("logo.webp"));
}

async function writeOgImage() {
  const W = 1200;
  const H = 630;
  const LW = 520;

  const logo = await sharp(brandLogo)
    .trim({ background: "#ffffff", threshold: 45 })
    .resize({ width: LW - 96, withoutEnlargement: true })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const cardH = (logoMeta.height ?? 240) + 96;
  const cardTop = Math.round((H - cardH) / 2);
  const cardLeft = Math.round((W - LW) / 2);

  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <radialGradient id="g" cx="50%" cy="34%" r="75%">
          <stop offset="0%" stop-color="#e6e8f7"/>
          <stop offset="100%" stop-color="#fbfaf7"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <g fill="${BRAND}" opacity="0.10" transform="translate(1000,70) scale(6)">${petals}</g>
      <g fill="${BRAND}" opacity="0.08" transform="translate(-40,430) scale(5)">${petals}</g>
      <rect x="${cardLeft}" y="${cardTop}" width="${LW}" height="${cardH}" rx="26"
        fill="#ffffff" stroke="#e2ded5"/>
      <text x="${W / 2}" y="${cardTop + cardH + 58}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#14131a">
        Personnalisez votre vie · خصّص حياتك
      </text>
    </svg>`,
  );

  await sharp(bg)
    .composite([{ input: logo, top: cardTop + 48, left: cardLeft + 48 }])
    .png()
    .toFile(pub("og-image.png"));
}

await writeFavicons();
await writeLogo();
await writeOgImage();
console.log("Brand assets written to public/ (favicons, logo.webp, og-image.png)");
