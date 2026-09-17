import { motion } from "framer-motion";
import { Fragment } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";

/**
 * Editorial headline reveal: every word sits in its own clipping box and rises
 * out from behind its baseline, one after the next — the masked type reveal,
 * rather than a plain fade.
 *
 * Under prefers-reduced-motion the mask is dropped and the words simply fade
 * in (opacity isn't the vestibular motion that setting targets), so the
 * headline still reads as deliberate instead of snapping in.
 */
export function StaggerText({
  text,
  className,
  wordClassName,
  delay = 0.1,
  stagger = 0.055,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  /** seconds before the first word moves */
  delay?: number;
  /** seconds between consecutive words */
  stagger?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const words = text.split(" ");

  if (reduced) {
    return (
      <span className={className}>
        {words.map((w, i) => (
          <Fragment key={`${i}-${w}`}>
            <motion.span
              className={cn("inline-block", wordClassName)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: delay + i * stagger }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    );
  }

  return (
    <span className={className}>
      {words.map((w, i) => (
        <Fragment key={`${i}-${w}`}>
          {/* The clip box is inline-block, which makes it ATOMIC: a line can
              only break between two of them if there is real whitespace
              between them in the markup. Hence the {" "} text node below —
              folding the space inside the span instead leaves the headline
              one unbreakable line that runs off the side of a phone. */}
          <span className="fx-line-clip inline-block align-bottom">
            <motion.span
              className={cn("inline-block", wordClassName)}
              initial={{ y: "108%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{
                duration: 0.75,
                delay: delay + i * stagger,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
