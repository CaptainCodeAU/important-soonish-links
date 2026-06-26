import { describe, it, expect, beforeEach } from "vitest";
import { toastsState, pushToast } from "./toasts.svelte";

beforeEach(() => {
  toastsState.items = [];
});

describe("pushToast cap (D4)", () => {
  it("caps the stack at 3, dropping the oldest actionless toast", () => {
    pushToast("a", { duration: 999999 });
    pushToast("b", { duration: 999999 });
    pushToast("c", { duration: 999999 });
    pushToast("d", { duration: 999999 });
    expect(toastsState.items).toHaveLength(3);
    expect(toastsState.items.map(t => t.message)).toEqual(["b", "c", "d"]);
  });

  it("never evicts an action (undo) toast when capping (#1)", () => {
    pushToast("Link removed", { duration: 999999, action: { label: "Undo", onClick: () => {} } });
    pushToast("x", { duration: 999999 });
    pushToast("y", { duration: 999999 });
    pushToast("z", { duration: 999999 });
    expect(toastsState.items.find(t => t.message === "Link removed")).toBeTruthy();
    expect(toastsState.items.some(t => t.action)).toBe(true);
  });

  it("shows a repeat confirmation rather than suppressing it (#7)", () => {
    pushToast("Saved", { duration: 999999 });
    pushToast("Saved", { duration: 999999 });
    expect(toastsState.items).toHaveLength(2);
  });
});
