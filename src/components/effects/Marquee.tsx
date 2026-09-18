import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";

/**
 * Edge-to-edge scrolling band. The content is repeated enough times to always
 * over-fill the container — with too few copies (e.g. a short category list
 * on a wide screen) the two-copy trick leaves a trailing gap of empty space
 * before the loop restarts, so the copy count is measured against the
 * container and unit widths and kept in sync via ResizeObserver. Each cycle
 * still translates by exactly one unit's width, so playback speed doesn't
 * change as the copy count does. CSS-driven, so it costs one compositor
 * animation rather than a per-frame JS callback — and it pauses on hover.
 * RTL reverses direction.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);
  const [reps, setReps] = useState(2);

  useLayoutEffect(() => {
    if (reduced) return;
    const container = containerRef.current;
    const unit = unitRef.current;
    if (!container || !unit) return;

    const recompute = () => {
      const containerWidth = container.offsetWidth;
      const unitWidth = unit.offsetWidth;
      if (unitWidth <= 0) return;
      const needed = Math.max(2, Math.ceil(containerWidth / unitWidth) + 1);
      setReps((prev) => (prev === needed ? prev : needed));
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(container);
    observer.observe(unit);
    return () => observer.disconnect();
  }, [reduced, children]);

  if (reduced) {
    return (
      <div className={cn("flex justify-center overflow-hidden", className)}>
        <div className={cn("flex shrink-0 items-center", itemClassName)}>{children}</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("fx-marquee overflow-hidden", className)}>
      <div
        className="fx-marquee-track"
        style={
          {
            "--marquee-duration": `${speed}s`,
            "--marquee-shift": `${-100 / reps}%`,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: reps }, (_, i) => (
          <div
            key={i}
            ref={i === 0 ? unitRef : undefined}
            className={cn("flex shrink-0 items-center", itemClassName)}
            aria-hidden={i > 0 || undefined}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
