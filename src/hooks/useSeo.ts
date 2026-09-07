import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { canonicalUrl, DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/seo";

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

    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
      upsertMeta("name", "twitter:description", description);
    }
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
