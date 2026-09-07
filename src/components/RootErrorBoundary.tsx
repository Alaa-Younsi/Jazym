import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

const STALE_CHUNK_RE = /loading chunk|dynamically imported module|failed to fetch dynamically/i;

/**
 * Top-level boundary. Renders OUTSIDE Theme/Language/Auth providers, so it can't
 * call any app hook — styled with the :root CSS tokens, bilingual text.
 * Also auto-reloads once on a stale-chunk error after a deploy. See skill 9.7.
 */
export class RootErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (STALE_CHUNK_RE.test(error.message)) {
      try {
        if (!sessionStorage.getItem("jazym-chunk-reloaded")) {
          sessionStorage.setItem("jazym-chunk-reloaded", "1");
          window.location.reload();
          return;
        }
      } catch {
        /* private mode */
      }
    }
    console.error("[RootErrorBoundary]", error, info.componentStack);
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.("event", "exception", { description: error.message, fatal: true });
  }

  override render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "rgb(var(--c-bg))",
          color: "rgb(var(--c-ink))",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Une erreur est survenue · حدث خطأ
          </h1>
          <p style={{ color: "rgb(var(--c-muted))", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
            Rechargez la page. Si le problème persiste, réessayez plus tard.
            <br />
            أعد تحميل الصفحة. إذا استمرّ المشكل، حاول لاحقًا.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              height: "2.75rem",
              padding: "0 1.5rem",
              borderRadius: "9999px",
              border: "none",
              background: "rgb(var(--c-brand))",
              color: "#fff",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Recharger · إعادة التحميل
          </button>
        </div>
      </div>
    );
  }
}
