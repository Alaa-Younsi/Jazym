/* Bundled demo catalogue — shown until Supabase is wired (isSupabaseConfigured
   === false). Mirrors supabase/migrations/0009_seed.sql. Prices & page-count
   variants are taken from the client's own printed price list. Images are left
   null on purpose: ProductCard / Gallery render a branded placeholder, and the
   client uploads real photos through the admin. */

import type { Category, ClientReview, DeliveryPrice, Product, StoreSettings } from "@/types/db";
import { WILAYAS } from "@/lib/wilayas";

const now = "2026-08-01T09:00:00.000Z";

export const DEMO_CATEGORIES: Category[] = [
  {
    id: "cat-cahiers",
    slug: "cahiers",
    name_fr: "Cahiers de l'enseignant",
    name_ar: "دفاتر الأستاذ",
    description_fr: "Cahier journal, fiches, formation, séminaires — personnalisés à votre nom.",
    description_ar: "الدفتر اليومي، المذكرات، التكوين، الندوات — مخصّصة باسمك.",
    image_url: null,
    sort_order: 1,
    parent_id: null,
    created_at: now,
  },
  {
    id: "cat-accessoires",
    slug: "accessoires",
    name_fr: "Accessoires & organisateurs",
    name_ar: "إكسسوارات ومنظّمات",
    description_fr: "Organisateurs de dossier, porte-mémoire, organisateur de tableau.",
    description_ar: "منظّمات الملفات، حافظة المذكرة، منظّمة السبورة.",
    image_url: null,
    sort_order: 2,
    parent_id: null,
    created_at: now,
  },
  {
    id: "cat-strategies",
    slug: "strategies",
    name_fr: "Stratégies pédagogiques",
    name_ar: "استراتيجيات بيداغوجية",
    description_fr:
      "Kits concrets pour animer la classe : pigeon voyageur, train de mots, théière…",
    description_ar: "حقائب عملية لتنشيط القسم: الحمام الزاجل، قطار الكلمات، إبريق الشاي…",
    image_url: null,
    sort_order: 3,
    parent_id: null,
    created_at: now,
  },
];

interface DemoDef {
  slug: string;
  name_fr: string;
  name_ar: string;
  category_id: string;
  price: number;
  compare_at_price?: number;
  featured?: boolean;
  description_fr: string;
  description_ar: string;
  details_fr: string[];
  details_ar: string[];
  pages?: { fr: string; ar: string; price: number }[];
  choices?: { name_fr: string; name_ar: string; values: { fr: string; ar: string }[] };
}

const DEFS: DemoDef[] = [
  {
    slug: "cahier-journal",
    name_fr: "Cahier journal",
    name_ar: "الدفتر اليومي",
    category_id: "cat-cahiers",
    price: 2200,
    featured: true,
    description_fr:
      "Le cahier journal quotidien de l'enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.",
    description_ar:
      "الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.",
    details_fr: [
      "Papier 80 g anti-transparence",
      "Reliure cousue résistante",
      "Nom + matière imprimés sur la couverture",
      "Format A4",
    ],
    details_ar: [
      "ورق 80 غ غير شفّاف",
      "تجليد مخيط متين",
      "الاسم + المادة مطبوعان على الغلاف",
      "قياس A4",
    ],
    pages: [
      { fr: "120 pages", ar: "120 صفحة", price: 2200 },
      { fr: "160 pages", ar: "160 صفحة", price: 2700 },
      { fr: "200 pages", ar: "200 صفحة", price: 3200 },
      { fr: "300 pages", ar: "300 صفحة", price: 3700 },
    ],
  },
  {
    slug: "cahier-de-notes",
    name_fr: "Cahier de notes",
    name_ar: "دفتر التنقيط",
    category_id: "cat-cahiers",
    price: 1700,
    description_fr:
      "Cahier de notes et d'évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l'année.",
    description_ar: "دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.",
    details_fr: [
      "60 pages quadrillées",
      "Grilles de notes pré-imprimées",
      "Couverture rigide personnalisée",
    ],
    details_ar: ["60 صفحة مسطّرة", "جداول تنقيط مطبوعة مسبقًا", "غلاف صلب مخصّص"],
  },
  {
    slug: "cahier-de-formation",
    name_fr: "Cahier de formation",
    name_ar: "دفتر التكوين",
    category_id: "cat-cahiers",
    price: 2200,
    featured: true,
    description_fr:
      "Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.",
    description_ar: "لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.",
    details_fr: ["Papier 80 g", "Intercalaires par thème", "Nom imprimé sur la couverture"],
    details_ar: ["ورق 80 غ", "فواصل حسب المحور", "الاسم مطبوع على الغلاف"],
    pages: [
      { fr: "120 pages", ar: "120 صفحة", price: 2200 },
      { fr: "160 pages", ar: "160 صفحة", price: 2700 },
      { fr: "200 pages", ar: "200 صفحة", price: 3200 },
      { fr: "300 pages", ar: "300 صفحة", price: 3700 },
    ],
  },
  {
    slug: "cahier-de-seminaires",
    name_fr: "Cahier de séminaires",
    name_ar: "دفتر الندوات",
    category_id: "cat-cahiers",
    price: 2200,
    description_fr:
      "Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.",
    description_ar: "دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.",
    details_fr: ["Papier 80 g", "Pages numérotées", "Couverture personnalisée"],
    details_ar: ["ورق 80 غ", "صفحات مرقّمة", "غلاف مخصّص"],
    pages: [
      { fr: "120 pages", ar: "120 صفحة", price: 2200 },
      { fr: "160 pages", ar: "160 صفحة", price: 2700 },
      { fr: "200 pages", ar: "200 صفحة", price: 3200 },
      { fr: "300 pages", ar: "300 صفحة", price: 3700 },
    ],
  },
  {
    slug: "cahier-de-fiches",
    name_fr: "Cahier de fiches (planning)",
    name_ar: "دفتر المذكرات (التخطيط)",
    category_id: "cat-cahiers",
    price: 2200,
    featured: true,
    description_fr:
      "Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.",
    description_ar: "دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.",
    details_fr: ["Trame de fiche pré-imprimée", "Papier 80 g", "Nom + niveau sur la couverture"],
    details_ar: ["هيكل مذكّرة مطبوع مسبقًا", "ورق 80 غ", "الاسم + المستوى على الغلاف"],
    pages: [
      { fr: "120 pages", ar: "120 صفحة", price: 2200 },
      { fr: "160 pages", ar: "160 صفحة", price: 2700 },
      { fr: "200 pages", ar: "200 صفحة", price: 3200 },
      { fr: "300 pages", ar: "300 صفحة", price: 3700 },
    ],
  },
  {
    slug: "cahier-de-remediation",
    name_fr: "Cahier de remédiation",
    name_ar: "دفتر المعالجة",
    category_id: "cat-cahiers",
    price: 2200,
    description_fr:
      "Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.",
    description_ar: "لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.",
    details_fr: ["Grilles de suivi individuel", "Papier 80 g", "Couverture personnalisée"],
    details_ar: ["جداول متابعة فردية", "ورق 80 غ", "غلاف مخصّص"],
    pages: [
      { fr: "120 pages", ar: "120 صفحة", price: 2200 },
      { fr: "160 pages", ar: "160 صفحة", price: 2700 },
    ],
  },
  {
    slug: "registre-appel",
    name_fr: "Registre d'appel",
    name_ar: "دفتر المناداة",
    category_id: "cat-cahiers",
    price: 1400,
    description_fr:
      "Registre d'appel et de présence — mise en page claire, une classe par double-page.",
    description_ar: "دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.",
    details_fr: ["40 pages", "Colonnes de présence pré-imprimées", "Couverture rigide"],
    details_ar: ["40 صفحة", "أعمدة حضور مطبوعة مسبقًا", "غلاف صلب"],
  },
  {
    slug: "cahier-de-roulement",
    name_fr: "Cahier de roulement",
    name_ar: "دفتر التداول",
    category_id: "cat-cahiers",
    price: 1700,
    description_fr:
      "Cahier de roulement pour la circulation de l'information entre enseignants et administration.",
    description_ar: "دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.",
    details_fr: ["Papier 70 g", "Pages lignées", "Couverture personnalisée"],
    details_ar: ["ورق 70 غ", "صفحات مسطّرة", "غلاف مخصّص"],
    pages: [
      { fr: "120 pages", ar: "120 صفحة", price: 1700 },
      { fr: "160 pages", ar: "160 صفحة", price: 2200 },
    ],
  },
  {
    slug: "organisateur-titularisation",
    name_fr: "Organisateur — comité de titularisation",
    name_ar: "منظّمات لجنة التثبيت",
    category_id: "cat-accessoires",
    price: 250,
    description_fr:
      "Intercalaires et organisateur de dossier pour le comité de titularisation, personnalisés selon la fonction.",
    description_ar: "فواصل ومنظّم ملف للجنة التثبيت، مخصّصة حسب الوظيفة.",
    details_fr: ["Jeu d'intercalaires", "Étiquettes de fonction", "Format A4"],
    details_ar: ["مجموعة فواصل", "بطاقات الوظيفة", "قياس A4"],
    choices: {
      name_fr: "Fonction",
      name_ar: "الوظيفة",
      values: [
        { fr: "Enseignant(e)", ar: "الأستاذ(ة)" },
        { fr: "Inspecteur(trice)", ar: "المفتّش(ة)" },
        { fr: "Directeur(trice)", ar: "المدير(ة)" },
      ],
    },
  },
  {
    slug: "porte-memoire-titularisation",
    name_fr: "Porte-mémoire de titularisation",
    name_ar: "حافظة مذكرة التثبيت",
    category_id: "cat-accessoires",
    price: 300,
    description_fr: "Chemise rigide pour présenter et protéger la mémoire de titularisation.",
    description_ar: "حافظة صلبة لتقديم وحماية مذكّرة التثبيت.",
    details_fr: ["Carton rigide plastifié", "Fenêtre titre personnalisable", "Format A4"],
    details_ar: ["كرتون صلب مغلّف", "نافذة عنوان قابلة للتخصيص", "قياس A4"],
  },
  {
    slug: "organisateur-tableau",
    name_fr: "Organisateur de tableau",
    name_ar: "منظّمة السبورة",
    category_id: "cat-accessoires",
    price: 250,
    description_fr: "Pochette murale pour garder feutres, brosse et fiches à portée du tableau.",
    description_ar: "جيب جداري للحفاظ على الأقلام، الممحاة والبطاقات قرب السبورة.",
    details_fr: ["Tissu enduit lavable", "3 compartiments", "Fixation adhésive + œillets"],
    details_ar: ["قماش مطلي قابل للغسل", "3 جيوب", "تثبيت لاصق + حلقات"],
  },
  {
    slug: "strategie-pigeon-voyageur",
    name_fr: "Stratégie du pigeon voyageur",
    name_ar: "استراتيجية الحمام الزاجل",
    category_id: "cat-strategies",
    price: 1200,
    featured: true,
    description_fr:
      "Kit « pigeon voyageur » (5 pigeons) pour faire circuler consignes et messages entre groupes de la classe de façon ludique.",
    description_ar:
      "حقيبة «الحمام الزاجل» (5 حمامات) لتمرير التعليمات والرسائل بين مجموعات القسم بطريقة ممتعة.",
    details_fr: [
      "5 pigeons cartonnés plastifiés",
      "Porte-messages",
      "Guide d'utilisation en classe",
    ],
    details_ar: ["5 حمامات من الكرتون المغلّف", "حاملات رسائل", "دليل الاستعمال في القسم"],
  },
  {
    slug: "strategie-autre-moitie",
    name_fr: "Stratégie de l'autre moitié",
    name_ar: "استراتيجية النصف الآخر",
    category_id: "cat-strategies",
    price: 1000,
    description_fr:
      "Kit « l'autre moitié » (4 œufs) : chaque élève cherche la moitié complémentaire — parfait pour les appariements et le vocabulaire.",
    description_ar:
      "حقيبة «النصف الآخر» (4 بيضات): كل تلميذ يبحث عن النصف المكمّل — مثالية للمزاوجة والمفردات.",
    details_fr: ["4 œufs sécables", "Jeux de cartes à apparier", "Fiches enseignant"],
    details_ar: ["4 بيضات قابلة للفصل", "بطاقات للمزاوجة", "بطاقات للأستاذ"],
  },
  {
    slug: "strategie-train-de-mots",
    name_fr: "Stratégie du train de mots",
    name_ar: "استراتيجية قطار الكلمات",
    category_id: "cat-strategies",
    price: 1000,
    featured: true,
    description_fr:
      "Kit « train de mots » (4 wagons + remorque) pour construire phrases, ordres de mots et suites logiques.",
    description_ar:
      "حقيبة «قطار الكلمات» (4 عربات + مقطورة) لبناء الجُمل، ترتيب الكلمات والمتتاليات المنطقية.",
    details_fr: ["Locomotive + 4 wagons + remorque", "Étiquettes effaçables", "Guide d'activités"],
    details_ar: ["قاطرة + 4 عربات + مقطورة", "بطاقات قابلة للمسح", "دليل أنشطة"],
  },
  {
    slug: "strategie-theiere",
    name_fr: "Stratégie de la théière",
    name_ar: "استراتيجية إبريق الشاي",
    category_id: "cat-strategies",
    price: 800,
    description_fr:
      "Kit « théière » (1 théière + 6 verres) : la théière pose la question, chaque verre reçoit une réponse d'élève.",
    description_ar:
      "حقيبة «إبريق الشاي» (إبريق + 6 كؤوس): الإبريق يطرح السؤال، وكل كأس يستقبل إجابة تلميذ.",
    details_fr: ["1 théière + 6 verres cartonnés", "Cartes questions/réponses", "Guide"],
    details_ar: ["إبريق + 6 كؤوس كرتونية", "بطاقات أسئلة/أجوبة", "دليل"],
  },
  {
    slug: "strategie-cadenas-cle",
    name_fr: "Stratégie du cadenas et de la clé",
    name_ar: "استراتيجية القفل والمفتاح",
    category_id: "cat-strategies",
    price: 1200,
    description_fr:
      "Kit « cadenas & clé » (4 clés + 4 cadenas) : associer la bonne clé (réponse) au bon cadenas (question).",
    description_ar:
      "حقيبة «القفل والمفتاح» (4 مفاتيح + 4 أقفال): مطابقة المفتاح الصحيح (الإجابة) بالقفل المناسب (السؤال).",
    details_fr: ["4 cadenas + 4 clés cartonnés", "Cartes à associer", "Fiches enseignant"],
    details_ar: ["4 أقفال + 4 مفاتيح كرتونية", "بطاقات للمطابقة", "بطاقات للأستاذ"],
  },
  {
    slug: "strategie-cinq-doigts",
    name_fr: "Stratégie des cinq doigts",
    name_ar: "استراتيجية الأصابع الخمسة",
    category_id: "cat-strategies",
    price: 700,
    description_fr:
      "Kit « cinq doigts » pour structurer un rappel, un résumé ou une auto-évaluation en cinq points.",
    description_ar: "حقيبة «الأصابع الخمسة» لهيكلة تذكير أو تلخيص أو تقويم ذاتي في خمس نقاط.",
    details_fr: ["Main géante + 5 doigts amovibles", "Pictogrammes de consignes", "Guide"],
    details_ar: ["يد كبيرة + 5 أصابع قابلة للنزع", "رموز التعليمات", "دليل"],
  },
  {
    slug: "strategie-pop-corn",
    name_fr: "Stratégie du pop-corn",
    name_ar: "استراتيجية الفشار",
    category_id: "cat-strategies",
    price: 1000,
    description_fr:
      "Kit « pop-corn » pour la prise de parole aléatoire : on tire un grain, l'élève répond.",
    description_ar: "حقيبة «الفشار» لأخذ الكلمة عشوائيًا: نسحب حبّة، والتلميذ يجيب.",
    details_fr: ["Boîte + 30 grains nominatifs", "Cartes défis", "Guide d'animation"],
    details_ar: ["علبة + 30 حبّة بالأسماء", "بطاقات تحدّيات", "دليل التنشيط"],
  },
];

function buildProduct(def: DemoDef, index: number): Product {
  const variants: Product["variants"] = [];
  if (def.pages && def.pages.length > 0) {
    variants.push({
      name_fr: "Nombre de pages",
      name_ar: "عدد الصفحات",
      values: def.pages.map((p) => ({ value_fr: p.fr, value_ar: p.ar, image_url: null })),
    });
  }
  if (def.choices) {
    variants.push({
      name_fr: def.choices.name_fr,
      name_ar: def.choices.name_ar,
      values: def.choices.values.map((v) => ({
        value_fr: v.fr,
        value_ar: v.ar,
        image_url: null,
      })),
    });
  }
  return {
    id: `prod-${def.slug}`,
    slug: def.slug,
    name_fr: def.name_fr,
    name_ar: def.name_ar,
    description_fr: def.description_fr,
    description_ar: def.description_ar,
    details_fr: def.details_fr,
    details_ar: def.details_ar,
    price: def.price,
    compare_at_price: def.compare_at_price ?? null,
    category_id: def.category_id,
    stock: 120,
    style_code: `JZ-${String(index + 1).padStart(3, "0")}`,
    colors: [],
    sizes: [],
    variants,
    quantity_offers: [],
    video_url: null,
    featured: def.featured ?? false,
    status: "active",
    created_at: now,
    updated_at: now,
    category: DEMO_CATEGORIES.find((c) => c.id === def.category_id) ?? null,
    product_images: [],
  };
}

export const DEMO_PRODUCTS: Product[] = DEFS.map(buildProduct);

export const DEMO_REVIEWS: ClientReview[] = [
  {
    id: "rev-1",
    client_name: "Nadia B. — Enseignante primaire, Blida",
    stars: 5,
    review_text:
      "Le cahier journal est superbe, papier épais et mon nom imprimé proprement. Livré en 3 jours à Blida.",
    image_url: null,
    active: true,
    created_at: now,
  },
  {
    id: "rev-2",
    client_name: "Karim L. — Professeur de maths, Oran",
    stars: 5,
    review_text:
      "J'ai commandé le pack fiches + formation. Qualité au rendez-vous et paiement à la livraison, rien à dire.",
    image_url: null,
    active: true,
    created_at: now,
  },
  {
    id: "rev-3",
    client_name: "Samira K. — Directrice d'école, Sétif",
    stars: 4,
    review_text:
      "Les organisateurs de titularisation ont fait gagner un temps fou au comité. Je recommande.",
    image_url: null,
    active: true,
    created_at: now,
  },
  {
    id: "rev-4",
    client_name: "Yacine M. — Enseignant CEM, Alger",
    stars: 5,
    review_text:
      "Les kits de stratégies changent l'ambiance de la classe. Le train de mots est un carton avec mes 1AM.",
    image_url: null,
    active: true,
    created_at: now,
  },
];

export const DEMO_STORE_SETTINGS: StoreSettings = {
  id: 1,
  shipping_fee: 500,
  free_ship_threshold: null, // free shipping is an OFFER, never a default (skill Phase 5)
  store_phone: null,
  store_email: null,
  store_address_fr: null,
  store_address_ar: null,
  announcement_fr: "Livraison partout en Algérie · Paiement à la livraison",
  announcement_ar: "توصيل إلى كامل الوطن · الدفع عند الاستلام",
  announcement_enabled: true,
  announcement_items: [
    {
      text_fr: "Livraison partout en Algérie · Paiement à la livraison",
      text_ar: "توصيل إلى كامل الوطن · الدفع عند الاستلام",
      emoji_start: "🚚",
      emoji_end: "🌼",
    },
  ],
  announcement_speed: 6,
  announcement_style: "gradient",
};

/** Fallback delivery grid — a rough zone-based estimate. Real prices come from
    the admin's DeliveryPrices screen once Supabase is wired. */
export const DEMO_DELIVERY_PRICES: DeliveryPrice[] = WILAYAS.map((w) => {
  const north = w.code <= 48;
  const home = north ? 500 : 800;
  const office = north ? 300 : 500;
  return {
    id: `del-${w.code}`,
    wilaya: w.name_fr,
    home_price: home,
    office_price: office,
    active: true,
    updated_at: now,
  };
});
