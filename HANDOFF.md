# Mise en production — Jazym

Checklist à suivre dans l'ordre. Chaque point coché = un défaut connu évité.

## 1. Supabase

1. Créer un projet Supabase → copier `Project URL` + `anon public key`.
2. `cp .env.example .env` et renseigner `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL` (domaine de prod).
   **Ne jamais committer `.env`.**
3. **Migrations** — dans le SQL Editor Supabase, exécuter dans l'ordre :
   `supabase/migrations/0001` → `0030`.
   - `bun run test:db` rejoue d'abord tout le dossier dans un Postgres jetable :
     si une migration ne s'applique plus, on le sait avant de coller quoi que ce
     soit dans le SQL Editor.
   - `0018` → `0020` ajoutent le **bandeau d'annonce** et le **moteur d'offres
     & promotions** (table `promotions`, `apply_promotions`, `price_cart`, et
     `place_order` recablé dessus). Tant qu'elles ne sont pas passées, les
     sections « Offres & promos » et « Bandeau d'annonce » de l'admin
     remontent une erreur de chargement — c'est attendu.
   - **Avant `0004`** : ouvrir `0004_admin_permissions.sql` et remplacer
     `owner@jazym.dz` par l'e-mail réel du propriétaire. Après cette migration,
     **seuls les admins enregistrés peuvent écrire**.
4. **Storage** → créer les buckets **publics en lecture** :
   `product-images` et `product-videos` (écriture : authenticated).
5. **Auth → Settings** : créer l'utilisateur propriétaire (même e-mail que le
   seed `0004`) **et désactiver l'inscription publique** (« Enable Signups »
   OFF). C'est la barrière réelle contre l'auto-inscription en admin.
6. Demander au propriétaire de changer son mot de passe dans `/admin/account`.

## 2. Edge functions (comptes staff)

```bash
supabase functions deploy create-worker
supabase functions deploy set-worker-password
supabase functions deploy notify
```
Les deux sont requises : sans `set-worker-password`, le bouton « changer le mot
de passe » d'un membre échoue en erreur réseau générique.

## 3. Vercel

1. Importer le repo GitHub dans Vercel (framework : **Vite**, laisser le reste).
2. **Project → Settings → Environment Variables** : ajouter
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`
   (et `VITE_GA_MEASUREMENT_ID` si GA). Le middleware d'aperçu de lien lit ces
   variables **au edge** — sans elles, les partages de `/produit/...` retombent
   sur la carte générique.
3. Déployer. `vercel.json` gère le rewrite SPA, les en-têtes de sécurité, la
   CSP et le cache.
4. Vérifier la **CSP sur l'URL de preview** (inerte en local) : ouvrir la
   console sur une fiche produit, le checkout, un upload admin, une page avec
   pixel — aucun `Refused to…`.
   - Si le script de thème dans `index.html` est modifié un jour :
     `bun run build && bun run scripts/csp-hash.mjs`, puis committer `vercel.json`.

## 4. Domaine / SEO

Domaine de prod : **`https://jazym.shop`** (apex ; `www.jazym.shop` redirige
dessus via `vercel.json`). C'est déjà la valeur de repli dans `src/lib/seo.ts`,
`middleware.ts` et `scripts/generate-sitemap.mjs` ; `VITE_SITE_URL` dans Vercel
doit valoir exactement `https://jazym.shop`. Chaque build régénère
`public/sitemap.xml` et `public/robots.txt` avec ce domaine.

- **Supabase → Authentication → URL Configuration** : Site URL
  `https://jazym.shop`, Redirect URLs `https://jazym.shop/**`.
- **Google Search Console** : propriété « Domaine » `jazym.shop` (TXT DNS),
  puis soumettre `https://jazym.shop/sitemap.xml`.
- **Meta Business → Domaines** : vérifier `jazym.shop` (TXT DNS) pour les
  événements du pixel.

## 4 bis. E-mails (Resend)

1. resend.com → **Domains → Add** `jazym.shop` (région eu-west-1), copier les
   enregistrements DKIM / SPF (sous-domaine `send`) / MX dans la zone DNS.
2. Ajouter un DMARC : TXT `_dmarc` = `v=DMARC1; p=none;`.
3. Une fois « Verified » :
   ```bash
   supabase secrets set RESEND_API_KEY=re_...
   supabase secrets set RESEND_FROM="Jazym <commandes@jazym.shop>"
   supabase functions deploy notify
   ```
4. Pas de boîte mail sur le domaine : le site n'affiche aucun e-mail, et les
   notifications partent vers l'adresse personnelle saisie dans
   `/admin/account` (préférences de notification).

## 5. Contenu

- `src/lib/contact.ts` : téléphone `0559 81 56 46` (`+213559815646`), adresse
  El Eulma 19600, Sétif. Tester le lien `tel:` et WhatsApp sur un vrai
  téléphone.
- Vérifier les liens réseaux sociaux dans `src/lib/contact.ts`
  (`SOCIAL_LINKS`).
- Seed : le catalogue Jazym (18 produits, 69 wilayas, avis) est inséré par
  `0008_seed.sql`. **Ajouter les vraies photos produits via l'admin** (le seed
  n'insère aucune image).
- **Ré-ouvrir un produit, modifier un prix, recharger** : confirmer que la
  valeur tient (les chemins création / édition sont distincts).
- Ajuster les **tarifs de livraison** réels par wilaya dans
  `/admin/delivery` (le seed pose une estimation nord/sud).
- Livraison gratuite : **désactivée par défaut** (`free_ship_threshold` NULL).
  Pour l'activer, renseigner le seuil dans `store_settings`.

## 6. Pixels

Dans `/admin/pixels`, créer au moins un pixel **actif** (Meta et/ou TikTok),
saisir l'ID (chiffres uniquement), choisir la portée. Vérifier dans Meta Events
Manager que chaque campagne ne reçoit que ses propres événements.

## 7. Test de commande réel

En **navigation privée (client anon, pas admin)** :
1. Passer une commande via le panier **et** via « Commander maintenant » sur une
   fiche. Confirmer que la page de confirmation affiche bien le récapitulatif.
2. Supprimer la commande de test dans l'admin (nom client = `TEST`).
3. Fuzz de `place_order` (curl/Insomnia sur `POST {url}/rest/v1/rpc/place_order`
   avec `apikey` + `Authorization: Bearer <anon>`) : `items` vide, quantité
   `0` / `10000`, wilaya désactivée, wilaya inventée, `product_id` inconnu,
   quantité > stock, téléphone `"x"`, nom vide, 11+ variantes → chaque cas doit
   renvoyer un `ERR_*` distinct, jamais un 200.
4. Passer une commande de test en `cancelled` → vérifier que le stock est
   recrédité (trigger `orders_restock_on_cancel`).

## 8. Staff (si le client a des employés)

Après `0004` avec le bon e-mail : se connecter en propriétaire, vérifier l'accès
à toutes les sections. Créer un compte jetable via `/admin/team` avec une seule
section, se connecter avec, vérifier que (a) la nav ne montre que cette section,
(b) l'URL d'une autre section redirige vers `/admin`, (c) un `PATCH` PostgREST
direct sur une table non accordée ne change rien (re-lire la ligne).
Désactiver le compte jetable ensuite.

## 9. Avant les pubs payantes

- `bun run typecheck && bun run lint` — zéro erreur.
- Compter les wilayas dans le select du checkout : **69**.
- Vérifier l'aperçu de lien :
  `curl -A "facebookexternalhit/1.1" https://jazym.shop/produit/<slug>`.
