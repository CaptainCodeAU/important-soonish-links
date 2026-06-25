import { describe, it, expect, beforeEach } from "vitest";
import {
  readSettings, writeSettings, readLinks, writeLinks,
  enableSyncMigration, disableSyncMigration,
} from "./index";
import { DEFAULT_SETTINGS } from "../types";
import type { SavedLink } from "../types";

const link = (id: string): SavedLink => ({
  id, title: `L${id}`, url: `https://e.com/${id}`, color: "default",
  order: 0, createdAt: 1, updatedAt: 1,
});

beforeEach(async () => {
  await chrome.storage.local.clear();
  await chrome.storage.sync.clear();
});

describe("sync discovery (A3)", () => {
  it("a sync marker makes readSettings report syncEnabled (links-only)", async () => {
    await chrome.storage.sync.set({ isl_settings: { syncEnabled: true, syncMode: "links-only", schemaVersion: 1 } });
    const s = await readSettings();
    expect(s.syncEnabled).toBe(true);
    expect(s.syncMode).toBe("links-only");
  });

  it("links-only keeps this device's preferences, not synced ones", async () => {
    await chrome.storage.local.set({ isl_settings: { ...DEFAULT_SETTINGS, theme: "dark" } });
    await chrome.storage.sync.set({ isl_settings: { syncEnabled: true, syncMode: "links-only", schemaVersion: 1 } });
    expect((await readSettings()).theme).toBe("dark");
  });

  it("everything mode adopts synced preferences", async () => {
    await chrome.storage.local.set({ isl_settings: { ...DEFAULT_SETTINGS, theme: "light" } });
    await chrome.storage.sync.set({ isl_settings: { ...DEFAULT_SETTINGS, theme: "dark", syncEnabled: true, syncMode: "everything" } });
    expect((await readSettings()).theme).toBe("dark");
  });
});

describe("writeSettings sync payload (A3)", () => {
  it("links-only writes only a marker (no preferences) to the cloud", async () => {
    await writeSettings({ ...DEFAULT_SETTINGS, theme: "dark", syncEnabled: true, syncMode: "links-only" });
    const synced = (await chrome.storage.sync.get("isl_settings")).isl_settings as Record<string, unknown>;
    expect(synced.syncEnabled).toBe(true);
    expect(synced.theme).toBeUndefined();
  });

  it("everything writes full settings to the cloud", async () => {
    await writeSettings({ ...DEFAULT_SETTINGS, theme: "dark", syncEnabled: true, syncMode: "everything" });
    const synced = (await chrome.storage.sync.get("isl_settings")).isl_settings as Record<string, unknown>;
    expect(synced.theme).toBe("dark");
  });

  it("switching to links-only removes preference data from the cloud (ISC-15)", async () => {
    await writeSettings({ ...DEFAULT_SETTINGS, theme: "dark", syncEnabled: true, syncMode: "everything" });
    await writeSettings({ ...DEFAULT_SETTINGS, theme: "dark", syncEnabled: true, syncMode: "links-only" });
    const synced = (await chrome.storage.sync.get("isl_settings")).isl_settings as Record<string, unknown>;
    expect(synced.theme).toBeUndefined();
  });

  it("turning sync off removes the cloud marker", async () => {
    await chrome.storage.sync.set({ isl_settings: { syncEnabled: true, syncMode: "links-only" } });
    await writeSettings({ ...DEFAULT_SETTINGS, syncEnabled: false });
    expect((await chrome.storage.sync.get("isl_settings")).isl_settings).toBeUndefined();
  });
});

describe("enable/disable migration (A3 — no data loss)", () => {
  it("enable copies local links up to sync", async () => {
    await chrome.storage.local.set({ isl_links: [link("1"), link("2")] });
    await enableSyncMigration();
    const synced = (await chrome.storage.sync.get("isl_links")).isl_links as SavedLink[];
    expect(synced).toHaveLength(2);
  });

  it("disable copies synced links down to local, then clears the cloud", async () => {
    await chrome.storage.sync.set({ isl_links: [link("1")] });
    await disableSyncMigration();
    const local = (await chrome.storage.local.get("isl_links")).isl_links as SavedLink[];
    expect(local).toHaveLength(1);
    expect((await chrome.storage.sync.get("isl_links")).isl_links).toBeUndefined();
  });
});

describe("readLinks honors discovered sync state (A3)", () => {
  it("reads links from sync when a marker enables sync", async () => {
    await chrome.storage.sync.set({
      isl_settings: { syncEnabled: true, syncMode: "links-only", schemaVersion: 1 },
      isl_links: [link("9")],
    });
    const links = await readLinks();
    expect(links).toHaveLength(1);
    expect(links[0].id).toBe("9");
  });
});

describe("oversized link downgrade (A6)", () => {
  it("keeps data locally and turns sync off", async () => {
    await writeSettings({ ...DEFAULT_SETTINGS, syncEnabled: true, syncMode: "links-only" });
    const huge: SavedLink = { ...link("big"), url: "https://e.com/" + "x".repeat(9000) };
    const res = await writeLinks([huge]);
    expect(res.downgraded).toBe(true);
    expect((await readSettings()).syncEnabled).toBe(false);
    expect(await readLinks()).toHaveLength(1);
  });
});

describe("legacy settings normalization (A7)", () => {
  it("fills missing fields (syncMode) from defaults", async () => {
    await chrome.storage.local.set({ isl_settings: { theme: "dark", sortOrder: "recent", syncEnabled: false } });
    const s = await readSettings();
    expect(s.syncMode).toBe("links-only");
    expect(s.showBadgeCount).toBe(true);
  });
});
