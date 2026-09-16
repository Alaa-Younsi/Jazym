import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";

/** Reveals a headline word-by-word on mount. Under prefers-reduced-motion it
    still fades each word in (opacity is not the motion that setting targets)
    but skips the vertical travel. */
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

  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={`${i}-${w}`}
          className={cn("inline-block", wordClassName)}
          initial={{ opacity: 0, y: reduced ? 0 : 14 }}
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
