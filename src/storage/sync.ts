import type { SavedLink } from "../types";

const LINKS_KEY = "isl_links";       // legacy plain single key
const PLAIN_CHUNK = "isl_links_";    // legacy plain chunks
const GZ_CHUNK = "isl_gz_";          // current format: gzipped base64 chunks
const GZ_CHUNK_SIZE = 7000;          // base64 chars per sync item (< 8 KB per-item limit)

// ── base64 <-> bytes ────────────────────────────────────────
function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ── gzip <-> string (built-in CompressionStream; no dependencies) ──
// Uses only Web Streams + TextEncoder so it runs identically in the extension
// (Chrome) and under the test runner (avoids Blob.stream()/Response, which jsdom
// doesn't fully implement).
async function pumpThrough(input: Uint8Array, transform: GenericTransformStream): Promise<Uint8Array> {
  const writer = (transform.writable as WritableStream<Uint8Array>).getWriter();
  void writer.write(input);
  void writer.close();

  const reader = (transform.readable as ReadableStream<Uint8Array>).getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
}

async function gzip(text: string): Promise<string> {
  const bytes = await pumpThrough(new TextEncoder().encode(text), new CompressionStream("gzip"));
  return bytesToBase64(bytes);
}

async function gunzip(b64: string): Promise<string> {
  const bytes = await pumpThrough(base64ToBytes(b64), new DecompressionStream("gzip"));
  return new TextDecoder().decode(bytes);
}

/**
 * Reassemble the links array from a full storage.get(null) result. Supports the
 * current gzip format (sync) and the legacy plain formats (local + old sync).
 */
export async function readPersistedLinks(allData: Record<string, unknown>): Promise<unknown[]> {
  // Current: gzipped base64 chunks isl_gz_0..n
  if (allData[`${GZ_CHUNK}0`] !== undefined) {
    let b64 = "";
    for (let i = 0; allData[`${GZ_CHUNK}${i}`] !== undefined; i++) {
      b64 += allData[`${GZ_CHUNK}${i}`] as string;
    }
    try {
      const arr = JSON.parse(await gunzip(b64));
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  // Legacy: plain single key (this is also the local-storage format)
  if (Array.isArray(allData[LINKS_KEY])) return allData[LINKS_KEY] as unknown[];
  // Legacy: plain chunks isl_links_0..n
  const chunks: unknown[][] = [];
  for (let i = 0; allData[`${PLAIN_CHUNK}${i}`] !== undefined; i++) {
    chunks.push(allData[`${PLAIN_CHUNK}${i}`] as unknown[]);
  }
  return chunks.flat();
}

/** Remove every link key (current + legacy formats) from sync storage. */
export async function clearSyncLinks(): Promise<void> {
  const existing = await chrome.storage.sync.get(null);
  const keys = Object.keys(existing).filter(
    (k) => k === LINKS_KEY || k.startsWith(PLAIN_CHUNK) || k.startsWith(GZ_CHUNK),
  );
  if (keys.length > 0) await chrome.storage.sync.remove(keys);
}

/**
 * Gzip the links and write them to sync as base64 chunks. Compression lets a
 * collection far larger than Chrome's 100 KB sync cap fit. Throws if the
 * compressed payload still exceeds quota — the caller falls back to local.
 */
export async function writeSyncLinks(links: SavedLink[]): Promise<void> {
  const b64 = await gzip(JSON.stringify(links));
  const toSet: Record<string, string> = {};
  let idx = 0;
  for (let i = 0; i < b64.length; i += GZ_CHUNK_SIZE) {
    toSet[`${GZ_CHUNK}${idx++}`] = b64.slice(i, i + GZ_CHUNK_SIZE);
  }
  await clearSyncLinks();
  await chrome.storage.sync.set(toSet);
}
