import { Suspense, lazy, useEffect, useState } from "react";
import { HeroArt } from "@/components/effects/HeroArt";
import { useIsDesktop, usePrefersReducedMotion, useSaveData } from "@/hooks/useMediaFlags";
import { useI18n } from "@/i18n/LanguageProvider";

/* three.js is ~150 KB gzipped — far too much to sit on the critical path of a
   storefront most visitors reach on mobile data. It is split into its own chunk
   and only requested once we know the device can actually use it. */
const Notebook3D = lazy(() => import("@/components/effects/Notebook3D"));

/** One-shot WebGL probe. Cached at module scope — creating a throwaway context
    per mount is genuinely expensive on low-end Android. */
let webglSupport: boolean | null = null;
function hasWebGL() {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    webglSupport = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/**
 * Hero artwork with a graceful ladder:
 *   flat SVG  →  (after first paint, if the device can take it)  →  live 3D.
 *
 * The SVG is always what renders first, so the hero is never blank and the LCP
 * never waits on a WebGL context. The 3D swap is deliberately deferred past
 * first paint via requestIdleCallback.
 */
export function HeroScene() {
  const { t } = useI18n();
  const reduced = usePrefersReducedMotion();
  const saveData = useSaveData();
  const isDesktop = useIsDesktop();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // saveData already covers 2g / slow-2g / explicit data-saver.
    if (reduced || saveData) return;
    // Hard floor on device capability — a 2-core phone will not enjoy this.
    if ((navigator.hardwareConcurrency ?? 4) < 4) return;
    // ~240 KB gzip of three.js is a real cost on a metered Algerian mobile
    // plan, so phones on a slow estimate keep the flat SVG. On desktop we do
    // NOT consult effectiveType: it is a rolling round-trip estimate that
    // reports "3g" on plenty of perfectly good fixed lines (this very
    // browser does), and gating the hero centrepiece on it means most
    // visitors never see the thing at all.
    if (!isDesktop) {
      const conn = (navigator as Navigator & { connection?: { effectiveType?: string } })
        .connection;
      if (conn?.effectiveType && conn.effectiveType !== "4g") return;
    }
    if (!hasWebGL()) return;

    // `timeout` matters: on a page that stays busy (product images decoding,
    // queries hydrating) a bare requestIdleCallback can sit unfired for tens
    // of seconds and the 3D silently never arrives. This caps the wait.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 400));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => setReady(true), { timeout: 2500 });
    return () => cancel(handle as number);
  }, [reduced, saveData, isDesktop]);

  // Explicit heights at every step, never `aspect-square`: the art is the
  // single biggest contributor to the hero's height, and on a 900px laptop a
  // square 512px box is what pushed the stat strip below the fold.
  return (
    <div className="relative mx-auto h-[clamp(205px,27svh,310px)] w-full max-w-[min(36rem,100vw)] sm:h-[clamp(250px,32svh,360px)] lg:h-[min(32rem,56vh)] lg:max-w-xl">
      {ready ? (
        <Suspense fallback={<HeroArt />}>
          <Notebook3D />
        </Suspense>
      ) : (
        <HeroArt />
      )}

      {ready && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center lg:bottom-2">
          <span className="rounded-full border border-line/70 bg-panel/70 px-3 py-1 text-[0.68rem] text-muted backdrop-blur-sm">
            {t("heroDragHint")}
          </span>
        </span>
      )}
    </div>
  );
}
