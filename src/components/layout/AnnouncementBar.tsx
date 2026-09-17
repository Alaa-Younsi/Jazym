import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import type { AnnouncementItem, AnnouncementStyle } from "@/types/db";

const STYLES: Record<AnnouncementStyle, string> = {
  gradient:
    "fx-glint bg-gradient-to-r from-brand via-violet to-brand bg-[length:200%_100%] text-bg",
  solid: "bg-ink text-bg",
  soft: "bg-brand-soft text-brand",
};

interface Props {
  items: AnnouncementItem[];
  style: AnnouncementStyle;
  /** Seconds each message stays before the next rotates in. */
  speed: number;
  /** Renders without the sticky/scroll context, for the admin preview. */
  preview?: boolean;
  className?: string;
}

/**
 * The strip above the header. Content, emojis, style and rotation speed all
 * come from the admin dashboard (store_settings, migration 0018); nothing here
 * is hard-coded. Rotation stops for `prefers-reduced-motion` and for a single
 * message, so the common case costs no timer at all.
 */
export function AnnouncementBar({ items, style, speed, preview, className }: Props) {
  const { lang } = useI18n();
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  const rotates = items.length > 1 && !reducedMotion;

  useEffect(() => {
    if (!rotates) {
      setIndex(0);
      return;
    }
    const ms = Math.min(60, Math.max(2, speed)) * 1000;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), ms);
    return () => window.clearInterval(id);
  }, [rotates, items.length, speed]);

  if (items.length === 0) return null;

  const current = items[Math.min(index, items.length - 1)];
  const text = (lang === "ar" ? current.text_ar : current.text_fr) || current.text_fr;

  return (
    <div
      className={cn("relative overflow-hidden", STYLES[style], className)}
      role="region"
      aria-live="off"
    >
      <Container
        className={cn(
          "flex min-h-9 items-center justify-center gap-2 py-2 text-center text-[0.72rem] font-medium tracking-wide",
          // Container ships responsive side padding; inside a narrow admin
          // card that reads as a huge gap, so the preview pins it flat.
          preview && "px-4 sm:px-4 lg:px-4",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${index}-${text}`}
            initial={rotates ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={rotates ? { opacity: 0, y: -6 } : undefined}
            transition={{ duration: 0.28 }}
            className="flex min-w-0 items-center justify-center gap-2"
          >
            {current.emoji_start && (
              <span aria-hidden className="shrink-0 leading-none">
                {current.emoji_start}
              </span>
            )}
            <span className="truncate sm:whitespace-normal">{text}</span>
            {current.emoji_end && (
              <span aria-hidden className="shrink-0 leading-none">
                {current.emoji_end}
              </span>
            )}
          </motion.span>
        </AnimatePresence>
      </Container>
    </div>
  );
}
