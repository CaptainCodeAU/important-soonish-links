<script lang="ts">
  import { fade } from "svelte/transition";
  import { DEFAULT_TAGS, TAG_MAP } from "../lib/tags";
  import { NOTION_PALETTE } from "../lib/colors";
  import { placePopover, clickedOutside, rovingKeydown, focusFirstOption } from "../lib/popover";
  import type { TagId } from "../types";

  let { values, onToggle }: { values: TagId[]; onToggle: (t: TagId) => void } = $props();
  let open = $state(false);
  let dropEl: HTMLElement | undefined = $state();
  let triggerEl: HTMLElement | undefined = $state();
  let menuEl: HTMLElement | undefined = $state();
  let menuStyle = $state("");

  const hasTags = $derived(values.length > 0);
  // Trigger is colored by the first tag; the tooltip/aria-label lists them all.
  const accent = $derived(hasTags ? NOTION_PALETTE[TAG_MAP[values[0]].accentColor].solid : undefined);
  const labels = $derived(hasTags ? values.map(t => TAG_MAP[t].label).join(", ") : "Add tag");

  function toggleOpen() {
    if (open) { open = false; return; }
    if (!triggerEl) return;
    // Prefer opening above (tall menu inside a short popup); fall back to below.
    const menuHeight = DEFAULT_TAGS.length * 32 + 8;
    menuStyle = placePopover(triggerEl.getBoundingClientRect(), {
      placement: "auto-top",
      offset: 6,
      panelHeight: menuHeight,
    });
    open = true;
    focusFirstOption(menuEl);
  }

  function close(returnFocus = true) {
    open = false;
    if (returnFocus) triggerEl?.focus();
  }

  function onMenuKeydown(e: KeyboardEvent) {
    if (rovingKeydown(e, menuEl, { orientation: "vertical", homeEnd: false }) === "close") close();
  }

  function handleWindowClick(e: MouseEvent) {
    if (open && clickedOutside(e, [dropEl, menuEl])) open = false;
  }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="tag-wrap" bind:this={dropEl}>
  <button
    class="tag-trigger"
    class:tagged={hasTags}
    bind:this={triggerEl}
    onclick={toggleOpen}
    style:color={accent}
    aria-label={hasTags ? `Tags: ${labels}` : "Add tag"}
    title={labels}
    aria-expanded={open}
    aria-haspopup="listbox"
  >
    <!-- Fixed-size icon so the title column never shifts. Filled + colored (by first
         tag) when the link has any tag; muted outline when untagged. -->
    <svg
      class="tag-icon" width="15" height="15" viewBox="0 0 24 24"
      fill={hasTags ? "currentColor" : "none"} stroke="currentColor" stroke-width="2"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  </button>
  {#if open}
    <ul
      class="dropdown" role="listbox" aria-multiselectable="true" aria-label="Card tags"
      tabindex="-1" style={menuStyle} bind:this={menuEl} onkeydown={onMenuKeydown}
      transition:fade={{ duration: 150 }}
    >
      {#each DEFAULT_TAGS as tag (tag.id)}
        {@const on = values.includes(tag.id)}
        <li>
          <button role="option" aria-selected={on} onclick={() => onToggle(tag.id)} class="option">
            <span class="check" class:on>{on ? "✓" : ""}</span>
            <span class="tag-dot" style:background={NOTION_PALETTE[tag.accentColor].solid}></span>
            {tag.label}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .tag-wrap { position: relative; flex-shrink: 0; }
  /* Fixed footprint regardless of tagged/untagged so the favicon + title column
     stays aligned across every row (no width jump). */
  .tag-trigger {
    display: flex; align-items: center; justify-content: center;
    width: 16px; height: 16px; flex-shrink: 0;
    color: var(--color-text-muted);
    background: transparent; border: none; cursor: pointer; padding: 0;
    border-radius: var(--radius-sm);
  }
  .tag-trigger:hover { color: var(--color-text-secondary); }
  .tag-trigger.tagged:hover { opacity: 0.8; }
  .tag-trigger:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .tag-icon { display: block; }
  .dropdown {
    min-width: 150px;
    background: var(--color-surface-base);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-dropdown);
    z-index: 1000;
    list-style: none;
    padding: 4px;
    margin: 0;
  }
  .option {
    width: 100%;
    display: flex; align-items: center; gap: 8px;
    padding: 6px 8px;
    font-size: 12px;
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    text-align: left;
    background: transparent;
    border: none;
    cursor: pointer;
  }
  .option:hover { background: var(--color-surface-overlay); }
  .option[aria-selected="true"] { font-weight: 600; }
  .option:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: -1px; }
  .check {
    width: 14px; height: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--color-border-strong); border-radius: 3px;
    font-size: 10px; color: #fff; line-height: 1;
  }
  .check.on { background: var(--color-accent); border-color: var(--color-accent); }
  .tag-dot { width: 8px; height: 8px; border-radius: var(--radius-full); flex-shrink: 0; }
</style>
