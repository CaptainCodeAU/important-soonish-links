import type { SavedLink } from "../types";

function score(text: string, query: string): number {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return -1;
  return 1 / (idx + 1);
}

export function fuzzySearch(links: SavedLink[], query: string): SavedLink[] {
  if (!query.trim()) return links;
  const q = query.trim().toLowerCase();
  return links
    .map(link => {
      const titleScore = score(link.title, q);
      const urlScore   = score(link.url, q);
      const best = Math.max(titleScore, urlScore);
      return { link, score: best };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ link }) => link);
}
