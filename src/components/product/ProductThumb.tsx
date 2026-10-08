import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/cn";
import { ProductPlaceholder } from "./ProductPlaceholder";

interface ProductThumbProps {
  src: string | null | undefined;
  name: string;
  /** sizing goes on the WRAPPER — the image/placeholder fills it */
  className?: string;
  sizes: string;
  eager?: boolean;
}

/** Renders the product image, or an on-brand placeholder when there's none.
    The wrapper owns the size; the inner element always fills it (avoids the
    `cn()` w-full-vs-w-14 collision — cn is a plain join, not tailwind-merge). */
export function ProductThumb({ src, name, className, sizes, eager }: ProductThumbProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {src ? (
        <SmartImage
          src={src}
          alt={name}
          sizes={sizes}
          eager={eager}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <ProductPlaceholder name={name} className="absolute inset-0 h-full w-full" compact />
      )}
    </div>
  );
}
