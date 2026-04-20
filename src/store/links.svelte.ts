import type { SavedLink } from "../types";
import { readLinks, writeLinks } from "../storage";
import { pushToast } from "./toasts.svelte";
import { COPY } from "../lib/copy";

export const linksState = $state({
  items: [] as SavedLink[],
  loaded: false,
});

async function persist(items: SavedLink[]): Promise<void> {
  try {
    await writeLinks(items);
  } catch {
    pushToast(COPY.STORAGE_WRITE_FAILED);
  }
}

export async function loadLinks(): Promise<void> {
  linksState.items = await readLinks();
  linksState.loaded = true;
}

export async function addLink(link: SavedLink): Promise<void> {
  if (linksState.items.some(l => l.url === link.url)) return;
  const next = [link, ...linksState.items];
  linksState.items = next;
  await persist(next);
}

export async function updateLink(id: string, patch: Partial<SavedLink>): Promise<void> {
  linksState.items = linksState.items.map(l => l.id === id ? { ...l, ...patch, updatedAt: Date.now() } : l);
  await persist(linksState.items);
}

export async function deleteLink(id: string): Promise<void> {
  linksState.items = linksState.items.filter(l => l.id !== id);
  await persist(linksState.items);
}

export async function restoreLink(link: SavedLink, index: number): Promise<void> {
  const next = [...linksState.items];
  next.splice(index, 0, link);
  linksState.items = next;
  await persist(next);
}
