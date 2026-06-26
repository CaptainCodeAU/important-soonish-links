import type { SavedLink } from "../types";
import { readLinks, writeLinks } from "../storage";
import { settingsState } from "./settings.svelte";
import { pushToast } from "./toasts.svelte";
import { COPY } from "../lib/copy";
import { normalizeUrl } from "../lib/utils";

export const linksState = $state({
  items: [] as SavedLink[],
  loaded: false,
});

async function persist(items: SavedLink[]): Promise<boolean> {
  try {
    const result = await writeLinks(items);
    if (result.downgraded) {
      // A sync write exceeded quota and was kept locally; reflect sync turning off.
      // Success-with-warning: the data IS saved (locally), so this still counts as success.
      settingsState.syncEnabled = false;
      pushToast(COPY.SYNC_QUOTA_EXCEEDED);
    }
    return true;
  } catch {
    pushToast(COPY.STORAGE_WRITE_FAILED);
    return false;
  }
}

export async function loadLinks(): Promise<void> {
  linksState.items = await readLinks();
  linksState.loaded = true;
}

// Mutators are optimistic: update state, persist, and roll the state back if the write
// fails (no chrome.storage.onChanged fires on failure, so this is the only corrector).
// They return whether the write succeeded so callers only show success feedback then. N1.
export async function addLink(link: SavedLink): Promise<boolean> {
  if (linksState.items.some(l => normalizeUrl(l.url) === normalizeUrl(link.url))) return false;
  const prev = linksState.items;
  const next = [link, ...prev];
  linksState.items = next;
  const ok = await persist(next);
  if (!ok) linksState.items = prev;
  return ok;
}

export async function updateLink(id: string, patch: Partial<SavedLink>): Promise<boolean> {
  const prev = linksState.items;
  linksState.items = prev.map(l => l.id === id ? { ...l, ...patch, updatedAt: Date.now() } : l);
  const ok = await persist(linksState.items);
  if (!ok) linksState.items = prev;
  return ok;
}

export async function deleteLink(id: string): Promise<boolean> {
  const prev = linksState.items;
  linksState.items = prev.filter(l => l.id !== id);
  const ok = await persist(linksState.items);
  if (!ok) linksState.items = prev;
  return ok;
}

export async function restoreLink(link: SavedLink, index: number): Promise<boolean> {
  const prev = linksState.items;
  const next = [...prev];
  next.splice(index, 0, link);
  linksState.items = next;
  const ok = await persist(next);
  if (!ok) linksState.items = prev;
  return ok;
}
