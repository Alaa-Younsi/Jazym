import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { Price } from "@/components/ui/Price";
import { ProductThumb } from "@/components/product/ProductThumb";
import { useI18n } from "@/i18n/LanguageProvider";
import { variantSummary } from "@/lib/format";
import { lineDiscount, lineTotal } from "@/lib/offers";
import { useCart } from "@/store/cart";

export function CartDrawer() {
  const { t, lang } = useI18n();
  const { lines, isOpen, closeCart, removeLine, setQuantity } = useCart();

  const subtotal = lines.reduce(
    (sum, l) => sum + lineTotal(l.unitPrice, l.quantity, l.quantity_offers),
    0,
  );
  const discount = lines.reduce(
    (sum, l) => sum + lineDiscount(l.unitPrice, l.quantity, l.quantity_offers),
    0,
  );
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <Drawer open={isOpen} onClose={closeCart} side="end" title={t("cartTitle")}>
      {lines.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <FlowerMark className="h-10 w-10 text-brand/40" />
          <p className="text-sm text-muted">{t("cartEmpty")}</p>
          <Button variant="secondary" size="sm" onClick={closeCart}>
            <Link to="/boutique">{t("cartEmptyCta")}</Link>
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <p className="border-b border-line px-5 py-2.5 text-xs text-muted">
            {t("cartItemCount", { count })}
          </p>
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
            {lines.map((line) => {
              const summary = variantSummary(line.variants, lang);
              const total = lineTotal(line.unitPrice, line.quantity, line.quantity_offers);
              const saved = lineDiscount(line.unitPrice, line.quantity, line.quantity_offers);
              return (
                <li key={line.key} className="flex gap-3 py-4">
                  <ProductThumb
                    src={line.image_url}
                    name={lang === "ar" ? line.name_ar : line.name_fr}
                    className="h-20 w-16 shrink-0 rounded-lg"
                    sizes="64px"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      to={`/produit/${line.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-medium text-ink hover:text-brand"
                    >
                      {lang === "ar" ? line.name_ar : line.name_fr}
                    </Link>
                    {summary && <p className="text-xs text-muted">{summary}</p>}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-full border border-line">
                        <button
                          type="button"
                          aria-label="-"
                          onClick={() => setQuantity(line.key, line.quantity - 1)}
                          className="grid h-8 w-8 place-items-center text-muted hover:text-ink"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="num-ltr w-7 text-center text-sm">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label="+"
                          onClick={() => setQuantity(line.key, line.quantity + 1)}
                          disabled={line.quantity >= line.maxQuantity}
                          className="grid h-8 w-8 place-items-center text-muted hover:text-ink disabled:opacity-40"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="text-end">
                        <Price value={total} className="text-sm font-semibold text-ink" />
                        {saved > 0 && (
                          <div className="text-[0.7rem] text-success">
                            {t("productOfferApplied")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={t("cartRemove")}
                    onClick={() => removeLine(line.key)}
                    className="self-start text-muted transition hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-line px-5 py-4">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>{t("cartSubtotal")}</span>
              <Price value={subtotal} className="text-ink" />
            </div>
            {discount > 0 && (
              <div className="mt-1 flex items-center justify-between text-sm text-success">
                <span>{t("cartDiscount")}</span>
                <Price value={discount} prefix="-" />
              </div>
            )}
            <p className="mt-1 text-xs text-muted">{t("cartShippingNote")}</p>
            <ButtonLink to="/commander" fullWidth className="mt-4" onClick={closeCart}>
              {t("cartCheckout")}
            </ButtonLink>
            <button
              type="button"
              onClick={closeCart}
              className="mt-2 w-full text-center text-xs text-muted hover:text-ink"
            >
              {t("cartContinue")}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
