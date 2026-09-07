import { z } from "zod";
import { DZ_PHONE_RE } from "./utils";

/** Mirrors the server-side validation in `place_order` (skill Phase 5, step 0).
    Keep both in step. */
export const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, "valName").max(80, "valName"),
  customer_phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ""))
    .pipe(z.string().regex(DZ_PHONE_RE, "valPhone")),
  wilaya: z.string().min(1, "valWilaya"),
  city: z.string().trim().min(1, "valCity").max(80, "valCity"),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  delivery_type: z.enum(["home", "office"]),
  /** honeypot — must stay empty */
  company: z.string().max(0).optional().or(z.literal("")),
});

export type CheckoutFormValues = z.input<typeof checkoutSchema>;
export type CheckoutParsed = z.output<typeof checkoutSchema>;
