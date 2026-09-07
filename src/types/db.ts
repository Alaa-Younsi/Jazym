/* Database row shapes — kept in lockstep with supabase/migrations/*.sql.
   Read models are normalised through the hooks (see src/hooks) so the UI can
   trust arrays are always present even against a DB missing a later migration. */

export type ProductStatus = "active" | "draft";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type DeliveryType = "home" | "office";
export type PixelProvider = "meta" | "tiktok";

export interface Category {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductColor {
  label_fr: string;
  label_ar: string;
  label_en?: string;
  hex: string;
  image_url?: string | null;
}

export interface ProductSize {
  label_fr: string;
  label_ar: string;
}

export interface VariantOption {
  value_fr: string;
  value_ar: string;
  image_url?: string | null;
}

export interface VariantGroup {
  name_fr: string;
  name_ar: string;
  values: VariantOption[];
}

export type QuantityOffer =
  | { type: "free"; buy: number; get: number }
  | { type: "price"; qty: number; price: number };

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  details_fr: string[];
  details_ar: string[];
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  stock: number;
  style_code: string | null;
  colors: ProductColor[];
  sizes: ProductSize[];
  variants: VariantGroup[];
  quantity_offers: QuantityOffer[];
  video_url: string | null;
  featured: boolean;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  product_images?: ProductImage[];
}

export interface CartVariantPick {
  name_fr: string;
  name_ar: string;
  value_fr: string;
  value_ar: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name_fr: string;
  name_ar: string;
  price: number;
  quantity: number;
  color: string | null;
  size: string | null;
  variants: CartVariantPick[];
  image_url: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  wilaya: string;
  city: string;
  address: string | null;
  notes: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  language: string;
  delivery_type: DeliveryType;
  created_at: string;
  order_items?: OrderItem[];
}

export interface StoreSettings {
  id: number;
  shipping_fee: number;
  free_ship_threshold: number | null;
  store_phone: string | null;
  store_email: string | null;
  store_address_fr: string | null;
  store_address_ar: string | null;
  announcement_fr: string | null;
  announcement_ar: string | null;
}

export interface DeliveryPrice {
  id: string;
  wilaya: string;
  home_price: number;
  office_price: number;
  active: boolean;
  updated_at: string;
}

export interface ClientReview {
  id: string;
  client_name: string;
  stars: number;
  review_text: string;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

/* ---- staff / permissions (Phase 8.5) ---- */
export interface AdminProfile {
  user_id: string;
  email: string | null;
  is_owner: boolean;
  sections: string[];
  active: boolean;
  created_at: string;
}

/* ---- tracking pixels (Phase 8.6) ---- */
export type PixelScope = "all" | "paths" | "products" | "landing";

export interface TrackingPixelEvents {
  page_view: boolean;
  view_content: boolean;
  add_to_cart: boolean;
  initiate_checkout: boolean;
  purchase: boolean;
}

export interface TrackingPixel {
  id: string;
  provider: PixelProvider;
  label: string;
  pixel_id: string;
  active: boolean;
  scope: PixelScope;
  match_values: string[];
  events: TrackingPixelEvents;
  currency: string;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/* ---- custom landing pages ---- */
export type LandingBlockType =
  | "hero"
  | "text"
  | "image"
  | "product"
  | "features"
  | "gallery"
  | "reviews"
  | "faq"
  | "cta"
  | "countdown";

export interface LandingBlock {
  id: string;
  type: LandingBlockType;
  /** Free-form per-block config; validated per type in the renderer. */
  data: Record<string, unknown>;
}

export interface LandingPage {
  id: string;
  slug: string;
  title_fr: string;
  title_ar: string;
  status: "draft" | "published";
  /** Product this landing page sells (drives the embedded checkout). */
  product_id: string | null;
  blocks: LandingBlock[];
  theme: "light" | "dark" | "auto";
  seo_title_fr: string | null;
  seo_title_ar: string | null;
  seo_description_fr: string | null;
  seo_description_ar: string | null;
  og_image_url: string | null;
  pixel_ids: string[];
  created_at: string;
  updated_at: string;
  product?: Product | null;
}

/* ---- policy content (Phase 8.8) ---- */
export interface PolicySettings {
  id: boolean;
  tag_fr: string | null;
  tag_ar: string | null;
  title_fr: string | null;
  title_ar: string | null;
  intro_fr: string | null;
  intro_ar: string | null;
  contact_title_fr: string | null;
  contact_title_ar: string | null;
  contact_body_fr: string | null;
  contact_body_ar: string | null;
  updated_label_fr: string | null;
  updated_label_ar: string | null;
  updated_at: string;
}

export interface PolicySection {
  id: string;
  builtin_key: string | null;
  icon: string | null;
  sort_order: number;
  active: boolean;
  title_fr: string | null;
  title_ar: string | null;
  body_fr: string | null;
  body_ar: string | null;
  created_at: string;
  updated_at: string;
}
