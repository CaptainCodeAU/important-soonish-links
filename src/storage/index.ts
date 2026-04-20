import type { SavedLink, AppSettings, StorageData } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { runMigrations, CURRENT_SCHEMA_VERSION } from "./migrations";
import { readChunked, writeChunked, clearChunked } from "./sync";

const STORAGE_KEYS = {
  LINKS:    "isl_links",
  SETTINGS: "isl_settings",
} as const;

function getStorage(syncEnabled: boolean): chrome.storage.StorageArea {
  return syncEnabled ? chrome.storage.sync : chrome.storage.local;
}

async function readRawLinks(storage: chrome.storage.StorageArea): Promise<SavedLink[]> {
  const result = await storage.get(null);
  if (result[STORAGE_KEYS.LINKS] !== undefined) {
    return result[STORAGE_KEYS.LINKS] as SavedLink[];
  }
  return readChunked(result);
}

export async function readSettings(): Promise<AppSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return (result[STORAGE_KEYS.SETTINGS] as AppSettings | undefined) ?? DEFAULT_SETTINGS;
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

export async function readLinks(): Promise<SavedLink[]> {
  const settings = await readSettings();
  const storage = getStorage(settings.syncEnabled);
  const rawLinks = await readRawLinks(storage);
  const rawSettings = await readSettings();

  if (rawSettings.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const migrated = runMigrations({ links: rawLinks, settings: rawSettings }, rawSettings.schemaVersion);
    await writeLinks(migrated.links);
    await writeSettings(migrated.settings);
    return migrated.links;
  }

  return rawLinks;
}

export async function writeLinks(links: SavedLink[]): Promise<void> {
  const settings = await readSettings();
  const json = JSON.stringify(links);

  if (settings.syncEnabled) {
    if (json.length > 7500) {
      await writeChunked(links, settings);
    } else {
      try {
        await chrome.storage.sync.set({ [STORAGE_KEYS.LINKS]: links });
      } catch (err) {
        await fallbackToLocal(links, settings);
      }
    }
  } else {
    await chrome.storage.local.set({ [STORAGE_KEYS.LINKS]: links });
  }
}

async function fallbackToLocal(links: SavedLink[], settings: AppSettings): Promise<void> {
  const updated = { ...settings, syncEnabled: false };
  await chrome.storage.local.set({ [STORAGE_KEYS.LINKS]: links });
  await writeSettings(updated);
}

export async function clearAll(): Promise<void> {
  await chrome.storage.local.clear();
  await chrome.storage.sync.clear();
}
