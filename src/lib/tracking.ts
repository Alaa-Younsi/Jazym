import type { TrackingPixel } from "@/types/db";

/* Multi-pixel runtime, Meta + TikTok. Two rules shape everything (skill 8.6):
   1. Every event goes through per-pixel isolation
      (fbq("trackSingle", id, …) / ttq.instance(id).track(…)) — never plain
      track(), which broadcasts to every initialised pixel of that vendor.
   2. Which pixels are live is decided from the DB by scope + match values.
   Nothing here throws — an ad blocker is the normal case and must never break
   checkout. */

type FbqFn = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
type TtqFn = {
  (...args: unknown[]): void;
  instance?: (id: string) => { track: (event: string, params?: unknown) => void };
  page?: () => void;
  load?: (id: string) => void;
  _i?: Record<string, unknown>;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
    ttq?: TtqFn;
    TiktokAnalyticsObject?: string;
  }
}

export type TrackEventKey =
  | "page_view"
  | "view_content"
  | "add_to_cart"
  | "initiate_checkout"
  | "purchase";

export interface PixelContext {
  pathname: string;
  productSlug?: string | null;
  landingSlug?: string | null;
  extraPixelIds?: string[];
}

const META_EVENT: Record<TrackEventKey, string> = {
  page_view: "PageView",
  view_content: "ViewContent",
  add_to_cart: "AddToCart",
  initiate_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

const TIKTOK_EVENT: Record<TrackEventKey, string> = {
  page_view: "PageView",
  view_content: "ViewContent",
  add_to_cart: "AddToCart",
  initiate_checkout: "InitiateCheckout",
  purchase: "CompletePayment",
};

const initedMeta = new Set<string>();
const initedTiktok = new Set<string>();
let metaBaseInstalled = false;
let tiktokBaseInstalled = false;

function ensureMetaBase(): void {
  if (metaBaseInstalled || typeof window === "undefined") return;
  metaBaseInstalled = true;
  if (window.fbq) return;
  const n: FbqFn = ((...args: unknown[]) => {
    (n.queue as unknown[]).push(args);
  }) as FbqFn;
  n.queue = [];
  n.loaded = true;
  window.fbq = n;
  window._fbq = n;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
}

function ensureTiktokBase(): void {
  if (tiktokBaseInstalled || typeof window === "undefined") return;
  tiktokBaseInstalled = true;
  if (window.ttq) return;
  window.TiktokAnalyticsObject = "ttq";
  const ttq: TtqFn = ((...args: unknown[]) => {
    (ttq as unknown as { _q?: unknown[] })._q = (ttq as unknown as { _q?: unknown[] })._q || [];
    (ttq as unknown as { _q: unknown[] })._q.push(args);
  }) as TtqFn;
  ttq._i = {};
  window.ttq = ttq;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://analytics.tiktok.com/i18n/pixel/events.js";
  document.head.appendChild(s);
}

export function initPixel(pixel: TrackingPixel): void {
  if (typeof window === "undefined" || !pixel.active) return;
  if (pixel.provider === "meta") {
    ensureMetaBase();
    if (initedMeta.has(pixel.pixel_id)) return;
    initedMeta.add(pixel.pixel_id);
    try {
      window.fbq?.("set", "autoConfig", false, pixel.pixel_id);
      window.fbq?.("init", pixel.pixel_id);
    } catch {
      /* noop */
    }
  } else {
    ensureTiktokBase();
    if (initedTiktok.has(pixel.pixel_id)) return;
    initedTiktok.add(pixel.pixel_id);
    try {
      window.ttq?.load?.(pixel.pixel_id);
    } catch {
      /* noop */
    }
  }
}

/** Scope + match resolution. Empty match_values on a scoped pixel = "every page
    of that kind" (skill 8.6). */
export function matchPixels(pixels: TrackingPixel[], ctx: PixelContext): TrackingPixel[] {
  const extra = new Set(ctx.extraPixelIds ?? []);
  return pixels.filter((p) => {
    if (!p.active) return false;
    if (extra.has(p.id)) return true;
    switch (p.scope) {
      case "all":
        return true;
      case "paths":
        return (
          p.match_values.length === 0 ||
          p.match_values.some((v) => ctx.pathname === v || ctx.pathname.startsWith(v))
        );
      case "products":
        return (
          !!ctx.productSlug &&
          (p.match_values.length === 0 || p.match_values.includes(ctx.productSlug))
        );
      case "landing":
        return (
          !!ctx.landingSlug &&
          (p.match_values.length === 0 || p.match_values.includes(ctx.landingSlug))
        );
      default:
        return false;
    }
  });
}

function valueIsValid(params?: Record<string, unknown>): boolean {
  if (!params || !("value" in params)) return true;
  const v = params.value;
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

export function trackEvent(
  pixels: TrackingPixel[],
  key: TrackEventKey,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === "undefined") return;
  if (!valueIsValid(params)) {
    if (import.meta.env.DEV) {
      console.warn(`[tracking] skipped ${key}: invalid value`, params);
    }
    return;
  }
  for (const pixel of pixels) {
    if (pixel.events[key] === false) continue;
    const payload = { currency: pixel.currency || "DZD", ...params };
    try {
      if (pixel.provider === "meta") {
        if (!initedMeta.has(pixel.pixel_id)) initPixel(pixel);
        window.fbq?.(
          "trackSingle",
          pixel.pixel_id,
          META_EVENT[key],
          payload,
          eventId ? { eventID: eventId } : undefined,
        );
      } else {
        if (!initedTiktok.has(pixel.pixel_id)) initPixel(pixel);
        const inst = window.ttq?.instance?.(pixel.pixel_id);
        if (key === "page_view") inst ? inst.track("Pageview", payload) : window.ttq?.page?.();
        else inst?.track(TIKTOK_EVENT[key], payload);
      }
    } catch {
      /* an ad blocker removed fbq/ttq mid-call — ignore */
    }
  }
}
