import type { Component } from "svelte";

export interface Toast {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
  duration: number;
}

let nextId = 0;
const MAX_TOASTS = 3;
export const toastsState = $state({ items: [] as Toast[] });

export function pushToast(
  message: string,
  opts?: { action?: { label: string; onClick: () => void }; duration?: number }
): void {
  // Dedupe identical actionless messages (e.g. repeated errors) so they don't pile up.
  // Toasts WITH an action carry per-item callbacks (e.g. per-link Undo) — never collapse
  // those or a second rapid delete would lose its undo. D4.
  if (!opts?.action && toastsState.items.some(t => t.message === message && !t.action)) return;
  const id = String(nextId++);
  const toast: Toast = { id, message, duration: opts?.duration ?? 2500, action: opts?.action };
  // Cap the stack: keep at most MAX_TOASTS by dropping the oldest. The dropped toast's
  // pending dismiss timeout is harmless (dismissToast filters by id, already gone).
  const kept = toastsState.items.slice(-(MAX_TOASTS - 1));
  toastsState.items = [...kept, toast];
  setTimeout(() => dismissToast(id), toast.duration);
}

export function dismissToast(id: string): void {
  toastsState.items = toastsState.items.filter(t => t.id !== id);
}
