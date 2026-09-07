import { Home, Store } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/Field";
import { useDeliveryPrices } from "@/hooks/useDeliveryPrices";
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
            {...register("wilaya")}
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
          <Input
            id={`${idPrefix}-city`}
            autoComplete="address-level2"
            invalid={!!errors.city}
            {...register("city")}
          />
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

      <Field label={t("checkoutNotes")} htmlFor={`${idPrefix}-notes`}>
        <Textarea id={`${idPrefix}-notes`} rows={2} {...register("notes")} />
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
