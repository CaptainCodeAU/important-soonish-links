// Shared scaffolding for the fixed-position dropdown menus (ColorPicker,
// TagDropdown, ColorFilterMenu, TagFilterMenu). The popups are rendered with
// `position: fixed` and anchored to their trigger via getBoundingClientRect, so
// they escape the popup's clipping/scroll. Each menu keeps its own markup, roles,
// aria, and bespoke open behavior; only the three repeated mechanics live here:
// placement math, outside-click detection, and roving-focus key handling.

import { tick } from "svelte";

/** Minimal shape of a trigger's bounding box (DOMRect is assignable). */
export interface AnchorRect {
  left: number;
  top: number;
  bottom: number;
}

export type Placement =
  | "bottom" // always below the anchor
  | "top" // always above the anchor
  | "auto-bottom" // below by default, flip up when there isn't room
  | "auto-top"; // above by default (tall menu in a short popup), flip down

export interface PlaceOptions {
  placement?: Placement; // default "bottom"
  offset?: number; // gap between anchor and panel, px (default 6)
  panelHeight?: number; // estimated panel height, used by the auto-* flips
  viewportHeight?: number; // injectable for tests; defaults to window.innerHeight
}

/**
 * Build the inline `position:fixed` style string that pins a panel to its anchor,
 * choosing above/below per the placement strategy. Pure: pass a rect, get a string.
 */
export function placePopover(anchor: AnchorRect, opts: PlaceOptions = {}): string {
  const { placement = "bottom", offset = 6, panelHeight = 0 } = opts;
  const viewportHeight = opts.viewportHeight ?? window.innerHeight;
  const spaceBelow = viewportHeight - anchor.bottom;
  const spaceAbove = anchor.top;

  let above: boolean;
  switch (placement) {
    case "top":
      above = true;
      break;
    case "auto-bottom":
      above = spaceBelow < panelHeight;
      break;
    case "auto-top":
      // Prefer above when it fits, or when it simply has more room than below.
      above = spaceAbove >= panelHeight || spaceAbove > spaceBelow;
      break;
    default:
      above = false;
  }

  const left = `left:${anchor.left}px;`;
  return above
    ? `position:fixed;${left}bottom:${viewportHeight - anchor.top + offset}px;`
    : `position:fixed;${left}top:${anchor.bottom + offset}px;`;
}

/**
 * True when the click landed outside every supplied element — the signal to close
 * an open menu. Returns false if any ref is missing (a half-mounted menu shouldn't
 * close itself), matching the original `el && !el.contains(...)` guards.
 */
export function clickedOutside(
  event: MouseEvent,
  elements: Array<HTMLElement | undefined | null>,
): boolean {
  const target = event.target as Node;
  return elements.every((el) => el != null && !el.contains(target));
}

export type Orientation = "vertical" | "horizontal";

export interface RovingOptions {
  orientation?: Orientation; // arrow axis (default "vertical")
  homeEnd?: boolean; // honour Home/End jumps (default true)
  selector?: string; // focusable items within the container (default "[role=option]")
}

/**
 * Roving-focus key handling for a menu container: moves focus across the items with
 * the arrow keys (and optionally Home/End), and reports Escape so the caller can
 * close and return focus to the trigger. Returns "close" on Escape, else null
 * (after handling any arrow/Home/End focus move) — the only signal callers act on.
 */
export function rovingKeydown(
  event: KeyboardEvent,
  container: HTMLElement | undefined,
  opts: RovingOptions = {},
): "close" | null {
  if (event.key === "Escape") {
    event.preventDefault();
    return "close";
  }

  const { orientation = "vertical", homeEnd = true, selector = "[role=option]" } = opts;
  const items = container ? Array.from(container.querySelectorAll<HTMLElement>(selector)) : [];
  if (!items.length) return null;

  const i = items.indexOf(document.activeElement as HTMLElement);
  const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
  const prevKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";

  if (event.key === nextKey) {
    event.preventDefault();
    items[Math.min(i + 1, items.length - 1)]?.focus();
    return null;
  }
  if (event.key === prevKey) {
    event.preventDefault();
    items[Math.max(i - 1, 0)]?.focus();
    return null;
  }
  if (homeEnd && event.key === "Home") {
    event.preventDefault();
    items[0]?.focus();
    return null;
  }
  if (homeEnd && event.key === "End") {
    event.preventDefault();
    items[items.length - 1]?.focus();
    return null;
  }
  return null;
}

/**
 * After an opening menu mounts, move focus to its first option so keyboard users
 * land inside it immediately. Fire-and-forget: awaits the DOM update, then focuses.
 */
export async function focusFirstOption(
  container: HTMLElement | undefined,
  selector = "[role=option]",
): Promise<void> {
  await tick();
  container?.querySelector<HTMLElement>(selector)?.focus();
}
