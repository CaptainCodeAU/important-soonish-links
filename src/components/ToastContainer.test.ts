import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import ToastContainer from "./ToastContainer.svelte";
import { toastsState, pushToast } from "../store/toasts.svelte";

beforeEach(() => {
  toastsState.items = [];
});

describe("ToastContainer dismissal (C7)", () => {
  it("renders a labeled dismiss button per toast", async () => {
    pushToast("Hello", { duration: 999999 });
    render(ToastContainer);
    await tick();
    expect(screen.getByLabelText("Dismiss")).toBeTruthy();
  });

  it("clicking dismiss removes the toast", async () => {
    pushToast("Hello", { duration: 999999 });
    render(ToastContainer);
    await tick();
    await fireEvent.click(screen.getByLabelText("Dismiss"));
    await tick();
    expect(toastsState.items.length).toBe(0);
  });

  it("does not dismiss toasts on Escape, so Undo survives (review fix)", async () => {
    pushToast("Link removed", { duration: 999999, action: { label: "Undo", onClick: () => {} } });
    render(ToastContainer);
    await tick();
    await fireEvent.keyDown(window, { key: "Escape" });
    await tick();
    expect(toastsState.items.length).toBe(1);
  });
});
