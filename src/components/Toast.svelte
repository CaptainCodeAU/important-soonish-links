<script lang="ts">
  import { dismissToast } from "../store/toasts.svelte";
  import type { Toast } from "../store/toasts.svelte";

  let { toast }: { toast: Toast } = $props();
</script>

<div class="toast" role="status" aria-live="polite">
  <span>{toast.message}</span>
  {#if toast.action}
    <button
      class="toast-action"
      onclick={() => { toast.action!.onClick(); dismissToast(toast.id); }}
    >
      {toast.action.label}
    </button>
  {/if}
</div>

<style>
  .toast {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--color-text-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-md);
    font-size: 12px;
    box-shadow: var(--shadow-modal);
    min-width: 180px;
    max-width: 340px;
  }
  .toast span { flex: 1; }
  .toast-action {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-accent);
    white-space: nowrap;
    text-decoration: underline;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
  }
  .toast-action:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
</style>
