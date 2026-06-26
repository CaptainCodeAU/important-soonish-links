<script lang="ts">
  import { fade } from "svelte/transition";
  import { DEFAULT_TAGS } from "../lib/tags";
  import { NOTION_PALETTE } from "../lib/colors";
  import { filtersState, toggleTag, clearTags, setTagMatchMode } from "../store/filters.svelte";
  import { placePopover, clickedOutside, rovingKeydown, focusFirstOption, trackViewport } from "../lib/popover";
  import { COPY } from "../lib/copy";

  let open = $state(false);
  let triggerEl: HTMLElement | undefined = $state();
  let menuEl: HTMLElement | undefined = $state();
  let menuStyle = $state("");

  const count = $derived(filtersState.activeTags.size);

  function reposition() {
    if (!triggerEl) return;
    // The bar sits at the top of the popup, so the menu opens downward with room.
    menuStyle = placePopover(triggerEl.getBoundingClientRect(), { placement: "bottom", offset: 6 });
  }

  function toggle() {
    if (open) { open = false; return; }
    if (!triggerEl) return;
    reposition();
    open = true;
    // Move focus into the menu so keyboard users can navigate immediately.
    focusFirstOption(menuEl);
  }

  // Keep the menu pinned to its trigger while scrolling/resizing. C2.
  $effect(() => {
    if (!open) return;
    return trackViewport(reposition);
  });

  function close(returnFocus = true) {
    open = false;
    if (returnFocus) triggerEl?.focus();
  }

  // Roving focus across the option rows (Arrow/Home/End), Escape to close.
  function onMenuKeydown(e: KeyboardEvent) {
    if (rovingKeydown(e, menuEl, { orientation: "vertical", homeEnd: true }) === "close") close();
  }

  function handleWindowClick(e: MouseEvent) {
    if (open && clickedOutside(e, [triggerEl, menuEl])) open = false;
  }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="wrap">
  <button
    class="trigger"
    class:active={count > 0}
    bind:this={triggerEl}
    onclick={toggle}
    aria-expanded={open}
    aria-haspopup="listbox"
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
    <span>{COPY.FILTER_TAGS}</span>
    {#if count > 0}<span class="badge">{count}</span>{/if}
    <span class="caret" aria-hidden="true">▾</span>
  </button>

  {#if open}
    <div
      class="menu"
      role="listbox"
      aria-multiselectable="true"
      aria-label="Filter by tag"
      tabindex="-1"
      style={menuStyle}
      bind:this={menuEl}
      onkeydown={onMenuKeydown}
      transition:fade={{ duration: 120 }}
    >
      {#if count >= 2}
        <div class="match-row" role="group" aria-label={COPY.FILTER_MATCH}>
          <span class="match-label">{COPY.FILTER_MATCH}</span>
          <div class="seg">
            <button
              class="seg-btn" class:on={filtersState.tagMatchMode === "any"}
              onclick={() => setTagMatchMode("any")}
              aria-pressed={filtersState.tagMatchMode === "any"}
              title={COPY.FILTER_MATCH_ANY_TIP}
            >{COPY.FILTER_MATCH_ANY}</button>
            <button
              class="seg-btn" class:on={filtersState.tagMatchMode === "all"}
              onclick={() => setTagMatchMode("all")}
              aria-pressed={filtersState.tagMatchMode === "all"}
              title={COPY.FILTER_MATCH_ALL_TIP}
            >{COPY.FILTER_MATCH_ALL}</button>
          </div>
        </div>
      {/if}
      {#each DEFAULT_TAGS as tag (tag.id)}
        {@const on = filtersState.activeTags.has(tag.id)}
        <button class="opt" role="option" aria-selected={on} onclick={() => toggleTag(tag.id)}>
          <span class="check" class:on>{on ? "✓" : ""}</span>
          <span class="dot" style:background={NOTION_PALETTE[tag.accentColor].solid}></span>
          <span class="label">{tag.label}</span>
        </button>
      {/each}
      <div class="footer">
        <button class="clear" onclick={clearTags} disabled={count === 0}>{COPY.FILTER_CLEAR}</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .wrap { position: relative; }
  .trigger {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 8px; font-size: 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-surface-raised);
    color: var(--color-text-secondary);
    cursor: pointer;
  }
  .trigger:hover { border-color: var(--color-border-strong); }
  .trigger.active { border-color: var(--color-accent); color: var(--color-accent); }
  .trigger:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 16px; height: 16px; padding: 0 4px;
    border-radius: var(--radius-full);
    background: var(--color-accent); color: #fff;
    font-size: 10px; font-weight: 600;
  }
  .caret { font-size: 9px; opacity: 0.7; }
  .menu {
    min-width: 168px;
    background: var(--color-surface-base);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-dropdown);
    z-index: 1000;
    padding: 4px;
  }
  .match-row {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; padding: 4px 6px 6px;
    margin-bottom: 4px; border-bottom: 1px solid var(--color-border);
  }
  .match-label { font-size: 11px; color: var(--color-text-muted); }
  .seg {
    display: inline-flex;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  .seg-btn {
    padding: 2px 8px; font-size: 11px; font-weight: 500;
    background: transparent; border: none;
    color: var(--color-text-secondary); cursor: pointer;
  }
  .seg-btn + .seg-btn { border-left: 1px solid var(--color-border); }
  .seg-btn.on { background: var(--color-accent); color: #fff; }
  .seg-btn:not(.on):hover { background: var(--color-surface-overlay); }
  .seg-btn:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: -1px; }
  .opt {
    width: 100%;
    display: flex; align-items: center; gap: 8px;
    padding: 6px 8px; font-size: 12px;
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    text-align: left; background: transparent; border: none; cursor: pointer;
  }
  .opt:hover { background: var(--color-surface-overlay); }
  .opt[aria-selected="true"] { font-weight: 600; }
  .opt:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: -1px; }
  .check {
    width: 14px; height: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--color-border-strong); border-radius: 3px;
    font-size: 10px; color: #fff; line-height: 1;
  }
  .check.on { background: var(--color-accent); border-color: var(--color-accent); }
  .dot { width: 8px; height: 8px; border-radius: var(--radius-full); flex-shrink: 0; }
  .label { flex: 1; }
  .footer { border-top: 1px solid var(--color-border); margin-top: 4px; padding-top: 4px; }
  .clear {
    width: 100%; padding: 5px 8px; font-size: 12px;
    border-radius: var(--radius-sm);
    background: transparent; border: none;
    color: var(--color-text-secondary); cursor: pointer; text-align: left;
  }
  .clear:hover:not(:disabled) { background: var(--color-surface-overlay); color: var(--color-text-primary); }
  .clear:disabled { opacity: 0.4; cursor: default; }
  .clear:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: -1px; }
</style>
