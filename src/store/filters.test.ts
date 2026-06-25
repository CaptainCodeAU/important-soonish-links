import { describe, it, expect, beforeEach } from "vitest";
import {
  filtersState, filteredLinks, toggleColor, toggleTag,
  clearColors, clearTags, clearFilters, hasActiveFilters,
} from "./filters.svelte";
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

  it("OR logic: two tags shows union", () => {
    toggleTag("work");
    toggleTag("personal");
    expect(filteredLinks()).toHaveLength(3);
  });
});

describe("reset paths", () => {
  it("clearColors resets only colors", () => {
    toggleColor("blue");
    toggleTag("work");
    clearColors();
    expect(filtersState.activeColors.size).toBe(0);
    expect(filtersState.activeTags.size).toBe(1);
  });

  it("clearTags resets only tags", () => {
    toggleColor("blue");
    toggleTag("work");
    clearTags();
    expect(filtersState.activeTags.size).toBe(0);
    expect(filtersState.activeColors.size).toBe(1);
  });

  it("hasActiveFilters reflects any selection", () => {
    expect(hasActiveFilters()).toBe(false);
    toggleTag("work");
    expect(hasActiveFilters()).toBe(true);
    clearFilters();
    expect(hasActiveFilters()).toBe(false);
  });

  it("the bug: untagging the last matching link empties the list but stays resettable", () => {
    // Filter by a tag, then untag every link that had it.
    toggleTag("work");
    expect(filteredLinks()).toHaveLength(1);
    linksState.items = linksState.items.map(l =>
      l.tag === "work" ? { ...l, tag: undefined } : l
    );
    // List is now empty under the active filter...
    expect(filteredLinks()).toHaveLength(0);
    // ...but the filter is still active and recoverable (this is what the old UI lost).
    expect(hasActiveFilters()).toBe(true);
    clearFilters();
    expect(filteredLinks().length).toBe(linksState.items.length);
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
