import type { SavedLink } from "../types";
import { readLinks, writeLinks } from "../storage";
import { settingsState } from "./settings.svelte";
import { pushToast } from "./toasts.svelte";
import { COPY } from "../lib/copy";
import { containsUrl } from "../lib/utils";

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
  // Always mark loaded — even if the read throws — so the popup falls back to the empty
  // state instead of spinning on the load skeleton forever. #2
  try {
    linksState.items = await readLinks();
  } finally {
    linksState.loaded = true;
  }
}

// Bumped on every committed mutation so a failed write's rollback can tell whether a later
// mutation already superseded it. (Svelte's $state proxy makes a reference check on
// linksState.items unreliable — the getter returns a proxy, not our raw array — so we
// compare a counter instead.) #9
let mutationGen = 0;

// Optimistic commit shared by all mutators: swap in `next`, persist, and roll back to
// `prev` ONLY if the write failed AND no later mutation ran since (else the rollback would
// clobber a change that already persisted). Returns write success so callers show success
// feedback only on success. N1 / #9 / #14.
async function commit(prev: SavedLink[], next: SavedLink[]): Promise<boolean> {
  const gen = ++mutationGen;
  linksState.items = next;
  const ok = await persist(next);
  if (!ok && gen === mutationGen) linksState.items = prev;
  return ok;
}

export async function addLink(link: SavedLink): Promise<boolean> {
  if (containsUrl(linksState.items, link.url)) return false;
  const prev = linksState.items;
  return commit(prev, [link, ...prev]);
}

export async function updateLink(id: string, patch: Partial<SavedLink>): Promise<boolean> {
  const prev = linksState.items;
  return commit(prev, prev.map(l => l.id === id ? { ...l, ...patch, updatedAt: Date.now() } : l));
}

export async function deleteLink(id: string): Promise<boolean> {
  const prev = linksState.items;
  return commit(prev, prev.filter(l => l.id !== id));
}

export async function restoreLink(link: SavedLink, index: number): Promise<boolean> {
  const prev = linksState.items;
  const next = [...prev];
  next.splice(index, 0, link);
  return commit(prev, next);
}

// Replace the whole list (used by import): write-before-swap with the same sync-quota
// downgrade handling as every other write path, so import can't bypass it. #5
export async function replaceLinks(items: SavedLink[]): Promise<boolean> {
  const ok = await persist(items);
  if (ok) { mutationGen++; linksState.items = items; }
  return ok;
}
