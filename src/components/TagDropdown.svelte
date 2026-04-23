<script lang="ts">
  import { fade } from "svelte/transition";
  import { DEFAULT_TAGS, TAG_MAP } from "../lib/tags";
  import { NOTION_PALETTE } from "../lib/colors";
  import type { TagId } from "../types";

  let { value, onChange }: { value?: TagId; onChange: (t: TagId | undefined) => void } = $props();
  let open = $state(false);
  let dropEl: HTMLElement | undefined = $state();
  let triggerEl: HTMLElement | undefined = $state();
  let menuEl: HTMLElement | undefined = $state();
  let menuStyle = $state("");

  function select(tag?: TagId) { onChange(tag); open = false; }

  function toggle() {
    if (open) { open = false; return; }
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const menuHeight = (DEFAULT_TAGS.length + 1) * 30 + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < menuHeight) {
      menuStyle = `position:fixed;left:${rect.left}px;bottom:${window.innerHeight - rect.top + 4}px;`;
    } else {
      menuStyle = `position:fixed;left:${rect.left}px;top:${rect.bottom + 4}px;`;
    }
    open = true;
  }

  function handleWindowClick(e: MouseEvent) {
    if (open && dropEl && !dropEl.contains(e.target as Node) &&
        menuEl && !menuEl.contains(e.target as Node)) {
      open = false;
    }
  }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="tag-wrap" bind:this={dropEl}>
  <button
    class="tag-trigger"
    bind:this={triggerEl}
    onclick={toggle}
    aria-label={value ? TAG_MAP[value].label : "Add tag"}
    aria-expanded={open}
    aria-haspopup="listbox"
  >
    {#if value}
      <span
        class="pill"
        style:background={NOTION_PALETTE[TAG_MAP[value].accentColor].lightBg}
        style:color={NOTION_PALETTE[TAG_MAP[value].accentColor].solid}
      >{TAG_MAP[value].label}</span>
    {:else}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    {/if}
  </button>
  {#if open}
    <ul class="dropdown" role="listbox" aria-label="Card tag" style={menuStyle} bind:this={menuEl} transition:fade={{ duration: 200 }}>
      <li>
        <button role="option" aria-selected={value === undefined} onclick={() => select(undefined)} class="option">
          No tag
        </button>
      </li>
      {#each DEFAULT_TAGS as tag (tag.id)}
        <li>
          <button
            role="option"
            aria-selected={value === tag.id}
            onclick={() => select(tag.id)}
            class="option"
          >
            <span
              class="tag-dot"
              style:background={NOTION_PALETTE[tag.accentColor].solid}
            ></span>
            {tag.label}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .tag-wrap { position: relative; flex-shrink: 0; }
  .tag-trigger {
    display: flex; align-items: center; color: var(--color-text-muted);
    background: transparent; border: none; cursor: pointer; padding: 0;
  }
  .tag-trigger:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .pill {
    display: inline-flex; align-items: center;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    font-size: 11px; font-weight: 500;
  }
  .dropdown {
    min-width: 140px;
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
    display: flex; align-items: center; gap: 6px;
    padding: 5px 8px;
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
  .tag-dot { width: 8px; height: 8px; border-radius: var(--radius-full); flex-shrink: 0; }
</style>
