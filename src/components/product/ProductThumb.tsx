import { useState } from "react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/cn";
import { ProductPlaceholder } from "./ProductPlaceholder";

/** Frame used until the photo has loaded and reported its own proportions
    (and for the placeholder). */
const FALLBACK_RATIO = 4 / 5;

interface ProductThumbProps {
  src: string | null | undefined;
  name: string;
  /** sizing goes on the WRAPPER — the image/placeholder fills it */
  className?: string;
  sizes: string;
  eager?: boolean;
  /** Let the wrapper take the photo's own aspect ratio (set its width only).
      Without it the wrapper keeps the size you give it and the photo is
      letterboxed inside — never cropped either way. */
  natural?: boolean;
}

/** Renders the product image, or an on-brand placeholder when there's none.
    The wrapper owns the size; the inner element always fills it (avoids the
    `cn()` w-full-vs-w-14 collision — cn is a plain join, not tailwind-merge). */
export function ProductThumb({ src, name, className, sizes, eager, natural }: ProductThumbProps) {
  const [ratio, setRatio] = useState<number | null>(null);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      // Dynamic per-photo value — not expressible as a Tailwind class.
      style={natural ? { aspectRatio: ratio ?? FALLBACK_RATIO } : undefined}
    >
      {src ? (
        <SmartImage
          src={src}
          alt={name}
          sizes={sizes}
          eager={eager}
          onLoad={(e) => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
            if (w > 0 && h > 0) setRatio(w / h);
          }}
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <ProductPlaceholder name={name} className="absolute inset-0 h-full w-full" compact />
      )}
    </div>
  );
}
