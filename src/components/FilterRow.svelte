<script lang="ts">
  import { filtersState, toggleColor, toggleTag } from "../store/filters.svelte";
  import { linksState } from "../store/links.svelte";
  import { NOTION_PALETTE } from "../lib/colors";
  import { DEFAULT_TAGS } from "../lib/tags";
  import type { ColorId } from "../types";

  const usedColors = $derived(
    [...new Set(linksState.items.map(l => l.color))] as ColorId[]
  );
  const usedTags = $derived(
    DEFAULT_TAGS.filter(t => linksState.items.some(l => l.tag === t.id))
  );
</script>

{#if usedColors.length > 0 || usedTags.length > 0}
  <div class="filter-row" role="group" aria-label="Filter links">
    {#each usedColors as color (color)}
      <button
        class="color-chip"
        class:active={filtersState.activeColors.has(color)}
        style:background={NOTION_PALETTE[color].solid}
        onclick={() => toggleColor(color)}
        role="checkbox"
        aria-checked={filtersState.activeColors.has(color)}
        aria-label="Filter by {NOTION_PALETTE[color].label}"
      ></button>
    {/each}
    {#each usedTags as tag (tag.id)}
      <button
        class="tag-chip"
        class:active={filtersState.activeTags.has(tag.id)}
        style:background={filtersState.activeTags.has(tag.id) ? NOTION_PALETTE[tag.accentColor].solid : NOTION_PALETTE[tag.accentColor].lightBg}
        style:color={filtersState.activeTags.has(tag.id) ? "#fff" : NOTION_PALETTE[tag.accentColor].solid}
        onclick={() => toggleTag(tag.id)}
        role="checkbox"
        aria-checked={filtersState.activeTags.has(tag.id)}
      >{tag.label}</button>
    {/each}
  </div>
{/if}

<style>
  .filter-row {
    display: flex; gap: 4px; padding: 4px 12px; flex-wrap: wrap;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .color-chip {
    width: 16px; height: 16px;
    border-radius: var(--radius-full);
    border: 2px solid transparent;
    transition: border-color var(--duration-fast);
    cursor: pointer;
    padding: 0;
  }
  .color-chip.active { border-color: var(--color-text-primary); }
  .color-chip:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .tag-chip {
    padding: 2px 7px; border-radius: var(--radius-full);
    font-size: 11px; font-weight: 500;
    transition: opacity var(--duration-fast);
    border: none; cursor: pointer;
  }
  .tag-chip:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
</style>
