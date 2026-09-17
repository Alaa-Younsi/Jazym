import type { AnnouncementItem, AnnouncementStyle, StoreSettings } from "@/types/db";

export const MAX_ANNOUNCEMENT_ITEMS = 8;
export const ANNOUNCEMENT_STYLES: AnnouncementStyle[] = ["gradient", "solid", "soft"];

export const EMPTY_ANNOUNCEMENT_ITEM: AnnouncementItem = {
  text_fr: "",
  text_ar: "",
  emoji_start: "",
  emoji_end: "",
};

/** Quick-pick palette for the admin editor — free text is always allowed too. */
export const EMOJI_SUGGESTIONS = [
  "🚚",
  "📦",
  "🎁",
  "🔥",
  "✨",
  "🌼",
  "💛",
  "⭐",
  "🎉",
  "📚",
  "✏️",
  "📝",
  "🧠",
  "💡",
  "🏷️",
  "💸",
  "⏰",
  "🇩🇿",
  "✅",
  "🛍️",
];

function toItem(raw: unknown): AnnouncementItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const text_fr = typeof o.text_fr === "string" ? o.text_fr.trim() : "";
  const text_ar = typeof o.text_ar === "string" ? o.text_ar.trim() : "";
  if (!text_fr && !text_ar) return null;
  return {
    text_fr: text_fr || text_ar,
    text_ar: text_ar || text_fr,
    emoji_start: typeof o.emoji_start === "string" ? o.emoji_start.slice(0, 8) : "",
    emoji_end: typeof o.emoji_end === "string" ? o.emoji_end.slice(0, 8) : "",
  };
}

/**
 * The list the header actually renders. Falls back to the legacy single
 * announcement_fr/ar pair so a database that has not run migration 0018 keeps
 * showing its bar instead of going blank.
 */
export function announcementItems(settings: StoreSettings | undefined): AnnouncementItem[] {
  if (!settings) return [];
  const items = Array.isArray(settings.announcement_items)
    ? settings.announcement_items.map(toItem).filter((i): i is AnnouncementItem => i !== null)
    : [];
  if (items.length > 0) return items.slice(0, MAX_ANNOUNCEMENT_ITEMS);

  const fr = settings.announcement_fr?.trim() ?? "";
  const ar = settings.announcement_ar?.trim() ?? "";
  if (!fr && !ar) return [];
  return [{ text_fr: fr || ar, text_ar: ar || fr, emoji_start: "🚚", emoji_end: "🌼" }];
}

export function isAnnouncementEnabled(settings: StoreSettings | undefined): boolean {
  // `undefined` (pre-0018 row) must read as ON — the bar existed before the flag did.
  return settings?.announcement_enabled !== false;
}

export function announcementStyle(settings: StoreSettings | undefined): AnnouncementStyle {
  const style = settings?.announcement_style;
  return ANNOUNCEMENT_STYLES.includes(style as AnnouncementStyle)
    ? (style as AnnouncementStyle)
    : "gradient";
}

export function announcementSpeed(settings: StoreSettings | undefined): number {
  const speed = Number(settings?.announcement_speed ?? 6);
  return Number.isFinite(speed) ? Math.min(60, Math.max(2, speed)) : 6;
}
