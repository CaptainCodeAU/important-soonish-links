import { describe, it, expect, beforeEach } from "vitest";
import {
  filtersState, filteredLinks, toggleColor, toggleTag,
  clearColors, clearTags, clearFilters, hasActiveFilters, setMatchMode, setTagMatchMode,
} from "./filters.svelte";
import { linksState } from "./links.svelte";
import { settingsState } from "./settings.svelte";
import type { SavedLink } from "../types";

const makeLink = (id: string, color: SavedLink["color"], tags: SavedLink["tags"] = []): SavedLink => ({
  id, title: `Link ${id}`, url: `https://example.com/${id}`,
  color, tags, order: 0, createdAt: 0, updatedAt: 0,
});

beforeEach(() => {
  linksState.items = [
    makeLink("1", "blue", ["work"]),
    makeLink("2", "green", ["personal"]),
    makeLink("3", "blue", ["personal"]),
  ];
  clearFilters();
  setMatchMode("all");
  setTagMatchMode("any");
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
      l.tags.includes("work") ? { ...l, tags: [] } : l
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
  it("AND across color and tag (matchMode all, default)", () => {
    toggleColor("blue");
    toggleTag("personal");
    const result = filteredLinks();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });
});

describe("tagMatchMode any/all (within-tag, multi-tag links)", () => {
  beforeEach(() => {
    linksState.items = [
      makeLink("a", "blue", ["work"]),
      makeLink("b", "blue", ["work", "personal"]),
      makeLink("c", "blue", ["personal"]),
    ];
  });

  it("any (default): a link with any selected tag matches", () => {
    toggleTag("work");
    toggleTag("personal");
    setTagMatchMode("any");
    expect(filteredLinks().map(l => l.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("all: only links carrying every selected tag match", () => {
    toggleTag("work");
    toggleTag("personal");
    setTagMatchMode("all");
    expect(filteredLinks().map(l => l.id)).toEqual(["b"]);
  });

  it("all with a single selected tag behaves like any", () => {
    toggleTag("work");
    setTagMatchMode("all");
    expect(filteredLinks().map(l => l.id).sort()).toEqual(["a", "b"]);
  });
});

describe("matchMode any/all (cross-type)", () => {
  it("any: union of color OR tag widens the result", () => {
    // blue = {1,3}; personal = {2,3}; union = {1,2,3}
    toggleColor("blue");
    toggleTag("personal");
    setMatchMode("any");
    expect(filteredLinks()).toHaveLength(3);
  });

  it("any: only matching-either survive when facets don't overlap fully", () => {
    // green = {2}; work = {1}; union = {1,2}, link 3 (blue/personal) excluded
    toggleColor("green");
    toggleTag("work");
    setMatchMode("any");
    const ids = filteredLinks().map(l => l.id).sort();
    expect(ids).toEqual(["1", "2"]);
  });

  it("all vs any on the same selection differ", () => {
    toggleColor("blue");
    toggleTag("personal");
    setMatchMode("all");
    expect(filteredLinks()).toHaveLength(1);
    setMatchMode("any");
    expect(filteredLinks()).toHaveLength(3);
  });

  it("with only one facet active, any and all agree", () => {
    toggleColor("blue");
    setMatchMode("all");
    const all = filteredLinks().map(l => l.id).sort();
    setMatchMode("any");
    const any = filteredLinks().map(l => l.id).sort();
    expect(any).toEqual(all);
  });
});
