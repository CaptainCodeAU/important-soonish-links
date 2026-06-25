<script lang="ts">
  import { linksState } from "../store/links.svelte";
  import { clearFilters, hasActiveFilters } from "../store/filters.svelte";
  import { COPY } from "../lib/copy";
  import ColorFilterMenu from "./ColorFilterMenu.svelte";
  import TagFilterMenu from "./TagFilterMenu.svelte";

  // Always show the bar while there are links to filter — OR while a filter is active,
  // so an active filter that empties the list still leaves a way to clear it.
  const anyActive = $derived(hasActiveFilters());
  const show = $derived(linksState.items.length > 0 || anyActive);
</script>

{#if show}
  <div class="filter-bar" role="group" aria-label="Filter links">
    <ColorFilterMenu />
    <TagFilterMenu />
    {#if anyActive}
      <button class="clear-all" onclick={clearFilters}>{COPY.FILTER_CLEAR_ALL}</button>
    {/if}
  </div>
{/if}

<style>
  .filter-bar {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .clear-all {
    margin-left: auto;
    padding: 4px 8px; font-size: 12px;
    border-radius: var(--radius-sm);
    background: transparent; border: none;
    color: var(--color-text-muted); cursor: pointer;
  }
  .clear-all:hover { color: var(--color-destructive); background: var(--color-surface-overlay); }
  .clear-all:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
</style>
