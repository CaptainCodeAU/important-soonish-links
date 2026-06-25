import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import EmptyState from "./EmptyState.svelte";

describe("EmptyState", () => {
  it("shows no clear-filters button without the handler", () => {
    render(EmptyState, { type: "no-results" });
    expect(screen.queryByRole("button", { name: /clear filters/i })).toBeNull();
  });

  it("shows a clear-filters button when onClearFilters is provided", () => {
    render(EmptyState, { type: "no-results", onClearFilters: () => {} });
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeTruthy();
  });

  it("calls onClearFilters when the button is clicked (the escape hatch)", async () => {
    const onClearFilters = vi.fn();
    render(EmptyState, { type: "no-results", onClearFilters });
    await fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });
});
