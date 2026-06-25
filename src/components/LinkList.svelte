<script lang="ts">
  import { filteredLinks, clearFilters, hasActiveFilters } from "../store/filters.svelte";
  import { linksState } from "../store/links.svelte";
  import { searchState } from "../store/search.svelte";
  import { COPY } from "../lib/copy";
  import LinkCard from "./LinkCard.svelte";
  import EmptyState from "./EmptyState.svelte";

  const links = $derived.by(() => filteredLinks());
  const hasFilterChips = $derived(hasActiveFilters());
  const isFiltering = $derived(
    searchState.query.length > 0 || hasFilterChips
  );
  const readCount = $derived(linksState.items.filter(l => l.isRead).length);

  let listEl: HTMLElement;

  function handleListKeydown(e: KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const cards = listEl?.querySelectorAll<HTMLElement>("[role=listitem][tabindex='0']");
    if (!cards?.length) return;
    const arr = Array.from(cards);
    const idx = arr.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); arr[Math.min(idx + 1, arr.length - 1)]?.focus(); }
    if (e.key === "ArrowUp")   { e.preventDefault(); arr[Math.max(idx - 1, 0)]?.focus(); }
  }
</script>

<div class="list-wrap">
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="links" role="list" aria-live="polite" aria-label="Saved links" bind:this={listEl} onkeydown={handleListKeydown}>
    {#if links.length === 0}
      <EmptyState
        type={!isFiltering && linksState.loaded && linksState.items.length === 0 ? "empty" : "no-results"}
        onClearFilters={hasFilterChips ? clearFilters : undefined}
      />
    {:else}
      {#each links as link (link.id)}
        <LinkCard {link} />
      {/each}
    {/if}
  </div>
</div>
<footer class="footer">
  {#if linksState.items.length === 0}
    <span>{COPY.FOOTER_COUNT_NONE}</span>
  {:else}
    <span>{linksState.items.length} links · {readCount} read</span>
  {/if}
</footer>

<style>
  .list-wrap {
    flex: 1;
    overflow-y: auto;
    padding: 8px 10px;
    min-height: 0;
  }
  .links {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .footer {
    border-top: 1px solid var(--color-border);
    padding: 4px 12px;
    font-size: 11px;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
</style>
