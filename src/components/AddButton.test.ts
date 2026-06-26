import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import AddButton from "./AddButton.svelte";
import { COPY } from "../lib/copy";
import { linksState } from "../store/links.svelte";

beforeEach(() => { linksState.items = []; });

describe("AddButton accessibility", () => {
  it("manual-entry form inputs expose accessible names (C8)", async () => {
    render(AddButton);
    await fireEvent.click(screen.getByLabelText("Manual entry"));
    await tick();
    // aria-label (not placeholder) gives each input a screen-reader name.
    expect(screen.getByLabelText(COPY.ADD_TITLE_PLACEHOLDER)).toBeTruthy();
    expect(screen.getByLabelText(COPY.ADD_URL_PLACEHOLDER)).toBeTruthy();
  });

  it("autofocuses the title field when the form opens (C4)", async () => {
    render(AddButton);
    await fireEvent.click(screen.getByLabelText("Manual entry"));
    await tick();
    await tick();
    expect(document.activeElement).toBe(screen.getByLabelText(COPY.ADD_TITLE_PLACEHOLDER));
  });

  it("toggles the form closed on a second caret click (review fix)", async () => {
    render(AddButton);
    const caret = screen.getByLabelText("Manual entry");
    await fireEvent.click(caret);
    await tick();
    expect(screen.getByLabelText(COPY.ADD_TITLE_PLACEHOLDER)).toBeTruthy();
    await fireEvent.click(caret);
    await tick();
    expect(screen.queryByLabelText(COPY.ADD_TITLE_PLACEHOLDER)).toBeNull();
  });

  it("closes the form on Escape (review fix)", async () => {
    render(AddButton);
    await fireEvent.click(screen.getByLabelText("Manual entry"));
    await tick();
    await fireEvent.keyDown(window, { key: "Escape" });
    await tick();
    expect(screen.queryByLabelText(COPY.ADD_TITLE_PLACEHOLDER)).toBeNull();
  });

  it("submits the add form on Enter (D2)", async () => {
    render(AddButton);
    await fireEvent.click(screen.getByLabelText("Manual entry"));
    await tick();
    const urlInput = screen.getByLabelText(COPY.ADD_URL_PLACEHOLDER);
    await fireEvent.input(urlInput, { target: { value: "https://enter-test.com" } });
    await fireEvent.keyDown(urlInput, { key: "Enter" });
    await new Promise(r => setTimeout(r));
    await tick();
    expect(linksState.items.some(l => l.url === "https://enter-test.com")).toBe(true);
    expect(screen.queryByLabelText(COPY.ADD_URL_PLACEHOLDER)).toBeNull();
  });
});
