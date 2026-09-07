/* The store's phone / email / address — the ONLY place any of them lives.
   Do NOT run these through i18n (a phone number is the same in every language;
   a translated copy is a copy that drifts). Replace the TODO(client) values at
   go-live and tap the number on a real phone — CONTACT_PHONE_TEL must be E.164
   or the tel: link silently does nothing. See skill Phase 2 / Phase 10 step 15. */

export const CONTACT_PHONE = "0555 00 00 00"; // TODO(client): real display number
export const CONTACT_PHONE_TEL = "+213555000000"; // TODO(client): E.164
export const CONTACT_EMAIL = "contact@jazym.dz"; // TODO(client)
export const CONTACT_ADDRESS_FR = "Alger, Algérie"; // TODO(client)
export const CONTACT_ADDRESS_AR = "الجزائر العاصمة، الجزائر"; // TODO(client)

export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE_TEL}`;
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;
export const CONTACT_WHATSAPP_HREF = `https://wa.me/${CONTACT_PHONE_TEL.replace(/\D/g, "")}`;

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/profile.php?id=61560103239125",
  instagram: "https://www.instagram.com/jazym.dz",
  tiktok: "https://www.tiktok.com/@jazym.dz",
} as const;
