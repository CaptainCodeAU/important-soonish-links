import { describe, it, expect } from "vitest";
import { fuzzySearch } from "./search";
import type { SavedLink } from "../types";

const makeLink = (id: string, title: string, url: string): SavedLink => ({
  id, title, url, color: "default", order: 0, createdAt: 0, updatedAt: 0,
});

const links: SavedLink[] = [
  makeLink("1", "TypeScript Handbook",  "https://typescriptlang.org/docs"),
  makeLink("2", "Svelte Tutorial",      "https://learn.svelte.dev"),
  makeLink("3", "MDN Web Docs",         "https://developer.mozilla.org"),
];

describe("fuzzySearch", () => {
  it("returns all links for empty query", () => {
    expect(fuzzySearch(links, "")).toEqual(links);
  });
  it("matches exact title substring", () => {
    const result = fuzzySearch(links, "Svelte");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });
  it("is case-insensitive", () => {
    const result = fuzzySearch(links, "typescript");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });
  it("searches URL as well as title", () => {
    const result = fuzzySearch(links, "mozilla");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });
  it("returns empty array when nothing matches", () => {
    expect(fuzzySearch(links, "zzznomatch")).toHaveLength(0);
  });
});
