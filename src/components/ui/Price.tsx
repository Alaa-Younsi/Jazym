import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

interface PriceProps {
  value: number;
  /** e.g. "-" on a discount line */
  prefix?: string;
  className?: string;
}

/**
 * The ONLY way a price is rendered in JSX. dir="ltr" defends against the
 * Unicode bidi reordering that turns "4 500 DA" into "DA 500 4" inside an RTL
 * layout. Never call formatPrice() directly in JSX. See skill Phase 4.
 */
export function Price({ value, prefix, className }: PriceProps) {
  return (
    <span dir="ltr" className={cn("num-ltr whitespace-nowrap", className)}>
      {prefix}
      {formatPrice(value)}
    </span>
  );
}
