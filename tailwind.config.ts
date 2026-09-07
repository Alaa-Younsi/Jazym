import type { Config } from "tailwindcss";

/**
 * Colour tokens are RGB triplets in `src/index.css` (`--c-*`), mapped here so
 * every component uses plain Tailwind classes (`bg-panel`, `text-ink`,
 * `border-line`) and themes automatically via the `data-theme` attribute.
 * Do NOT use Tailwind's `dark:` strategy — see skill Phase 3.
 */
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        panel: token("panel"),
        "panel-2": token("panel-2"),
        line: token("line"),
        ink: token("ink"),
        muted: token("muted"),
        brand: token("brand"),
        "brand-soft": token("brand-soft"),
        violet: token("violet"),
        gold: token("gold"),
        success: token("success"),
        danger: token("danger"),
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        arabic: ["Tajawal", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(20 19 26 / 0.04), 0 12px 32px -12px rgb(20 19 26 / 0.12)",
        lift: "0 2px 4px rgb(20 19 26 / 0.06), 0 24px 48px -16px rgb(91 111 199 / 0.28)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "petal-drift": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(6deg)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "petal-drift": "petal-drift 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
