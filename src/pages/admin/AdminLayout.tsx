import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, ShieldAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { AdminToastProvider } from "@/components/admin/AdminToast";
import { LangToggle, ThemeToggle } from "@/components/layout/ToggleControls";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { Wordmark } from "@/components/ui/Wordmark";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import { ADMIN_SECTIONS, routeToSection, type AdminSection } from "@/lib/adminSections";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { cn } from "@/lib/cn";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Declared at MODULE scope — never inside the layout render body (drawer
    "opens but won't close" fix, part 1). See skill Phase 8. */
function SidebarContent({
  sections,
  onNavigate,
  onSignOut,
  t,
}: {
  sections: AdminSection[];
  onNavigate: () => void;
  onSignOut: () => void;
  t: (k: TranslationKey) => string;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden p-5">
      <Link to="/admin" onClick={onNavigate} className="mb-8 shrink-0">
        <Wordmark />
        <span className="mt-1 block text-[0.65rem] uppercase tracking-widest text-muted">
          {t("adminTitle")}
        </span>
      </Link>

      <nav className="fx-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto">
        {sections.map((s) => (
          <NavLink
            key={s.key}
            to={s.route}
            end={s.exact}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                isActive
                  ? "bg-brand-soft/70 font-medium text-brand"
                  : "text-muted hover:bg-panel-2 hover:text-ink",
              )
            }
          >
            <s.icon size={17} />
            {t(s.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 shrink-0 space-y-3 border-t border-line pt-4">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LangToggle />
        </div>
        <Link to="/" onClick={onNavigate} className="block text-xs text-muted hover:text-brand">
          {t("adminBackToSite")}
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-2 text-xs font-medium text-danger hover:underline"
        >
          <LogOut size={13} />
          {t("adminSignOut")}
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { t, dir } = useI18n();
  const { session, loading: authLoading, signOut } = useAuth();
  const { hasSection, isActive, isLoading: profileLoading } = useAdminProfile();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Reset the <main> scroll region on route change.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  // Close the drawer on route change, Escape, and md breakpoint crossing.
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    const mql = window.matchMedia("(min-width: 1024px)");
    const onResize = () => mql.matches && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    mql.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      mql.removeEventListener("change", onResize);
      unlockBodyScroll();
    };
  }, [drawerOpen]);

  if (authLoading || (session && profileLoading)) return <PageLoader />;
  if (!session) return <Navigate to="/admin/login" replace />;

  if (isSupabaseConfigured && !isActive) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <ShieldAlert size={40} className="text-danger" />
        <h1 className="fx-display text-2xl text-ink">{t("adminNoAccessTitle")}</h1>
        <p className="max-w-sm text-sm text-muted">{t("adminNoAccessBody")}</p>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full border border-line px-5 py-2 text-sm text-ink"
        >
          {t("adminSignOut")}
        </button>
      </div>
    );
  }

  const canAccess = (s: AdminSection) => {
    if (s.always) return true;
    return hasSection(s.key);
  };
  const visibleSections = ADMIN_SECTIONS.filter(canAccess);

  // Guard direct-URL access.
  const currentKey = routeToSection(location.pathname);
  if (currentKey) {
    const section = ADMIN_SECTIONS.find((s) => s.key === currentKey);
    if (section && !canAccess(section)) {
      return <Navigate to="/admin" replace />;
    }
  }

  const slideFrom = dir === "rtl" ? "100%" : "-100%";

  return (
    <AdminToastProvider>
      <div className="flex h-dvh overflow-hidden bg-bg">
        <aside className="hidden h-full w-64 shrink-0 border-e border-line bg-panel lg:block">
          <SidebarContent
            sections={visibleSections}
            onNavigate={() => undefined}
            onSignOut={signOut}
            t={t}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-panel px-4 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("adminNav")}
              className="-ms-2 rounded-full p-2 text-ink"
            >
              <Menu size={20} />
            </button>
            <Wordmark className="text-xl" />
            <ThemeToggle />
          </header>

          <main ref={mainRef} className="fx-scrollbar flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-50 bg-ink/40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                className="fixed inset-y-0 start-0 z-50 w-72 bg-panel shadow-lift lg:hidden"
                initial={{ x: slideFrom }}
                animate={{ x: 0 }}
                exit={{ x: slideFrom }}
                transition={{ type: "tween", duration: 0.26 }}
              >
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label={t("close")}
                  className="absolute end-3 top-3 -m-2 p-2 text-muted"
                >
                  <X size={18} />
                </button>
                <SidebarContent
                  sections={visibleSections}
                  onNavigate={() => setDrawerOpen(false)}
                  onSignOut={signOut}
                  t={t}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {!isSupabaseConfigured && (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-2">
            <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 text-[0.7rem] text-muted shadow-soft">
              <FlowerMark className="h-3 w-3 text-brand" />
              Mode démo — connectez Supabase pour activer l'enregistrement
            </span>
          </div>
        )}
      </div>
    </AdminToastProvider>
  );
}
