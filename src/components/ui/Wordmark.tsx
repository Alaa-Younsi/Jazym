import { cn } from "@/lib/cn";

interface WordmarkProps {
  className?: string;
  /** stacked = larger, centred (used in the admin sidebar / login card) */
  stacked?: boolean;
  /** render at high priority — use on the header, which is above the fold */
  eager?: boolean;
}

/**
 * The official Jazym logo (`public/jazym-logo.png`, optimised into
 * `jazym-logo.webp` by `scripts/optimize-logo.mjs` — 659 KB → 15 KB).
 *
 * Two files, not a CSS filter: the wordmark is black calligraphy but the flower
 * is brand blue + gold, so `invert()` would turn the flower orange. The dark
 * variant re-lights only the near-greyscale lettering. Which one shows is
 * decided by CSS on `html[data-theme]` (see `.fx-logo-*` in index.css) so the
 * swap happens pre-paint, with no theme flash and no JS.
 */
export function Wordmark({ className, stacked, eager }: WordmarkProps) {
  const size = stacked ? "h-14" : "h-10 sm:h-11";
  const common = cn("w-auto object-contain", size, className);
  return (
    <>
      <img
        src="/jazym-logo.webp"
        alt="Jazym"
        width={320}
        height={207}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        className={cn("fx-logo-light", common)}
      />
      <img
        src="/jazym-logo-dark.webp"
        alt="Jazym"
        width={320}
        height={207}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        className={cn("fx-logo-dark", common)}
        aria-hidden
      />
    </>
  );
}
