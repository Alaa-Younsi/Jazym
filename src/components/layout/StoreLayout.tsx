import { motion } from "framer-motion";
import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useI18n } from "@/i18n/LanguageProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { PageLoader } from "@/components/ui/Spinner";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { WhatsAppButton } from "./WhatsAppButton";

export function StoreLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const reduced = usePrefersReducedMotion();
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {t("skipToContent")}
      </a>
      <Header />
      {/* Scoped to the outlet ONLY — a lazy page chunk suspending here must
          never tear down Header/Footer/CartDrawer, or a drawer mid-close
          (AnimatePresence exit animation in flight) gets torn down with it
          and gets stuck half-open forever. See skill's "opens but won't
          close" note. */}
      <main id="main" className="flex-1">
        <Suspense fallback={<PageLoader />}>
          {/* Enter-only page transition, keyed on the path. Deliberately NOT
              wrapped in <AnimatePresence>: an exit animation racing a route
              change is exactly what left the cart drawer stuck open before.
              No exit means nothing to get stuck. */}
          <motion.div
            key={pathname}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
}
