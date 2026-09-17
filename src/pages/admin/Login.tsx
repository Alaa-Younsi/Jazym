import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { Wordmark } from "@/components/ui/Wordmark";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/LanguageProvider";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function AdminLogin() {
  const { t } = useI18n();
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/admin" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured) {
      setError(t("adminNeedsSupabase"));
      return;
    }
    setBusy(true);
    const { error: err } = await signIn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(t("adminBadCredentials"));
      return;
    }
    navigate("/admin", { replace: true });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <FlowerMark className="h-9 w-9 text-brand" />
          <Wordmark />
          <span className="text-xs uppercase tracking-widest text-muted">{t("adminTitle")}</span>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-card border border-line bg-panel p-6"
        >
          <Field label={t("adminEmail")} htmlFor="admin-email">
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label={t("adminPassword")} htmlFor="admin-password">
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : t("adminSignIn")}
          </Button>
        </form>
      </div>
    </div>
  );
}
