-- Placeholder copy for the 4 promo panels so they render something on first
-- launch instead of sitting empty/inactive. No image_url set — PanelSlot
-- renders a tasteful branded gradient fallback when there's no photo yet.
-- Edit or replace all of this anytime from /admin/panels.

update public.promo_panels set
  active = true,
  title_fr = 'Rentrée scolaire 2026',
  title_ar = 'الدخول المدرسي 2026',
  subtitle_fr = 'Cahiers personnalisés à votre nom, livrés partout en Algérie.',
  subtitle_ar = 'دفاتر مخصصة باسمك، توصيل إلى كامل الوطن.',
  link_url = '/boutique'
where slot = 'home_hero';

update public.promo_panels set
  active = true,
  title_fr = 'Kits de stratégies pédagogiques',
  title_ar = 'حقائب الاستراتيجيات البيداغوجية',
  subtitle_fr = 'Animez votre classe autrement — pigeon voyageur, train de mots, théière…',
  subtitle_ar = 'نشّط قسمك بطريقة مختلفة — الحمام الزاجل، قطار الكلمات، إبريق الشاي…',
  link_url = '/boutique/strategies'
where slot = 'home_mid';

update public.promo_panels set
  active = true,
  title_fr = 'Personnalisation offerte',
  title_ar = 'التخصيص مجانًا',
  subtitle_fr = 'Votre nom et votre matière imprimés sur chaque cahier, sans supplément.',
  subtitle_ar = 'اسمك ومادتك مطبوعان على كل دفتر، دون أي تكلفة إضافية.'
where slot = 'category_top';

update public.promo_panels set
  active = true,
  title_fr = 'Livraison 58 à 69 wilayas',
  title_ar = 'التوصيل إلى 58 حتى 69 ولاية',
  subtitle_fr = 'Paiement à la livraison, en espèces.',
  subtitle_ar = 'الدفع عند الاستلام نقدًا.'
where slot = 'cart_drawer';
