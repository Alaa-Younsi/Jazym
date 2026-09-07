import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { SmartImage } from "@/components/ui/SmartImage";
import { useI18n } from "@/i18n/LanguageProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";
import { ProductPlaceholder } from "./ProductPlaceholder";

export interface GalleryImage {
  key: string;
  url: string;
  alt?: string;
}

interface GalleryProps {
  images: GalleryImage[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
  /** shown when there are no images */
  placeholderName: string;
}

const SWIPE_THRESHOLD = 60;

/** Standalone, state-free gallery: a swatch click, a thumb click and a swipe all
    drive the SAME index from the parent. See skill Phase 6. */
export function Gallery({ images, activeIndex, onActiveChange, placeholderName }: GalleryProps) {
  const { dir } = useI18n();
  const reduced = usePrefersReducedMotion();

  if (images.length === 0) {
    return (
      <ProductPlaceholder
        name={placeholderName}
        className="aspect-square w-full rounded-card border border-line"
      />
    );
  }

  const safeIndex = Math.max(0, Math.min(activeIndex, images.length - 1));
  const image = images[safeIndex];

  function onDragEnd(_: unknown, info: PanInfo) {
    const offset = dir === "rtl" ? -info.offset.x : info.offset.x;
    if (Math.abs(offset) < SWIPE_THRESHOLD) return;
    const delta = offset < 0 ? 1 : -1;
    onActiveChange((safeIndex + delta + images.length) % images.length);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-card border border-line bg-panel">
        <motion.div
          className="h-full w-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={onDragEnd}
          style={{ touchAction: "pan-y" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={image.key}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.28 }}
              className="h-full w-full"
            >
              <SmartImage
                src={image.url}
                alt={image.alt ?? placeholderName}
                sizes="(max-width: 1024px) 100vw, 520px"
                eager
                className="h-full w-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.key}
              type="button"
              onClick={() => onActiveChange(i)}
              aria-label={`${i + 1}`}
              className={cn(
                "h-16 w-14 shrink-0 overflow-hidden rounded-lg border transition",
                i === safeIndex ? "border-brand ring-2 ring-brand/30" : "border-line opacity-70",
              )}
            >
              <SmartImage
                src={img.url}
                alt=""
                sizes="56px"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
