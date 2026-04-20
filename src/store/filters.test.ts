import { describe, it, expect, beforeEach } from "vitest";
import { filtersState, filteredLinks, toggleColor, toggleTag, clearFilters } from "./filters.svelte";
import { linksState } from "./links.svelte";
import { settingsState } from "./settings.svelte";
import type { SavedLink } from "../types";

const makeLink = (id: string, color: SavedLink["color"], tag?: SavedLink["tag"]): SavedLink => ({
  id, title: `Link ${id}`, url: `https://example.com/${id}`,
  color, tag, order: 0, createdAt: 0, updatedAt: 0,
});

beforeEach(() => {
  linksState.items = [
    makeLink("1", "blue", "work"),
    makeLink("2", "green", "personal"),
    makeLink("3", "blue", "personal"),
  ];
  clearFilters();
  settingsState.sortOrder = "recent";
});

describe("color filter", () => {
  it("filters by single color", () => {
    toggleColor("blue");
    const result = filteredLinks();
    expect(result.filter(l => l.color === "blue")).toHaveLength(result.length);
    expect(result).toHaveLength(2);
  });

  it("OR logic: two colors shows union", () => {
    toggleColor("blue");
    toggleColor("green");
    expect(filteredLinks()).toHaveLength(3);
  });
});

describe("tag filter", () => {
  it("filters by tag", () => {
    toggleTag("work");
    expect(filteredLinks()).toHaveLength(1);
  });
});

describe("combined filter", () => {
  it("AND across color and tag", () => {
    toggleColor("blue");
    toggleTag("personal");
    const result = filteredLinks();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });
});
