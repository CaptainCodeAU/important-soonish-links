import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import LinkList from "./LinkList.svelte";
import { COPY } from "../lib/copy";
import { linksState } from "../store/links.svelte";
import { searchState, clearSearch } from "../store/search.svelte";
import { clearFilters } from "../store/filters.svelte";

beforeEach(() => {
  linksState.items = [];
  linksState.loaded = true;
  clearSearch();
  clearFilters();
});

describe("LinkList status announcements (C3)", () => {
  it("does not announce via aria-live on the list container", () => {
    render(LinkList);
    expect(screen.getByRole("list").getAttribute("aria-live")).toBeNull();
  });

  it("keeps the status node silent until filtering", () => {
    render(LinkList);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("announces the result count while searching", async () => {
    render(LinkList);
    searchState.query = "anything";
    await tick();
    expect(screen.getByRole("status").textContent).toMatch(/result/);
  });
});

describe("LinkList load state (D3)", () => {
  it("shows neither empty message before the first load resolves", () => {
    linksState.items = [];
    linksState.loaded = false;
    render(LinkList);
    expect(screen.queryByText(COPY.EMPTY_SEARCH)).toBeNull();
    expect(screen.queryByText(COPY.EMPTY_LIST)).toBeNull();
  });

  it("shows the empty message once loaded with no links", () => {
    linksState.items = [];
    linksState.loaded = true;
    render(LinkList);
    expect(screen.getByText(COPY.EMPTY_LIST)).toBeTruthy();
  });
});
