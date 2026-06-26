import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import SettingsView from "./SettingsView.svelte";
import { COPY } from "../lib/copy";

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
