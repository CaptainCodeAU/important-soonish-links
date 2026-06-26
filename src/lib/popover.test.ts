import { describe, it, expect, afterEach, vi } from "vitest";
import { placePopover, clickedOutside, rovingKeydown, focusFirstOption, trackViewport } from "./popover";

describe("placePopover", () => {
  const anchor = { left: 10, top: 100, bottom: 120 };

  it("places below by default (top = bottom + offset)", () => {
    expect(placePopover(anchor, { offset: 6, viewportHeight: 800 })).toBe(
      "position:fixed;left:10px;top:126px;",
    );
  });

  it("uses the anchor's left coordinate", () => {
    expect(placePopover({ left: 42, top: 0, bottom: 20 }, { viewportHeight: 800 })).toContain(
      "left:42px;",
    );
  });

  it("auto-bottom stays below when there is room", () => {
    expect(
      placePopover(anchor, { placement: "auto-bottom", offset: 4, panelHeight: 40, viewportHeight: 800 }),
    ).toBe("position:fixed;left:10px;top:124px;");
  });

  it("auto-bottom flips above when below space is insufficient", () => {
    // viewport 130 => spaceBelow = 130 - 120 = 10 < panelHeight 40 => flip up
    expect(
      placePopover(anchor, { placement: "auto-bottom", offset: 4, panelHeight: 40, viewportHeight: 130 }),
    ).toBe("position:fixed;left:10px;bottom:34px;");
  });

  it("auto-top prefers above for a tall menu that fits", () => {
    const a = { left: 0, top: 300, bottom: 320 };
    expect(
      placePopover(a, { placement: "auto-top", offset: 6, panelHeight: 100, viewportHeight: 800 }),
    ).toBe("position:fixed;left:0px;bottom:506px;");
  });

  it("auto-top falls back below when above neither fits nor has more room", () => {
    const a = { left: 0, top: 50, bottom: 70 };
    expect(
      placePopover(a, { placement: "auto-top", offset: 6, panelHeight: 100, viewportHeight: 800 }),
    ).toBe("position:fixed;left:0px;top:76px;");
  });

  it("top always opens above", () => {
    expect(placePopover(anchor, { placement: "top", offset: 6, viewportHeight: 800 })).toBe(
      "position:fixed;left:10px;bottom:706px;",
    );
  });
});

describe("clickedOutside", () => {
  it("returns true when the target is outside every element", () => {
    const wrap = document.createElement("div");
    const menu = document.createElement("div");
    document.body.append(wrap, menu);
    const evt = { target: document.body } as unknown as MouseEvent;
    expect(clickedOutside(evt, [wrap, menu])).toBe(true);
  });

  it("returns false when the target is inside one of the elements", () => {
    const menu = document.createElement("div");
    const child = document.createElement("button");
    menu.appendChild(child);
    document.body.append(menu);
    const evt = { target: child } as unknown as MouseEvent;
    expect(clickedOutside(evt, [menu])).toBe(false);
  });

  it("returns false when any ref is missing (half-mounted menu)", () => {
    const menu = document.createElement("div");
    document.body.append(menu);
    const evt = { target: document.body } as unknown as MouseEvent;
    expect(clickedOutside(evt, [undefined, menu])).toBe(false);
  });
});

describe("rovingKeydown", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  function buildMenu(n = 3): { container: HTMLElement; items: HTMLButtonElement[] } {
    const container = document.createElement("div");
    const items = Array.from({ length: n }, () => {
      const b = document.createElement("button");
      b.setAttribute("role", "option");
      container.appendChild(b);
      return b;
    });
    document.body.appendChild(container);
    return { container, items };
  }

  const key = (k: string) => new KeyboardEvent("keydown", { key: k });

  it("vertical ArrowDown moves focus to the next item", () => {
    const { container, items } = buildMenu();
    items[0].focus();
    expect(rovingKeydown(key("ArrowDown"), container, { orientation: "vertical" })).toBeNull();
    expect(document.activeElement).toBe(items[1]);
  });

  it("vertical ArrowUp moves focus to the previous item", () => {
    const { container, items } = buildMenu();
    items[1].focus();
    expect(rovingKeydown(key("ArrowUp"), container, { orientation: "vertical" })).toBeNull();
    expect(document.activeElement).toBe(items[0]);
  });

  it("horizontal mode responds to ArrowRight/ArrowLeft", () => {
    const { container, items } = buildMenu();
    items[0].focus();
    rovingKeydown(key("ArrowRight"), container, { orientation: "horizontal" });
    expect(document.activeElement).toBe(items[1]);
    rovingKeydown(key("ArrowLeft"), container, { orientation: "horizontal" });
    expect(document.activeElement).toBe(items[0]);
  });

  it("Home/End jump to the first and last item when enabled", () => {
    const { container, items } = buildMenu();
    items[0].focus();
    rovingKeydown(key("End"), container, { homeEnd: true });
    expect(document.activeElement).toBe(items[2]);
    rovingKeydown(key("Home"), container, { homeEnd: true });
    expect(document.activeElement).toBe(items[0]);
  });

  it("ignores Home/End when homeEnd is false", () => {
    const { container, items } = buildMenu();
    items[1].focus();
    expect(rovingKeydown(key("Home"), container, { homeEnd: false })).toBeNull();
    expect(document.activeElement).toBe(items[1]);
  });

  it("does not move past the last item", () => {
    const { container, items } = buildMenu();
    items[2].focus();
    rovingKeydown(key("ArrowDown"), container, { orientation: "vertical" });
    expect(document.activeElement).toBe(items[2]);
  });

  it("reports Escape so the caller can close", () => {
    const { container } = buildMenu();
    expect(rovingKeydown(key("Escape"), container)).toBe("close");
  });
});

describe("focusFirstOption", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("focuses the first matching option after the tick", async () => {
    const container = document.createElement("div");
    const first = document.createElement("button");
    first.setAttribute("role", "option");
    const second = document.createElement("button");
    second.setAttribute("role", "option");
    container.append(first, second);
    document.body.appendChild(container);
    await focusFirstOption(container);
    expect(document.activeElement).toBe(first);
  });

  it("is a no-op when the container is undefined", async () => {
    await expect(focusFirstOption(undefined)).resolves.toBeUndefined();
  });
});

describe("trackViewport", () => {
  it("listens to scroll (capture) + resize and the disposer removes both", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const handler = vi.fn();
    const stop = trackViewport(handler);
    expect(add).toHaveBeenCalledWith("scroll", handler, true);
    expect(add).toHaveBeenCalledWith("resize", handler);
    stop();
    expect(remove).toHaveBeenCalledWith("scroll", handler, true);
    expect(remove).toHaveBeenCalledWith("resize", handler);
    add.mockRestore();
    remove.mockRestore();
  });

  it("invokes the handler on scroll and resize, and stops after dispose", () => {
    const handler = vi.fn();
    const stop = trackViewport(handler);
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    expect(handler).toHaveBeenCalledTimes(2);
    stop();
    window.dispatchEvent(new Event("resize"));
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
