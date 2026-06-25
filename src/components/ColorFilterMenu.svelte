<script lang="ts">
  import { tick } from "svelte";
  import { fade } from "svelte/transition";
  import { NOTION_PALETTE } from "../lib/colors";
  import { COLOR_IDS } from "../types";
  import { filtersState, toggleColor, clearColors } from "../store/filters.svelte";
  import { COPY } from "../lib/copy";

  let open = $state(false);
  let triggerEl: HTMLElement | undefined = $state();
  let menuEl: HTMLElement | undefined = $state();
  let menuStyle = $state("");

  const count = $derived(filtersState.activeColors.size);

  function toggle() {
    if (open) { open = false; return; }
    if (!triggerEl) return;
    const r = triggerEl.getBoundingClientRect();
    menuStyle = `position:fixed;left:${r.left}px;top:${r.bottom + 6}px;`;
    open = true;
    // Move focus into the menu so keyboard users can navigate immediately.
    tick().then(() => menuEl?.querySelector<HTMLElement>("[role=option]")?.focus());
  }

  function close(returnFocus = true) {
    open = false;
    if (returnFocus) triggerEl?.focus();
  }

  // Roving focus across the swatch grid (Left/Right/Home/End), Escape to close.
  function onMenuKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    const opts = menuEl ? Array.from(menuEl.querySelectorAll<HTMLElement>("[role=option]")) : [];
    if (!opts.length) return;
    const i = opts.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowRight") { e.preventDefault(); opts[Math.min(i + 1, opts.length - 1)]?.focus(); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); opts[Math.max(i - 1, 0)]?.focus(); }
    if (e.key === "Home")       { e.preventDefault(); opts[0]?.focus(); }
    if (e.key === "End")        { e.preventDefault(); opts[opts.length - 1]?.focus(); }
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
    <span class="swatch-icon" aria-hidden="true"></span>
    <span>{COPY.FILTER_COLOR}</span>
    {#if count > 0}<span class="badge">{count}</span>{/if}
    <span class="caret" aria-hidden="true">▾</span>
  </button>

  {#if open}
    <div
      class="menu"
      role="listbox"
      aria-multiselectable="true"
      aria-label="Filter by color"
      tabindex="-1"
      style={menuStyle}
      bind:this={menuEl}
      onkeydown={onMenuKeydown}
      transition:fade={{ duration: 120 }}
    >
      <div class="grid">
        {#each COLOR_IDS as color (color)}
          {@const on = filtersState.activeColors.has(color)}
          <button
            class="swatch"
            class:on
            role="option"
            aria-selected={on}
            aria-label={NOTION_PALETTE[color].label}
            title={NOTION_PALETTE[color].label}
            style:background={NOTION_PALETTE[color].solid}
            onclick={() => toggleColor(color)}
          ></button>
        {/each}
      </div>
      <div class="footer">
        <button class="clear" onclick={clearColors} disabled={count === 0}>{COPY.FILTER_CLEAR}</button>
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
  .swatch-icon {
    width: 12px; height: 12px; border-radius: var(--radius-full);
    background: conic-gradient(#E03E3E, #DFAB01, #0F7B6C, #0B6E99, #6940A5, #E03E3E);
  }
  .badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 16px; height: 16px; padding: 0 4px;
    border-radius: var(--radius-full);
    background: var(--color-accent); color: #fff;
    font-size: 10px; font-weight: 600;
  }
  .caret { font-size: 9px; opacity: 0.7; }
  .menu {
    background: var(--color-surface-base);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-dropdown);
    z-index: 1000;
    padding: 8px;
  }
  .grid {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;
  }
  .swatch {
    width: 22px; height: 22px;
    border-radius: var(--radius-sm);
    border: 2px solid transparent;
    cursor: pointer; padding: 0;
    transition: transform var(--duration-fast) var(--ease-out);
  }
  .swatch:hover { transform: scale(1.1); }
  .swatch.on { border-color: var(--color-text-primary); }
  .swatch:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .footer { border-top: 1px solid var(--color-border); margin-top: 8px; padding-top: 6px; }
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
