import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import TagFilterMenu from "./TagFilterMenu.svelte";
import { filtersState, clearFilters } from "../store/filters.svelte";

beforeEach(() => clearFilters());

describe("TagFilterMenu", () => {
  it("renders the Tags trigger", () => {
    render(TagFilterMenu);
    expect(screen.getByRole("button", { name: /tags/i })).toBeTruthy();
  });

  it("menu is closed by default", () => {
    render(TagFilterMenu);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("opens with all 6 tag options (multi-select)", async () => {
    render(TagFilterMenu);
    await fireEvent.click(screen.getByRole("button", { name: /tags/i }));
    await tick();
    expect(screen.getByRole("listbox").getAttribute("aria-multiselectable")).toBe("true");
    expect(screen.getAllByRole("option")).toHaveLength(6);
  });

  it("toggling options selects multiple tags in the store", async () => {
    render(TagFilterMenu);
    await fireEvent.click(screen.getByRole("button", { name: /tags/i }));
    await tick();
    const options = screen.getAllByRole("option");
    await fireEvent.click(options[0]);
    await fireEvent.click(options[2]);
    expect(filtersState.activeTags.size).toBe(2);
  });

  it("Clear resets just the tag filter", async () => {
    render(TagFilterMenu);
    await fireEvent.click(screen.getByRole("button", { name: /tags/i }));
    await tick();
    await fireEvent.click(screen.getAllByRole("option")[0]);
    expect(filtersState.activeTags.size).toBe(1);
    await fireEvent.click(screen.getByRole("button", { name: /^clear$/i }));
    expect(filtersState.activeTags.size).toBe(0);
  });
});
