/**
 * Tiny class-name joiner. This is a plain string join — NOT tailwind-merge.
 * Passing `w-20` into a component whose base classes include `w-full` does NOT
 * override it (last-in-markup does not win in CSS). Size the container instead.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
