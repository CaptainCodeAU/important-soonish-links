<script lang="ts">
  import { linksState } from "../store/links.svelte";
  import { filtersState, clearFilters, hasActiveFilters, setMatchMode } from "../store/filters.svelte";
  import { COPY } from "../lib/copy";
  import ColorFilterMenu from "./ColorFilterMenu.svelte";
  import TagFilterMenu from "./TagFilterMenu.svelte";

  // Always show the bar while there are links to filter — OR while a filter is active,
  // so an active filter that empties the list still leaves a way to clear it.
  const anyActive = $derived(hasActiveFilters());
  const show = $derived(linksState.items.length > 0 || anyActive);
  // The Match toggle only changes results when BOTH facets are active, so show it then.
  const bothActive = $derived(filtersState.activeColors.size > 0 && filtersState.activeTags.size > 0);
</script>

{#if show}
  <div class="filter-bar" role="group" aria-label="Filter links">
    <ColorFilterMenu />
    <TagFilterMenu />

    {#if bothActive}
      <div class="match" role="group" aria-label={COPY.FILTER_MATCH}>
        <span class="match-label">{COPY.FILTER_MATCH}</span>
        <div class="seg">
          <button
            class="seg-btn" class:on={filtersState.matchMode === "all"}
            onclick={() => setMatchMode("all")}
            title={COPY.FILTER_MATCH_ALL_TIP}
            aria-pressed={filtersState.matchMode === "all"}
          >{COPY.FILTER_MATCH_ALL}</button>
          <button
            class="seg-btn" class:on={filtersState.matchMode === "any"}
            onclick={() => setMatchMode("any")}
            title={COPY.FILTER_MATCH_ANY_TIP}
            aria-pressed={filtersState.matchMode === "any"}
          >{COPY.FILTER_MATCH_ANY}</button>
        </div>
      </div>
    {/if}

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
  .match { display: inline-flex; align-items: center; gap: 6px; margin-left: 4px; }
  .match-label { font-size: 11px; color: var(--color-text-muted); }
  .seg {
    display: inline-flex;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  .seg-btn {
    padding: 3px 9px; font-size: 11px; font-weight: 500;
    background: transparent; border: none;
    color: var(--color-text-secondary); cursor: pointer;
  }
  .seg-btn + .seg-btn { border-left: 1px solid var(--color-border); }
  .seg-btn.on { background: var(--color-accent); color: #fff; }
  .seg-btn:not(.on):hover { background: var(--color-surface-overlay); }
  .seg-btn:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: -1px; }
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
