import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { useI18n } from "@/i18n/LanguageProvider";
import { PageLoader } from "@/components/ui/Spinner";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { WhatsAppButton } from "./WhatsAppButton";

export function StoreLayout() {
  const { t } = useI18n();
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
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
}
