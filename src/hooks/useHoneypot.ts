import { useRef } from "react";

/**
 * Deters unsophisticated bots filling the HTML form. Does NOTHING against a bot
 * calling the RPC directly — that is what the server-side validation + per-phone
 * rate limit in the migration are for. See skill Phase 6.
 */
export function useHoneypot() {
  const mountedAt = useRef(Date.now());
  return {
    /** Wire onto a visually-hidden `<input name="company">` field. */
    isSpam(honeypotValue: string | undefined): boolean {
      return !!honeypotValue || Date.now() - mountedAt.current < 1500;
    },
    elapsedMs: () => Date.now() - mountedAt.current,
  };
}
