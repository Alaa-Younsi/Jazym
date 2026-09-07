import { cn } from "@/lib/cn";
import { FlowerMark } from "./FlowerMark";

interface WordmarkProps {
  className?: string;
  /** stacked = flower above, wordmark below (used in admin sidebar) */
  stacked?: boolean;
}

/**
 * Text wordmark echoing the logo: "Jaz" · flower · "ym" set in the display
 * serif (the logo replaces the apostrophe of "Jaz'ym" with the flower). Not the
 * raster logo — that's `public/logo.webp`, used for OG / print.
 */
export function Wordmark({ className, stacked }: WordmarkProps) {
  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex items-baseline gap-[0.1em] font-display text-[1.7rem] font-semibold tracking-tight text-ink",
        stacked && "flex-col items-center gap-1.5 text-3xl",
        className,
      )}
    >
      <span>Jaz</span>
      <FlowerMark className="h-[0.7em] w-[0.7em] translate-y-[-0.05em] text-brand" />
      <span>ym</span>
    </span>
  );
}
