import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";

/**
 * Edge-to-edge scrolling band. The children are rendered twice so the loop is
 * seamless (the track translates exactly -50%); the duplicate is hidden from
 * assistive tech. CSS-driven, so it costs one compositor animation rather than
 * a per-frame JS callback — and it pauses on hover. RTL reverses direction.
 *
 * Under prefers-reduced-motion it degrades to a static, centred row.
 */
export function Marquee({
  children,
  speed = 38,
  className,
  itemClassName,
}: {
  children: ReactNode;
  /** seconds for one full loop — larger is slower */
  speed?: number;
  className?: string;
  itemClassName?: string;
}) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <div className={cn("flex justify-center overflow-hidden", className)}>
        <div className={cn("flex shrink-0 items-center", itemClassName)}>{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("fx-marquee overflow-hidden", className)}>
      <div
        className="fx-marquee-track"
        style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
      >
        <div className={cn("flex shrink-0 items-center", itemClassName)}>{children}</div>
        <div className={cn("flex shrink-0 items-center", itemClassName)} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
