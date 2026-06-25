import type { StorageData } from "../types";
import { DEFAULT_SETTINGS } from "../types";

// v2: links carry `tags: TagId[]` instead of a single `tag?: TagId`. The per-link
// shape migration is performed by sanitizeLink on every read (the normalization point),
// so no entry in `migrations` is needed; this constant just stamps settings.schemaVersion.
export const CURRENT_SCHEMA_VERSION = 2;

export type MigrationFn = (data: Partial<StorageData>) => StorageData;

export const migrations: Record<number, MigrationFn> = {
};

export function runMigrations(data: Partial<StorageData>, fromVersion: number): StorageData {
  let current: Partial<StorageData> = data;
  for (let v = fromVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    if (migrations[v]) {
      current = migrations[v](current);
    }
  }
  return {
    links: current.links ?? [],
    settings: { ...DEFAULT_SETTINGS, ...(current.settings ?? {}) },
  };
}
