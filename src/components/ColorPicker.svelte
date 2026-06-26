<script lang="ts">
  import { NOTION_PALETTE } from "../lib/colors";
  import { placePopover, clickedOutside, trackViewport } from "../lib/popover";
  import { COLOR_IDS } from "../types";
  import type { ColorId } from "../types";

  let { value, onChange }: { value: ColorId; onChange: (c: ColorId) => void } = $props();
  let open = $state(false);
  let pickerEl: HTMLElement | undefined = $state();
  let dotEl: HTMLElement | undefined = $state();
  let swatchesEl: HTMLElement | undefined = $state();
  let swatchStyle = $state("");
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let reopenSuppressed = false;

  function handleKeydown(e: KeyboardEvent, color: ColorId, idx: number) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(color); }
    if (e.key === "ArrowRight") { e.preventDefault(); focusSwatch(idx + 1); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); focusSwatch(idx - 1); }
    // Escape closes and returns focus to the dot, consistent with the other menus. The
    // flag stops the dot's onfocus from immediately reopening it. N2.
    if (e.key === "Escape") {
      e.preventDefault();
      open = false;
      reopenSuppressed = true;
      dotEl?.focus();
      reopenSuppressed = false;
    }
  }

  function focusSwatch(idx: number) {
    const swatches = swatchesEl?.querySelectorAll<HTMLElement>("[role=radio]");
    if (!swatches) return;
    const clamped = Math.max(0, Math.min(idx, swatches.length - 1));
    swatches[clamped]?.focus();
  }

  function select(color: ColorId) { onChange(color); open = false; }

  function scheduleClose() {
    closeTimer = setTimeout(() => { open = false; }, 80);
  }

  function cancelClose() {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = undefined; }
  }

  function reposition() {
    if (!dotEl) return;
    swatchStyle = placePopover(dotEl.getBoundingClientRect(), {
      placement: "auto-bottom",
      offset: 4,
      panelHeight: 40,
    });
  }

  function openPicker() {
    // Suppress the re-open that Escape's dotEl.focus() would otherwise trigger — the dot
    // opens on focus, so returning focus to it after Escape must not reopen the menu. N2.
    if (reopenSuppressed) return;
    cancelClose();
    if (!dotEl) return;
    reposition();
    open = true;
  }


  function handleWindowClick(e: MouseEvent) {
    if (open && clickedOutside(e, [pickerEl, swatchesEl])) open = false;
  }

  function handleFocusOut(e: FocusEvent) {
    // Tab away from the whole picker closes it (and releases the scroll listener
    // below, which opens on dot focus but has no blur-close otherwise). C2 review.
    if (!pickerEl?.contains(e.relatedTarget as Node)) open = false;
  }

  // Close the picker on scroll/resize so it never floats detached from its dot;
  // the disposer releases the listeners. C2.
  $effect(() => {
    if (!open) return;
    return trackViewport(() => { open = false; });
  });
</script>

<svelte:window on:click={handleWindowClick} />

<div class="color-wrap" bind:this={pickerEl} onfocusout={handleFocusOut}>
  <button
    class="dot"
    bind:this={dotEl}
    style:background={NOTION_PALETTE[value].solid}
    onmouseenter={openPicker}
    onmouseleave={scheduleClose}
    onfocus={openPicker}
    aria-label="Card color: {NOTION_PALETTE[value].label}"
    aria-expanded={open}
  ></button>
  {#if open}
    <div
      class="swatches"
      role="radiogroup"
      aria-label="Card color"
      style={swatchStyle}
      bind:this={swatchesEl}
      onmouseenter={cancelClose}
      onmouseleave={scheduleClose}
    >
      {#each COLOR_IDS as color, i (color)}
        <button
          class="swatch"
          style:background={NOTION_PALETTE[color].solid}
          role="radio"
          aria-checked={color === value}
          aria-label={NOTION_PALETTE[color].label}
          onclick={() => select(color)}
          onkeydown={(e) => handleKeydown(e, color, i)}
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
