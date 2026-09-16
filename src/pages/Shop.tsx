import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PanelSlot } from "@/components/panels/PanelSlot";
import { ProductCard } from "@/components/product/ProductCard";
import { Container, SectionHeading } from "@/components/ui/Container";
import { NativeSelect } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import { useCategories } from "@/hooks/useCategories";
import { useProducts, type ProductSort } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { childrenOf, pathTo } from "@/lib/categoryTree";
import { pick } from "@/lib/utils";
import { cn } from "@/lib/cn";

export default function Shop() {
  const { t, lang } = useI18n();
  const { categorySlug } = useParams();
  const [params, setParams] = useSearchParams();

  const search = params.get("q") ?? "";
  const sort = (params.get("sort") as ProductSort | null) ?? "new";

  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts({
    categorySlug: categorySlug ?? null,
    search,
    sort,
  });

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug) ?? null,
    [categories, categorySlug],
  );

  const ancestors = useMemo(
    () => pathTo(categories, activeCategory?.id ?? null),
    [categories, activeCategory],
  );
  const subcategories = useMemo(
    () => childrenOf(categories, activeCategory?.id ?? null),
    [categories, activeCategory],
  );
  const siblingParentId = activeCategory ? activeCategory.parent_id : null;
  const siblings = useMemo(
    () => childrenOf(categories, siblingParentId),
    [categories, siblingParentId],
  );

  const title = activeCategory ? pick(lang, activeCategory, "name") : t("shopTitle");
  const subtitle = activeCategory
    ? pick(lang, activeCategory, "description")
    : t("categoriesSubtitle");

  useSeo({
    title,
    description: subtitle || t("brandTaglineLong"),
  });

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const hasFilters = !!search || sort !== "new";

  return (
    <Container className="py-12">
      {ancestors.length > 0 && (
        <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Link to="/boutique" className="hover:text-brand">
            {t("navShop")}
          </Link>
          {ancestors.map((a, i) => (
            <span key={a.id} className="flex items-center gap-1.5">
              <ChevronRight size={12} className="rtl:rotate-180" />
              {i === ancestors.length - 1 ? (
                <span className="text-ink">{pick(lang, a, "name")}</span>
              ) : (
                <Link to={`/boutique/${a.slug}`} className="hover:text-brand">
                  {pick(lang, a, "name")}
                </Link>
              )}
            </span>
          ))}
        </nav>
      )}

      <SectionHeading
        align="start"
        kicker={t("navShop")}
        title={title}
        subtitle={subtitle || undefined}
      />

      <div className="mt-6">
        <PanelSlot slot="category_top" />
      </div>

      {/* subcategories at this level */}
      {subcategories.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {subcategories.map((c) => (
            <Link
              key={c.id}
              to={`/boutique/${c.slug}`}
              className="group flex flex-col items-center gap-2 rounded-card border border-line bg-panel p-4 text-center transition hover:border-brand"
            >
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-panel-2">
                {c.image_url && (
                  <img
                    src={c.image_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <span className="text-sm font-medium text-ink group-hover:text-brand">
                {pick(lang, c, "name")}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* sibling chips — quick switch between leaf categories at this level */}
      {subcategories.length === 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <CategoryChip to="/boutique" active={!categorySlug}>
            {t("all")}
          </CategoryChip>
          {siblings.map((c) => (
            <CategoryChip key={c.id} to={`/boutique/${c.slug}`} active={categorySlug === c.slug}>
              {pick(lang, c, "name")}
            </CategoryChip>
          ))}
        </div>
      )}

      {/* toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
        <p className="text-sm text-muted">{t("shopResultCount", { count: products.length })}</p>
        <div className="flex items-center gap-2">
          {search && (
            <button
              type="button"
              onClick={() => updateParam("q", "")}
              className="inline-flex items-center gap-1 rounded-full bg-panel-2 px-3 py-1 text-xs text-ink"
            >
              “{search}”
              <X size={12} />
            </button>
          )}
          <SlidersHorizontal size={15} className="text-muted" />
          <NativeSelect
            aria-label={t("shopSort")}
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value === "new" ? "" : e.target.value)}
            className="h-9 w-auto py-0 text-xs"
          >
            <option value="new">{t("shopSortNew")}</option>
            <option value="price-asc">{t("shopSortPriceAsc")}</option>
            <option value="price-desc">{t("shopSortPriceDesc")}</option>
          </NativeSelect>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-sm text-muted">{t("shopEmpty")}</p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
              className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink hover:border-brand hover:text-brand"
            >
              {t("shopClearFilters")}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} eager={i < 4} />
          ))}
        </div>
      )}
    </Container>
  );
}

function CategoryChip({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition",
        active
          ? "border-brand bg-brand text-white"
          : "border-line text-ink hover:border-brand hover:text-brand",
      )}
    >
      {children}
    </Link>
  );
}
