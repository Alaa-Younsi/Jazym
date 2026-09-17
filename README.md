# Jazym — boutique en ligne (COD Algérie)

Boutique cash-on-delivery bilingue **FR / AR (RTL)** pour **Jazym** — cahiers de
l'enseignant, accessoires/organisateurs et kits de stratégies pédagogiques —
avec tableau de bord d'administration complet.

- **Front** : Vite + React 19 + TypeScript (strict) + TailwindCSS 3
- **Données** : Supabase (Postgres + Auth + Storage) — *à connecter*
- **État** : TanStack Query · Zustand (panier) · react-hook-form + zod
- **Anim.** : Framer Motion · **Icônes** : lucide-react
- **Lint/format** : Biome · **Déploiement** : Vercel

Palette et typographie tirées du logo : bleu bleuet `#5B6FC7`, or `#E8B84B`,
papier crème `#FBFAF7`, encre `#14131A` ; **Cormorant Garamond** (titres) +
**Inter** (FR) + **Tajawal** (AR), auto-hébergées via `@fontsource`.

## Démarrage

```bash
bun install
cp .env.example .env      # remplir les clés Supabase (voir HANDOFF.md)
bun run dev               # http://localhost:5173
```

Sans clés Supabase le site tourne en **mode démo** : catalogue Jazym intégré
(`src/data/demo.ts`), commandes simulées, admin en lecture seule. Renseignez
`.env` puis exécutez les migrations pour passer en production.

## Scripts

| Script | Rôle |
| --- | --- |
| `bun run dev` | serveur de dev |
| `bun run build` | `prebuild` (sitemap) → `tsc -b` → `vite build` |
| `bun run preview` | prévisualise `dist/` |
| `bun run typecheck` | `tsc -b --noEmit` |
| `bun run lint` | `biome check .` |
| `bun run test:db` | applique **toutes** les migrations dans un Postgres en mémoire (PGlite) et vérifie que le moteur de promotions SQL et son miroir TypeScript donnent le même prix |
| `bun run format` | `biome format --write .` |
| `bun run scripts/gen-brand-assets.mjs` | régénère favicons + `logo.webp` + `og-image.png` depuis `_brand/logo.jpeg` |
| `bun run optimize:logo` | régénère `public/jazym-logo*.webp` depuis `_brand/jazym-logo.png` |
| `bun run scripts/gen-seed-sql.mjs` | régénère `supabase/migrations/0008_seed.sql` depuis la démo |
| `bun run scripts/csp-hash.mjs` | recalcule le hash CSP du script de thème (après `vite build`) |

## Structure

```
src/
  components/  layout · product · checkout · landing · ui · admin · effects
  hooks/       useProducts · useOrders · useStoreSettings · useAdminProfile · …
  i18n/        translations.ts (FR/AR à plat) + LanguageProvider
  lib/         supabase · format · offers · promotions · announcement · video
               · orderErrors · image · datetime · tracking · …
  pages/       Landing · Shop · Product · Checkout · OrderConfirmation · Policy
               · Contact · LandingPageView · admin/*
  data/demo.ts catalogue Jazym intégré (mode démo)
supabase/
  migrations/  0001…0020 (schéma, RLS, RPC place_order, permissions, pixels,
               pages de vente, politique, seed, arbre de catégories, variantes
               tarifées, panneaux promo, commandes manuelles, bandeau
               d'annonce, moteur d'offres & promotions)
  functions/   create-worker · set-worker-password (edge, service-role)
middleware.ts  OG link-preview pour /produit/:slug (crawlers)
vercel.json    rewrite SPA + en-têtes sécurité + CSP + cache
```

## Fonctionnalités clés

**Boutique** — accueil éditorial (hero animé bleuet, catégories, sélection,
avis), boutique filtrable/recherche, fiche produit (galerie *swipe* +
couleurs/formats/options personnalisées avec image par option, offres quantité,
« Commander maintenant » intégré), panier *drawer*, **checkout COD** (nom,
tél. algérien validé, wilaya des **69** wilayas, domicile/bureau), page de
confirmation, politique éditable, contact.

**Prix côté serveur** — la RPC `place_order` recalcule prix, remise (offres
quantité), livraison et stock ; le client n'envoie jamais de montant. Rejette
wilaya inconnue/désactivée, sélection manquante, stock insuffisant, et applique
un *rate-limit* par téléphone + disjoncteur global. Erreurs `ERR_*` mappées
FR/AR.

**Admin** (`/admin`, non lié depuis le site) — tableau de bord, **Produits**
(images ordonnables, couleurs/formats/options, offres, vidéo), **Catégories**,
**Commandes** (filtre, export Excel anti-injection, suppression groupée),
**Tarifs de livraison** (69 wilayas, activation par wilaya), **Avis**,
**Pages de vente** personnalisées (éditeur de blocs), **Pixels** Meta + TikTok
multi-comptes pilotés par la BDD, **Équipe** (comptes staff + permissions par
section appliquées en RLS), **Mon compte** (changement de mot de passe),
**Politique** (surcharges de texte).

> Pas de module **Finance** ni **POS** (hors périmètre client).

Voir **HANDOFF.md** pour la mise en production pas à pas.
