import type { SavedLink, AppSettings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { CURRENT_SCHEMA_VERSION } from "./migrations";
import { readPersistedLinks, writeSyncLinks, clearSyncLinks } from "./sync";
import { sanitizeLinks } from "../lib/sanitize";

const STORAGE_KEYS = {
  LINKS:    "isl_links",
  SETTINGS: "isl_settings",
} as const;

/** Remove all link + settings data from the sync (cloud) area. */
async function clearCloudStorage(): Promise<void> {
  await clearSyncLinks();
  await chrome.storage.sync.remove(STORAGE_KEYS.SETTINGS);
}

// ── Settings ────────────────────────────────────────────────

/** Merge stored settings over defaults so no field is ever undefined, and
 *  normalize legacy/missing schemaVersion forward to current. */
function normalizeSettings(raw: Partial<AppSettings> | undefined): AppSettings {
  const merged: AppSettings = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  merged.schemaVersion = CURRENT_SCHEMA_VERSION;
  return merged;
}

/**
 * Read settings, resolving cross-device sync state. Settings always live in
 * local. When sync is enabled, a marker (links-only) or the full settings
 * (everything) also live in sync — that is what lets a second device discover
 * that sync is on.
 */
export async function readSettings(): Promise<AppSettings> {
  const [localRes, syncRes] = await Promise.all([
    chrome.storage.local.get(STORAGE_KEYS.SETTINGS),
    chrome.storage.sync.get(STORAGE_KEYS.SETTINGS),
  ]);
  const localSettings = normalizeSettings(localRes[STORAGE_KEYS.SETTINGS] as Partial<AppSettings> | undefined);
  const syncMarker = syncRes[STORAGE_KEYS.SETTINGS] as Partial<AppSettings> | undefined;

  if (syncMarker?.syncEnabled) {
    if (syncMarker.syncMode === "everything") {
      // Preferences follow the user across devices.
      return normalizeSettings({ ...localSettings, ...syncMarker });
    }
    // links-only: adopt sync state but keep this device's preferences.
    return normalizeSettings({ ...localSettings, syncEnabled: true, syncMode: "links-only" });
  }
  return localSettings;
}

/** Persist settings locally (always) and to sync per the chosen mode. */
export async function writeSettings(settings: AppSettings): Promise<void> {
  const clean = normalizeSettings(settings);
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: clean });

  if (clean.syncEnabled) {
    const payload: Partial<AppSettings> =
      clean.syncMode === "everything"
        ? clean
        : { schemaVersion: clean.schemaVersion, syncEnabled: true, syncMode: "links-only" };
    try {
      await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: payload });
    } catch {
      /* settings payload is tiny; a sync failure here is non-fatal */
    }
  } else {
    try {
      await chrome.storage.sync.remove(STORAGE_KEYS.SETTINGS);
    } catch {
      /* nothing to remove */
    }
  }
}

// ── Links ───────────────────────────────────────────────────

async function readRawLinks(storage: chrome.storage.StorageArea): Promise<SavedLink[]> {
  const result = await storage.get(null);
  return sanitizeLinks(await readPersistedLinks(result));
}

export async function readLinks(): Promise<SavedLink[]> {
  const settings = await readSettings();
  const storage = settings.syncEnabled ? chrome.storage.sync : chrome.storage.local;
  return readRawLinks(storage);
}

export interface WriteResult {
  /** true if a sync write was downgraded to local (quota/size); sync was turned off. */
  downgraded: boolean;
}

export async function writeLinks(links: SavedLink[]): Promise<WriteResult> {
  const settings = await readSettings();
  const plain = JSON.parse(JSON.stringify(links)) as SavedLink[];

  if (!settings.syncEnabled) {
    await chrome.storage.local.set({ [STORAGE_KEYS.LINKS]: plain });
    return { downgraded: false };
  }

  // writeChunkedToSync throws when the data can't fit (per-item or total quota).
  try {
    await writeSyncLinks(plain);
    return { downgraded: false };
  } catch {
    // Downgrade: keep the data locally (no loss), clear the cloud, turn sync off.
    await chrome.storage.local.set({ [STORAGE_KEYS.LINKS]: plain });
    await clearCloudStorage();
    await writeSettings({ ...settings, syncEnabled: false });
    return { downgraded: true };
  }
}

// ── Sync enable/disable migration ───────────────────────────

/** Enabling sync: copy local links up to sync. Throws if they don't fit. */
export async function enableSyncMigration(): Promise<void> {
  const localRes = await chrome.storage.local.get(STORAGE_KEYS.LINKS);
  const localLinks = sanitizeLinks(localRes[STORAGE_KEYS.LINKS]);
  await writeSyncLinks(localLinks);
}

/** Disabling sync: copy synced links back down to local, THEN clear the cloud. */
export async function disableSyncMigration(): Promise<void> {
  const syncLinks = sanitizeLinks(await readPersistedLinks(await chrome.storage.sync.get(null)));
  await chrome.storage.local.set({ [STORAGE_KEYS.LINKS]: syncLinks });
  await clearCloudStorage();
}

export async function clearAll(): Promise<void> {
  await chrome.storage.local.clear();
  await chrome.storage.sync.clear();
}
