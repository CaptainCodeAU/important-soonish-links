import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import LinkCard from "./LinkCard.svelte";
import { linksState, addLink } from "../store/links.svelte";
import type { SavedLink } from "../types";

const makeLink = (overrides?: Partial<SavedLink>): SavedLink => ({
  id: "test-1",
  title: "Example Site",
  url: "https://example.com",
  color: "default",
  order: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

beforeEach(() => {
  linksState.items = [];
  chrome.storage.local.clear();
});

describe("LinkCard", () => {
  it("renders the link title", async () => {
    const link = makeLink({ title: "My Test Link" });
    await addLink(link);
    render(LinkCard, { link });
    expect(screen.getByText("My Test Link")).toBeTruthy();
  });

  it("renders the hostname", async () => {
    const link = makeLink({ url: "https://example.com/path" });
    await addLink(link);
    render(LinkCard, { link });
    expect(screen.getByText("example.com")).toBeTruthy();
  });

  it("renders delete button", async () => {
    const link = makeLink();
    await addLink(link);
    render(LinkCard, { link });
    expect(screen.getByLabelText("Delete link")).toBeTruthy();
  });

  it("renders mark-as-read button", async () => {
    const link = makeLink();
    await addLink(link);
    render(LinkCard, { link });
    expect(screen.getByLabelText("Mark as read")).toBeTruthy();
  });

  it("has role=listitem", async () => {
    const link = makeLink();
    await addLink(link);
    render(LinkCard, { link });
    expect(screen.getByRole("listitem")).toBeTruthy();
  });

  it("delete button removes link from store", async () => {
    const link = makeLink();
    await addLink(link);
    expect(linksState.items).toHaveLength(1);
    render(LinkCard, { link });
    await fireEvent.click(screen.getByLabelText("Delete link"));
    await tick();
    expect(linksState.items).toHaveLength(0);
  });

  it("shows 'Mark as unread' when link.isRead is true", async () => {
    const link = makeLink({ isRead: true });
    await addLink(link);
    render(LinkCard, { link });
    expect(screen.getByLabelText("Mark as unread")).toBeTruthy();
  });

  it("renders with all 10 color values without error", async () => {
    const colors = [
      "default","gray","brown","orange","yellow",
      "green","blue","purple","pink","red",
    ] as const;
    for (const color of colors) {
      const { unmount } = render(LinkCard, { link: makeLink({ color, id: color }) });
      expect(screen.getByRole("listitem")).toBeTruthy();
      unmount();
    }
  });
});
