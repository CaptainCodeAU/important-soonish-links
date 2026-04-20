<script lang="ts">
  import { onMount } from "svelte";
  let {
    title, body, cancelLabel, confirmLabel,
    onCancel, onConfirm,
  }: {
    title: string; body: string;
    cancelLabel: string; confirmLabel: string;
    onCancel: () => void; onConfirm: () => void;
  } = $props();

  let dialogEl: HTMLElement | undefined = $state();
  let cancelBtn: HTMLButtonElement | undefined = $state();

  onMount(() => { cancelBtn?.focus(); });

  function trapFocus(e: KeyboardEvent) {
    if (e.key !== "Tab" || !dialogEl) return;
    const focusable = dialogEl.querySelectorAll<HTMLElement>(
      "button, [tabindex]:not([tabindex='-1'])"
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") onCancel();
  }
</script>

<svelte:window on:keydown={handleKey} />

<div class="backdrop" role="presentation">
  <div
    class="dialog"
    role="alertdialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-body"
    bind:this={dialogEl}
    onkeydown={trapFocus}
  >
    <p id="dialog-title" class="dialog-title">{title}</p>
    <p id="dialog-body" class="dialog-body">{body}</p>
    <div class="dialog-actions">
      <button bind:this={cancelBtn} class="btn-cancel" onclick={onCancel}>{cancelLabel}</button>
      <button class="btn-destructive" onclick={onConfirm}>{confirmLabel}</button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.3);
    display: flex; align-items: center; justify-content: center;
  }
  .dialog {
    background: var(--color-surface-base);
    border-radius: var(--radius-lg);
    padding: 20px;
    width: 280px;
    box-shadow: var(--shadow-modal);
  }
  .dialog-title { font-size: 14px; font-weight: 600; margin-bottom: 6px; color: var(--color-text-primary); }
  .dialog-body { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 16px; }
  .dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }
  .btn-cancel {
    padding: 6px 14px; font-size: 12px; border-radius: var(--radius-sm);
    background: var(--color-surface-raised); color: var(--color-text-secondary);
    border: 1px solid var(--color-border); cursor: pointer;
  }
  .btn-destructive {
    padding: 6px 14px; font-size: 12px; border-radius: var(--radius-sm);
    background: transparent; color: var(--color-destructive);
    border: 2px solid var(--color-destructive); font-weight: 600; cursor: pointer;
  }
  .btn-cancel:focus-visible, .btn-destructive:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
</style>
