import type { SavedLink, AppSettings } from "../types";

const CHUNK_PREFIX = "isl_links_";
const LINKS_KEY = "isl_links";
const SETTINGS_KEY = "isl_settings";

export async function readChunked(allData: Record<string, unknown>): Promise<SavedLink[]> {
  const chunks: SavedLink[][] = [];
  let i = 0;
  while (allData[`${CHUNK_PREFIX}${i}`] !== undefined) {
    chunks.push(allData[`${CHUNK_PREFIX}${i}`] as SavedLink[]);
    i++;
  }
  if (chunks.length === 0) return [];
  return chunks.flat();
}

export async function writeChunked(links: SavedLink[], settings: AppSettings): Promise<void> {
  const chunkSize = 7500;
  const serialized = JSON.stringify(links);

  if (serialized.length <= chunkSize) {
    try {
      await chrome.storage.sync.set({ [LINKS_KEY]: links });
    } catch {
      await localFallback(links, settings);
    }
    return;
  }

  const chunks: SavedLink[][] = [];
  let current: SavedLink[] = [];
  let currentSize = 2;
  for (const link of links) {
    const itemSize = JSON.stringify(link).length + 1;
    if (currentSize + itemSize > chunkSize && current.length > 0) {
      chunks.push(current);
      current = [];
      currentSize = 2;
    }
    current.push(link);
    currentSize += itemSize;
  }
  if (current.length > 0) chunks.push(current);

  const toSet: Record<string, unknown> = {};
  chunks.forEach((chunk, i) => { toSet[`${CHUNK_PREFIX}${i}`] = chunk; });

  try {
    const existing = await chrome.storage.sync.get(null);
    const oldChunkKeys = Object.keys(existing).filter(k => k.startsWith(CHUNK_PREFIX));
    if (oldChunkKeys.length > 0) await chrome.storage.sync.remove(oldChunkKeys);
    await chrome.storage.sync.remove(LINKS_KEY);
    await chrome.storage.sync.set(toSet);
  } catch {
    await localFallback(links, settings);
  }
}

export async function clearChunked(): Promise<void> {
  const existing = await chrome.storage.sync.get(null);
  const chunkKeys = Object.keys(existing).filter(k => k.startsWith(CHUNK_PREFIX));
  if (chunkKeys.length > 0) await chrome.storage.sync.remove(chunkKeys);
}

async function localFallback(links: SavedLink[], settings: AppSettings): Promise<void> {
  await chrome.storage.local.set({ [LINKS_KEY]: links });
  await chrome.storage.local.set({
    [SETTINGS_KEY]: { ...settings, syncEnabled: false },
  });
}
