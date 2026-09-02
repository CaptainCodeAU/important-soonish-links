import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import TagDropdown from "./TagDropdown.svelte";

describe("TagDropdown (multi-select)", () => {
  it("renders the trigger labelled 'Add tag' when empty", () => {
    render(TagDropdown, { values: [], onToggle: vi.fn() });
    expect(screen.getByRole("button", { name: "Add tag" })).toBeTruthy();
  });

  it("menu is hidden by default", () => {
    render(TagDropdown, { values: [], onToggle: vi.fn() });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("opens a multi-select listbox of 6 tags on click", async () => {
    render(TagDropdown, { values: [], onToggle: vi.fn() });
    await fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    await tick();
    expect(screen.getByRole("listbox").getAttribute("aria-multiselectable")).toBe("true");
    expect(screen.getAllByRole("option")).toHaveLength(6);
  });

  it("calls onToggle with the clicked tag id", async () => {
    const onToggle = vi.fn();
    render(TagDropdown, { values: [], onToggle });
    await fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    await tick();
    await fireEvent.click(screen.getAllByRole("option")[0]);
    expect(onToggle).toHaveBeenCalledOnce();
    expect(typeof onToggle.mock.calls[0][0]).toBe("string");
  });

  it("exposes assigned tags on the trigger and marks them selected", async () => {
    render(TagDropdown, { values: ["work", "personal"], onToggle: vi.fn() });
    expect(screen.getByRole("button", { name: /Tags: Work, Personal/ })).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: /Tags:/ }));
    await tick();
    const selected = screen.getAllByRole("option").filter(
      o => o.getAttribute("aria-selected") === "true"
    );
    expect(selected).toHaveLength(2);
  });

  it("stays open after a selection (multi-select)", async () => {
    render(TagDropdown, { values: [], onToggle: vi.fn() });
    await fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    await tick();
    await fireEvent.click(screen.getAllByRole("option")[0]);
    await tick();
    expect(screen.queryByRole("listbox")).not.toBeNull();
  });

  it("moves focus to the first option on open (#1)", async () => {
    render(TagDropdown, { values: [], onToggle: vi.fn() });
    await fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    await tick();
    expect(document.activeElement).toBe(screen.getAllByRole("option")[0]);
  });

  it("Escape closes and returns focus to the trigger", async () => {
    render(TagDropdown, { values: [], onToggle: vi.fn() });
    const trigger = screen.getByRole("button", { name: "Add tag" });
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
