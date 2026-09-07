import type { LandingBlockType } from "@/types/db";
import type { TranslationKey } from "@/i18n/translations";

export interface FieldSpec {
  key: string;
  labelFr: string;
  kind: "text" | "textarea" | "image" | "datetime" | "number" | "url";
  localized?: boolean; // renders _fr + _ar
}

export interface ItemFieldSpec extends FieldSpec {}

export interface BlockSpec {
  type: LandingBlockType;
  labelKey: TranslationKey;
  fields: FieldSpec[];
  item?: { labelFr: string; fields: ItemFieldSpec[] };
}

export const BLOCK_SPECS: BlockSpec[] = [
  {
    type: "hero",
    labelKey: "lpBlockHero",
    fields: [
      { key: "title", labelFr: "Titre", kind: "text", localized: true },
      { key: "subtitle", labelFr: "Sous-titre", kind: "textarea", localized: true },
      { key: "image_url", labelFr: "Image de fond", kind: "image" },
    ],
  },
  {
    type: "text",
    labelKey: "lpBlockText",
    fields: [
      { key: "title", labelFr: "Titre", kind: "text", localized: true },
      { key: "body", labelFr: "Texte", kind: "textarea", localized: true },
    ],
  },
  {
    type: "image",
    labelKey: "lpBlockImage",
    fields: [
      { key: "image_url", labelFr: "Image", kind: "image" },
      { key: "alt", labelFr: "Texte alternatif", kind: "text" },
    ],
  },
  {
    type: "product",
    labelKey: "lpBlockProduct",
    fields: [{ key: "title", labelFr: "Titre", kind: "text", localized: true }],
  },
  {
    type: "features",
    labelKey: "lpBlockFeatures",
    fields: [{ key: "title", labelFr: "Titre", kind: "text", localized: true }],
    item: {
      labelFr: "Avantage",
      fields: [
        { key: "title", labelFr: "Titre", kind: "text", localized: true },
        { key: "body", labelFr: "Texte", kind: "textarea", localized: true },
      ],
    },
  },
  {
    type: "gallery",
    labelKey: "lpBlockGallery",
    fields: [],
    item: {
      labelFr: "Image",
      fields: [
        { key: "image_url", labelFr: "Image", kind: "image" },
        { key: "alt", labelFr: "Texte alternatif", kind: "text" },
      ],
    },
  },
  {
    type: "reviews",
    labelKey: "lpBlockReviews",
    fields: [{ key: "title", labelFr: "Titre", kind: "text", localized: true }],
    item: {
      labelFr: "Avis",
      fields: [
        { key: "name", labelFr: "Nom", kind: "text" },
        { key: "stars", labelFr: "Note (1-5)", kind: "number" },
        { key: "text", labelFr: "Avis", kind: "textarea", localized: true },
      ],
    },
  },
  {
    type: "faq",
    labelKey: "lpBlockFaq",
    fields: [{ key: "title", labelFr: "Titre", kind: "text", localized: true }],
    item: {
      labelFr: "Question",
      fields: [
        { key: "q", labelFr: "Question", kind: "text", localized: true },
        { key: "a", labelFr: "Réponse", kind: "textarea", localized: true },
      ],
    },
  },
  {
    type: "countdown",
    labelKey: "lpBlockCountdown",
    fields: [
      { key: "title", labelFr: "Titre", kind: "text", localized: true },
      { key: "target", labelFr: "Date de fin", kind: "datetime" },
    ],
  },
  {
    type: "cta",
    labelKey: "lpBlockCta",
    fields: [
      { key: "title", labelFr: "Titre", kind: "text", localized: true },
      { key: "subtitle", labelFr: "Sous-titre", kind: "text", localized: true },
      { key: "button", labelFr: "Bouton", kind: "text", localized: true },
      { key: "href", labelFr: "Lien", kind: "url" },
    ],
  },
];

export function specFor(type: LandingBlockType): BlockSpec {
  return BLOCK_SPECS.find((s) => s.type === type) ?? BLOCK_SPECS[0];
}
