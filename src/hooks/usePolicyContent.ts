import { useQuery } from "@tanstack/react-query";
import type { PolicySection, PolicySettings } from "@/types/db";
import { useI18n } from "@/i18n/LanguageProvider";
import { translations, type Lang, type TranslationKey } from "@/i18n/translations";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** Built-in sections the app ships text for. builtin_key → translation key stems. */
export const BUILTIN_POLICY_SECTIONS = [
  { builtin_key: "policy_s1", icon: "ShoppingBag" },
  { builtin_key: "policy_s2", icon: "Truck" },
  { builtin_key: "policy_s3", icon: "Wallet" },
  { builtin_key: "policy_s4", icon: "RefreshCw" },
  { builtin_key: "policy_s5", icon: "Lock" },
] as const;

export interface ResolvedPolicySection {
  id: string;
  icon: string | null;
  title: string;
  body: string;
}

export interface ResolvedPolicy {
  tag: string;
  title: string;
  intro: string;
  contactTitle: string;
  contactBody: string;
  updatedLabel: string;
  sections: ResolvedPolicySection[];
}

function fieldFallback(
  lang: Lang,
  override: Record<string, string | null> | undefined,
  base: string,
  builtinKey: TranslationKey | null,
): string {
  const active = override?.[`${base}_${lang}`];
  const fr = override?.[`${base}_fr`];
  if (active?.trim()) return active;
  if (fr?.trim()) return fr;
  if (!builtinKey) return "";
  const dict = translations[lang] as Record<TranslationKey, string>;
  const frDict = translations.fr as Record<TranslationKey, string>;
  return dict[builtinKey] || frDict[builtinKey] || "";
}

interface PolicyData {
  settings: PolicySettings | null;
  sections: PolicySection[];
  failed: boolean;
}

export function useResolvedPolicy(): { data: ResolvedPolicy; isLoading: boolean } {
  const { lang } = useI18n();

  const { data, isLoading } = useQuery<PolicyData>({
    queryKey: ["policy-content"],
    retry: 0,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return { settings: null, sections: [], failed: false };
      }
      const [settingsRes, sectionsRes] = await Promise.all([
        supabase.from("policy_settings").select("*").eq("id", true).maybeSingle(),
        supabase.from("policy_sections").select("*").order("sort_order"),
      ]);
      if (settingsRes.error || sectionsRes.error) {
        return { settings: null, sections: [], failed: true };
      }
      return {
        settings: (settingsRes.data as PolicySettings | null) ?? null,
        sections: (sectionsRes.data as PolicySection[]) ?? [],
        failed: false,
      };
    },
  });

  const settingsOverride = (data?.settings ?? undefined) as
    | Record<string, string | null>
    | undefined;

  const rows =
    data && data.sections.length > 0 && !data.failed
      ? data.sections.filter((s) => s.active)
      : BUILTIN_POLICY_SECTIONS.map((b, i) => ({
          id: b.builtin_key,
          builtin_key: b.builtin_key,
          icon: b.icon,
          sort_order: i,
          active: true,
          title_fr: null,
          title_ar: null,
          body_fr: null,
          body_ar: null,
          created_at: "",
          updated_at: "",
        }));

  const sections: ResolvedPolicySection[] = rows
    .map((row) => {
      const builtin = row.builtin_key;
      const titleKey = builtin ? (`${builtin}_title` as TranslationKey) : null;
      const bodyKey = builtin ? (`${builtin}_body` as TranslationKey) : null;
      const override = row as unknown as Record<string, string | null>;
      const title = fieldFallback(lang, override, "title", titleKey);
      const body = fieldFallback(lang, override, "body", bodyKey);
      return { id: row.id, icon: row.icon, title, body };
    })
    .filter((s) => s.title.trim() && s.body.trim());

  const resolved: ResolvedPolicy = {
    tag: fieldFallback(lang, settingsOverride, "tag", "footerPolicy"),
    title: fieldFallback(lang, settingsOverride, "title", "policyTitle"),
    intro: fieldFallback(lang, settingsOverride, "intro", "policyIntro"),
    contactTitle: fieldFallback(lang, settingsOverride, "contact_title", "policyContactTitle"),
    contactBody: fieldFallback(lang, settingsOverride, "contact_body", "policyContactBody"),
    updatedLabel: fieldFallback(lang, settingsOverride, "updated_label", "policyUpdated"),
    sections,
  };

  return { data: resolved, isLoading };
}
