import type { StorageData } from "../types";
import { DEFAULT_SETTINGS } from "../types";

export const CURRENT_SCHEMA_VERSION = 1;

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
