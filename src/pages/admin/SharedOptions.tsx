import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader, EmptyState, LoadError } from "@/components/admin/AdminUI";
import { VariantGroupFields } from "@/components/admin/VariantGroupFields";
import { Button } from "@/components/ui/Button";
import { Field, NativeSelect } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminProducts } from "@/hooks/useAdminData";
import { useI18n } from "@/i18n/LanguageProvider";
import { sanitizeVariantGroups } from "@/lib/productForm";
import { invalidateProductCaches } from "@/lib/queryCache";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { VariantGroup } from "@/types/db";

interface GroupUsage {
  name_fr: string;
  count: number;
  /** How many differing copies exist — saving collapses them into one. */
  versions: number;
  template: VariantGroup;
}

/** Edit an option group once and write it to every product that has it
 *  (cover photos, renamed values…) instead of opening each product. */
export default function AdminSharedOptions() {
  const { t } = useI18n();
  const toast = useAdminToast();
  const qc = useQueryClient();
  const { data: products, isLoading, isError } = useAdminProducts();
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState<VariantGroup | null>(null);
  const [saving, setSaving] = useState(false);

  const usage = useMemo<GroupUsage[]>(() => {
    const byName = new Map<
      string,
      { count: number; copies: Set<string>; template: VariantGroup }
    >();
    for (const p of products ?? []) {
      for (const g of p.variants) {
        const entry = byName.get(g.name_fr);
        if (entry) {
          entry.count += 1;
          entry.copies.add(JSON.stringify(g));
        } else {
          byName.set(g.name_fr, { count: 1, copies: new Set([JSON.stringify(g)]), template: g });
        }
      }
    }
    return [...byName.entries()]
      .map(([name_fr, e]) => ({
        name_fr,
        count: e.count,
        versions: e.copies.size,
        template: e.template,
      }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  const current = usage.find((u) => u.name_fr === selected);

  // Default to the cover group (the reason this page exists), else the first.
  useEffect(() => {
    if (selected || usage.length === 0) return;
    setSelected((usage.find((u) => u.name_fr === "Couverture") ?? usage[0]).name_fr);
  }, [usage, selected]);

  // Fresh, deep-copied draft whenever the picked group changes.
  useEffect(() => {
    setDraft(current ? (structuredClone(current.template) as VariantGroup) : null);
  }, [current]);

  if (isLoading) return <PageLoader />;
  if (isError || !products) return <LoadError message={t("adminLoadError")} />;

  async function onSave() {
    if (!draft || !current) return;
    const [clean] = sanitizeVariantGroups([draft]);
    if (!clean) {
      toast.error(t("sharedOptEmpty"));
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error(t("adminSaveError"));
      return;
    }
    if (!window.confirm(t("sharedOptConfirm", { n: current.count }))) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("bulk_replace_variant_group", {
        p_name_fr: current.name_fr,
        p_group: clean,
      });
      if (error) throw error;
      toast.success(t("sharedOptSaved", { n: Number(data ?? 0) }));
      setSelected(clean.name_fr);
      invalidateProductCaches(qc);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.includes("duplicate") ? t("sharedOptDuplicate") : t("adminSaveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link
        to="/admin/products"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={15} className="rtl:rotate-180" />
        {t("prodListTitle")}
      </Link>
      <AdminPageHeader title={t("sharedOptTitle")} description={t("sharedOptHint")} />

      {usage.length === 0 ? (
        <EmptyState title={t("sharedOptNone")} />
      ) : (
        <div className="flex max-w-4xl flex-col gap-4">
          <AdminCard>
            <Field label={t("sharedOptGroup")} htmlFor="shared-group">
              <NativeSelect
                id="shared-group"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {usage.map((u) => (
                  <option key={u.name_fr} value={u.name_fr}>
                    {u.name_fr} — {t("sharedOptCount", { n: u.count })}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            {current && current.versions > 1 && (
              <p className="mt-2 text-xs text-danger">
                {t("sharedOptVersions", { n: current.versions })}
              </p>
            )}
          </AdminCard>

          {draft && (
            <VariantGroupFields group={draft} onChange={setDraft} uploadPrefix="variants/shared/" />
          )}

          <div>
            <Button onClick={onSave} disabled={saving || !draft}>
              {saving && <Loader2 size={15} className="animate-spin" />}
              {t("sharedOptApply", { n: current?.count ?? 0 })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
