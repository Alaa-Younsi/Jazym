import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";

type RevealVariant = "up" | "blur" | "scale";

/**
 * Scroll-triggered entrance, once per element.
 *
 * `blur` adds a short defocus on the way in — the trick that makes a reveal
 * read as "developed" rather than "slid in", used on the section headings.
 * `scale` is for large media blocks.
 *
 * Under prefers-reduced-motion every variant collapses to a plain fade: the
 * element still announces itself, it just doesn't travel or defocus.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  variant = "up",
  duration = 0.6,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: RevealVariant;
  duration?: number;
}) {
  const reduced = usePrefersReducedMotion();

  const hidden = reduced
    ? { opacity: 0 }
    : variant === "blur"
      ? { opacity: 0, y: 14, filter: "blur(10px)" }
      : variant === "scale"
        ? { opacity: 0, scale: 0.96 }
        : { opacity: 0, y: 22 };

  const shown = reduced
    ? { opacity: 1 }
    : variant === "blur"
      ? { opacity: 1, y: 0, filter: "blur(0px)" }
      : variant === "scale"
        ? { opacity: 1, scale: 1 }
        : { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={shown}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
