import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import App from "./App.svelte";

describe("App focus management (C4)", () => {
  it("returns focus to the settings gear after leaving settings", async () => {
    render(App);
    await tick();
    await fireEvent.click(screen.getByLabelText("Settings"));
    await tick();
    await fireEvent.click(screen.getByLabelText("Back to links"));
    await tick();
    await tick();
    expect(document.activeElement).toBe(screen.getByLabelText("Settings"));
  });
});
