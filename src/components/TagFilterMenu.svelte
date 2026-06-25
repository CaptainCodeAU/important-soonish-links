<script lang="ts">
  import { tick } from "svelte";
  import { fade } from "svelte/transition";
  import { DEFAULT_TAGS } from "../lib/tags";
  import { NOTION_PALETTE } from "../lib/colors";
  import { filtersState, toggleTag, clearTags } from "../store/filters.svelte";
  import { COPY } from "../lib/copy";

  let open = $state(false);
  let triggerEl: HTMLElement | undefined = $state();
  let menuEl: HTMLElement | undefined = $state();
  let menuStyle = $state("");

  const count = $derived(filtersState.activeTags.size);

  function toggle() {
    if (open) { open = false; return; }
    if (!triggerEl) return;
    const r = triggerEl.getBoundingClientRect();
    // The bar sits at the top of the popup, so the menu opens downward with room.
    menuStyle = `position:fixed;left:${r.left}px;top:${r.bottom + 6}px;`;
    open = true;
    // Move focus into the menu so keyboard users can navigate immediately.
    tick().then(() => menuEl?.querySelector<HTMLElement>("[role=option]")?.focus());
  }

  function close(returnFocus = true) {
    open = false;
    if (returnFocus) triggerEl?.focus();
  }

  // Roving focus across the option rows (Arrow/Home/End), Escape to close.
  function onMenuKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    const opts = menuEl ? Array.from(menuEl.querySelectorAll<HTMLElement>("[role=option]")) : [];
    if (!opts.length) return;
    const i = opts.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); opts[Math.min(i + 1, opts.length - 1)]?.focus(); }
    if (e.key === "ArrowUp")   { e.preventDefault(); opts[Math.max(i - 1, 0)]?.focus(); }
    if (e.key === "Home")      { e.preventDefault(); opts[0]?.focus(); }
    if (e.key === "End")       { e.preventDefault(); opts[opts.length - 1]?.focus(); }
  }

  function handleWindowClick(e: MouseEvent) {
    if (open && triggerEl && !triggerEl.contains(e.target as Node) &&
        menuEl && !menuEl.contains(e.target as Node)) {
      open = false;
    }
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
