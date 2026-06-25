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
});
