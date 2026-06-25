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

export function normalizeUrl(url: string): string {
  return url.trim();
}

/**
 * Whether a favicon URL is safe to load in an <img>. Allows only `https:` and
 * self-contained `data:image/...` URIs. Rejects `http:` (a plain-text request that can
 * act as a tracking beacon on popup open), `javascript:`, and anything else — those fall
 * back to the letter-avatar in FaviconImage. The favicon is the extension's only outbound
 * request, so this is the gate that keeps an imported/forged URL from phoning home (B4).
 */
export function isSafeFaviconUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (/^data:image\//i.test(trimmed)) return true;
  try {
    return new URL(trimmed).protocol === "https:";
  } catch {
    return false;
  }
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
