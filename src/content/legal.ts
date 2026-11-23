/* Legal pages text, FR + AR, rendered by src/pages/Legal.tsx.
   Algerian frame: loi 18-05 (commerce électronique), loi 18-07 (données
   personnelles, ANPDP), loi 09-03 (protection du consommateur).
   Latin runs inside Arabic prose (law numbers, phone, domain) are wrapped in
   bidi isolates (`iso()`) or they render scrambled in RTL.
   The cookie inventory below lists the REAL storage keys the site uses — keep
   it in step with src/store/*, src/i18n/LanguageProvider, src/theme/ThemeProvider
   and src/lib/consent.ts when one is added or renamed. */

import type { TranslationKey } from "@/i18n/translations";
import { CONTACT_ADDRESS_AR, CONTACT_ADDRESS_FR, CONTACT_PHONE } from "@/lib/contact";

export type LegalSlug = "mentions-legales" | "cgv" | "confidentialite" | "cookies";

interface Bi {
  fr: string;
  ar: string;
}

export interface LegalSection {
  title: Bi;
  body: Bi;
}

export interface LegalDoc {
  slug: LegalSlug;
  title: Bi;
  intro: Bi;
  sections: LegalSection[];
}

/** Bidi-isolate a left-to-right run inside Arabic text. */
function iso(s: string): string {
  // LRI … PDI, plus an LRM on each side so a leading/trailing neutral
  // ("_fbp", "18-05") stays attached to the Latin run.
  return `⁦‎${s}‎⁩`;
}

export const LEGAL_UPDATED = "23/11/2026";

const PHONE_AR = iso(CONTACT_PHONE);
const SITE = "jazym.shop";
const SITE_AR = iso(SITE);

export const LEGAL_DOCS: Record<LegalSlug, LegalDoc> = {
  "mentions-legales": {
    slug: "mentions-legales",
    title: { fr: "Mentions légales", ar: "الإشعارات القانونية" },
    intro: {
      fr: `Informations sur l'éditeur et l'hébergement du site ${SITE}, publiées conformément à la loi n° 18-05 du 10 mai 2018 relative au commerce électronique.`,
      ar: `معلومات حول ناشر الموقع ${SITE_AR} واستضافته، منشورة طبقًا للقانون رقم ${iso("18-05")} المؤرخ في 10 ماي 2018 المتعلق بالتجارة الإلكترونية.`,
    },
    sections: [
      {
        title: { fr: "Éditeur du site", ar: "ناشر الموقع" },
        body: {
          fr: `Jazym — conception et vente de cahiers, accessoires et outils pédagogiques pour enseignants.\nAdresse : ${CONTACT_ADDRESS_FR}\nTéléphone : ${CONTACT_PHONE}`,
          ar: `جازيم — تصميم وبيع الكراريس والأدوات والوسائل البيداغوجية للأساتذة.\nالعنوان: ${CONTACT_ADDRESS_AR}\nالهاتف: ${PHONE_AR}`,
        },
      },
      {
        title: { fr: "Hébergement", ar: "الاستضافة" },
        body: {
          fr: "Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com.\nBase de données et stockage des images : Supabase Inc. — supabase.com.",
          ar: `الموقع: ${iso("Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA")} — ${iso("vercel.com")}.\nقاعدة البيانات وتخزين الصور: ${iso("Supabase Inc.")} — ${iso("supabase.com")}.`,
        },
      },
      {
        title: { fr: "Conception et développement", ar: "التصميم والتطوير" },
        body: {
          fr: "Site conçu et développé par Alaa Younsi — alaayounsi.vercel.app.",
          ar: `تم تصميم الموقع وتطويره بواسطة ${iso("Alaa Younsi")} — ${iso("alaayounsi.vercel.app")}.`,
        },
      },
      {
        title: { fr: "Propriété intellectuelle", ar: "الملكية الفكرية" },
        body: {
          fr: "Le nom Jazym, le logo, les photographies, les designs de couvertures et les textes de ce site sont la propriété de Jazym. Toute reproduction ou réutilisation, totale ou partielle, sans autorisation écrite est interdite (ordonnance n° 03-05 du 19 juillet 2003 relative aux droits d'auteur et aux droits voisins).",
          ar: `اسم جازيم وشعارها والصور وتصاميم الأغلفة والنصوص المنشورة في هذا الموقع ملك لجازيم. يُمنع أي نسخ أو إعادة استعمال، كليًا أو جزئيًا، دون إذن كتابي (الأمر رقم ${iso("03-05")} المؤرخ في 19 يوليو 2003 المتعلق بحقوق المؤلف والحقوق المجاورة).`,
        },
      },
      {
        title: { fr: "Responsabilité", ar: "المسؤولية" },
        body: {
          fr: "Nous veillons à l'exactitude des informations publiées. Les couleurs affichées peuvent légèrement varier selon votre écran ; les photos de produits personnalisés sont des exemples.",
          ar: "نحرص على دقة المعلومات المنشورة. قد تختلف الألوان قليلًا حسب شاشتك، وصور المنتجات المخصّصة هي أمثلة توضيحية.",
        },
      },
      {
        title: { fr: "Droit applicable", ar: "القانون المطبّق" },
        body: {
          fr: "Le site et son utilisation sont régis par le droit algérien. Tout litige relève des juridictions algériennes compétentes, après une tentative de règlement amiable.",
          ar: "يخضع الموقع واستعماله للقانون الجزائري. يُعرض كل نزاع على الجهات القضائية الجزائرية المختصة، بعد محاولة الحل الودي.",
        },
      },
    ],
  },

  cgv: {
    slug: "cgv",
    title: { fr: "Conditions générales de vente", ar: "الشروط العامة للبيع" },
    intro: {
      fr: `Ces conditions s'appliquent à toute commande passée sur ${SITE}. Elles sont établies conformément à la loi n° 18-05 du 10 mai 2018 relative au commerce électronique et à la loi n° 09-03 du 25 février 2009 relative à la protection du consommateur et à la répression des fraudes.`,
      ar: `تُطبّق هذه الشروط على كل طلب يتم عبر ${SITE_AR}. وقد أُعدّت طبقًا للقانون رقم ${iso("18-05")} المؤرخ في 10 ماي 2018 المتعلق بالتجارة الإلكترونية، والقانون رقم ${iso("09-03")} المؤرخ في 25 فبراير 2009 المتعلق بحماية المستهلك وقمع الغش.`,
    },
    sections: [
      {
        title: { fr: "Produits", ar: "المنتجات" },
        body: {
          fr: "Chaque produit est présenté avec sa description, ses options (palier, couverture, contenu…) et son prix. Les produits personnalisés (avec un nom ou une couverture fournie par vous) sont fabriqués à la demande, d'après les informations que vous indiquez.",
          ar: "يُعرض كل منتج مع وصفه وخياراته (الطور، الغلاف، المحتوى…) وسعره. المنتجات المخصّصة (بالاسم أو بغلاف تقدّمه) تُصنع حسب الطلب وفق المعلومات التي تقدّمها.",
        },
      },
      {
        title: { fr: "Prix", ar: "الأسعار" },
        body: {
          fr: "Les prix sont indiqués en dinars algériens (DA), toutes taxes comprises. Les frais de livraison dépendent de la wilaya et du mode choisi (à domicile ou au bureau) ; ils sont affichés avant la confirmation. Le montant total est recalculé par nos serveurs au moment de la commande, offres en cours comprises.",
          ar: "الأسعار محددة بالدينار الجزائري (دج) شاملة كل الرسوم. تكاليف التوصيل حسب الولاية وطريقة التوصيل (إلى المنزل أو إلى المكتب) وتُعرض قبل التأكيد. يُعاد حساب المبلغ الإجمالي على خوادمنا لحظة الطلب، مع احتساب العروض الجارية.",
        },
      },
      {
        title: { fr: "Commande", ar: "الطلب" },
        body: {
          fr: "Vous choisissez vos produits et options, puis indiquez votre nom, votre téléphone, votre wilaya, votre commune et le mode de livraison. Un numéro de commande vous est attribué. Nous vous appelons ensuite pour confirmer la commande avant l'expédition. Nous pouvons refuser une commande manifestement anormale (coordonnées fausses, quantités abusives).",
          ar: "تختار منتجاتك وخياراتك، ثم تُدخل اسمك وهاتفك وولايتك وبلديتك وطريقة التوصيل. يُمنح لك رقم طلب، ثم نتصل بك لتأكيد الطلب قبل الشحن. يمكننا رفض أي طلب غير عادي بشكل واضح (معلومات خاطئة، كميات مبالغ فيها).",
        },
      },
      {
        title: { fr: "Paiement", ar: "الدفع" },
        body: {
          fr: "Le paiement se fait à la livraison, en espèces, auprès du livreur. Aucun paiement n'est demandé en ligne et aucune donnée bancaire n'est collectée.",
          ar: "يتم الدفع عند الاستلام نقدًا لدى عون التوصيل. لا يُطلب أي دفع عبر الإنترنت ولا تُجمع أي معلومات بنكية.",
        },
      },
      {
        title: { fr: "Livraison", ar: "التوصيل" },
        body: {
          fr: "Nous livrons dans les 69 wilayas par l'intermédiaire de sociétés de livraison partenaires, à domicile ou au bureau de livraison. Les délais communiqués sont indicatifs. Vérifiez votre colis en présence du livreur et signalez-nous immédiatement toute anomalie.",
          ar: "نوصل إلى الولايات الـ 69 عبر شركات توصيل شريكة، إلى المنزل أو إلى مكتب التوصيل. الآجال المعلنة تقريبية. تحقق من طردك بحضور عون التوصيل وأبلغنا فورًا بأي خلل.",
        },
      },
      {
        title: { fr: "Produit non conforme ou défectueux", ar: "المنتج غير المطابق أو المعيب" },
        body: {
          fr: "Si le produit livré ne correspond pas à votre commande ou présente un défaut, vous pouvez le retourner dans un délai de quatre (4) jours ouvrables à compter de sa réception, dans son état et son emballage d'origine, en indiquant le motif (loi n° 18-05, art. 23). Les frais de retour sont alors à notre charge, et nous procédons, à votre choix, à l'échange, à la réparation ou au remboursement.\nUn produit personnalisé conforme à la commande (nom, couverture fournie) ne peut être ni repris ni échangé, puisqu'il a été fabriqué pour vous.",
          ar: `إذا كان المنتج المُسلَّم غير مطابق لطلبك أو به عيب، يمكنك إرجاعه في أجل أربعة (4) أيام عمل ابتداءً من استلامه، بحالته وتغليفه الأصليين مع ذكر السبب (القانون رقم ${iso("18-05")}، المادة 23). تكون مصاريف الإرجاع على عاتقنا، ونقوم حسب اختيارك بالاستبدال أو الإصلاح أو إرجاع المبلغ.\nالمنتج المخصّص المطابق للطلب (بالاسم أو بغلاف مقدَّم) لا يُسترجع ولا يُستبدل لأنه صُنع خصيصًا لك.`,
        },
      },
      {
        title: { fr: "Garantie", ar: "الضمان" },
        body: {
          fr: "Nos produits bénéficient de la garantie légale de conformité et de sécurité prévue par la loi n° 09-03 relative à la protection du consommateur.",
          ar: `تستفيد منتجاتنا من الضمان القانوني للمطابقة والسلامة المنصوص عليه في القانون رقم ${iso("09-03")} المتعلق بحماية المستهلك.`,
        },
      },
      {
        title: { fr: "Annulation", ar: "الإلغاء" },
        body: {
          fr: `Vous pouvez annuler gratuitement une commande tant qu'elle n'a pas été expédiée, par téléphone au ${CONTACT_PHONE} ou lors de l'appel de confirmation. Les colis refusés sans motif à la livraison nous coûtent des frais ; en cas de refus répétés, nous pouvons décliner de nouvelles commandes.`,
          ar: `يمكنك إلغاء الطلب مجانًا ما دام لم يُشحن، عبر الهاتف ${PHONE_AR} أو أثناء مكالمة التأكيد. رفض الطرد دون سبب عند التوصيل يكلّفنا مصاريف، وفي حال تكرار الرفض يمكننا عدم قبول طلبات جديدة.`,
        },
      },
      {
        title: { fr: "Litiges", ar: "النزاعات" },
        body: {
          fr: "Contactez-nous d'abord : la plupart des problèmes se règlent en un appel. À défaut d'accord amiable, le litige relève des juridictions algériennes compétentes, selon le droit algérien.",
          ar: "اتصل بنا أولًا: معظم المشاكل تُحلّ بمكالمة واحدة. وفي غياب حل ودي، يُعرض النزاع على الجهات القضائية الجزائرية المختصة وفق القانون الجزائري.",
        },
      },
    ],
  },

  confidentialite: {
    slug: "confidentialite",
    title: { fr: "Politique de confidentialité", ar: "سياسة الخصوصية" },
    intro: {
      fr: "Comment Jazym collecte et utilise vos données personnelles, conformément à la loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel.",
      ar: `كيف تجمع جازيم معطياتك الشخصية وتستعملها، طبقًا للقانون رقم ${iso("18-07")} المؤرخ في 10 يونيو 2018 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي.`,
    },
    sections: [
      {
        title: { fr: "Responsable du traitement", ar: "المسؤول عن المعالجة" },
        body: {
          fr: `Jazym, ${CONTACT_ADDRESS_FR}. Téléphone : ${CONTACT_PHONE}.`,
          ar: `جازيم، ${CONTACT_ADDRESS_AR}. الهاتف: ${PHONE_AR}.`,
        },
      },
      {
        title: { fr: "Données collectées", ar: "المعطيات المجمّعة" },
        body: {
          fr: "Lors d'une commande : nom, numéro de téléphone, wilaya, commune, mode de livraison, produits et options choisis, note facultative et, le cas échéant, l'image de couverture que vous envoyez. Aucun compte client, aucune adresse e-mail et aucune donnée bancaire ne sont demandés.",
          ar: "عند الطلب: الاسم، رقم الهاتف، الولاية، البلدية، طريقة التوصيل، المنتجات والخيارات المختارة، ملاحظة اختيارية، وعند الاقتضاء صورة الغلاف التي ترسلها. لا نطلب إنشاء حساب ولا بريدًا إلكترونيًا ولا أي معلومات بنكية.",
        },
      },
      {
        title: { fr: "Finalités", ar: "الأغراض" },
        body: {
          fr: "Traiter et confirmer votre commande par téléphone, la fabriquer, la livrer et assurer le service après-vente ; respecter nos obligations légales et comptables ; avec votre accord uniquement, mesurer l'efficacité de nos publicités.",
          ar: "معالجة طلبك وتأكيده هاتفيًا، وتصنيعه وتوصيله، وضمان خدمة ما بعد البيع؛ احترام التزاماتنا القانونية والمحاسبية؛ وبموافقتك فقط، قياس فعالية إعلاناتنا.",
        },
      },
      {
        title: { fr: "Destinataires", ar: "المستلمون" },
        body: {
          fr: "Le personnel habilité de Jazym ; la société de livraison chargée de votre colis (nom, téléphone, wilaya, commune, montant à encaisser) ; nos prestataires techniques : Vercel (hébergement du site), Supabase (base de données) et Resend (alerte e-mail interne à chaque nouvelle commande). Vos données ne sont jamais vendues.",
          ar: `موظفو جازيم المؤهلون؛ شركة التوصيل المكلّفة بطردك (الاسم، الهاتف، الولاية، البلدية، المبلغ المطلوب تحصيله)؛ ومزوّدونا التقنيون: ${iso("Vercel")} (استضافة الموقع)، ${iso("Supabase")} (قاعدة البيانات)، و${iso("Resend")} (تنبيه داخلي بالبريد الإلكتروني عند كل طلب جديد). لا تُباع معطياتك أبدًا.`,
        },
      },
      {
        title: { fr: "Hébergement hors d'Algérie", ar: "الاستضافة خارج الجزائر" },
        body: {
          fr: "Les serveurs de nos prestataires techniques sont situés hors d'Algérie. Les données y sont stockées de façon sécurisée et uniquement pour les finalités ci-dessus.",
          ar: "تقع خوادم مزوّدينا التقنيين خارج الجزائر. تُخزّن المعطيات فيها بشكل آمن ولأجل الأغراض المذكورة أعلاه فقط.",
        },
      },
      {
        title: { fr: "Durée de conservation", ar: "مدة الحفظ" },
        body: {
          fr: "Les données de commande sont conservées le temps nécessaire au traitement de la commande et au service après-vente, puis pendant les durées imposées par les obligations légales et comptables.",
          ar: "تُحفظ معطيات الطلب طوال المدة اللازمة لمعالجته ولخدمة ما بعد البيع، ثم طوال المدد التي تفرضها الالتزامات القانونية والمحاسبية.",
        },
      },
      {
        title: { fr: "Vos droits", ar: "حقوقك" },
        body: {
          fr: `Vous disposez d'un droit d'information, d'accès, de rectification et d'opposition sur vos données (loi n° 18-07, art. 32 à 36). Pour l'exercer, appelez-nous ou écrivez-nous sur WhatsApp au ${CONTACT_PHONE}. Vous pouvez aussi saisir l'Autorité nationale de protection des données à caractère personnel (ANPDP).`,
          ar: `لك الحق في الإعلام والاطلاع والتصحيح والاعتراض على معطياتك (القانون رقم ${iso("18-07")}، المواد من 32 إلى 36). لممارسته، اتصل بنا أو راسلنا عبر واتساب على ${PHONE_AR}. ويمكنك أيضًا إخطار السلطة الوطنية لحماية المعطيات ذات الطابع الشخصي.`,
        },
      },
      {
        title: { fr: "Sécurité", ar: "الأمان" },
        body: {
          fr: "Le site est servi en HTTPS. L'accès aux commandes est limité au personnel, par comptes nominatifs dont les droits sont restreints section par section.",
          ar: `يعمل الموقع عبر ${iso("HTTPS")}. الاطلاع على الطلبات مقتصر على الموظفين، بحسابات شخصية بصلاحيات محدودة حسب كل قسم.`,
        },
      },
    ],
  },

  cookies: {
    slug: "cookies",
    title: { fr: "Politique cookies", ar: "سياسة ملفات تعريف الارتباط" },
    intro: {
      fr: "Ce que le site enregistre dans votre navigateur, pourquoi, et comment changer d'avis à tout moment.",
      ar: "ما يحفظه الموقع في متصفحك، ولماذا، وكيف تغيّر رأيك في أي وقت.",
    },
    sections: [
      {
        title: { fr: "Strictement nécessaires", ar: "ضرورية تمامًا" },
        body: {
          fr: "Toujours actifs, sans eux le site ne fonctionne pas. Ils restent dans votre navigateur et ne servent pas à vous suivre :\n• jazym-cart : le contenu de votre panier (jusqu'à ce que vous le vidiez ou commandiez) ;\n• jazym-lang : la langue choisie ;\n• jazym-theme : le thème clair ou sombre ;\n• jazym-consent : votre choix sur les cookies (redemandé après 13 mois) ;\n• jazym-chunk-reloaded : évite une boucle de rechargement après une mise à jour du site (durée de l'onglet).\nL'espace d'administration, réservé au personnel, enregistre en plus un jeton de session de connexion.",
          ar: `مفعّلة دائمًا، ولا يعمل الموقع بدونها. تبقى في متصفحك ولا تُستعمل لتتبعك:\n• ${iso("jazym-cart")}: محتوى سلتك (إلى أن تفرغها أو تطلب)؛\n• ${iso("jazym-lang")}: اللغة المختارة؛\n• ${iso("jazym-theme")}: المظهر الفاتح أو الداكن؛\n• ${iso("jazym-consent")}: اختيارك بخصوص ملفات تعريف الارتباط (يُطلب مجددًا بعد 13 شهرًا)؛\n• ${iso("jazym-chunk-reloaded")}: يمنع إعادة التحميل المتكررة بعد تحديث الموقع (مدة الجلسة).\nفضاء الإدارة، المخصص للموظفين، يحفظ إضافةً إلى ذلك رمز جلسة الدخول.`,
        },
      },
      {
        title: { fr: "Mesure publicitaire (avec votre accord)", ar: "قياس الإعلانات (بموافقتك)" },
        body: {
          fr: "Uniquement si vous cliquez sur « Tout accepter » ou activez cette catégorie :\n• Pixel Meta (Facebook / Instagram) — cookie _fbp, 90 jours ;\n• Pixel TikTok — cookie _ttp, 13 mois.\nIls nous indiquent quelles publicités mènent à une visite ou à une commande. Tant que vous n'avez pas accepté, aucun de ces scripts n'est chargé.",
          ar: `فقط إذا ضغطت على «قبول الكل» أو فعّلت هذه الفئة:\n• بكسل ميتا (فيسبوك / إنستغرام) — ملف ${iso("_fbp")}، 90 يومًا؛\n• بكسل تيك توك — ملف ${iso("_ttp")}، 13 شهرًا.\nتخبرنا أي الإعلانات تؤدي إلى زيارة أو طلب. ما دمت لم توافق، لا يُحمَّل أي من هذه البرامج.`,
        },
      },
      {
        title: { fr: "Changer d'avis", ar: "تغيير رأيك" },
        body: {
          fr: "Cliquez sur « Gérer les cookies » en bas de chaque page pour modifier votre choix à tout moment. Vous pouvez aussi effacer les données du site dans les réglages de votre navigateur.",
          ar: "اضغط على «إدارة ملفات تعريف الارتباط» أسفل كل صفحة لتعديل اختيارك في أي وقت. ويمكنك أيضًا مسح بيانات الموقع من إعدادات متصفحك.",
        },
      },
    ],
  },
};

export const LEGAL_ORDER: LegalSlug[] = ["mentions-legales", "cgv", "confidentialite", "cookies"];

/** Footer / cross-link label for each legal page. */
export const LEGAL_NAV_KEYS: Record<LegalSlug, TranslationKey> = {
  "mentions-legales": "footerLegalNotice",
  cgv: "footerTerms",
  confidentialite: "footerPrivacy",
  cookies: "footerCookies",
};
