import type { SheetData } from "write-excel-file";
import type { Order } from "@/types/db";
import { formatDateTime } from "./format";

/** Prefix a `'` when a cell starts with =+-@ / tab / CR — Excel/Sheets then
    render it as literal text (CSV/Excel formula-injection guard). Skill Phase 8. */
export function excelSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

const HEADERS = [
  "N° commande",
  "Client",
  "Téléphone",
  "Wilaya",
  "Commune",
  "Adresse",
  "Statut",
  "Livraison",
  "Sous-total",
  "Livraison (frais)",
  "Remise",
  "Total",
  "Note",
  "Date",
];

export async function exportOrdersToXlsx(orders: Order[]): Promise<void> {
  const data: SheetData = [
    HEADERS.map((h) => ({ value: h, type: String, fontWeight: "bold" as const })),
    ...orders.map((o) => [
      { value: excelSafe(o.order_number), type: String },
      { value: excelSafe(o.customer_name), type: String },
      { value: excelSafe(o.customer_phone), type: String },
      { value: excelSafe(o.wilaya), type: String },
      { value: excelSafe(o.city), type: String },
      { value: excelSafe(o.address ?? ""), type: String },
      { value: o.status, type: String },
      { value: o.delivery_type === "office" ? "Bureau" : "Domicile", type: String },
      { value: Math.round(o.subtotal), type: Number },
      { value: Math.round(o.shipping), type: Number },
      { value: Math.round(o.discount), type: Number },
      { value: Math.round(o.total), type: Number },
      { value: excelSafe(o.notes ?? ""), type: String },
      { value: formatDateTime(o.created_at, "fr"), type: String },
    ]),
  ];

  // Code-split: the xlsx writer (~130 KB) loads only when an export is run.
  // v2's main export IS the browser build (`./node` is the Node one).
  const { default: writeXlsxFile } = await import("write-excel-file");
  await writeXlsxFile(data, {
    fileName: `commandes-${new Date().toISOString().slice(0, 10)}.xlsx`,
  });
}
