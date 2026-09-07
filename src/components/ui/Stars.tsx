import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

interface StarsProps {
  value: number;
  size?: number;
  className?: string;
}

export function Stars({ value, size = 16, className }: StarsProps) {
  const full = Math.round(Math.max(0, Math.min(5, value)));
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-gold", className)}
      aria-label={`${full}/5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          width={size}
          height={size}
          fill={i < full ? "currentColor" : "none"}
          className={i < full ? "" : "text-line"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}
