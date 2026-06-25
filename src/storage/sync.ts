import type { SavedLink } from "../types";

const CHUNK_PREFIX = "isl_links_";
const LINKS_KEY = "isl_links";

// chrome.storage.sync hard limits (bytes).
export const SYNC_ITEM_LIMIT = 8192; // QUOTA_BYTES_PER_ITEM
const CHUNK_SIZE = 7500; // headroom under the per-item limit

/** Reassemble chunked links from a full sync.get(null) result. */
export async function readChunked(allData: Record<string, unknown>): Promise<SavedLink[]> {
  const chunks: SavedLink[][] = [];
  let i = 0;
  while (allData[`${CHUNK_PREFIX}${i}`] !== undefined) {
    chunks.push(allData[`${CHUNK_PREFIX}${i}`] as SavedLink[]);
    i++;
  }
  return chunks.flat();
}

/** Remove every link-chunk key from sync storage. */
export async function clearChunked(): Promise<void> {
  const existing = await chrome.storage.sync.get(null);
  const chunkKeys = Object.keys(existing).filter(k => k.startsWith(CHUNK_PREFIX));
  if (chunkKeys.length > 0) await chrome.storage.sync.remove(chunkKeys);
}

/**
 * Write links to chrome.storage.sync, splitting into chunks when the payload
 * exceeds a single item's limit. Throws on quota/write failure — the caller is
 * responsible for falling back to local storage.
 */
export async function writeChunkedToSync(links: SavedLink[]): Promise<void> {
  const serialized = JSON.stringify(links);

  // Small enough for a single key: store directly, clearing any stale chunks.
  if (serialized.length <= CHUNK_SIZE) {
    await clearChunked();
    await chrome.storage.sync.set({ [LINKS_KEY]: links });
    return;
  }

  // Otherwise pack links into size-bounded chunks.
  const chunks: SavedLink[][] = [];
  let current: SavedLink[] = [];
  let currentSize = 2;
  for (const link of links) {
    const itemSize = JSON.stringify(link).length + 1;
    // A single link larger than one item can never be stored in sync.
    if (itemSize > SYNC_ITEM_LIMIT) {
      throw new Error("Link exceeds the per-item sync quota");
    }
    if (currentSize + itemSize > CHUNK_SIZE && current.length > 0) {
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

  // Replace prior state (single key + any old chunks) atomically-ish.
  const existing = await chrome.storage.sync.get(null);
  const oldChunkKeys = Object.keys(existing).filter(k => k.startsWith(CHUNK_PREFIX));
  if (oldChunkKeys.length > 0) await chrome.storage.sync.remove(oldChunkKeys);
  await chrome.storage.sync.remove(LINKS_KEY);
  await chrome.storage.sync.set(toSet);
}
