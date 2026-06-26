<script lang="ts">
  import { toastsState, dismissToast } from "../store/toasts.svelte";
  import Toast from "./Toast.svelte";

  // Escape dismisses the most recent toast — unless a dialog is open, which owns
  // Escape for its own cancel. C7 / WCAG 2.2.1.
  function handleKeydown(e: KeyboardEvent) {
    if (e.key !== "Escape") return;
    if (document.querySelector("[role=alertdialog]")) return;
    const newest = toastsState.items.at(-1);
    if (newest) dismissToast(newest.id);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="toast-container" aria-live="polite" aria-atomic="false">
  {#each toastsState.items as toast (toast.id)}
    <Toast {toast} />
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 200;
    pointer-events: none;
  }
  .toast-container > :global(*) {
    pointer-events: all;
  }
</style>
