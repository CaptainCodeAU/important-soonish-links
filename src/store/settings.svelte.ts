import type { AppSettings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { readSettings, writeSettings } from "../storage";
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
  Object.assign(settingsState, patch);
  if (patch.theme) applyTheme(patch.theme);
  try {
    await writeSettings({ ...settingsState });
  } catch {
    pushToast(COPY.STORAGE_WRITE_FAILED);
  }
}
