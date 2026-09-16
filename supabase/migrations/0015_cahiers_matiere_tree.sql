-- Full "Cahiers de l'enseignant" catalog tree: one subcategory per matière
-- (from the client's handwritten module list), each holding the full set of
-- teacher copybook types (from the client's price list), each type carrying
-- its real page-count/price variants. Image URLs are freely-licensed Wikimedia
-- Commons placeholders — swap for real product photos anytime from the admin.
--
-- NOTE ON UNCERTAIN NAMES: two matière labels were hard to read from the
-- handwritten source photo and are best-effort transcriptions:
--   - "langue-internationale" (لغة عالمية)
--   - "education-scientifique" (التربية العلمية والتكنولوجية)
-- Rename them from /admin/categories if they don't match your intent — it's
-- a plain text edit, nothing else depends on the wording.

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'langue-arabe', 'Langue arabe', 'اللغة العربية', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Layla_and_Majnun2.jpg/960px-Layla_and_Majnun2.jpg',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'langue-arabe');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'langue-francaise', 'Langue française', 'اللغة الفرنسية', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/French_language_and_conversation_%281891%29_%2814596463110%29.jpg/960px-French_language_and_conversation_%281891%29_%2814596463110%29.jpg',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'langue-francaise');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'langue-anglaise', 'Langue anglaise', 'اللغة الإنجليزية', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/First_Grade_Classroom-Egypt-2018.jpg/960px-First_Grade_Classroom-Egypt-2018.jpg',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'langue-anglaise');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'langue-internationale', 'Langue internationale', 'لغة عالمية', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Gustave_Dor%C3%A9_-_Miguel_de_Cervantes_-_Don_Quixote_-_Part_1_-_Chapter_1_-_Plate_1_%22A_world_of_disorderly_notions%2C_picked_out_of_his_books%2C_crowded_into_his_imagination%22.jpg/960px-thumbnail.jpg',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'langue-internationale');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'langue-de-base', 'Langue de base', 'اللغة الأساسية', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Armenian_alphabet_on_the_wall_of_primary_school.jpg/960px-Armenian_alphabet_on_the_wall_of_primary_school.jpg',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'langue-de-base');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'mathematiques', 'Mathématiques', 'الرياضيات', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Classroom_scene_in_Washington%2C_D.C._elementary_school_-_children_working_with_blocks_and_at_blackboard_in_mathematics_class_LCCN2001703711.jpg/960px-Classroom_scene_in_Washington%2C_D.C._elementary_school_-_children_working_with_blocks_and_at_blackboard_in_mathematics_class_LCCN2001703711.jpg',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'mathematiques');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'sciences-naturelles', 'Sciences naturelles et de la vie', 'علوم الطبيعة والحياة', 'https://upload.wikimedia.org/wikipedia/commons/8/82/Queensland_State_Archives_1656_Slacks_Creek_State_School_nature_study_ramble_April_1951.png',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'sciences-naturelles');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'education-scientifique', 'Éducation scientifique et technologique', 'التربية العلمية والتكنولوجية', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Out_of_classroom_experiments.jpg/960px-Out_of_classroom_experiments.jpg',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'education-scientifique');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'sciences-sociales', 'Sciences sociales', 'الاجتماعيات', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sias_Campus-_Classroom_Building_11_-_2007.jpg/960px-Sias_Campus-_Classroom_Building_11_-_2007.jpg',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'sciences-sociales');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'education-islamique', 'Éducation islamique', 'التربية الإسلامية', 'https://upload.wikimedia.org/wikipedia/commons/c/c4/AndalusQuran.JPG',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'education-islamique');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'informatique', 'Informatique', 'المعلوماتية', 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Computer_education.jpg',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'informatique');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'education-artistique', 'Éducation artistique', 'التربية التشكيلية', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Art_classes_for_children_LCCN98509582.jpg/960px-Art_classes_for_children_LCCN98509582.jpg',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'education-artistique');

insert into public.categories (slug, name_fr, name_ar, image_url, sort_order, parent_id)
select 'sensibilisation-orientation', 'Sensibilisation et orientation', 'التحسيس والتوجيه', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Good_Counsel_College_1930s.jpg/960px-Good_Counsel_College_1930s.jpg',
  (select coalesce(max(sort_order), 0) + 1 from public.categories where parent_id = (select id from public.categories where slug = 'cahiers')),
  (select id from public.categories where slug = 'cahiers')
where not exists (select 1 from public.categories where slug = 'sensibilisation-orientation');

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-langue-arabe', 'Cahier journal — Langue arabe', 'الدفتر اليومي - اللغة العربية', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'langue-arabe'), 100, 'JZC-001', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-langue-arabe');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-langue-arabe'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-langue-arabe', 'Cahier de notes — Langue arabe', 'دفتر التنقيط - اللغة العربية', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'langue-arabe'), 100, 'JZC-002', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-langue-arabe');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-langue-arabe'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-langue-arabe', 'Cahier de formation — Langue arabe', 'دفتر التكوين - اللغة العربية', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'langue-arabe'), 100, 'JZC-003', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-langue-arabe');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-langue-arabe'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-langue-arabe', 'Cahier de séminaires — Langue arabe', 'دفتر الندوات - اللغة العربية', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'langue-arabe'), 100, 'JZC-004', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-langue-arabe');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-langue-arabe'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-langue-arabe', 'Cahier de fiches (planning) — Langue arabe', 'دفتر المذكرات (التخطيط) - اللغة العربية', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'langue-arabe'), 100, 'JZC-005', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-langue-arabe');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-langue-arabe'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-langue-arabe', 'Cahier de remédiation — Langue arabe', 'دفتر المعالجة - اللغة العربية', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'langue-arabe'), 100, 'JZC-006', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-langue-arabe');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-langue-arabe'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-langue-arabe', 'Registre d''appel — Langue arabe', 'دفتر المناداة - اللغة العربية', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'langue-arabe'), 100, 'JZC-007', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-langue-arabe');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-langue-arabe'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-langue-arabe', 'Cahier de roulement — Langue arabe', 'دفتر التداول - اللغة العربية', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'langue-arabe'), 100, 'JZC-008', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-langue-arabe');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-langue-arabe'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-langue-arabe'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-langue-francaise', 'Cahier journal — Langue française', 'الدفتر اليومي - اللغة الفرنسية', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'langue-francaise'), 100, 'JZC-009', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-langue-francaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-langue-francaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-langue-francaise', 'Cahier de notes — Langue française', 'دفتر التنقيط - اللغة الفرنسية', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'langue-francaise'), 100, 'JZC-010', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-langue-francaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-langue-francaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-langue-francaise', 'Cahier de formation — Langue française', 'دفتر التكوين - اللغة الفرنسية', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'langue-francaise'), 100, 'JZC-011', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-langue-francaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-langue-francaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-langue-francaise', 'Cahier de séminaires — Langue française', 'دفتر الندوات - اللغة الفرنسية', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'langue-francaise'), 100, 'JZC-012', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-langue-francaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-langue-francaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-langue-francaise', 'Cahier de fiches (planning) — Langue française', 'دفتر المذكرات (التخطيط) - اللغة الفرنسية', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'langue-francaise'), 100, 'JZC-013', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-langue-francaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-langue-francaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-langue-francaise', 'Cahier de remédiation — Langue française', 'دفتر المعالجة - اللغة الفرنسية', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'langue-francaise'), 100, 'JZC-014', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-langue-francaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-langue-francaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-langue-francaise', 'Registre d''appel — Langue française', 'دفتر المناداة - اللغة الفرنسية', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'langue-francaise'), 100, 'JZC-015', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-langue-francaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-langue-francaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-langue-francaise', 'Cahier de roulement — Langue française', 'دفتر التداول - اللغة الفرنسية', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'langue-francaise'), 100, 'JZC-016', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-langue-francaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-langue-francaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-langue-francaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-langue-anglaise', 'Cahier journal — Langue anglaise', 'الدفتر اليومي - اللغة الإنجليزية', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'langue-anglaise'), 100, 'JZC-017', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-langue-anglaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-langue-anglaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-langue-anglaise', 'Cahier de notes — Langue anglaise', 'دفتر التنقيط - اللغة الإنجليزية', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'langue-anglaise'), 100, 'JZC-018', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-langue-anglaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-langue-anglaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-langue-anglaise', 'Cahier de formation — Langue anglaise', 'دفتر التكوين - اللغة الإنجليزية', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'langue-anglaise'), 100, 'JZC-019', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-langue-anglaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-langue-anglaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-langue-anglaise', 'Cahier de séminaires — Langue anglaise', 'دفتر الندوات - اللغة الإنجليزية', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'langue-anglaise'), 100, 'JZC-020', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-langue-anglaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-langue-anglaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-langue-anglaise', 'Cahier de fiches (planning) — Langue anglaise', 'دفتر المذكرات (التخطيط) - اللغة الإنجليزية', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'langue-anglaise'), 100, 'JZC-021', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-langue-anglaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-langue-anglaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-langue-anglaise', 'Cahier de remédiation — Langue anglaise', 'دفتر المعالجة - اللغة الإنجليزية', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'langue-anglaise'), 100, 'JZC-022', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-langue-anglaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-langue-anglaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-langue-anglaise', 'Registre d''appel — Langue anglaise', 'دفتر المناداة - اللغة الإنجليزية', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'langue-anglaise'), 100, 'JZC-023', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-langue-anglaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-langue-anglaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-langue-anglaise', 'Cahier de roulement — Langue anglaise', 'دفتر التداول - اللغة الإنجليزية', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'langue-anglaise'), 100, 'JZC-024', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-langue-anglaise');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-langue-anglaise'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-langue-anglaise'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-langue-internationale', 'Cahier journal — Langue internationale', 'الدفتر اليومي - لغة عالمية', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'langue-internationale'), 100, 'JZC-025', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-langue-internationale');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-langue-internationale'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-langue-internationale', 'Cahier de notes — Langue internationale', 'دفتر التنقيط - لغة عالمية', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'langue-internationale'), 100, 'JZC-026', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-langue-internationale');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-langue-internationale'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-langue-internationale', 'Cahier de formation — Langue internationale', 'دفتر التكوين - لغة عالمية', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'langue-internationale'), 100, 'JZC-027', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-langue-internationale');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-langue-internationale'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-langue-internationale', 'Cahier de séminaires — Langue internationale', 'دفتر الندوات - لغة عالمية', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'langue-internationale'), 100, 'JZC-028', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-langue-internationale');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-langue-internationale'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-langue-internationale', 'Cahier de fiches (planning) — Langue internationale', 'دفتر المذكرات (التخطيط) - لغة عالمية', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'langue-internationale'), 100, 'JZC-029', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-langue-internationale');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-langue-internationale'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-langue-internationale', 'Cahier de remédiation — Langue internationale', 'دفتر المعالجة - لغة عالمية', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'langue-internationale'), 100, 'JZC-030', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-langue-internationale');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-langue-internationale'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-langue-internationale', 'Registre d''appel — Langue internationale', 'دفتر المناداة - لغة عالمية', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'langue-internationale'), 100, 'JZC-031', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-langue-internationale');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-langue-internationale'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-langue-internationale', 'Cahier de roulement — Langue internationale', 'دفتر التداول - لغة عالمية', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'langue-internationale'), 100, 'JZC-032', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-langue-internationale');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-langue-internationale'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-langue-internationale'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-langue-de-base', 'Cahier journal — Langue de base', 'الدفتر اليومي - اللغة الأساسية', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'langue-de-base'), 100, 'JZC-033', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-langue-de-base');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-langue-de-base'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-langue-de-base', 'Cahier de notes — Langue de base', 'دفتر التنقيط - اللغة الأساسية', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'langue-de-base'), 100, 'JZC-034', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-langue-de-base');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-langue-de-base'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-langue-de-base', 'Cahier de formation — Langue de base', 'دفتر التكوين - اللغة الأساسية', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'langue-de-base'), 100, 'JZC-035', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-langue-de-base');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-langue-de-base'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-langue-de-base', 'Cahier de séminaires — Langue de base', 'دفتر الندوات - اللغة الأساسية', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'langue-de-base'), 100, 'JZC-036', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-langue-de-base');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-langue-de-base'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-langue-de-base', 'Cahier de fiches (planning) — Langue de base', 'دفتر المذكرات (التخطيط) - اللغة الأساسية', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'langue-de-base'), 100, 'JZC-037', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-langue-de-base');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-langue-de-base'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-langue-de-base', 'Cahier de remédiation — Langue de base', 'دفتر المعالجة - اللغة الأساسية', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'langue-de-base'), 100, 'JZC-038', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-langue-de-base');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-langue-de-base'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-langue-de-base', 'Registre d''appel — Langue de base', 'دفتر المناداة - اللغة الأساسية', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'langue-de-base'), 100, 'JZC-039', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-langue-de-base');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-langue-de-base'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-langue-de-base', 'Cahier de roulement — Langue de base', 'دفتر التداول - اللغة الأساسية', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'langue-de-base'), 100, 'JZC-040', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-langue-de-base');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-langue-de-base'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-langue-de-base'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-mathematiques', 'Cahier journal — Mathématiques', 'الدفتر اليومي - الرياضيات', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'mathematiques'), 100, 'JZC-041', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-mathematiques');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-mathematiques'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-mathematiques', 'Cahier de notes — Mathématiques', 'دفتر التنقيط - الرياضيات', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'mathematiques'), 100, 'JZC-042', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-mathematiques');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-mathematiques'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-mathematiques', 'Cahier de formation — Mathématiques', 'دفتر التكوين - الرياضيات', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'mathematiques'), 100, 'JZC-043', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-mathematiques');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-mathematiques'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-mathematiques', 'Cahier de séminaires — Mathématiques', 'دفتر الندوات - الرياضيات', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'mathematiques'), 100, 'JZC-044', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-mathematiques');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-mathematiques'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-mathematiques', 'Cahier de fiches (planning) — Mathématiques', 'دفتر المذكرات (التخطيط) - الرياضيات', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'mathematiques'), 100, 'JZC-045', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-mathematiques');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-mathematiques'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-mathematiques', 'Cahier de remédiation — Mathématiques', 'دفتر المعالجة - الرياضيات', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'mathematiques'), 100, 'JZC-046', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-mathematiques');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-mathematiques'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-mathematiques', 'Registre d''appel — Mathématiques', 'دفتر المناداة - الرياضيات', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'mathematiques'), 100, 'JZC-047', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-mathematiques');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-mathematiques'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-mathematiques', 'Cahier de roulement — Mathématiques', 'دفتر التداول - الرياضيات', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'mathematiques'), 100, 'JZC-048', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-mathematiques');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-mathematiques'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-mathematiques'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-sciences-naturelles', 'Cahier journal — Sciences naturelles et de la vie', 'الدفتر اليومي - علوم الطبيعة والحياة', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'sciences-naturelles'), 100, 'JZC-049', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-sciences-naturelles');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-sciences-naturelles'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-sciences-naturelles', 'Cahier de notes — Sciences naturelles et de la vie', 'دفتر التنقيط - علوم الطبيعة والحياة', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'sciences-naturelles'), 100, 'JZC-050', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-sciences-naturelles');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-sciences-naturelles'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-sciences-naturelles', 'Cahier de formation — Sciences naturelles et de la vie', 'دفتر التكوين - علوم الطبيعة والحياة', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'sciences-naturelles'), 100, 'JZC-051', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-sciences-naturelles');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-sciences-naturelles'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-sciences-naturelles', 'Cahier de séminaires — Sciences naturelles et de la vie', 'دفتر الندوات - علوم الطبيعة والحياة', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'sciences-naturelles'), 100, 'JZC-052', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-sciences-naturelles');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-sciences-naturelles'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-sciences-naturelles', 'Cahier de fiches (planning) — Sciences naturelles et de la vie', 'دفتر المذكرات (التخطيط) - علوم الطبيعة والحياة', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'sciences-naturelles'), 100, 'JZC-053', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-sciences-naturelles');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-sciences-naturelles'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-sciences-naturelles', 'Cahier de remédiation — Sciences naturelles et de la vie', 'دفتر المعالجة - علوم الطبيعة والحياة', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'sciences-naturelles'), 100, 'JZC-054', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-sciences-naturelles');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-sciences-naturelles'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-sciences-naturelles', 'Registre d''appel — Sciences naturelles et de la vie', 'دفتر المناداة - علوم الطبيعة والحياة', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'sciences-naturelles'), 100, 'JZC-055', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-sciences-naturelles');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-sciences-naturelles'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-sciences-naturelles', 'Cahier de roulement — Sciences naturelles et de la vie', 'دفتر التداول - علوم الطبيعة والحياة', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'sciences-naturelles'), 100, 'JZC-056', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-sciences-naturelles');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-sciences-naturelles'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-sciences-naturelles'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-education-scientifique', 'Cahier journal — Éducation scientifique et technologique', 'الدفتر اليومي - التربية العلمية والتكنولوجية', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'education-scientifique'), 100, 'JZC-057', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-education-scientifique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-education-scientifique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-education-scientifique', 'Cahier de notes — Éducation scientifique et technologique', 'دفتر التنقيط - التربية العلمية والتكنولوجية', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'education-scientifique'), 100, 'JZC-058', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-education-scientifique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-education-scientifique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-education-scientifique', 'Cahier de formation — Éducation scientifique et technologique', 'دفتر التكوين - التربية العلمية والتكنولوجية', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'education-scientifique'), 100, 'JZC-059', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-education-scientifique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-education-scientifique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-education-scientifique', 'Cahier de séminaires — Éducation scientifique et technologique', 'دفتر الندوات - التربية العلمية والتكنولوجية', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'education-scientifique'), 100, 'JZC-060', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-education-scientifique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-education-scientifique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-education-scientifique', 'Cahier de fiches (planning) — Éducation scientifique et technologique', 'دفتر المذكرات (التخطيط) - التربية العلمية والتكنولوجية', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'education-scientifique'), 100, 'JZC-061', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-education-scientifique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-education-scientifique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-education-scientifique', 'Cahier de remédiation — Éducation scientifique et technologique', 'دفتر المعالجة - التربية العلمية والتكنولوجية', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'education-scientifique'), 100, 'JZC-062', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-education-scientifique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-education-scientifique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-education-scientifique', 'Registre d''appel — Éducation scientifique et technologique', 'دفتر المناداة - التربية العلمية والتكنولوجية', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'education-scientifique'), 100, 'JZC-063', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-education-scientifique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-education-scientifique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-education-scientifique', 'Cahier de roulement — Éducation scientifique et technologique', 'دفتر التداول - التربية العلمية والتكنولوجية', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'education-scientifique'), 100, 'JZC-064', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-education-scientifique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-education-scientifique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-education-scientifique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-sciences-sociales', 'Cahier journal — Sciences sociales', 'الدفتر اليومي - الاجتماعيات', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'sciences-sociales'), 100, 'JZC-065', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-sciences-sociales');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-sciences-sociales'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-sciences-sociales', 'Cahier de notes — Sciences sociales', 'دفتر التنقيط - الاجتماعيات', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'sciences-sociales'), 100, 'JZC-066', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-sciences-sociales');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-sciences-sociales'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-sciences-sociales', 'Cahier de formation — Sciences sociales', 'دفتر التكوين - الاجتماعيات', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'sciences-sociales'), 100, 'JZC-067', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-sciences-sociales');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-sciences-sociales'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-sciences-sociales', 'Cahier de séminaires — Sciences sociales', 'دفتر الندوات - الاجتماعيات', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'sciences-sociales'), 100, 'JZC-068', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-sciences-sociales');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-sciences-sociales'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-sciences-sociales', 'Cahier de fiches (planning) — Sciences sociales', 'دفتر المذكرات (التخطيط) - الاجتماعيات', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'sciences-sociales'), 100, 'JZC-069', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-sciences-sociales');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-sciences-sociales'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-sciences-sociales', 'Cahier de remédiation — Sciences sociales', 'دفتر المعالجة - الاجتماعيات', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'sciences-sociales'), 100, 'JZC-070', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-sciences-sociales');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-sciences-sociales'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-sciences-sociales', 'Registre d''appel — Sciences sociales', 'دفتر المناداة - الاجتماعيات', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'sciences-sociales'), 100, 'JZC-071', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-sciences-sociales');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-sciences-sociales'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-sciences-sociales', 'Cahier de roulement — Sciences sociales', 'دفتر التداول - الاجتماعيات', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'sciences-sociales'), 100, 'JZC-072', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-sciences-sociales');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-sciences-sociales'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-sciences-sociales'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-education-islamique', 'Cahier journal — Éducation islamique', 'الدفتر اليومي - التربية الإسلامية', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'education-islamique'), 100, 'JZC-073', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-education-islamique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-education-islamique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-education-islamique', 'Cahier de notes — Éducation islamique', 'دفتر التنقيط - التربية الإسلامية', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'education-islamique'), 100, 'JZC-074', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-education-islamique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-education-islamique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-education-islamique', 'Cahier de formation — Éducation islamique', 'دفتر التكوين - التربية الإسلامية', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'education-islamique'), 100, 'JZC-075', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-education-islamique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-education-islamique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-education-islamique', 'Cahier de séminaires — Éducation islamique', 'دفتر الندوات - التربية الإسلامية', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'education-islamique'), 100, 'JZC-076', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-education-islamique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-education-islamique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-education-islamique', 'Cahier de fiches (planning) — Éducation islamique', 'دفتر المذكرات (التخطيط) - التربية الإسلامية', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'education-islamique'), 100, 'JZC-077', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-education-islamique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-education-islamique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-education-islamique', 'Cahier de remédiation — Éducation islamique', 'دفتر المعالجة - التربية الإسلامية', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'education-islamique'), 100, 'JZC-078', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-education-islamique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-education-islamique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-education-islamique', 'Registre d''appel — Éducation islamique', 'دفتر المناداة - التربية الإسلامية', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'education-islamique'), 100, 'JZC-079', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-education-islamique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-education-islamique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-education-islamique', 'Cahier de roulement — Éducation islamique', 'دفتر التداول - التربية الإسلامية', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'education-islamique'), 100, 'JZC-080', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-education-islamique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-education-islamique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-education-islamique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-informatique', 'Cahier journal — Informatique', 'الدفتر اليومي - المعلوماتية', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'informatique'), 100, 'JZC-081', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-informatique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-informatique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-informatique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-informatique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-informatique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-informatique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-informatique', 'Cahier de notes — Informatique', 'دفتر التنقيط - المعلوماتية', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'informatique'), 100, 'JZC-082', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-informatique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-informatique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-informatique', 'Cahier de formation — Informatique', 'دفتر التكوين - المعلوماتية', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'informatique'), 100, 'JZC-083', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-informatique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-informatique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-informatique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-informatique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-informatique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-informatique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-informatique', 'Cahier de séminaires — Informatique', 'دفتر الندوات - المعلوماتية', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'informatique'), 100, 'JZC-084', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-informatique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-informatique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-informatique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-informatique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-informatique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-informatique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-informatique', 'Cahier de fiches (planning) — Informatique', 'دفتر المذكرات (التخطيط) - المعلوماتية', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'informatique'), 100, 'JZC-085', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-informatique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-informatique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-informatique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-informatique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-informatique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-informatique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-informatique', 'Cahier de remédiation — Informatique', 'دفتر المعالجة - المعلوماتية', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'informatique'), 100, 'JZC-086', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-informatique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-informatique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-informatique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-informatique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-informatique', 'Registre d''appel — Informatique', 'دفتر المناداة - المعلوماتية', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'informatique'), 100, 'JZC-087', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-informatique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-informatique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-informatique', 'Cahier de roulement — Informatique', 'دفتر التداول - المعلوماتية', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'informatique'), 100, 'JZC-088', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-informatique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-informatique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-informatique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-informatique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-education-artistique', 'Cahier journal — Éducation artistique', 'الدفتر اليومي - التربية التشكيلية', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'education-artistique'), 100, 'JZC-089', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-education-artistique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-education-artistique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-education-artistique', 'Cahier de notes — Éducation artistique', 'دفتر التنقيط - التربية التشكيلية', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'education-artistique'), 100, 'JZC-090', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-education-artistique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-education-artistique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-education-artistique', 'Cahier de formation — Éducation artistique', 'دفتر التكوين - التربية التشكيلية', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'education-artistique'), 100, 'JZC-091', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-education-artistique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-education-artistique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-education-artistique', 'Cahier de séminaires — Éducation artistique', 'دفتر الندوات - التربية التشكيلية', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'education-artistique'), 100, 'JZC-092', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-education-artistique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-education-artistique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-education-artistique', 'Cahier de fiches (planning) — Éducation artistique', 'دفتر المذكرات (التخطيط) - التربية التشكيلية', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'education-artistique'), 100, 'JZC-093', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-education-artistique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-education-artistique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-education-artistique', 'Cahier de remédiation — Éducation artistique', 'دفتر المعالجة - التربية التشكيلية', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'education-artistique'), 100, 'JZC-094', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-education-artistique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-education-artistique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-education-artistique', 'Registre d''appel — Éducation artistique', 'دفتر المناداة - التربية التشكيلية', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'education-artistique'), 100, 'JZC-095', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-education-artistique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-education-artistique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-education-artistique', 'Cahier de roulement — Éducation artistique', 'دفتر التداول - التربية التشكيلية', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'education-artistique'), 100, 'JZC-096', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-education-artistique');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-education-artistique'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-education-artistique'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-journal-sensibilisation-orientation', 'Cahier journal — Sensibilisation et orientation', 'الدفتر اليومي - التحسيس والتوجيه', 'Le cahier journal quotidien de l''enseignant : une page par jour, repères de séances et de progression. Couverture personnalisée à votre nom et votre matière.', 'الدفتر اليومي للأستاذ: صفحة لكل يوم، مع معالم الحصص والتدرّج. غلاف مخصّص باسمك ومادّتك.',
  array['Papier 80 g anti-transparence','Reliure cousue résistante','Nom + matière imprimés sur la couverture','Format A4'], array['ورق 80 غ غير شفّاف','تجليد مخيط متين','الاسم + المادة مطبوعان على الغلاف','قياس A4'],
  2200, (select id from public.categories where slug = 'sensibilisation-orientation'), 100, 'JZC-097', 'active'
where not exists (select 1 from public.products where slug = 'cahier-journal-sensibilisation-orientation');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Wright_diary.jpg/960px-Wright_diary.jpg', 0
from public.products p
where p.slug = 'cahier-journal-sensibilisation-orientation'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-journal-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-journal-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-journal-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-journal-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-notes-sensibilisation-orientation', 'Cahier de notes — Sensibilisation et orientation', 'دفتر التنقيط - التحسيس والتوجيه', 'Cahier de notes et d''évaluation — grilles prêtes à remplir pour suivre les résultats de vos élèves sur toute l''année.', 'دفتر التنقيط والتقويم — جداول جاهزة للتعبئة لمتابعة نتائج تلاميذك طوال السنة.',
  array['60 pages quadrillées','Grilles de notes pré-imprimées','Couverture rigide personnalisée'], array['60 صفحة مسطّرة','جداول تنقيط مطبوعة مسبقًا','غلاف صلب مخصّص'],
  1700, (select id from public.categories where slug = 'sensibilisation-orientation'), 100, 'JZC-098', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-notes-sensibilisation-orientation');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Russian_realschule_report_card_1908.jpg/960px-Russian_realschule_report_card_1908.jpg', 0
from public.products p
where p.slug = 'cahier-de-notes-sensibilisation-orientation'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-formation-sensibilisation-orientation', 'Cahier de formation — Sensibilisation et orientation', 'دفتر التكوين - التحسيس والتوجيه', 'Pour consigner les journées de formation, les apports des inspecteurs et vos notes de perfectionnement.', 'لتدوين أيام التكوين، وملاحظات المفتشين، ومذكّراتك حول التطوير المهني.',
  array['Papier 80 g','Intercalaires par thème','Nom imprimé sur la couverture'], array['ورق 80 غ','فواصل حسب المحور','الاسم مطبوع على الغلاف'],
  2200, (select id from public.categories where slug = 'sensibilisation-orientation'), 100, 'JZC-099', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-formation-sensibilisation-orientation');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg/960px-Teachers_in_Wikipedia_Workshop_Rajshahi_01.jpg', 0
from public.products p
where p.slug = 'cahier-de-formation-sensibilisation-orientation'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-formation-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-formation-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-formation-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-formation-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-seminaires-sensibilisation-orientation', 'Cahier de séminaires — Sensibilisation et orientation', 'دفتر الندوات - التحسيس والتوجيه', 'Cahier dédié aux séminaires pédagogiques et aux comptes-rendus de réunions de coordination.', 'دفتر خاص بالندوات البيداغوجية ومحاضر اجتماعات التنسيق.',
  array['Papier 80 g','Pages numérotées','Couverture personnalisée'], array['ورق 80 غ','صفحات مرقّمة','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'sensibilisation-orientation'), 100, 'JZC-100', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-seminaires-sensibilisation-orientation');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg/960px-Supernova_Seminar_Room_%28upr_IMG_5587-CC%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-seminaires-sensibilisation-orientation'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-seminaires-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-seminaires-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-seminaires-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-seminaires-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-fiches-sensibilisation-orientation', 'Cahier de fiches (planning) — Sensibilisation et orientation', 'دفتر المذكرات (التخطيط) - التحسيس والتوجيه', 'Cahier de préparation des fiches de leçons : trame de séance, objectifs, déroulement et évaluation.', 'دفتر تحضير مذكّرات الدروس: هيكل الحصة، الأهداف، السيرورة والتقويم.',
  array['Trame de fiche pré-imprimée','Papier 80 g','Nom + niveau sur la couverture'], array['هيكل مذكّرة مطبوع مسبقًا','ورق 80 غ','الاسم + المستوى على الغلاف'],
  2200, (select id from public.categories where slug = 'sensibilisation-orientation'), 100, 'JZC-101', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-fiches-sensibilisation-orientation');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg/960px-Working_on_a_planning_session_with_stationery_items%2C_notebook%2C_and_colorful_pencils_on_a_wooden_desk.jpg', 0
from public.products p
where p.slug = 'cahier-de-fiches-sensibilisation-orientation'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-fiches-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-fiches-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1),
  ((select id from public.products where slug = 'cahier-de-fiches-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '200 pages', '200 صفحة', 3200, 100, 2),
  ((select id from public.products where slug = 'cahier-de-fiches-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '300 pages', '300 صفحة', 3700, 100, 3)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-remediation-sensibilisation-orientation', 'Cahier de remédiation — Sensibilisation et orientation', 'دفتر المعالجة - التحسيس والتوجيه', 'Pour planifier et suivre les séances de remédiation : difficultés repérées, actions, progrès.', 'لتخطيط ومتابعة حصص المعالجة: الصعوبات المرصودة، الإجراءات، التقدّم.',
  array['Grilles de suivi individuel','Papier 80 g','Couverture personnalisée'], array['جداول متابعة فردية','ورق 80 غ','غلاف مخصّص'],
  2200, (select id from public.categories where slug = 'sensibilisation-orientation'), 100, 'JZC-102', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-remediation-sensibilisation-orientation');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Violinlesson.JPG/960px-Violinlesson.JPG', 0
from public.products p
where p.slug = 'cahier-de-remediation-sensibilisation-orientation'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-remediation-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 2200, 100, 0),
  ((select id from public.products where slug = 'cahier-de-remediation-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2700, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'registre-appel-sensibilisation-orientation', 'Registre d''appel — Sensibilisation et orientation', 'دفتر المناداة - التحسيس والتوجيه', 'Registre d''appel et de présence — mise en page claire, une classe par double-page.', 'دفتر المناداة والحضور — تصميم واضح، قسم واحد في كل صفحتين متقابلتين.',
  array['40 pages','Colonnes de présence pré-imprimées','Couverture rigide'], array['40 صفحة','أعمدة حضور مطبوعة مسبقًا','غلاف صلب'],
  1400, (select id from public.categories where slug = 'sensibilisation-orientation'), 100, 'JZC-103', 'active'
where not exists (select 1 from public.products where slug = 'registre-appel-sensibilisation-orientation');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/1964_Hammond_Slides_Student_Raising_Hand.jpg/960px-1964_Hammond_Slides_Student_Raising_Hand.jpg', 0
from public.products p
where p.slug = 'registre-appel-sensibilisation-orientation'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.products (
  slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
  price, category_id, stock, style_code, status
)
select 'cahier-de-roulement-sensibilisation-orientation', 'Cahier de roulement — Sensibilisation et orientation', 'دفتر التداول - التحسيس والتوجيه', 'Cahier de roulement pour la circulation de l''information entre enseignants et administration.', 'دفتر التداول لتمرير المعلومة بين الأساتذة والإدارة.',
  array['Papier 70 g','Pages lignées','Couverture personnalisée'], array['ورق 70 غ','صفحات مسطّرة','غلاف مخصّص'],
  1700, (select id from public.categories where slug = 'sensibilisation-orientation'), 100, 'JZC-104', 'active'
where not exists (select 1 from public.products where slug = 'cahier-de-roulement-sensibilisation-orientation');

insert into public.product_images (product_id, url, sort_order)
select p.id, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg/960px-Collecting_books_for_readers_in_the_reserve_stacks%2C_1964_%283925726691%29.jpg', 0
from public.products p
where p.slug = 'cahier-de-roulement-sensibilisation-orientation'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (
  product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order
)
select v.* from (values
  ((select id from public.products where slug = 'cahier-de-roulement-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '120 pages', '120 صفحة', 1700, 100, 0),
  ((select id from public.products where slug = 'cahier-de-roulement-sensibilisation-orientation'), 'Nombre de pages', 'عدد الصفحات', '160 pages', '160 صفحة', 2200, 100, 1)
) as v(product_id, option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar, price, stock, sort_order)
where not exists (
  select 1 from public.product_variants pv where pv.product_id = v.product_id
);


