import { KeyRound, Loader2, Plus, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToast";
import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  LoadError,
  Toggle,
} from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import {
  fnErrorKey,
  readFnError,
  useCreateWorker,
  useSetWorkerPassword,
  useTeam,
  useUpdateWorker,
} from "@/hooks/useTeam";
import { useI18n } from "@/i18n/LanguageProvider";
import { GRANTABLE_SECTIONS } from "@/lib/adminSections";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { AdminProfile } from "@/types/db";

export default function Team() {
  const { t } = useI18n();
  const toast = useAdminToast();
  const { isOwner } = useAdminProfile();
  const { data: workers, isLoading, isError } = useTeam();
  const createWorker = useCreateWorker();

  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sections, setSections] = useState<string[]>([]);

  if (!isOwner && isSupabaseConfigured) {
    return <LoadError message={t("teamErrForbidden")} />;
  }
  if (isLoading) return <PageLoader />;
  if (isError || !workers) return <LoadError message={t("adminLoadError")} />;

  function toggleSection(key: string) {
    setSections((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }

  async function onCreate() {
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      toast.error(t("teamErrWeakPassword"));
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error(t("teamErrGeneric"));
      return;
    }
    try {
      await createWorker.mutateAsync({ email: email.trim(), password, sections });
      toast.success(t("teamCreated"));
      setShowCreate(false);
      setEmail("");
      setPassword("");
      setSections([]);
    } catch (err) {
      toast.error(t(fnErrorKey(await readFnError(err))));
    }
  }

  return (
    <div>
      <AdminPageHeader
        title={t("teamListTitle")}
        actions={
          <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
            <Plus size={15} />
            {t("teamNew")}
          </Button>
        }
      />

      {showCreate && (
        <AdminCard className="mb-5 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("teamEmail")}>
              <Input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label={t("teamPassword")} hint={t("teamPasswordHint")}>
              <Input
                type="text"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </div>
          <SectionGrid selected={sections} onToggle={toggleSection} label={t("teamSections")} />
          <div className="flex gap-2">
            <Button onClick={onCreate} disabled={createWorker.isPending}>
              {createWorker.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={15} />
                  {t("teamCreate")}
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              {t("cancel")}
            </Button>
          </div>
        </AdminCard>
      )}

      {workers.length === 0 ? (
        <EmptyState title={t("teamListTitle")} />
      ) : (
        <div className="grid gap-3">
          {workers.map((w) => (
            <WorkerRow key={w.user_id} worker={w} />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionGrid({
  selected,
  onToggle,
  label,
}: {
  selected: string[];
  onToggle: (key: string) => void;
  label: string;
}) {
  const { t } = useI18n();
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {GRANTABLE_SECTIONS.map((s) => (
          <label
            key={s.key}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-ink"
          >
            <input
              type="checkbox"
              checked={selected.includes(s.key)}
              onChange={() => onToggle(s.key)}
            />
            {t(s.labelKey)}
          </label>
        ))}
      </div>
    </div>
  );
}

function WorkerRow({ worker }: { worker: AdminProfile }) {
  const { t } = useI18n();
  const toast = useAdminToast();
  const update = useUpdateWorker();
  const setPw = useSetWorkerPassword();

  const [sections, setSections] = useState<string[]>(worker.sections);
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw2] = useState("");

  const dirty =
    sections.length !== worker.sections.length ||
    sections.some((s) => !worker.sections.includes(s));

  function toggle(key: string) {
    setSections((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }

  async function saveSections() {
    try {
      await update.mutateAsync({ userId: worker.user_id, patch: { sections } });
      toast.success(t("teamSaved"));
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  async function toggleActive(next: boolean) {
    try {
      await update.mutateAsync({ userId: worker.user_id, patch: { active: next } });
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  async function submitPassword() {
    if (pw.length < 8) {
      toast.error(t("teamErrWeakPassword"));
      return;
    }
    try {
      await setPw.mutateAsync({ userId: worker.user_id, password: pw });
      toast.success(t("teamPasswordUpdated"));
      setShowPw(false);
      setPw2("");
    } catch (err) {
      toast.error(t(fnErrorKey(await readFnError(err))));
    }
  }

  return (
    <AdminCard className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="num-ltr text-sm font-medium text-ink">{worker.email}</span>
        <Toggle checked={worker.active} onChange={toggleActive} label={t("teamActive")} />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-ink hover:border-brand hover:text-brand"
        >
          <KeyRound size={12} />
          {t("teamChangePassword")}
        </button>
      </div>

      <SectionGrid selected={sections} onToggle={toggle} label={t("teamSections")} />
      {dirty && (
        <div className="flex gap-2">
          <Button size="sm" onClick={saveSections} disabled={update.isPending}>
            {t("save")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSections(worker.sections)}>
            {t("cancel")}
          </Button>
        </div>
      )}

      {showPw && (
        <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
          <Field label={t("teamPassword")} hint={t("teamNoNotify")}>
            <Input type="text" dir="ltr" value={pw} onChange={(e) => setPw2(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" onClick={submitPassword} disabled={setPw.isPending}>
              {setPw.isPending ? <Loader2 size={14} className="animate-spin" /> : t("save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowPw(false)}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
    </AdminCard>
  );
}
