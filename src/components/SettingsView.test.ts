import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import SettingsView from "./SettingsView.svelte";
import { COPY } from "../lib/copy";
import { linksState } from "../store/links.svelte";

beforeEach(() => { linksState.items = []; });

describe("SettingsView accessibility", () => {
  it("sync and badge toggles have accessible names (C8)", () => {
    render(SettingsView, { onBack: vi.fn() });
    expect(screen.getByRole("checkbox", { name: COPY.SETTINGS_SYNC })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: COPY.SETTINGS_BADGE })).toBeTruthy();
  });

  it("sort select has an accessible name (C8)", () => {
    render(SettingsView, { onBack: vi.fn() });
    expect(screen.getByRole("combobox", { name: COPY.SETTINGS_SORT })).toBeTruthy();
  });
});

describe("SettingsView replace-import (D1)", () => {
  it("confirms before wiping links and leaves them intact until confirmed", async () => {
    linksState.items = [
      { id: "keep", url: "https://keep.com", title: "Keep", color: "default", tags: [], order: 0, createdAt: 1, updatedAt: 1 },
    ];
    const { container } = render(SettingsView, { onBack: vi.fn() });
    const fileInputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const replaceInput = fileInputs[fileInputs.length - 1];
    const file = new File(
      [JSON.stringify([
        { id: "new", url: "https://new.com", title: "New", color: "default", tags: [], order: 0, createdAt: 1, updatedAt: 1 },
      ])],
      "links.json",
      { type: "application/json" },
    );
    Object.defineProperty(replaceInput, "files", { value: [file], configurable: true });
    await fireEvent.change(replaceInput);
    await new Promise(r => setTimeout(r));
    await tick();
    // A confirm dialog appears and the existing link is NOT wiped yet.
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(linksState.items.some(l => l.id === "keep")).toBe(true);
  });

  it("dedupes repeats within an imported file on merge (#4)", async () => {
    linksState.items = [];
    const { container } = render(SettingsView, { onBack: vi.fn() });
    const mergeInput = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(
      [JSON.stringify([
        { id: "a", url: "https://dup.com", title: "A", color: "default", tags: [], order: 0, createdAt: 1, updatedAt: 1 },
        { id: "b", url: "https://www.dup.com/", title: "B", color: "default", tags: [], order: 0, createdAt: 1, updatedAt: 1 },
      ])],
      "links.json",
      { type: "application/json" },
    );
    Object.defineProperty(mergeInput, "files", { value: [file], configurable: true });
    await fireEvent.change(mergeInput);
    await new Promise(r => setTimeout(r));
    await new Promise(r => setTimeout(r));
    await tick();
    // Both entries normalize to the same URL → only one is imported.
    expect(linksState.items).toHaveLength(1);
  });
});
