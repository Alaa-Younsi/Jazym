import { Home, Store } from "lucide-react";
import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Field, Input, NativeSelect } from "@/components/ui/Field";
import { useCommunes } from "@/hooks/useCommunes";
import { useDeliveryPrices } from "@/hooks/useDeliveryPrices";
import { wilayaCode } from "@/lib/wilayas";
import { useI18n } from "@/i18n/LanguageProvider";
import type { CheckoutFormValues } from "@/lib/checkoutSchema";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/cn";

interface CheckoutFieldsProps {
  form: UseFormReturn<CheckoutFormValues>;
  idPrefix?: string;
}

export function CheckoutFields({ form, idPrefix = "co" }: CheckoutFieldsProps) {
  const { t, lang } = useI18n();
  const { data: deliveryPrices = [] } = useDeliveryPrices(true);
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const deliveryType = watch("delivery_type");
  const wilaya = watch("wilaya");
  const { data: communes } = useCommunes();

  // null → free-text commune: the table is still loading, or the admin priced
  // a wilaya name that is not one of the 69. Delivery is priced by wilaya +
  // home/office only — the commune never changes the total.
  const wilayaCommunes = useMemo(() => {
    if (!communes) return null;
    if (!wilaya) return [];
    const code = wilayaCode(wilaya);
    if (code === null) return null;
    const list = communes[code] ?? [];
    return lang === "ar" ? [...list].sort((a, b) => a[1].localeCompare(b[1], "ar")) : list;
  }, [communes, wilaya, lang]);

  const err = (k: keyof CheckoutFormValues) =>
    errors[k]?.message ? t(errors[k]?.message as TranslationKey) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <Field
        label={t("checkoutName")}
        htmlFor={`${idPrefix}-name`}
        required
        error={err("customer_name")}
      >
        <Input
          id={`${idPrefix}-name`}
          autoComplete="name"
          invalid={!!errors.customer_name}
          {...register("customer_name")}
        />
      </Field>

      <Field
        label={t("checkoutPhone")}
        htmlFor={`${idPrefix}-phone`}
        required
        hint={t("checkoutPhoneHint")}
        error={err("customer_phone")}
      >
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          inputMode="tel"
          dir="ltr"
          autoComplete="tel"
          placeholder="0555 12 34 56"
          invalid={!!errors.customer_phone}
          {...register("customer_phone")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("checkoutWilaya")}
          htmlFor={`${idPrefix}-wilaya`}
          required
          error={err("wilaya")}
        >
          <NativeSelect
            id={`${idPrefix}-wilaya`}
            invalid={!!errors.wilaya}
            defaultValue=""
            {...register("wilaya", {
              // A commune picked for the previous wilaya is never valid here.
              onChange: () => setValue("city", ""),
            })}
          >
            <option value="" disabled>
              {t("checkoutWilayaPlaceholder")}
            </option>
            {deliveryPrices.map((d) => (
              <option key={d.id} value={d.wilaya}>
                {d.wilaya}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label={t("checkoutCity")} htmlFor={`${idPrefix}-city`} required error={err("city")}>
          {wilayaCommunes === null ? (
            <Input
              id={`${idPrefix}-city`}
              autoComplete="address-level2"
              invalid={!!errors.city}
              {...register("city")}
            />
          ) : (
            // Remounted per wilaya so the DOM value follows the reset to "".
            <NativeSelect
              key={wilayaCode(wilaya ?? "") ?? "none"}
              id={`${idPrefix}-city`}
              autoComplete="address-level2"
              invalid={!!errors.city}
              disabled={!wilaya}
              defaultValue=""
              {...register("city")}
            >
              <option value="" disabled>
                {wilaya ? t("checkoutCityPlaceholder") : t("checkoutCityPickWilaya")}
              </option>
              {wilayaCommunes.map(([fr, ar]) => (
                // The French name is stored either way — it is what the admin
                // reads and what DHD matches against.
                <option key={fr} value={fr}>
                  {lang === "ar" ? ar : fr}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink">{t("checkoutDelivery")}</span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "home", label: t("checkoutDeliveryHome"), Icon: Home },
              { value: "office", label: t("checkoutDeliveryOffice"), Icon: Store },
            ] as const
          ).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue("delivery_type", value, { shouldValidate: true })}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition",
                deliveryType === value
                  ? "border-brand bg-brand-soft/60 font-medium text-brand"
                  : "border-line text-muted hover:border-brand/50",
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <Field label={t("checkoutAddress")} htmlFor={`${idPrefix}-address`}>
        <Input id={`${idPrefix}-address`} autoComplete="street-address" {...register("address")} />
      </Field>

      {/* honeypot — visually hidden, never announced */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor={`${idPrefix}-company`}>{lang === "ar" ? "الشركة" : "Société"}</label>
        <input
          id={`${idPrefix}-company`}
          tabIndex={-1}
          autoComplete="off"
          {...register("company")}
        />
      </div>
    </div>
  );
}
