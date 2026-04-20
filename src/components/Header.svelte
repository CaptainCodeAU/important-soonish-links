<script lang="ts">
  import AddButton from "./AddButton.svelte";

  let { onSettings }: { onSettings: () => void } = $props();
</script>

<header class="header">
  <AddButton />
  <span class="wordmark">Important Soonish Links</span>
  <button class="icon-btn" onclick={onSettings} aria-label="Settings">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  </button>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    gap: 8px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .wordmark {
    flex: 1;
    font-family: var(--font-display);
    font-size: 13px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-text-primary);
  }
  .icon-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    flex-shrink: 0;
    background: transparent;
    border: none;
    cursor: pointer;
  }
  .icon-btn:hover { background: var(--color-surface-overlay); }
  .icon-btn:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
</style>
