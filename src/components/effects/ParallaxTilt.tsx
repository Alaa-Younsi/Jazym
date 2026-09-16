import { motion, useMotionValue, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { useIsDesktop, usePrefersReducedMotion } from "@/hooks/useMediaFlags";

/** Subtle mouse-driven tilt, desktop only, off under reduced motion. */
export function ParallaxTilt({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop();
  const reduced = usePrefersReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [7, -7]);
  const rotateY = useTransform(x, [-60, 60], [-7, 7]);

  if (!isDesktop || reduced) return <>{children}</>;

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
