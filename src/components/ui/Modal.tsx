import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** disable backdrop-click + Escape (e.g. while a delete is in flight) */
  locked?: boolean;
  className?: string;
}

export function Modal({ open, onClose, title, children, locked, className }: ModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [open, onClose, locked]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={locked ? undefined : onClose}
          />
          <motion.div
            className={cn(
              "fx-paper relative z-10 w-full max-w-lg rounded-card border border-line p-6 shadow-lift",
              className,
            )}
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="fx-display text-xl text-ink">{title}</h2>
              {!locked && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("close")}
                  className="-m-2 rounded-full p-2 text-muted transition hover:bg-panel-2 hover:text-ink"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
