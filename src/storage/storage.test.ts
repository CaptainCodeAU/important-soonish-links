import { describe, it, expect, beforeEach } from "vitest";
import { readLinks, writeLinks, readSettings, writeSettings } from "./index";
import { DEFAULT_SETTINGS } from "../types";

describe("storage round-trip", () => {
  beforeEach(() => {
    chrome.storage.local.clear();
    chrome.storage.sync.clear();
  });

  it("writeLinks then readLinks returns identical array", async () => {
    const links = [
      { id: "1", title: "Test", url: "https://example.com", color: "default" as const,
        order: 0, createdAt: 1000, updatedAt: 1000 },
    ];
    await writeLinks(links);
    const result = await readLinks();
    expect(result).toEqual(links);
  });

  it("readSettings returns DEFAULT_SETTINGS when nothing stored", async () => {
    const result = await readSettings();
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it("writeSettings then readSettings returns same object", async () => {
    const settings = { ...DEFAULT_SETTINGS, theme: "dark" as const };
    await writeSettings(settings);
    const result = await readSettings();
    expect(result).toEqual(settings);
  });
});
