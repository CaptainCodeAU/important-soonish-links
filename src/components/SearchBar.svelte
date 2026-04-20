<script lang="ts">
  import { setQuery, clearSearch, searchState } from "../store/search.svelte";
  import { COPY } from "../lib/copy";
</script>

<div class="search-wrap">
  <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
  <input
    class="search-input"
    type="search"
    placeholder={COPY.SEARCH_PLACEHOLDER}
    oninput={(e) => setQuery((e.target as HTMLInputElement).value)}
    value={searchState.query}
    aria-label="Search saved links"
  />
  {#if searchState.query}
    <button class="clear-btn" onclick={clearSearch} aria-label="Clear search">×</button>
  {/if}
</div>

<style>
  .search-wrap {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .search-icon { color: var(--color-text-muted); flex-shrink: 0; }
  .search-input {
    flex: 1; font-size: 13px;
    background: transparent; border: none;
    color: var(--color-text-primary);
    font-family: var(--font-ui);
    -webkit-appearance: none;
    appearance: none;
  }
  .search-input:focus { outline: none; }
  .search-input::placeholder { color: var(--color-text-muted); }
  .clear-btn {
    font-size: 16px; color: var(--color-text-muted);
    width: 20px; height: 20px;
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--radius-full);
    background: transparent; border: none; cursor: pointer;
  }
  .clear-btn:hover { background: var(--color-surface-overlay); }
  .clear-btn:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
</style>
