import type {
  CartVariantPick,
  Order,
  OrderItem,
  Product,
  ProductVariant,
  VariantGroup,
  VariantOption,
} from "@/types/db";

/* Read-side normalisers. A DB missing a later migration returns rows without a
   jsonb column; every consumer can then trust arrays are present. Also lifts the
   legacy `variants: string[]` option shape into objects. See skill Phases 5/8. */

function toOptions(raw: unknown): VariantOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v): VariantOption | null => {
      // Legacy `variants: string[]` shape. Same field set as the object branch
      // below, so both paths hand consumers an identical object — never a mix
      // of `false` and `undefined` for the same flag.
      if (typeof v === "string") {
        return {
          value_fr: v,
          value_ar: v,
          image_url: null,
          swatch_hex: null,
          requires_text: false,
          requires_upload: false,
        };
      }
      if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        const value_fr = typeof o.value_fr === "string" ? o.value_fr : "";
        const value_ar = typeof o.value_ar === "string" ? o.value_ar : value_fr;
        if (!value_fr && !value_ar) return null;
        return {
          value_fr: value_fr || value_ar,
          value_ar: value_ar || value_fr,
          image_url: typeof o.image_url === "string" ? o.image_url : null,
          // Every field below is OPTIONAL on VariantOption, so omitting one
          // here compiles cleanly and fails silently at runtime. Keep this
          // mapper in step with the interface in types/db.ts.
          swatch_hex: typeof o.swatch_hex === "string" ? o.swatch_hex : null,
          requires_text: o.requires_text === true,
          requires_upload: o.requires_upload === true,
        };
      }
      return null;
    })
    .filter((v): v is VariantOption => v !== null);
}

function toVariantGroups(raw: unknown): VariantGroup[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((g): VariantGroup | null => {
      if (!g || typeof g !== "object") return null;
      const o = g as Record<string, unknown>;
      const name_fr = typeof o.name_fr === "string" ? o.name_fr : "";
      const name_ar = typeof o.name_ar === "string" ? o.name_ar : name_fr;
      const values = toOptions(o.values);
      if (!name_fr || values.length === 0) return null;
      return {
        name_fr,
        name_ar: name_ar || name_fr,
        values,
        // Same trap as in toOptions — optional, so dropping it type-checks.
        before_price_variant: o.before_price_variant === true,
      };
    })
    .filter((g): g is VariantGroup => g !== null);
}

function toStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === "string");
}

function normalizeProductVariant(row: Record<string, unknown>): ProductVariant {
  return {
    id: String(row.id ?? ""),
    product_id: String(row.product_id ?? ""),
    option1_name_fr: (row.option1_name_fr as string | null) ?? null,
    option1_name_ar: (row.option1_name_ar as string | null) ?? null,
    option1_value_fr: (row.option1_value_fr as string | null) ?? null,
    option1_value_ar: (row.option1_value_ar as string | null) ?? null,
    option2_name_fr: (row.option2_name_fr as string | null) ?? null,
    option2_name_ar: (row.option2_name_ar as string | null) ?? null,
    option2_value_fr: (row.option2_value_fr as string | null) ?? null,
    option2_value_ar: (row.option2_value_ar as string | null) ?? null,
    price: Number(row.price ?? 0),
    compare_at_price: row.compare_at_price == null ? null : Number(row.compare_at_price),
    stock: Number(row.stock ?? 0),
    sku: (row.sku as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? row.created_at ?? ""),
  };
}

export function normalizeProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    name_fr: String(row.name_fr ?? ""),
    name_ar: String(row.name_ar ?? row.name_fr ?? ""),
    description_fr: (row.description_fr as string | null) ?? null,
    description_ar: (row.description_ar as string | null) ?? null,
    details_fr: toStringArray(row.details_fr),
    details_ar: toStringArray(row.details_ar),
    price: Number(row.price ?? 0),
    compare_at_price: row.compare_at_price == null ? null : Number(row.compare_at_price),
    category_id: (row.category_id as string | null) ?? null,
    stock: Number(row.stock ?? 0),
    style_code: (row.style_code as string | null) ?? null,
    colors: Array.isArray(row.colors) ? (row.colors as Product["colors"]) : [],
    sizes: Array.isArray(row.sizes) ? (row.sizes as Product["sizes"]) : [],
    variants: toVariantGroups(row.variants),
    quantity_offers: Array.isArray(row.quantity_offers)
      ? (row.quantity_offers as Product["quantity_offers"])
      : [],
    video_url: (row.video_url as string | null) ?? null,
    featured: Boolean(row.featured),
    status: row.status === "draft" ? "draft" : "active",
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? row.created_at ?? ""),
    category: (row.category as Product["category"]) ?? null,
    product_images: Array.isArray(row.product_images)
      ? [
          ...(row.product_images as Product["product_images"] as NonNullable<
            Product["product_images"]
          >),
        ].sort((a, b) => a.sort_order - b.sort_order)
      : [],
    product_variants: Array.isArray(row.product_variants)
      ? (row.product_variants as Record<string, unknown>[])
          .map(normalizeProductVariant)
          .sort((a, b) => a.sort_order - b.sort_order)
      : [],
  };
}

export function normalizeOrderItem(row: Record<string, unknown>): OrderItem {
  const picks = Array.isArray(row.variants) ? (row.variants as CartVariantPick[]) : [];
  return {
    id: String(row.id ?? ""),
    order_id: String(row.order_id ?? ""),
    product_id: (row.product_id as string | null) ?? null,
    variant_id: (row.variant_id as string | null) ?? null,
    name_fr: String(row.name_fr ?? ""),
    name_ar: String(row.name_ar ?? row.name_fr ?? ""),
    price: Number(row.price ?? 0),
    quantity: Number(row.quantity ?? 1),
    color: (row.color as string | null) ?? null,
    size: (row.size as string | null) ?? null,
    variants: picks,
    image_url: (row.image_url as string | null) ?? null,
    note: (row.note as string | null) ?? null,
  };
}

export function normalizeOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id ?? ""),
    order_number: String(row.order_number ?? ""),
    customer_name: String(row.customer_name ?? ""),
    customer_phone: String(row.customer_phone ?? ""),
    wilaya: String(row.wilaya ?? ""),
    city: String(row.city ?? ""),
    address: (row.address as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    subtotal: Number(row.subtotal ?? 0),
    shipping: Number(row.shipping ?? 0),
    discount: Number(row.discount ?? 0),
    total: Number(row.total ?? 0),
    status: (row.status as Order["status"]) ?? "pending",
    language: String(row.language ?? "fr"),
    delivery_type: row.delivery_type === "office" ? "office" : "home",
    created_at: String(row.created_at ?? ""),
    order_items: Array.isArray(row.order_items)
      ? (row.order_items as Record<string, unknown>[]).map(normalizeOrderItem)
      : [],
  };
}
