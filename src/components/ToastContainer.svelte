<script lang="ts">
  import { toastsState } from "../store/toasts.svelte";
  import Toast from "./Toast.svelte";
</script>

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
