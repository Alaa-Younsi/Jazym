import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Truck,
  Star,
  LayoutTemplate,
  Megaphone,
  Radio,
  Users,
  UserCog,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

/**
 * ONE source of truth for the admin nav, the route→section map, and the owner's
 * grant checklist. `key` MUST equal the `has_section('…')` string in the
 * migration AND the edge function's ALLOWED_SECTIONS. A mismatch fails silently.
 * See skill Phase 8.5.
 *
 * This project intentionally has NO Finance / POS sections (client brief).
 */
export interface AdminSection {
  key: string;
  route: string;
  exact?: boolean;
  labelKey: TranslationKey;
  icon: LucideIcon;
  always?: boolean;
  ownerOnly?: boolean;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    key: "dashboard",
    route: "/admin",
    exact: true,
    labelKey: "adminSecDashboard",
    icon: LayoutDashboard,
    always: true,
  },
  { key: "products", route: "/admin/products", labelKey: "adminSecProducts", icon: Package },
  {
    key: "categories",
    route: "/admin/categories",
    labelKey: "adminSecCategories",
    icon: FolderTree,
  },
  { key: "orders", route: "/admin/orders", labelKey: "adminSecOrders", icon: ShoppingBag },
  {
    key: "delivery",
    route: "/admin/delivery",
    labelKey: "adminSecDelivery",
    icon: Truck,
  },
  { key: "reviews", route: "/admin/reviews", labelKey: "adminSecReviews", icon: Star },
  {
    key: "landing",
    route: "/admin/landing",
    labelKey: "adminSecLanding",
    icon: LayoutTemplate,
  },
  { key: "pixels", route: "/admin/pixels", labelKey: "adminSecPixels", icon: Radio },
  { key: "panels", route: "/admin/panels", labelKey: "adminSecPanels", icon: Megaphone },
  { key: "policy", route: "/admin/policy", labelKey: "adminSecPolicy", icon: FileText },
  {
    key: "team",
    route: "/admin/team",
    labelKey: "adminSecTeam",
    icon: Users,
    ownerOnly: true,
  },
  {
    key: "account",
    route: "/admin/account",
    labelKey: "adminSecAccount",
    icon: UserCog,
    always: true,
  },
];

/** Sections the owner can grant to a worker (not `always`, not `ownerOnly`). */
export const GRANTABLE_SECTIONS = ADMIN_SECTIONS.filter((s) => !s.always && !s.ownerOnly);

/** Whitelist mirrored server-side in the create-worker edge function. */
export const ALLOWED_SECTIONS = GRANTABLE_SECTIONS.map((s) => s.key);

/**
 * Resolve a pathname to its section key. Exact `/admin` overview first, then the
 * LONGEST matching route prefix — otherwise `/admin` shadows everything.
 */
export function routeToSection(pathname: string): string | null {
  const exact = ADMIN_SECTIONS.find((s) => s.exact && s.route === pathname);
  if (exact) return exact.key;
  let best: AdminSection | null = null;
  for (const s of ADMIN_SECTIONS) {
    if (s.exact) continue;
    if (pathname === s.route || pathname.startsWith(`${s.route}/`)) {
      if (!best || s.route.length > best.route.length) best = s;
    }
  }
  return best?.key ?? null;
}
