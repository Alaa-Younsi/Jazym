/**
 * Video sources — one resolver for "uploaded file" and "URL pasted from
 * anywhere". Whatever comes back plays the same way on the storefront:
 * autoplay, looping forever, muted, and with no controls the visitor can
 * touch (see VideoPlayer).
 */

export type VideoKind = "file" | "youtube" | "vimeo" | "embed";

export interface ResolvedVideo {
  kind: VideoKind;
  /** `<video src>` for a file, `<iframe src>` for everything else. */
  src: string;
  /** Poster frame when the provider gives us one for free. */
  poster: string | null;
  /**
   * false when the provider's own player is the only option. It still can't be
   * touched (the iframe takes no pointer events) and browsers force autoplay
   * to be muted, but we are not the ones guaranteeing it — the admin form says so.
   */
  silentLoopGuaranteed: boolean;
}

const FILE_EXT = /\.(mp4|webm|ogv|ogg|mov|m4v)(\?.*)?$/i;

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{6,})/i,
  /(?:youtu\.be\/)([\w-]{6,})/i,
  /(?:youtube\.com\/shorts\/)([\w-]{6,})/i,
  /(?:youtube(?:-nocookie)?\.com\/embed\/)([\w-]{6,})/i,
];

const VIMEO_PATTERN = /vimeo\.com\/(?:video\/)?(\d{6,})/i;

function httpsUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export function resolveVideo(raw: string | null | undefined): ResolvedVideo | null {
  if (!raw?.trim()) return null;
  const url = httpsUrl(raw);
  if (!url) return null;
  const href = url.toString();

  for (const pattern of YOUTUBE_PATTERNS) {
    const id = pattern.exec(href)?.[1];
    if (!id) continue;
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      // A single-video loop needs the id repeated in `playlist` — without it
      // YouTube ignores loop=1 entirely.
      playlist: id,
      controls: "0",
      disablekb: "1",
      fs: "0",
      modestbranding: "1",
      rel: "0",
      iv_load_policy: "3",
      playsinline: "1",
    });
    return {
      kind: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${id}?${params}`,
      poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      silentLoopGuaranteed: true,
    };
  }

  const vimeoId = VIMEO_PATTERN.exec(href)?.[1];
  if (vimeoId) {
    // `background=1` is Vimeo's own "no chrome, autoplay, loop, muted" mode.
    const params = new URLSearchParams({
      background: "1",
      autoplay: "1",
      loop: "1",
      muted: "1",
      autopause: "0",
    });
    return {
      kind: "vimeo",
      src: `https://player.vimeo.com/video/${vimeoId}?${params}`,
      poster: null,
      silentLoopGuaranteed: true,
    };
  }

  if (FILE_EXT.test(url.pathname) || url.pathname.includes("/storage/v1/object/public/")) {
    return { kind: "file", src: href, poster: null, silentLoopGuaranteed: true };
  }

  // Anything else (TikTok, Instagram, Facebook, a random embed page): show the
  // provider's own player, pointer-locked. Autoplay policy keeps it muted.
  return { kind: "embed", src: href, poster: null, silentLoopGuaranteed: false };
}

/**
 * Uploaded video is the single most expensive thing this store can serve:
 * storage AND egress, both metered, and the player streams the whole file
 * every time it scrolls into view. 15 MB x a few thousand views is the free
 * tier's monthly egress on its own — so the cap is deliberately tight, and
 * the admin form points at a hosted link (YouTube/Vimeo/social) first, which
 * costs us nothing at all.
 */
export const MAX_VIDEO_BYTES = 15 * 1024 * 1024;
/** Above this we warn but still allow it. */
export const WARN_VIDEO_BYTES = 6 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
