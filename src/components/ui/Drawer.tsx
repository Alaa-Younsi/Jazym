import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** logical side; auto-flips with `dir` unless overridden */
  side?: "start" | "end";
  title?: string;
  children: ReactNode;
  widthClass?: string;
}

export function Drawer({
  open,
  onClose,
  side = "end",
  title,
  children,
  widthClass = "w-full max-w-md",
}: DrawerProps) {
  const { dir } = useI18n();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [open, onClose]);

  // Physical side, RTL-aware (skill Phase 4 — physical props don't auto-flip).
  const physicalEnd = dir === "rtl" ? "left-0" : "right-0";
  const physicalStart = dir === "rtl" ? "right-0" : "left-0";
  const anchored = side === "end" ? physicalEnd : physicalStart;
  const offscreen =
    side === "end" ? (dir === "rtl" ? "-100%" : "100%") : dir === "rtl" ? "100%" : "-100%";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={cn(
              "fx-paper fixed inset-y-0 z-50 flex h-dvh flex-col overflow-hidden border-line shadow-lift",
              anchored,
              side === "end" ? "border-s" : "border-e",
              widthClass,
            )}
            initial={reduced ? { opacity: 0 } : { x: offscreen }}
            animate={reduced ? { opacity: 1 } : { x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: offscreen }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {title && (
              <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
                <h2 className="fx-display text-xl text-ink">{title}</h2>
                <CloseButton onClose={onClose} />
              </header>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={t("close")}
      className="-m-2 rounded-full p-2 text-muted transition hover:bg-panel-2 hover:text-ink"
    >
      <X size={18} />
    </button>
  );
}
