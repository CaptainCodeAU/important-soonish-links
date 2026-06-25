import type { AppSettings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { readSettings, writeSettings, enableSyncMigration, disableSyncMigration } from "../storage";
import { applyTheme } from "./theme.svelte";
import { pushToast } from "./toasts.svelte";
import { COPY } from "../lib/copy";

export const settingsState = $state<AppSettings>({ ...DEFAULT_SETTINGS });

export async function loadSettings(): Promise<void> {
  const s = await readSettings();
  Object.assign(settingsState, s);
  applyTheme(s.theme);
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  const prevSync = settingsState.syncEnabled;
  Object.assign(settingsState, patch);
  if (patch.theme) applyTheme(patch.theme);

  try {
    if (patch.syncEnabled === true && !prevSync) {
      // Turning sync on: copy local links up to the cloud first.
      try {
        await enableSyncMigration();
      } catch {
        // Links didn't fit in sync — revert to local-only and tell the user.
        settingsState.syncEnabled = false;
        await writeSettings({ ...settingsState });
        pushToast(COPY.SYNC_QUOTA_EXCEEDED);
        return;
      }
    } else if (patch.syncEnabled === false && prevSync) {
      // Turning sync off: pull synced links back down before clearing the cloud.
      await disableSyncMigration();
    }
    await writeSettings({ ...settingsState });
  } catch {
    pushToast(COPY.STORAGE_WRITE_FAILED);
  }
}
