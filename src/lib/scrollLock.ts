/**
 * Scroll-lock the body with position:fixed at the current offset — NOT
 * overflow:hidden, which does not stop iOS Safari visual-viewport rubber-banding
 * and leaves a fixed overlay drifting out of sync with real screen coordinates
 * (drawer "opens but won't close"). See skill Phase 8.
 */
let locks = 0;
let savedY = 0;

export function lockBodyScroll(): void {
  locks += 1;
  if (locks > 1) return;
  savedY = window.scrollY;
  const { style } = document.body;
  style.position = "fixed";
  style.top = `-${savedY}px`;
  style.left = "0";
  style.right = "0";
  style.width = "100%";
  style.overflow = "hidden";
}

export function unlockBodyScroll(): void {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;
  const { style } = document.body;
  style.position = "";
  style.top = "";
  style.left = "";
  style.right = "";
  style.width = "";
  style.overflow = "";
  window.scrollTo(0, savedY);
}
