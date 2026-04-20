import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import SearchBar from "./SearchBar.svelte";
import { searchState, clearSearch } from "../store/search.svelte";

beforeEach(() => {
  clearSearch();
});

describe("SearchBar", () => {
  it("renders a search input", () => {
    render(SearchBar);
    expect(screen.getByRole("searchbox")).toBeTruthy();
  });

  it("has placeholder text", () => {
    render(SearchBar);
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    expect(input.placeholder).toBeTruthy();
  });

  it("hides clear button when query is empty", () => {
    render(SearchBar);
    expect(screen.queryByLabelText("Clear search")).toBeNull();
  });

  it("shows clear button when query is non-empty", async () => {
    render(SearchBar);
    searchState.query = "hello";
    await tick();
    expect(screen.getByLabelText("Clear search")).toBeTruthy();
  });

  it("clears query when clear button clicked", async () => {
    render(SearchBar);
    searchState.query = "hello";
    await tick();
    await fireEvent.click(screen.getByLabelText("Clear search"));
    await tick();
    expect(searchState.query).toBe("");
  });

  it("input has aria-label for screen readers", () => {
    render(SearchBar);
    expect(screen.getByLabelText("Search saved links")).toBeTruthy();
  });
});
