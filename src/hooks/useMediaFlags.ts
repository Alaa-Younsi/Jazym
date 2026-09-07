import { useEffect, useState } from "react";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Data-saver / slow connection — heavy effects should be skipped. */
export function useSaveData(): boolean {
  const [saveData, setSaveData] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const c = nav.connection;
    if (!c) return;
    const check = () =>
      setSaveData(!!c.saveData || c.effectiveType === "2g" || c.effectiveType === "slow-2g");
    check();
  }, []);
  return saveData;
}

export function useMediaFlags() {
  return {
    isMobile: useIsMobile(),
    isDesktop: useIsDesktop(),
    reducedMotion: usePrefersReducedMotion(),
    saveData: useSaveData(),
  };
}
