import type { SavedLink, ColorId, TagId } from "../types";
import { COLOR_IDS, TAG_IDS, DEFAULT_LINK_COLOR } from "../types";
import { validateUrl, generateId, now, isSafeFaviconUrl } from "./utils";

/**
 * Coerce an untrusted object into a valid SavedLink, or return null if it
 * cannot be salvaged (missing/invalid URL). This is the single hardening point
 * for every data boundary: JSON import and the storage read-path.
 *
 * Guarantees on the returned link:
 *  - url passes validateUrl (http/https only)
 *  - color is a known ColorId (falls back to DEFAULT_LINK_COLOR)
 *  - tag, when present, is a known TagId (otherwise dropped)
 *  - favicon, when present, is a safe https:/data:image URL (otherwise dropped)
 *  - id/order/createdAt/updatedAt always present and well-typed
 */
export function sanitizeLink(raw: unknown): SavedLink | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Record<string, unknown>;

  const url = typeof l.url === "string" ? l.url : "";
  if (!validateUrl(url)) return null;

  const title = typeof l.title === "string" && l.title.trim() ? l.title : url;
  const id = typeof l.id === "string" && l.id ? l.id : generateId();

  const color: ColorId = (COLOR_IDS as readonly string[]).includes(String(l.color))
    ? (l.color as ColorId)
    : DEFAULT_LINK_COLOR;

  const ts = now();
  const createdAt = typeof l.createdAt === "number" ? l.createdAt : ts;
  const updatedAt = typeof l.updatedAt === "number" ? l.updatedAt : createdAt;
  const order = typeof l.order === "number" ? l.order : 0;

  const link: SavedLink = { id, title, url, color, order, createdAt, updatedAt };

  // Preserve optional fields only when present and well-typed.
  if (typeof l.favicon === "string" && isSafeFaviconUrl(l.favicon)) link.favicon = l.favicon;
  if (typeof l.description === "string") link.description = l.description;
  if ((TAG_IDS as readonly string[]).includes(String(l.tag))) link.tag = l.tag as TagId;
  if (typeof l.pinned === "boolean") link.pinned = l.pinned;
  if (typeof l.notes === "string") link.notes = l.notes;
  if (typeof l.isRead === "boolean") link.isRead = l.isRead;

  return link;
}

/** Sanitize an unknown value expected to be an array of links. Invalid entries are dropped. */
export function sanitizeLinks(raw: unknown): SavedLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeLink).filter((l): l is SavedLink => l !== null);
}
