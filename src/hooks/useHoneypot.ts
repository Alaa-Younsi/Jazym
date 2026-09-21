import { useRef } from "react";

/** Why a submission was held back — the two signals want different handling. */
export type HoneypotVerdict = "ok" | "bot" | "too-fast";

/**
 * Deters unsophisticated bots filling the HTML form. Does NOTHING against a bot
 * calling the RPC directly — that is what the server-side validation + per-phone
 * rate limit in the migration are for. See skill Phase 6.
 *
 * The two checks are reported separately on purpose. A filled honeypot field is
 * a bot and gets the silent treatment. The time gate is a heuristic that a fast,
 * genuine customer (autofill, a second order, a returning visitor) trips too —
 * dropping that submission without a word is how a real order gets lost, so the
 * caller shows a message and the customer simply submits again.
 */
export function useHoneypot() {
  const mountedAt = useRef(Date.now());
  return {
    /** Wire onto a visually-hidden `<input name="company">` field. */
    check(honeypotValue: string | undefined): HoneypotVerdict {
      if (honeypotValue) return "bot";
      if (Date.now() - mountedAt.current < 1500) return "too-fast";
      return "ok";
    },
  };
}
