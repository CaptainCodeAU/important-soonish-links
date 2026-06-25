<script lang="ts">
  import { COPY } from "../lib/copy";
  let { type, onClearFilters }: {
    type: "empty" | "no-results";
    onClearFilters?: () => void;
  } = $props();
</script>

<div class="empty">
  <p>{type === "empty" ? COPY.EMPTY_LIST : COPY.EMPTY_SEARCH}</p>
  {#if onClearFilters}
    <button class="clear-filters" onclick={onClearFilters}>{COPY.EMPTY_CLEAR_FILTERS}</button>
  {/if}
</div>

<style>
  .empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    text-align: center;
  }
  .empty p {
    font-size: 13px;
    color: var(--color-text-muted);
    line-height: 1.5;
  }
  .clear-filters {
    margin-top: 14px;
    padding: 6px 14px; font-size: 12px; font-weight: 500;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-surface-raised);
    color: var(--color-text-secondary); cursor: pointer;
  }
  .clear-filters:hover { border-color: var(--color-accent); color: var(--color-accent); }
  .clear-filters:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
</style>
