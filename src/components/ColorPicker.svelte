<script lang="ts">
  import { onDestroy } from "svelte";
  import { NOTION_PALETTE } from "../lib/colors";
  import { createPopover } from "../lib/popover.svelte";
  import { COLOR_IDS } from "../types";
  import type { ColorId } from "../types";

  let { value, onChange }: { value: ColorId; onChange: (c: ColorId) => void } = $props();
  let pickerEl: HTMLElement | undefined = $state();
  let dotEl: HTMLElement | undefined = $state();
  let swatchesEl: HTMLElement | undefined = $state();
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let reopenSuppressed = false;

  // Opens on hover/focus rather than click, uses radiogroup/radio rather than
  // listbox/option, and has its own hover-intent close timer below -- genuinely
  // different from the other three menus, so it keeps its own markup and open
  // trigger. It shares the controller for placement, outside-click, and
  // viewport-tracking close, and gains roving-focus keyboard nav (Home/End
  // included, previously Left/Right only) and Escape-closes-the-container instead
  // of Escape-per-swatch.
  const menu = createPopover({
    anchor: () => dotEl,
    panel: () => swatchesEl,
    place: { placement: "auto-bottom", offset: 4, panelHeight: 40 },
    roving: { selector: "[role=radio]", orientation: "horizontal" },
    // Focus the currently-selected swatch on open, not simply the first one --
    // matching the roving tabindex below (only the selected radio is tabbable).
    focusOnOpen: '[role=radio][aria-checked="true"]',
    // Outside-click checks the whole wrapper and the panel, not just the dot.
    outsideRefs: () => [pickerEl, swatchesEl],
  });

  function handleKeydown(e: KeyboardEvent, color: ColorId) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(color); return; }
    if (e.key === "Escape") {
      e.preventDefault();
      // Suppress the re-open that focusing the dot would otherwise trigger via onfocus. N2.
      reopenSuppressed = true;
      menu.close();
      reopenSuppressed = false;
      return;
    }
    menu.onKeydown(e);
  }

  function select(color: ColorId) { onChange(color); menu.close({ returnFocus: false }); }

  function scheduleClose() {
    closeTimer = setTimeout(() => menu.close({ returnFocus: false }), 80);
  }

  function cancelClose() {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = undefined; }
  }

  onDestroy(cancelClose);

  function openPicker() {
    // Suppress the re-open that Escape's dotEl.focus() would otherwise trigger -- the dot
    // opens on focus, so returning focus to it after Escape must not reopen the menu. N2.
    if (reopenSuppressed) return;
    cancelClose();
    void menu.openMenu();
  }

  function handleFocusOut(e: FocusEvent) {
    // Tab away from the whole picker closes it (and releases the scroll listener,
    // which opens on dot focus but has no blur-close otherwise). C2 review.
    if (!pickerEl?.contains(e.relatedTarget as Node)) menu.close({ returnFocus: false });
  }
</script>

<svelte:window on:click={menu.onWindowClick} />

<div class="color-wrap" bind:this={pickerEl} onfocusout={handleFocusOut}>
  <button
    class="dot"
    bind:this={dotEl}
    style:background={NOTION_PALETTE[value].solid}
    onmouseenter={openPicker}
    onmouseleave={scheduleClose}
    onfocus={openPicker}
    aria-label="Card color: {NOTION_PALETTE[value].label}"
    aria-expanded={menu.open}
  ></button>
  {#if menu.open}
    <div
      class="swatches"
      role="radiogroup"
      aria-label="Card color"
      tabindex="-1"
      style={menu.style}
      bind:this={swatchesEl}
      onmouseenter={cancelClose}
      onmouseleave={scheduleClose}
    >
      {#each COLOR_IDS as color (color)}
        <button
          class="swatch"
          style:background={NOTION_PALETTE[color].solid}
          role="radio"
          aria-checked={color === value}
          aria-label={NOTION_PALETTE[color].label}
          onclick={() => select(color)}
          onkeydown={(e) => handleKeydown(e, color)}
          tabindex={color === value ? 0 : -1}
        ></button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .color-wrap { position: relative; flex-shrink: 0; }
  .dot {
    width: 16px; height: 16px;
    border-radius: var(--radius-full);
    transition: transform var(--duration-fast) var(--ease-out);
    flex-shrink: 0;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  .dot:hover { transform: scale(1.2); }
  .dot:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .swatches {
    display: flex; gap: 4px;
    background: var(--color-surface-base);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 6px;
    box-shadow: var(--shadow-dropdown);
    z-index: 1000;
  }
  .swatch {
    width: 20px; height: 20px;
    border-radius: var(--radius-sm);
    border: 2px solid transparent;
    transition: transform var(--duration-fast) var(--ease-out);
    cursor: pointer;
    padding: 0;
  }
  .swatch[aria-checked="true"] { border-color: var(--color-text-primary); }
  .swatch:hover { transform: scale(1.15); }
  .swatch:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 1px; }
</style>
