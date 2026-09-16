import { motion } from "framer-motion";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { CONTACT_WHATSAPP_HREF } from "@/lib/contact";

/** Fixed floating contact button, present on every storefront page. Anchored
    to the physical bottom-right corner regardless of text direction — the
    universally recognized spot for this pattern. */
export function WhatsAppButton() {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.a
      href={CONTACT_WHATSAPP_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-105"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.8, type: "spring", stiffness: 260, damping: 20 }}
    >
      {!reduced && (
        <motion.span
          className="absolute inset-0 rounded-full bg-[#25D366]"
          animate={{ scale: [1, 1.5], opacity: [0.55, 0] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
        />
      )}
      <WhatsAppIcon className="relative h-7 w-7" />
    </motion.a>
  );
}
