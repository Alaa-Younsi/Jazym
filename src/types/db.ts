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
  /** null = top-level category. Categories nest arbitrarily deep; a category
      may hold either subcategories or products, never both (enforced in SQL). */
  parent_id: string | null;
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
  /** small color dot rendered in the picker pill (e.g. theme swatches) */
  swatch_hex?: string | null;
  /** customer must type free text (e.g. a name to print on the cover) */
  requires_text?: boolean;
  /** customer must upload an image (e.g. a custom cover design) */
  requires_upload?: boolean;
}

export interface VariantGroup {
  name_fr: string;
  name_ar: string;
  values: VariantOption[];
  /** render this group before the priced/stocked product_variants picker
      (e.g. pages) instead of after it, which is the default. */
  before_price_variant?: boolean;
  /**
   * The shopper may leave this group unpicked. Default (false) means every
   * group is mandatory, which is what `place_order` enforces server-side.
   * A single-value optional group renders as a checkbox — that is how the
   * custom-cover opt-in works.
   */
  optional?: boolean;
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

/** A priced/stocked SKU (e.g. a page-count option), distinct from the cosmetic
    colors/sizes/variants jsonb above — a product should use one or the other
    for a given axis, never both. Up to two option axes (option1/option2). */
export interface ProductVariant {
  id: string;
  product_id: string;
  option1_name_fr: string | null;
  option1_name_ar: string | null;
  option1_value_fr: string | null;
  option1_value_ar: string | null;
  option2_name_fr: string | null;
  option2_name_ar: string | null;
  option2_value_fr: string | null;
  option2_value_ar: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
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
  product_variants?: ProductVariant[];
}

export interface CartVariantPick {
  name_fr: string;
  name_ar: string;
  value_fr: string;
  value_ar: string;
  /** free text the shopper typed for this pick (e.g. a name for the cover) */
  custom_text?: string | null;
  /** URL of a file the shopper uploaded for this pick (e.g. a custom cover) */
  custom_upload_url?: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  name_fr: string;
  name_ar: string;
  price: number;
  quantity: number;
  color: string | null;
  size: string | null;
  variants: CartVariantPick[];
  image_url: string | null;
  /** optional per-line note the shopper attached to this product */
  note: string | null;
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
  announcement_enabled: boolean;
  announcement_items: AnnouncementItem[];
  /** Seconds each message stays on screen before the next one rotates in. */
  announcement_speed: number;
  announcement_style: AnnouncementStyle;
}

export type AnnouncementStyle = "gradient" | "solid" | "soft";

export interface AnnouncementItem {
  text_fr: string;
  text_ar: string;
  emoji_start: string;
  emoji_end: string;
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

/* ---- promo panels ---- */
export type PanelSlot = "home_hero" | "home_mid" | "category_top" | "cart_drawer";

/** One downloadable freebie attached to a panel (migration 0029). */
export interface PanelFile {
  url: string;
  name_fr: string;
  name_ar: string;
  /** Content type as uploaded — drives the icon and the download filename. */
  mime: string | null;
  size_bytes: number | null;
}

export interface PromoPanel {
  id: string;
  slot: PanelSlot;
  active: boolean;
  title_fr: string | null;
  title_ar: string | null;
  subtitle_fr: string | null;
  subtitle_ar: string | null;
  image_url: string | null;
  link_url: string | null;
  /** Free downloads rendered as a strip under the banner. */
  files: PanelFile[];
  start_at: string | null;
  end_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/* ---- offers & promotions ---- */
export type PromotionType = "buy_x_get_y" | "buy_x_percent" | "category_percent" | "pack";
export type PromotionScope = "all" | "categories" | "products";

export interface PackItem {
  product_id: string;
  quantity: number;
}

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  active: boolean;
  /** Higher wins when two packs compete for the same cart quantity. */
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  scope: PromotionScope;
  category_ids: string[];
  product_ids: string[];
  buy_qty: number;
  get_qty: number;
  percent: number;
  pack_items: PackItem[];
  pack_price: number | null;
  label_fr: string | null;
  label_ar: string | null;
  created_at: string;
  updated_at: string;
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
