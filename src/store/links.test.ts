import { describe, it, expect, beforeEach } from "vitest";
import { linksState, loadLinks, addLink, deleteLink, restoreLink } from "./links.svelte";
import type { SavedLink } from "../types";

const makeLink = (id: string, url: string): SavedLink => ({
  id, title: `Link ${id}`, url, color: "default",
  order: 0, createdAt: Date.now(), updatedAt: Date.now(),
});

beforeEach(() => {
  linksState.items = [];
  linksState.loaded = false;
  chrome.storage.local.clear();
});

describe("addLink", () => {
  it("adds a link to state", async () => {
    await addLink(makeLink("1", "https://example.com"));
    expect(linksState.items).toHaveLength(1);
  });

  it("rejects duplicate URL", async () => {
    await addLink(makeLink("1", "https://example.com"));
    await addLink(makeLink("2", "https://example.com"));
    expect(linksState.items).toHaveLength(1);
  });
});

describe("deleteLink", () => {
  it("removes link from state", async () => {
    await addLink(makeLink("1", "https://example.com"));
    await deleteLink("1");
    expect(linksState.items).toHaveLength(0);
  });
});

describe("restoreLink", () => {
  it("re-inserts link at original index", async () => {
    await addLink(makeLink("1", "https://a.com"));
    await addLink(makeLink("2", "https://b.com"));
    const link = linksState.items[1];
    await deleteLink(link.id);
    await restoreLink(link, 1);
    expect(linksState.items[1]).toEqual(link);
  });
});
