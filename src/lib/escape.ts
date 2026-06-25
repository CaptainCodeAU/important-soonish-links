/**
 * Escaping helpers for serializing untrusted link data into export formats.
 *
 * Saved titles/URLs are user- or import-supplied and are interpolated verbatim into
 * HTML and Markdown export files. Without escaping, a crafted title/URL can inject
 * markup (HTML) or break link structure (Markdown) in the exported file. These helpers
 * are the single escaping boundary for the export serializers in `./export`.
 */

/**
 * Escape a string for safe inclusion in an HTML text node OR a double-quoted attribute
 * value. Covers `& < >` (element/text context) plus `" '` (attribute context), so the
 * same helper is safe for both the anchor text and the HREF attribute.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape Markdown link text so brackets/backslashes can't terminate or alter the
 * `[text]` span, and collapse newlines so a single bullet stays a single line.
 */
export function escapeMarkdownText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/[\r\n]+/g, " ");
}

/**
 * Render a URL as a CommonMark angle-bracket link destination `<url>`. The angle-bracket
 * form tolerates `(` / `)` in a valid URL (e.g. Wikipedia disambiguation pages) that
 * would otherwise close a bare `(...)` destination early. Whitespace and `<`/`>` are not
 * valid in a real URL but are percent-encoded defensively so they can't break out.
 */
export function mdLinkDestination(url: string): string {
  const cleaned = url.replace(/[\s<>]/g, (c) => encodeURIComponent(c));
  return `<${cleaned}>`;
}
