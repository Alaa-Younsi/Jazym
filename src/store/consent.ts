import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Re-ask after ~13 months, the usual lifetime of a consent choice. */
const CONSENT_MAX_AGE_MS = 395 * 24 * 60 * 60 * 1000;

interface ConsentState {
  /** Epoch ms of the visitor's last explicit choice; null = never chose. */
  decidedAt: number | null;
  /** Advertising measurement (Meta + TikTok pixels). Off until accepted. */
  ads: boolean;
  /** Preferences panel open (not persisted). */
  panelOpen: boolean;
  choose: (ads: boolean) => void;
  openPanel: () => void;
  closePanel: () => void;
}

/**
 * Cookie consent. The pixels are NOT loaded before an explicit accept:
 * TrackingProvider reads `adsAllowed()` and passes no pixels until then.
 * Revoking after acceptance reloads the page, because a vendor script that
 * already ran cannot be unloaded.
 * Keep the storage key in step with the inventory in src/content/legal.ts.
 */
export const useConsent = create<ConsentState>()(
  persist(
    (set, get) => ({
      decidedAt: null,
      ads: false,
      panelOpen: false,
      choose: (ads) => {
        const revoked = get().ads && !ads;
        set({ ads, decidedAt: Date.now(), panelOpen: false });
        if (revoked) window.location.reload();
      },
      openPanel: () => set({ panelOpen: true }),
      closePanel: () => set({ panelOpen: false }),
    }),
    {
      name: "jazym-consent",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ decidedAt: s.decidedAt, ads: s.ads }),
    },
  ),
);

/** True once the visitor made a choice that is still fresh. */
export function hasValidDecision(decidedAt: number | null): boolean {
  return decidedAt != null && Date.now() - decidedAt < CONSENT_MAX_AGE_MS;
}

/** Ads tracking allowed right now (accepted AND the choice has not expired). */
export function useAdsAllowed(): boolean {
  const ads = useConsent((s) => s.ads);
  const decidedAt = useConsent((s) => s.decidedAt);
  return ads && hasValidDecision(decidedAt);
}
