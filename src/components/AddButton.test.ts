import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import AddButton from "./AddButton.svelte";
import { COPY } from "../lib/copy";

describe("AddButton accessibility", () => {
  it("manual-entry form inputs expose accessible names (C8)", async () => {
    render(AddButton);
    await fireEvent.click(screen.getByLabelText("Manual entry"));
    await tick();
    // aria-label (not placeholder) gives each input a screen-reader name.
    expect(screen.getByLabelText(COPY.ADD_TITLE_PLACEHOLDER)).toBeTruthy();
    expect(screen.getByLabelText(COPY.ADD_URL_PLACEHOLDER)).toBeTruthy();
  });
});
