/** Shared `<input type="datetime-local">` ⇄ ISO helpers (panels, promotions). */

export function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Where a scheduled row sits relative to now — drives the list badges. */
export type ScheduleState = "live" | "scheduled" | "expired" | "off";

export function scheduleState(
  active: boolean,
  startAt: string | null,
  endAt: string | null,
  now: number = Date.now(),
): ScheduleState {
  if (!active) return "off";
  if (startAt && Date.parse(startAt) > now) return "scheduled";
  if (endAt && Date.parse(endAt) < now) return "expired";
  return "live";
}
