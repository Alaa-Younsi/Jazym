import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import { useIsDesktop, usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";

/**
 * Pointer-magnetised wrapper — the element leans a few pixels toward the cursor
 * while it is nearby and springs back on leave. Desktop + fine-pointer only
 * (it has no meaning on touch) and off entirely under reduced motion, in both
 * cases rendering the child untouched.
 */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  /** 0–1: how far the element follows the pointer across its own half-width */
  strength?: number;
  className?: string;
}) {
  const isDesktop = useIsDesktop();
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  if (!isDesktop || reduced) {
    return <span className={cn("inline-flex", className)}>{children}</span>;
  }

  return (
    <motion.span
      ref={ref}
      className={cn("inline-flex", className)}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
