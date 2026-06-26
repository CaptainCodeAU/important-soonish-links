export function generateId(): string {
  return crypto.randomUUID();
}

export function validateUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Canonical form of a URL for **duplicate comparison only** (never stored — links keep
 * their original url for display/open). Lowercases the host, drops a leading `www.`, a
 * single trailing slash, and the hash; preserves the query string. Deliberately does NOT
 * unify http/https — treating those as the same page is surprising, so they stay distinct.
 * Falls back to a trimmed string for non-URL input. D6.
 */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./i, "");
    let path = u.pathname;
    if (path.endsWith("/")) path = path.slice(0, -1); // "/a/" -> "/a", "/" -> ""
    return `${u.protocol}//${host}${u.port ? ":" + u.port : ""}${path}${u.search}`;
  } catch {
    return url.trim();
  }
}

/**
 * Whether a favicon URL is safe to load in an <img>. Allows only `https:` and
 * self-contained `data:image/...` URIs. Rejects `http:` (a plain-text request that can
 * act as a tracking beacon on popup open), `javascript:`, and anything else — those fall
 * back to the letter-avatar in FaviconImage. The favicon is the extension's only outbound
 * request, so this is the gate that keeps an imported/forged URL from phoning home (B4).
 *
 * A scheme-prefix test (not `new URL()`) is enough: we never resolve the URL ourselves —
 * the browser does, as the <img> src — so only the scheme matters, and this runs per-row
 * on render and per-link on every storage read.
 */
export function isSafeFaviconUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return /^data:image\//i.test(trimmed) || /^https:\/\//i.test(trimmed);
}

export function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function now(): number {
  return Date.now();
}
