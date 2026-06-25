import { describe, it, expect, beforeEach } from "vitest";
import {
  readSettings, writeSettings, readLinks, writeLinks,
  enableSyncMigration, disableSyncMigration,
} from "./index";
import { readPersistedLinks, writeSyncLinks } from "./sync";
import { DEFAULT_SETTINGS } from "../types";
import type { SavedLink } from "../types";

const link = (id: string): SavedLink => ({
  id, title: `L${id}`, url: `https://e.com/${id}`, color: "default", tags: [],
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
  it("enable copies local links up to sync (compressed)", async () => {
    await chrome.storage.local.set({ isl_links: [link("1"), link("2")] });
    await enableSyncMigration();
    const all = await chrome.storage.sync.get(null);
    expect(all["isl_gz_0"]).toBeDefined();      // stored in the compressed format
    expect(all["isl_links"]).toBeUndefined();   // not the plain format
    expect(await readPersistedLinks(all)).toHaveLength(2);
  });

  it("disable copies synced links down to local, then clears the cloud", async () => {
    await writeSyncLinks([link("1")]);          // seed sync in the compressed format
    await disableSyncMigration();
    const local = (await chrome.storage.local.get("isl_links")).isl_links as SavedLink[];
    expect(local).toHaveLength(1);
    const all = await chrome.storage.sync.get(null);
    expect(all["isl_gz_0"]).toBeUndefined();
    expect(all["isl_links"]).toBeUndefined();
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

describe("downgrade when sync rejects (A6)", () => {
  it("keeps data locally and turns sync off", async () => {
    await writeSettings({ ...DEFAULT_SETTINGS, syncEnabled: true, syncMode: "links-only" });
    const origSet = chrome.storage.sync.set;
    // Simulate a real quota rejection (compressed payload still too big).
    (chrome.storage.sync as unknown as { set: unknown }).set = () =>
      Promise.reject(new Error("QUOTA_BYTES quota exceeded"));
    try {
      const res = await writeLinks([link("1")]);
      expect(res.downgraded).toBe(true);
    } finally {
      (chrome.storage.sync as unknown as { set: typeof origSet }).set = origSet;
    }
    expect((await readSettings()).syncEnabled).toBe(false);
    expect(await readLinks()).toHaveLength(1);
  });
});

describe("gzip compression (large collections fit sync)", () => {
  it("round-trips links through the compressed format", async () => {
    const links: SavedLink[] = [
      link("a"),
      { ...link("b"), title: 'with, commas "quotes" & symbols' },
    ];
    await writeSyncLinks(links);
    const all = await chrome.storage.sync.get(null);
    expect(all["isl_gz_0"]).toBeDefined();
    expect(all["isl_links"]).toBeUndefined();
    expect(await readPersistedLinks(all)).toEqual(links);
  });

  it("fits a 500-link collection (would exceed 100KB uncompressed) within per-item limits", async () => {
    const many: SavedLink[] = Array.from({ length: 500 }, (_, i) => link(`link-number-${i}`));
    await writeSyncLinks(many);
    const all = await chrome.storage.sync.get(null);
    for (const k of Object.keys(all)) {
      if (k.startsWith("isl_gz_")) expect((all[k] as string).length).toBeLessThan(8192);
    }
    expect(await readPersistedLinks(all)).toHaveLength(500);
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
