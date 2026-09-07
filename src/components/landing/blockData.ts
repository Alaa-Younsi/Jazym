import type { Lang } from "@/i18n/translations";

/** Safe getters over a landing block's untyped `data` object. */
export function str(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  return typeof v === "string" ? v : "";
}

export function localized(data: Record<string, unknown>, base: string, lang: Lang): string {
  return str(data, `${base}_${lang}`) || str(data, `${base}_fr`);
}

export function list(data: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const v = data[key];
  return Array.isArray(v)
    ? (v.filter((x) => x && typeof x === "object") as Record<string, unknown>[])
    : [];
}

export function num(data: Record<string, unknown>, key: string): number | null {
  const v = data[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
}
