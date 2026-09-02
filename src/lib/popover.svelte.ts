// Shared controller for the fixed-position dropdown menus (TagDropdown, TagFilterMenu,
// ColorFilterMenu, and -- partially, see ColorPicker.svelte's own comments -- ColorPicker).
// popover.ts holds the pure leaf functions (placement math, outside-click test, roving-focus
// key handling); this file is the layer above that was missing: the open/close state, the
// wiring between those leaves, and the one bug all four menus shared before this existed (see
// below). Each menu keeps its own markup, roles, aria, and open trigger (hover for ColorPicker,
// click for the rest) -- only the mechanics below are common.

import { tick } from "svelte";
import { placePopover, clickedOutside, rovingKeydown, focusFirstOption, trackViewport } from "./popover";
import type { PlaceOptions, RovingOptions } from "./popover";

export interface PopoverOptions {
  /** Read live -- not captured once -- so the controller always sees the current trigger. */
  anchor: () => HTMLElement | undefined;
  /** Read live. Notably read again AFTER the panel mounts; see openMenu(). */
  panel: () => HTMLElement | undefined;
  /** Passed to placePopover. A function when placement depends on live layout (e.g. option count). */
  place: PlaceOptions | (() => PlaceOptions);
  /** Roving-focus options for keyboard nav inside the panel; also supplies focusFirstOption's selector. */
  roving?: RovingOptions;
  /**
   * Selector for the element openMenu() focuses, if it should be narrower than
   * roving.selector -- e.g. ColorPicker wants the currently-*selected* swatch, not simply
   * the first one, so it passes `[role=radio][aria-checked="true"]`. Defaults to
   * roving.selector (or focusFirstOption's own default, "[role=option]").
   */
  focusOnOpen?: string;
  /**
   * Elements outside-click must also treat as "inside" the popover, beyond anchor()/panel() --
   * e.g. a wrapper div distinct from the trigger button. Defaults to [anchor(), panel()].
   */
  outsideRefs?: () => Array<HTMLElement | undefined | null>;
}

export interface PopoverController {
  readonly open: boolean;
  readonly style: string;
  /** Click-to-open-or-close, as used by every menu's trigger button. */
  toggle(): void;
  /** Open directly, for a trigger that isn't a toggle (e.g. ColorPicker's hover/focus open). */
  openMenu(): void;
  close(options?: { returnFocus?: boolean }): void;
  /** Wire to the panel's onkeydown. */
  onKeydown(e: KeyboardEvent): void;
  /** Wire to <svelte:window on:click>. */
  onWindowClick(e: MouseEvent): void;
}

/**
 * Owns a popover's open state, placement, outside-click, viewport-tracking close, and
 * roving-focus keydown handling -- previously hand-rolled, near-identically, in each of the
 * four menus, which is how they drifted (menu-pinning and Escape/reopen review-fix commits)
 * and why one of them, ColorFilterMenu, had no test file at all.
 *
 * Fixes a live bug present in all three listbox menus before this controller existed: each
 * called `focusFirstOption(menuEl)` on the same line as `open = true`, before Svelte flushes
 * the `{#if open}` block that the panel lives behind -- so `menuEl` was still `undefined`,
 * passed by value, and the helper's own `await tick()` couldn't rescue it. Keyboard focus
 * never entered the menu on open. openMenu() below awaits tick() itself, THEN reads panel()
 * live -- by then bind:this has run -- before focusing into it.
 */
export function createPopover(opts: PopoverOptions): PopoverController {
  let open = $state(false);
  let style = $state("");

  function reposition() {
    const anchorEl = opts.anchor();
    if (!anchorEl) return;
    const place = typeof opts.place === "function" ? opts.place() : opts.place;
    style = placePopover(anchorEl.getBoundingClientRect(), place);
  }

  async function openMenu() {
    if (!opts.anchor()) return;
    reposition();
    open = true;
    // Let the panel actually mount before touching it -- reading opts.panel() here
    // synchronously would still return the pre-open value, which is the bug above.
    await tick();
    void focusFirstOption(opts.panel(), opts.focusOnOpen ?? opts.roving?.selector);
  }

  function toggle() {
    if (open) { open = false; return; }
    void openMenu();
  }

  function close(options: { returnFocus?: boolean } = {}) {
    const { returnFocus = true } = options;
    open = false;
    if (returnFocus) opts.anchor()?.focus();
  }

  // Close (not reposition) on scroll/resize, so the panel never floats detached from its
  // trigger. C2.
  $effect(() => {
    if (!open) return;
    return trackViewport(() => { open = false; });
  });

  function onKeydown(e: KeyboardEvent) {
    if (rovingKeydown(e, opts.panel(), opts.roving) === "close") close();
  }

  function onWindowClick(e: MouseEvent) {
    if (!open) return;
    const refs = opts.outsideRefs ? opts.outsideRefs() : [opts.anchor(), opts.panel()];
    if (clickedOutside(e, refs)) open = false;
  }

  return {
    get open() { return open; },
    get style() { return style; },
    toggle,
    openMenu,
    close,
    onKeydown,
    onWindowClick,
  };
}
