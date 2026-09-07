/* Recompute the CSP sha256 for the inline pre-paint theme script and patch it
   into vercel.json. Run after `vite build` whenever the inline <script> in
   index.html changes, then COMMIT the updated vercel.json.

   script-src in vercel.json has no 'unsafe-inline' — the inline script runs only
   on the strength of this exact hash. See skill Phase 3 / 9.5. */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const distIndex = fileURLToPath(new URL("../dist/index.html", import.meta.url));
const vercelJson = fileURLToPath(new URL("../vercel.json", import.meta.url));

const html = await readFile(distIndex, "utf8");
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) {
  console.error("No inline <script> found in dist/index.html — run `vite build` first.");
  process.exit(1);
}

const hash = createHash("sha256").update(match[1]).digest("base64");
const token = `sha256-${hash}`;
console.log("Theme script hash:", token);

const vercel = await readFile(vercelJson, "utf8");
const patched = vercel.replace(
  /'sha256-[^']*'/,
  `'${token}'`,
);
if (patched === vercel && !vercel.includes(token)) {
  console.warn("vercel.json unchanged — no sha256-… placeholder matched?");
} else {
  await writeFile(vercelJson, patched, "utf8");
  console.log("vercel.json patched. Commit it.");
}
