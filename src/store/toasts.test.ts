import { describe, it, expect, beforeEach } from "vitest";
import { toastsState, pushToast } from "./toasts.svelte";

beforeEach(() => {
  toastsState.items = [];
});

describe("pushToast cap + dedupe (D4)", () => {
  it("caps the stack at 3, dropping the oldest", () => {
    pushToast("a", { duration: 999999 });
    pushToast("b", { duration: 999999 });
    pushToast("c", { duration: 999999 });
    pushToast("d", { duration: 999999 });
    expect(toastsState.items).toHaveLength(3);
    expect(toastsState.items.map(t => t.message)).toEqual(["b", "c", "d"]);
  });

  it("dedupes identical actionless messages", () => {
    pushToast("same", { duration: 999999 });
    pushToast("same", { duration: 999999 });
    expect(toastsState.items).toHaveLength(1);
  });

  it("never dedupes toasts that carry an action (undo must survive)", () => {
    pushToast("Link removed", { duration: 999999, action: { label: "Undo", onClick: () => {} } });
    pushToast("Link removed", { duration: 999999, action: { label: "Undo", onClick: () => {} } });
    expect(toastsState.items).toHaveLength(2);
  });
});
