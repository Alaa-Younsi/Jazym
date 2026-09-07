import { cn } from "@/lib/cn";

interface FlowerMarkProps {
  className?: string;
  /** decorative title for a11y; omit to keep aria-hidden */
  title?: string;
}

/**
 * The Jazym flax / cornflower flower — five rounded petals, a gold centre.
 * Lifted from the brand logo. Used as the favicon seed, the section-rule dot,
 * loaders, and hover motifs.
 */
export function FlowerMark({ className, title }: FlowerMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-6 w-6", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <g fill="currentColor">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="24"
            cy="12.5"
            rx="6.2"
            ry="9"
            transform={`rotate(${deg} 24 24)`}
            opacity="0.92"
          />
        ))}
      </g>
      <circle cx="24" cy="24" r="4.4" className="fill-gold" />
      <circle cx="24" cy="24" r="1.7" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
