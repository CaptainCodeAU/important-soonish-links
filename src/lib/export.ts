import type { SavedLink } from "../types";
import { escapeHtml, escapeMarkdownText, mdLinkDestination } from "./escape";

/**
 * Pure serializers for the export formats offered in Settings. Kept out of the Svelte
 * component so the (security-critical) escaping is directly unit-testable. The settings
 * UI calls these and hands the result to a download blob.
 */

/** JSON export — the canonical backup format. Output is intentionally unescaped/raw. */
export function serializeJson(links: SavedLink[]): string {
  return JSON.stringify(links, null, 2);
}

/** Markdown export, grouped by tag. Titles and URLs are escaped (B2). */
export function serializeMarkdown(links: SavedLink[]): string {
  const lines: string[] = [];
  const byTag = new Map<string, SavedLink[]>();
  for (const l of links) {
    const key = l.tags[0] ?? "other";
    if (!byTag.has(key)) byTag.set(key, []);
    byTag.get(key)!.push(l);
  }
  for (const [tag, group] of byTag) {
    lines.push(`\n## ${tag}`);
    for (const l of group) {
      lines.push(`- [${escapeMarkdownText(l.title)}](${mdLinkDestination(l.url)})`);
    }
  }
  return lines.join("\n");
}

/** HTML export in Netscape bookmark format. Titles and HREFs are escaped (B1). */
export function serializeHtml(links: SavedLink[]): string {
  const items = links
    .map((l) => `    <DT><A HREF="${escapeHtml(l.url)}">${escapeHtml(l.title)}</A>`)
    .join("\n");
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n${items}\n</DL><p>`;
}
