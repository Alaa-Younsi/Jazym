import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";

/** Reveals a headline word-by-word on mount. Falls back to plain static text
    under prefers-reduced-motion. */
export function StaggerText({
  text,
  className,
  wordClassName,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const words = text.split(" ");

  if (reduced) return <span className={className}>{text}</span>;

  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={`${i}-${w}`}
          className={cn("inline-block", wordClassName)}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 + i * 0.045, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}
