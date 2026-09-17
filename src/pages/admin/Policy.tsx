import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader, LoadError } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import {
  useAdminPolicySections,
  useAdminPolicySettings,
  useDeletePolicySection,
  useSavePolicySection,
  useSavePolicySettings,
} from "@/hooks/useAdminPolicy";
import { BUILTIN_POLICY_SECTIONS } from "@/hooks/usePolicyContent";
import { useI18n } from "@/i18n/LanguageProvider";
import { translations, type TranslationKey } from "@/i18n/translations";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PolicySection } from "@/types/db";

function builtinText(key: string, base: "title" | "body", lang: "fr" | "ar"): string {
  const k = `${key}_${base}` as TranslationKey;
  const dict = translations[lang] as Record<TranslationKey, string>;
  return dict[k] ?? "";
}

export default function Policy() {
  const { t } = useI18n();
  const toast = useAdminToast();
  const settingsQ = useAdminPolicySettings();
  const sectionsQ = useAdminPolicySections();
  const saveSettings = useSavePolicySettings();
  const saveSection = useSavePolicySection();

  const [tagFr, setTagFr] = useState("");
  const [tagAr, setTagAr] = useState("");
  const [titleFr, setTitleFr] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [introFr, setIntroFr] = useState("");
  const [introAr, setIntroAr] = useState("");
  const [updatedFr, setUpdatedFr] = useState("");
  const [updatedAr, setUpdatedAr] = useState("");

  useEffect(() => {
    const s = settingsQ.data;
    if (!s) return;
    setTagFr(s.tag_fr ?? "");
    setTagAr(s.tag_ar ?? "");
    setTitleFr(s.title_fr ?? "");
    setTitleAr(s.title_ar ?? "");
    setIntroFr(s.intro_fr ?? "");
    setIntroAr(s.intro_ar ?? "");
    setUpdatedFr(s.updated_label_fr ?? "");
    setUpdatedAr(s.updated_label_ar ?? "");
  }, [settingsQ.data]);

  if (!isSupabaseConfigured) {
    return (
      <div>
        <AdminPageHeader title={t("polEditTitle")} description={t("polEditIntro")} />
        <LoadError message={t("adminNeedsSupabase")} />
      </div>
    );
  }

  if (settingsQ.isLoading || sectionsQ.isLoading) return <PageLoader />;
  if (settingsQ.isError || sectionsQ.isError) {
    return <LoadError message={t("adminLoadError")} />;
  }

  const sections = sectionsQ.data ?? [];
  const builtinKeys = new Set<string>(BUILTIN_POLICY_SECTIONS.map((b) => b.builtin_key));
  const missingBuiltins = BUILTIN_POLICY_SECTIONS.filter(
    (b) => !sections.some((s) => s.builtin_key === b.builtin_key),
  );

  async function onSaveSettings() {
    try {
      await saveSettings.mutateAsync({
        tag_fr: tagFr || null,
        tag_ar: tagAr || null,
        title_fr: titleFr || null,
        title_ar: titleAr || null,
        intro_fr: introFr || null,
        intro_ar: introAr || null,
        updated_label_fr: updatedFr || null,
        updated_label_ar: updatedAr || null,
      });
      toast.success(t("adminSaved"));
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  async function seedBuiltin(key: string, icon: string, order: number) {
    try {
      await saveSection.mutateAsync({
        builtin_key: key,
        icon,
        sort_order: order,
        active: true,
      });
      toast.success(t("adminSaved"));
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  async function addCustom() {
    try {
      await saveSection.mutateAsync({
        builtin_key: null,
        icon: null,
        sort_order: sections.length + 10,
        active: true,
        title_fr: translations.fr.polNewSectionTitle,
        title_ar: translations.ar.polNewSectionTitle,
        body_fr: translations.fr.polNewSectionBody,
        body_ar: translations.ar.polNewSectionBody,
      });
      toast.success(t("adminSaved"));
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  return (
    <div>
      <AdminPageHeader title={t("polEditTitle")} description={t("polEditIntro")} />

      <AdminCard className="mb-6 flex flex-col gap-4">
        <TwoLang
          label={t("polTag")}
          fr={tagFr}
          ar={tagAr}
          setFr={setTagFr}
          setAr={setTagAr}
          placeholderFr={translations.fr.footerPolicy}
          placeholderAr={translations.ar.footerPolicy}
        />
        <TwoLang
          label={t("policyTitle")}
          fr={titleFr}
          ar={titleAr}
          setFr={setTitleFr}
          setAr={setTitleAr}
          placeholderFr={translations.fr.policyTitle}
          placeholderAr={translations.ar.policyTitle}
        />
        <TwoLang
          label={t("policyIntro")}
          fr={introFr}
          ar={introAr}
          setFr={setIntroFr}
          setAr={setIntroAr}
          placeholderFr={translations.fr.policyIntro}
          placeholderAr={translations.ar.policyIntro}
          textarea
        />
        <TwoLang
          label={t("policyUpdated")}
          fr={updatedFr}
          ar={updatedAr}
          setFr={setUpdatedFr}
          setAr={setUpdatedAr}
          placeholderFr={translations.fr.policyUpdated}
          placeholderAr={translations.ar.policyUpdated}
        />
        <Button onClick={onSaveSettings} disabled={saveSettings.isPending}>
          {saveSettings.isPending ? <Loader2 size={15} className="animate-spin" /> : t("save")}
        </Button>
      </AdminCard>

      {missingBuiltins.length > 0 && (
        <AdminCard className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">{t("polAddSection")}:</span>
          {missingBuiltins.map((b, i) => (
            <button
              key={b.builtin_key}
              type="button"
              onClick={() => seedBuiltin(b.builtin_key, b.icon, i)}
              className="rounded-full border border-line px-3 py-1 text-xs text-ink hover:border-brand hover:text-brand"
            >
              + {builtinText(b.builtin_key, "title", "fr")}
            </button>
          ))}
        </AdminCard>
      )}

      <div className="mb-4 flex flex-col gap-3">
        {sections.map((section) => (
          <SectionEditor
            key={section.id}
            section={section}
            isBuiltin={!!section.builtin_key && builtinKeys.has(section.builtin_key)}
          />
        ))}
      </div>

      <Button variant="secondary" size="sm" onClick={addCustom}>
        <Plus size={14} />
        {t("polAddSection")}
      </Button>
    </div>
  );
}

function TwoLang({
  label,
  fr,
  ar,
  setFr,
  setAr,
  placeholderFr,
  placeholderAr,
  textarea,
}: {
  label: string;
  fr: string;
  ar: string;
  setFr: (v: string) => void;
  setAr: (v: string) => void;
  placeholderFr: string;
  placeholderAr: string;
  textarea?: boolean;
}) {
  const Comp = textarea ? Textarea : Input;
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="grid gap-2 sm:grid-cols-2">
        <Comp placeholder={placeholderFr} value={fr} onChange={(e) => setFr(e.target.value)} />
        <Comp
          dir="rtl"
          placeholder={placeholderAr}
          value={ar}
          onChange={(e) => setAr(e.target.value)}
        />
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  isBuiltin,
}: {
  section: PolicySection;
  isBuiltin: boolean;
}) {
  const { t } = useI18n();
  const toast = useAdminToast();
  const save = useSavePolicySection();
  const del = useDeletePolicySection();

  const [titleFr, setTitleFr] = useState(section.title_fr ?? "");
  const [titleAr, setTitleAr] = useState(section.title_ar ?? "");
  const [bodyFr, setBodyFr] = useState(section.body_fr ?? "");
  const [bodyAr, setBodyAr] = useState(section.body_ar ?? "");

  const phTitleFr = section.builtin_key ? builtinText(section.builtin_key, "title", "fr") : "";
  const phTitleAr = section.builtin_key ? builtinText(section.builtin_key, "title", "ar") : "";
  const phBodyFr = section.builtin_key ? builtinText(section.builtin_key, "body", "fr") : "";
  const phBodyAr = section.builtin_key ? builtinText(section.builtin_key, "body", "ar") : "";

  async function onSave() {
    if (!isBuiltin && !titleFr.trim()) {
      toast.error(t("prodSaveBlockedName"));
      return;
    }
    try {
      await save.mutateAsync({
        id: section.id,
        title_fr: titleFr || null,
        title_ar: titleAr || null,
        body_fr: bodyFr || null,
        body_ar: bodyAr || null,
      });
      toast.success(t("adminSaved"));
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  async function toggleActive() {
    try {
      await save.mutateAsync({ id: section.id, active: !section.active });
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  async function onDelete() {
    if (!window.confirm(t("polDeleteConfirm"))) return;
    try {
      await del.mutateAsync(section.id);
      toast.success(t("adminDeleted"));
    } catch {
      toast.error(t("adminDeleteError"));
    }
  }

  return (
    <AdminCard className={`flex flex-col gap-3 ${!section.active ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted">
          {isBuiltin ? section.builtin_key : t("polAddSection")}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleActive}
            className="rounded-full border border-line px-3 py-1 text-xs text-ink hover:border-brand"
          >
            {section.active ? t("polSectionHidden") : t("revActive")}
          </button>
          {!isBuiltin && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full border border-line p-1.5 text-muted hover:border-danger hover:text-danger"
              aria-label={t("delete")}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder={phTitleFr}
          value={titleFr}
          onChange={(e) => setTitleFr(e.target.value)}
        />
        <Input
          dir="rtl"
          placeholder={phTitleAr}
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Textarea
          rows={4}
          placeholder={phBodyFr}
          value={bodyFr}
          onChange={(e) => setBodyFr(e.target.value)}
        />
        <Textarea
          rows={4}
          dir="rtl"
          placeholder={phBodyAr}
          value={bodyAr}
          onChange={(e) => setBodyAr(e.target.value)}
        />
      </div>
      <Button size="sm" onClick={onSave} disabled={save.isPending}>
        {save.isPending ? <Loader2 size={14} className="animate-spin" /> : t("save")}
      </Button>
    </AdminCard>
  );
}
