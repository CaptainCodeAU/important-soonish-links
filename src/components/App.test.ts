import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import App from "./App.svelte";
import { linksState } from "../store/links.svelte";
import { settingsState } from "../store/settings.svelte";
import { writeSyncLinks } from "../storage/sync";
import { dispatchStorageChange } from "../test-setup";
import type { SavedLink } from "../types";

const link = (id: string): SavedLink => ({
  id, title: `L${id}`, url: `https://e.com/${id}`, color: "default", tags: [],
  order: 0, createdAt: 1, updatedAt: 1,
});

describe("App focus management (C4)", () => {
  it("returns focus to the settings gear after leaving settings", async () => {
    render(App);
    await tick();
    await fireEvent.click(screen.getByLabelText("Settings"));
    await tick();
    await fireEvent.click(screen.getByLabelText("Back to links"));
    await tick();
    await tick();
    expect(document.activeElement).toBe(screen.getByLabelText("Settings"));
  });
});

describe("popup freshness on storage change (#4)", () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
    linksState.items = [];
    linksState.loaded = false;
  });

  it("reloads links when only gzipped sync chunks change", async () => {
    await chrome.storage.sync.set({ isl_settings: { syncEnabled: true, syncMode: "links-only", schemaVersion: 1 } });
    render(App);
    await tick();
    await writeSyncLinks([link("b")]);
    dispatchStorageChange({ isl_gz_0: {} }, "sync");
    expect(await screen.findByText("Lb")).toBeTruthy();
  });

  it("does not blank the list while a sync write is mid-flight", async () => {
    await chrome.storage.sync.set({ isl_settings: { syncEnabled: true, syncMode: "links-only", schemaVersion: 1 } });
    await writeSyncLinks([link("a")]);
    render(App);
    await tick();
    await screen.findByText("La");
    await chrome.storage.sync.remove(["isl_gz_0"]);
    dispatchStorageChange({ isl_gz_0: {} }, "sync");
    await new Promise((r) => setTimeout(r, 30)); // well inside the 150ms debounce
    expect(screen.getByText("La")).toBeTruthy();
    await writeSyncLinks([link("b")]);
    dispatchStorageChange({ isl_gz_0: {} }, "sync");
    expect(await screen.findByText("Lb")).toBeTruthy();
    expect(screen.queryByText("La")).toBeNull();
  });

  it("reloads settings when the settings key changes", async () => {
    render(App);
    await new Promise((r) => setTimeout(r, 50)); // let the async onMount's initial load settle
    await chrome.storage.local.set({ isl_settings: { theme: "dark" } });
    dispatchStorageChange({ isl_settings: {} }, "local");
    await new Promise((r) => setTimeout(r, 50));
    expect(settingsState.theme).toBe("dark");
  });

  it("ignores changes to keys the storage module does not own", async () => {
    render(App);
    await new Promise((r) => setTimeout(r, 50)); // let the async onMount's initial load settle
    linksState.items = [link("sentinel")];
    dispatchStorageChange({ isl_theme: {} }, "local");
    await new Promise((r) => setTimeout(r, 200));
    expect(linksState.items).toEqual([link("sentinel")]);
  });
});
