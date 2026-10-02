/* The store's phone / address — the ONLY place either lives. No public email:
   the store has no inbox (order notifications go out via Resend only).
   Do NOT run these through i18n (a phone number is the same in every language;
   a translated copy is a copy that drifts). CONTACT_PHONE_TEL must be E.164 or
   the tel: link silently does nothing. See skill Phase 2 / Phase 10 step 15. */

export const CONTACT_PHONE = "0559 81 56 46";
export const CONTACT_PHONE_TEL = "+213559815646";
export const CONTACT_ADDRESS_FR = "El Eulma 19600, Sétif, Algérie";
export const CONTACT_ADDRESS_AR = "العلمة 19600، سطيف، الجزائر";

export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE_TEL}`;
export const CONTACT_WHATSAPP_HREF = `https://wa.me/${CONTACT_PHONE_TEL.replace(/\D/g, "")}`;

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/profile.php?id=61560103239125",
  instagram: "https://www.instagram.com/jazym.dz",
  tiktok: "https://www.tiktok.com/@jazym.dz",
} as const;
