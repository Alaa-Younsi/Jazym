import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { useActivePixels } from "@/hooks/useTrackingPixels";
import {
  initPixel,
  matchPixels,
  trackEvent,
  type PixelContext,
  type TrackEventKey,
} from "@/lib/tracking";

interface TrackingContextValue {
  track: (key: TrackEventKey, params?: Record<string, unknown>, eventId?: string) => void;
  setContext: (patch: Partial<Omit<PixelContext, "pathname">>) => void;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { data: pixels = [] } = useActivePixels();
  const [routeCtx, setRouteCtx] = useState<Omit<PixelContext, "pathname">>({});
  const pageViewSent = useRef<{ path: string; ids: Set<string> }>({
    path: "",
    ids: new Set(),
  });

  const isAdmin = pathname.startsWith("/admin");

  const ctx: PixelContext = useMemo(() => ({ pathname, ...routeCtx }), [pathname, routeCtx]);

  const matched = useMemo(() => (isAdmin ? [] : matchPixels(pixels, ctx)), [pixels, ctx, isAdmin]);

  // Init matched pixels.
  useEffect(() => {
    for (const p of matched) initPixel(p);
  }, [matched]);

  // Reset route context on navigation.
  useEffect(() => {
    setRouteCtx({});
  }, [pathname]);

  // PageView bookkeeping per (path, pixel id).
  useEffect(() => {
    if (isAdmin || matched.length === 0) return;
    const store = pageViewSent.current;
    if (store.path !== pathname) {
      store.path = pathname;
      store.ids = new Set();
    }
    const fresh = matched.filter((p) => !store.ids.has(p.id));
    if (fresh.length === 0) return;
    for (const p of fresh) store.ids.add(p.id);
    trackEvent(fresh, "page_view");
  }, [pathname, matched, isAdmin]);

  const value = useMemo<TrackingContextValue>(
    () => ({
      track: (key, params, eventId) => {
        if (isAdmin) return;
        trackEvent(matched, key, params, eventId);
      },
      setContext: (patch) => {
        setRouteCtx((prev) => {
          const nextSlug = patch.productSlug ?? prev.productSlug ?? null;
          const nextLanding = patch.landingSlug ?? prev.landingSlug ?? null;
          const nextExtra = patch.extraPixelIds ?? prev.extraPixelIds ?? [];
          if (
            nextSlug === (prev.productSlug ?? null) &&
            nextLanding === (prev.landingSlug ?? null) &&
            nextExtra.join() === (prev.extraPixelIds ?? []).join()
          ) {
            return prev;
          }
          return {
            productSlug: nextSlug,
            landingSlug: nextLanding,
            extraPixelIds: nextExtra,
          };
        });
      },
    }),
    [matched, isAdmin],
  );

  return <TrackingContext value={value}>{children}</TrackingContext>;
}

export function usePixel(): TrackingContextValue {
  const ctx = useContext(TrackingContext);
  if (!ctx) throw new Error("usePixel must be used within <TrackingProvider>");
  return ctx;
}
