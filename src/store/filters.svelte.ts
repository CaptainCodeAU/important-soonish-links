import type { ColorId, TagId, SavedLink, SortOrder } from "../types";
import { linksState } from "./links.svelte";
import { settingsState } from "./settings.svelte";
import { searchState } from "./search.svelte";
import { fuzzySearch } from "../lib/search";

export const filtersState = $state({
  activeColors: new Set<ColorId>(),
  activeTags: new Set<TagId>(),
});

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

export function clearFilters(): void {
  filtersState.activeColors = new Set();
  filtersState.activeTags = new Set();
}

function sortLinks(links: SavedLink[], order: SortOrder): SavedLink[] {
  const sorted = [...links];
  switch (order) {
    case "recent":      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case "oldest":      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case "alphabetical":return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "color":       return sorted.sort((a, b) => a.color.localeCompare(b.color));
    case "tag":         return sorted.sort((a, b) => (a.tag ?? "").localeCompare(b.tag ?? ""));
    default:            return sorted;
  }
}

export function filteredLinks(): SavedLink[] {
  let items = linksState.items;

  if (searchState.query) {
    items = fuzzySearch(items, searchState.query);
  }

  if (filtersState.activeColors.size > 0) {
    items = items.filter(l => filtersState.activeColors.has(l.color));
  }

  if (filtersState.activeTags.size > 0) {
    items = items.filter(l => l.tag !== undefined && filtersState.activeTags.has(l.tag));
  }

  const order = settingsState.sortOrder;
  const unread = sortLinks(items.filter(l => !l.isRead), order);
  const read = sortLinks(items.filter(l => l.isRead), order);

  return [...unread, ...read];
}
