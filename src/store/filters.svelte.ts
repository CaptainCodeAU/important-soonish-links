import type { ColorId, TagId, SavedLink, SortOrder, MatchMode } from "../types";
import { linksState } from "./links.svelte";
import { settingsState } from "./settings.svelte";
import { searchState } from "./search.svelte";
import { fuzzySearch } from "../lib/search";

export const filtersState = $state({
  activeColors: new Set<ColorId>(),
  activeTags: new Set<TagId>(),
  // How color and tag filters combine. "all" = AND (default, narrow);
  // "any" = OR (a link matches if it satisfies either facet).
  matchMode: "all" as MatchMode,
  // How multiple selected tags combine within the tag filter. "any" = OR (default,
  // a link needs any one); "all" = AND (a link must carry every selected tag).
  tagMatchMode: "any" as MatchMode,
});

export function setMatchMode(mode: MatchMode): void {
  filtersState.matchMode = mode;
}

export function setTagMatchMode(mode: MatchMode): void {
  filtersState.tagMatchMode = mode;
}

export function toggleColor(id: ColorId): void {
  const next = new Set(filtersState.activeColors);
  next.has(id) ? next.delete(id) : next.add(id);
  filtersState.activeColors = next;
}

export function toggleTag(id: TagId): void {
  const next = new Set(filtersState.activeTags);
  next.has(id) ? next.delete(id) : next.add(id);
  filtersState.activeTags = next;
}

export function clearColors(): void {
  filtersState.activeColors = new Set();
}

export function clearTags(): void {
  filtersState.activeTags = new Set();
}

export function clearFilters(): void {
  filtersState.activeColors = new Set();
  filtersState.activeTags = new Set();
}

/** Whether any filter (color or tag) is currently applied. */
export function hasActiveFilters(): boolean {
  return filtersState.activeColors.size > 0 || filtersState.activeTags.size > 0;
}

function sortLinks(links: SavedLink[], order: SortOrder): SavedLink[] {
  const sorted = [...links];
  switch (order) {
    case "recent":      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case "oldest":      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case "alphabetical":return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "color":       return sorted.sort((a, b) => a.color.localeCompare(b.color));
    case "tag":         return sorted.sort((a, b) => (a.tags[0] ?? "").localeCompare(b.tags[0] ?? ""));
    default:            return sorted;
  }
}

export function filteredLinks(): SavedLink[] {
  let items = linksState.items;

  if (searchState.query) {
    items = fuzzySearch(items, searchState.query);
  }

  const hasColor = filtersState.activeColors.size > 0;
  const hasTag = filtersState.activeTags.size > 0;
  const colorMatch = (l: SavedLink) => filtersState.activeColors.has(l.color);
  // Within-tag combine: "all" = the link must carry every selected tag; "any" = at
  // least one. (With one selected tag the two are equivalent.)
  const tagMatch = (l: SavedLink) =>
    filtersState.tagMatchMode === "all"
      ? [...filtersState.activeTags].every(t => l.tags.includes(t))
      : l.tags.some(t => filtersState.activeTags.has(t));

  if (hasColor || hasTag) {
    if (filtersState.matchMode === "any") {
      // OR across facets: match either an active color or an active tag.
      items = items.filter(l => (hasColor && colorMatch(l)) || (hasTag && tagMatch(l)));
    } else {
      // AND across facets: each active facet must pass.
      if (hasColor) items = items.filter(colorMatch);
      if (hasTag) items = items.filter(tagMatch);
    }
  }

  const order = settingsState.sortOrder;
  const unread = sortLinks(items.filter(l => !l.isRead), order);
  const read = sortLinks(items.filter(l => l.isRead), order);

  return [...unread, ...read];
}
