import { animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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

const SWIPE_DISTANCE_RATIO = 0.2; // fraction of the container's width
const SWIPE_VELOCITY = 500;

/** Standalone, state-free gallery: a swatch click, a thumb click and a
    hold-and-drag swipe all drive the SAME index from the parent. The track
    visually follows the pointer while dragging (not just a gesture detector
    that jumps at release) — that live tracking is what makes it read as a
    slider instead of doing nothing until you let go. */
export function Gallery({ images, activeIndex, onActiveChange, placeholderName }: GalleryProps) {
  const { dir } = useI18n();
  const reduced = usePrefersReducedMotion();
  const isRtl = dir === "rtl";
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);

  const safeIndex = images.length > 0 ? Math.max(0, Math.min(activeIndex, images.length - 1)) : 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.offsetWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Re-settle the track whenever the active index changes for ANY reason
  // (drag, thumbnail click, swatch selection) or the container resizes.
  useEffect(() => {
    if (width === 0) return;
    const target = isRtl ? safeIndex * width : -safeIndex * width;
    const controls = animate(
      x,
      target,
      reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 38 },
    );
    return () => controls.stop();
  }, [safeIndex, width, isRtl, reduced, x]);

  if (images.length === 0) {
    return (
      <ProductPlaceholder
        name={placeholderName}
        className="aspect-square w-full rounded-card border border-line"
      />
    );
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (width === 0) return;
    const offset = isRtl ? -info.offset.x : info.offset.x;
    const velocity = isRtl ? -info.velocity.x : info.velocity.x;
    let delta = 0;
    if (offset < -width * SWIPE_DISTANCE_RATIO || velocity < -SWIPE_VELOCITY) delta = 1;
    else if (offset > width * SWIPE_DISTANCE_RATIO || velocity > SWIPE_VELOCITY) delta = -1;

    if (delta === 0) {
      const target = isRtl ? safeIndex * width : -safeIndex * width;
      animate(x, target, { type: "spring", stiffness: 380, damping: 38 });
      return;
    }
    onActiveChange((safeIndex + delta + images.length) % images.length);
  }

  const dragConstraints = isRtl
    ? { left: 0, right: (images.length - 1) * width }
    : { left: -(images.length - 1) * width, right: 0 };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        className="relative aspect-square w-full touch-pan-y overflow-hidden rounded-card border border-line bg-panel"
      >
        <motion.div
          className={cn("flex h-full", images.length > 1 && "cursor-grab active:cursor-grabbing")}
          style={{ x, width: `${images.length * 100}%` }}
          drag={images.length > 1 ? "x" : false}
          dragConstraints={dragConstraints}
          dragElastic={0.15}
          dragMomentum={false}
          onDragEnd={onDragEnd}
        >
          {images.map((img, i) => (
            <div
              key={img.key}
              className="h-full shrink-0"
              style={{ width: `${100 / images.length}%` }}
            >
              <SmartImage
                src={img.url}
                alt={img.alt ?? placeholderName}
                sizes="(max-width: 1024px) 100vw, 520px"
                eager={i === 0}
                draggable={false}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
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
