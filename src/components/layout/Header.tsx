import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { Drawer } from "@/components/ui/Drawer";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { Wordmark } from "@/components/ui/Wordmark";
import { useCategories } from "@/hooks/useCategories";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useI18n } from "@/i18n/LanguageProvider";
import { childrenOf } from "@/lib/categoryTree";
import { pick } from "@/lib/utils";
import { cn } from "@/lib/cn";
import { useCart } from "@/store/cart";
import { LangToggle, ThemeToggle } from "./ToggleControls";

export function Header() {
  const { t, lang } = useI18n();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useStoreSettings();
  const openCart = useCart((s) => s.openCart);
  const count = useCart((s) => s.totalItems());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const announcement = lang === "ar" ? settings?.announcement_ar : settings?.announcement_fr;

  // Top-level categories only, capped — a deep matière/thème tree must never
  // flood the main nav (that's what the shop page's own browsing is for).
  const topCategories = childrenOf(categories, null).slice(0, 4);
  // No policy link here by client request — it lives in the footer, where
  // shipping/returns copy is conventionally looked for anyway.
  const navItems = [
    { to: "/boutique", label: t("navShop") },
    ...topCategories.map((c) => ({
      to: `/boutique/${c.slug}`,
      label: pick(lang, c, "name"),
    })),
    { to: "/contact", label: t("navContact") },
  ];

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchOpen(false);
    navigate(`/boutique?q=${encodeURIComponent(term.trim())}`);
    setTerm("");
  }

  return (
    <>
      {announcement && (
        <div className="fx-glint relative overflow-hidden bg-gradient-to-r from-brand via-violet to-brand bg-[length:200%_100%] text-bg">
          <Container className="flex items-center justify-center gap-2 py-2 text-[0.72rem] font-medium tracking-wide">
            <Truck size={13} className="shrink-0 opacity-90" />
            <span>{announcement}</span>
            <FlowerMark className="h-3 w-3 shrink-0 text-gold" />
          </Container>
        </div>
      )}
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-colors",
          scrolled ? "border-line bg-bg/85 backdrop-blur-md" : "border-transparent bg-bg",
        )}
      >
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("navMenu")}
              className="-ms-2 rounded-full p-2 text-ink"
            >
              <Menu size={20} />
            </button>
          </div>

          <Link
            to="/"
            className="shrink-0 transition-transform duration-300 hover:scale-[1.03]"
            aria-label={t("brandName")}
          >
            <Wordmark eager />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/boutique"}
                className={({ isActive }) =>
                  cn(
                    "fx-link-underline py-1 text-sm text-ink/80 transition hover:text-ink",
                    isActive && "text-ink",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={t("search")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition hover:border-brand hover:text-brand"
            >
              <Search size={16} />
            </button>
            <ThemeToggle className="hidden sm:inline-flex" />
            <LangToggle />
            <button
              type="button"
              onClick={openCart}
              aria-label={t("navCart")}
              className="relative inline-flex h-9 items-center gap-2 rounded-full bg-brand px-3.5 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              <ShoppingBag size={16} />
              <span className="num-ltr min-w-[1ch] text-center">{count}</span>
            </button>
          </div>
        </Container>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-line bg-bg"
            >
              <Container className="py-3">
                <form onSubmit={submitSearch} className="flex items-center gap-2">
                  <Search size={16} className="text-muted" />
                  <input
                    ref={(el) => el?.focus()}
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder={t("shopSearchPlaceholder")}
                    className="h-10 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-bg"
                  >
                    {t("search")}
                  </button>
                </form>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        side="start"
        title={t("navMenu")}
        widthClass="w-[86%] max-w-xs"
      >
        <nav className="flex flex-col p-2">
          <MobileLink to="/" onClick={() => setMenuOpen(false)}>
            {t("navHome")}
          </MobileLink>
          {navItems.map((item) => (
            <MobileLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
              {item.label}
            </MobileLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 border-t border-line p-4">
          <ThemeToggle />
          <LangToggle />
          <span className="ms-auto inline-flex items-center gap-1.5 text-xs text-muted">
            <FlowerMark className="h-4 w-4 text-brand" />
            {t("footerMadeIn")}
          </span>
        </div>
      </Drawer>
    </>
  );
}

function MobileLink({
  to,
  children,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === "/" || to === "/boutique"}
      className={({ isActive }) =>
        cn(
          "rounded-xl px-4 py-3 text-sm text-ink transition hover:bg-panel-2",
          isActive && "bg-panel-2 font-medium text-brand",
        )
      }
    >
      {children}
    </NavLink>
  );
}
