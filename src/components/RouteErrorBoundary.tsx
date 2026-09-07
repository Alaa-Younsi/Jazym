import { Component, type ReactNode } from "react";
import { translations } from "@/i18n/translations";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

const STALE_CHUNK_RE = /loading chunk|dynamically imported module|failed to fetch dynamically/i;

/** Wraps <Routes>. Uses the translations module directly (no hook) so it works
    even if a provider is the thing that threw. */
export class RouteErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    if (STALE_CHUNK_RE.test(error.message)) {
      try {
        if (!sessionStorage.getItem("jazym-chunk-reloaded")) {
          sessionStorage.setItem("jazym-chunk-reloaded", "1");
          window.location.reload();
        }
      } catch {
        /* noop */
      }
    }
    console.error("[RouteErrorBoundary]", error);
  }

  override render() {
    if (!this.state.hasError) return this.props.children;
    const fr = translations.fr;
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="fx-display text-2xl text-ink">{fr.errorTitle}</h1>
        <p className="max-w-sm text-sm text-muted">{fr.errorBody}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 rounded-full bg-brand px-6 text-sm font-medium text-white"
        >
          {fr.errorReload}
        </button>
      </div>
    );
  }
}
