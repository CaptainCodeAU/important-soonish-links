import type { SavedLink } from "../types";
import { DEFAULT_LINK_COLOR } from "../types";
import { generateId, hostnameFromUrl, now } from "./utils";

export interface CreateLinkInput {
  url: string;
  /** Falls back to the URL's hostname when blank/omitted. */
  title?: string;
  favicon?: string;
}

/**
 * Build a fresh SavedLink for a newly-saved link. This is the *creation* path — as
 * opposed to sanitizeLink (../lib/sanitize.ts), which parses an UNTRUSTED
 * already-existing record from storage or an imported file and has different
 * defaults on purpose (e.g. its title falls back to the raw url, not the hostname).
 *
 * The single home for fields every new-link call site was independently choosing,
 * and had already drifted on: `order` (0 vs links.length — neither is read by any
 * sort path today; see sortLinks in store/filters.svelte.ts), the title-fallback
 * operator (`??` vs `||`), and whether createdAt/updatedAt came from one now() call
 * or two. #3.
 */
export function createLink(input: CreateLinkInput): SavedLink {
  const ts = now();
  const link: SavedLink = {
    id: generateId(),
    title: input.title || hostnameFromUrl(input.url),
    url: input.url,
    color: DEFAULT_LINK_COLOR,
    tags: [],
    order: 0,
    createdAt: ts,
    updatedAt: ts,
  };
  if (input.favicon) link.favicon = input.favicon;
  return link;
}
