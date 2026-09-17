import { motion } from "framer-motion";
import { usePrefersReducedMotion, useSaveData } from "@/hooks/useMediaFlags";
import { FlowerMark } from "@/components/ui/FlowerMark";

/**
 * Brand centrepiece for the hero — a layered "open notebook + drifting flax
 * flowers" composition drawn in SVG. Theme-aware via CSS tokens. Positional
 * transforms only (opacity stays at its CSS default of 1) so it can never get
 * stuck invisible under CPU pressure. See skill Phase 3.
 */
export function HeroArt() {
  const reduced = usePrefersReducedMotion();
  const saveData = useSaveData();
  const animate = !reduced && !saveData;

  // Fills whatever box HeroScene gives it — a short banner on phones, a square
  // on desktop. The SVG letterboxes itself via preserveAspectRatio.
  return (
    <div className="relative mx-auto h-full w-full max-w-md">
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgb(var(--c-brand-soft)) 0%, transparent 65%)",
        }}
      />

      <svg viewBox="0 0 400 400" className="relative h-full w-full" role="presentation">
        <defs>
          <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--c-panel))" />
            <stop offset="100%" stopColor="rgb(var(--c-panel-2))" />
          </linearGradient>
        </defs>

        {/* open notebook */}
        <g transform="rotate(-8 200 210)">
          <rect
            x="70"
            y="120"
            width="260"
            height="185"
            rx="10"
            fill="url(#paper)"
            stroke="rgb(var(--c-line))"
          />
          <line x1="200" y1="120" x2="200" y2="305" stroke="rgb(var(--c-line))" />
          {[150, 172, 194, 216, 238, 260, 282].map((y) => (
            <line
              key={`l${y}`}
              x1="90"
              y1={y}
              x2="185"
              y2={y}
              stroke="rgb(var(--c-brand) / 0.35)"
              strokeWidth="2"
            />
          ))}
          {[150, 172, 194, 216, 238].map((y) => (
            <line
              key={`r${y}`}
              x1="215"
              y1={y}
              x2="310"
              y2={y}
              stroke="rgb(var(--c-line))"
              strokeWidth="2"
            />
          ))}
          <path
            d="M70 130 q130 -30 260 0"
            fill="none"
            stroke="rgb(var(--c-gold) / 0.7)"
            strokeWidth="3"
          />
        </g>

        {/* pen */}
        <g transform="rotate(32 300 250)">
          <rect x="292" y="150" width="14" height="150" rx="7" fill="rgb(var(--c-ink))" />
          <path d="M292 300 l7 22 l7 -22 Z" fill="rgb(var(--c-gold))" />
          <rect x="292" y="150" width="14" height="26" rx="7" fill="rgb(var(--c-brand))" />
        </g>
      </svg>

      {[
        { top: "6%", left: "12%", size: 44, delay: 0 },
        { top: "18%", right: "6%", size: 30, delay: 0.6 },
        { bottom: "10%", left: "4%", size: 34, delay: 1.1 },
        { bottom: "20%", right: "14%", size: 22, delay: 1.6 },
      ].map((f, i) => (
        <motion.div
          key={i}
          className="absolute text-brand"
          style={{
            top: f.top,
            left: f.left,
            right: f.right,
            bottom: f.bottom,
            width: f.size,
            height: f.size,
          }}
          animate={animate ? { y: [0, -12, 0], rotate: [0, 8, 0] } : undefined}
          transition={{
            duration: 7,
            repeat: Number.POSITIVE_INFINITY,
            delay: f.delay,
            ease: "easeInOut",
          }}
        >
          <FlowerMark className="h-full w-full" />
        </motion.div>
      ))}
    </div>
  );
}
