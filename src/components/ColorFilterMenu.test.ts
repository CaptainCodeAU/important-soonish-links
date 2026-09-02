import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import ColorFilterMenu from "./ColorFilterMenu.svelte";
import { filtersState, clearFilters } from "../store/filters.svelte";

beforeEach(() => clearFilters());

describe("ColorFilterMenu", () => {
  it("renders the Color trigger", () => {
    render(ColorFilterMenu);
    expect(screen.getByRole("button", { name: /color/i })).toBeTruthy();
  });

  it("menu is closed by default", () => {
    render(ColorFilterMenu);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("opens with all 10 color options (multi-select)", async () => {
    render(ColorFilterMenu);
    await fireEvent.click(screen.getByRole("button", { name: /color/i }));
    await tick();
    expect(screen.getByRole("listbox").getAttribute("aria-multiselectable")).toBe("true");
    expect(screen.getAllByRole("option")).toHaveLength(10);
  });

  it("toggling options selects multiple colors in the store", async () => {
    render(ColorFilterMenu);
    await fireEvent.click(screen.getByRole("button", { name: /color/i }));
    await tick();
    const options = screen.getAllByRole("option");
    await fireEvent.click(options[0]);
    await fireEvent.click(options[2]);
    expect(filtersState.activeColors.size).toBe(2);
  });

  it("Clear resets just the color filter", async () => {
    render(ColorFilterMenu);
    await fireEvent.click(screen.getByRole("button", { name: /color/i }));
    await tick();
    await fireEvent.click(screen.getAllByRole("option")[0]);
    expect(filtersState.activeColors.size).toBe(1);
    await fireEvent.click(screen.getByRole("button", { name: /^clear$/i }));
    expect(filtersState.activeColors.size).toBe(0);
  });

  it("moves focus to the first option on open (#1)", async () => {
    render(ColorFilterMenu);
    await fireEvent.click(screen.getByRole("button", { name: /color/i }));
    await tick();
    expect(document.activeElement).toBe(screen.getAllByRole("option")[0]);
  });

  it("Escape closes and returns focus to the trigger", async () => {
    render(ColorFilterMenu);
    const trigger = screen.getByRole("button", { name: /color/i });
    await fireEvent.click(trigger);
    await tick();
    const menu = screen.getByRole("listbox");
    await fireEvent.keyDown(menu, { key: "Escape" });
    await tick();
    // Checks aria-expanded rather than DOM absence: the menu's transition:fade outro never
    // resolves under jsdom's Element.animate stub (a pre-existing, unrelated test-env gap —
    // confirmed independently), so the node lingers in the DOM after `open` correctly flips.
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });
});
