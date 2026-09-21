import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { canonicalUrl, DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/seo";

/* Fallback copy for a route that sets no description of its own. Without it,
   navigating Product → Checkout leaves the PRODUCT's description sitting in
   <meta name="description"> and in the og: tags — these are mutations on a
   shared <head>, so anything not overwritten on the next route simply stays.
   Matches the static copy in index.html. */
const DEFAULT_DESCRIPTION =
  "Cahiers de l'enseignant, accessoires et kits de stratégies pédagogiques. Paiement à la livraison partout en Algérie.";

interface SeoInput {
  title: string;
  description?: string;
  image?: string | null;
  /** schema.org payload injected as a page-scoped <script>, removed on unmount. */
  jsonLd?: Record<string, unknown> | null;
  noindex?: boolean;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function useSeo({ title, description, image, jsonLd, noindex }: SeoInput) {
  const { pathname } = useLocation();
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const prevTitle = document.title;
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const url = canonicalUrl(pathname);
    // Always set og:image / twitter:image explicitly (skill Phase 7).
    const ogImage = image || DEFAULT_OG_IMAGE;

    // Always written, never conditionally — see DEFAULT_DESCRIPTION above.
    const desc = description?.trim() || DEFAULT_DESCRIPTION;
    upsertMeta("name", "description", desc);
    upsertMeta("property", "og:description", desc);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("name", "twitter:image", ogImage);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    upsertLink("canonical", url);

    let script: HTMLScriptElement | null = null;
    if (jsonLdKey) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = jsonLdKey;
      script.dataset.seo = "page";
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      script?.remove();
    };
  }, [title, description, image, jsonLdKey, noindex, pathname]);
}
