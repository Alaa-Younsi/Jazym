import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion, useSaveData } from "@/hooks/useMediaFlags";
import { useI18n } from "@/i18n/LanguageProvider";
import { resolveVideo } from "@/lib/video";
import { cn } from "@/lib/cn";

interface Props {
  url: string | null | undefined;
  /** Still frame shown before the video is in view — usually the product image. */
  poster?: string | null;
  className?: string;
}

/**
 * Plays a product video the way the client asked for it everywhere:
 * looping forever, muted, with no controls, no scrubber and no way for the
 * visitor to pause or re-time it.
 *
 * Nothing is fetched until the player scrolls into view — an embed or an mp4
 * on every product page would otherwise be the single heaviest thing the site
 * downloads. Under data-saver, and for `prefers-reduced-motion`, the poster
 * stands in and no video is loaded at all.
 */
export function VideoPlayer({ url, poster, className }: Props) {
  const { t } = useI18n();
  const reducedMotion = usePrefersReducedMotion();
  const saveData = useSaveData();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const video = resolveVideo(url);
  if (!video) return null;

  const stillOnly = reducedMotion || saveData;
  const stillSrc = poster ?? video.poster;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-card border border-line bg-panel-2",
        className,
      )}
    >
      {stillOnly || !inView ? (
        stillSrc ? (
          <img
            src={stillSrc}
            alt={t("productVideo")}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : null
      ) : video.kind === "file" ? (
        <video
          // No `controls`: the visitor gets no play/pause, no scrubber, no
          // volume — muted + loop + autoplay is the whole interaction.
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          poster={stillSrc ?? undefined}
          aria-label={t("productVideo")}
          onContextMenu={(e) => e.preventDefault()}
          className="pointer-events-none h-full w-full object-cover"
        >
          <source src={video.src} />
        </video>
      ) : (
        <iframe
          src={video.src}
          title={t("productVideo")}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          // An admin can paste any URL here, so the frame gets the minimum it
          // needs to play: no top-level navigation, no popups, no forms.
          sandbox="allow-scripts allow-same-origin allow-presentation"
          referrerPolicy="strict-origin-when-cross-origin"
          // pointer-events-none is what actually enforces "no controls" for a
          // third-party player we do not own.
          className="pointer-events-none absolute inset-0 h-full w-full border-0"
        />
      )}
    </div>
  );
}
