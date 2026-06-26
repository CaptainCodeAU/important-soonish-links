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
  const id = String(nextId++);
  const toast: Toast = { id, message, duration: opts?.duration ?? 2500, action: opts?.action };
  // Cap the stack at MAX_TOASTS by dropping the OLDEST *actionless* toasts — never an
  // action toast (e.g. an 8s Undo), or a delete would become silently unrecoverable. If
  // only action toasts remain, the stack is allowed to exceed the cap rather than lose an
  // undo. (No dedupe: it suppressed legit repeat confirmations; the cap alone bounds it.)
  const next = [...toastsState.items, toast];
  let overflow = next.length - MAX_TOASTS;
  toastsState.items = next.filter(t => {
    if (overflow > 0 && !t.action && t.id !== id) { overflow--; return false; }
    return true;
  });
  setTimeout(() => dismissToast(id), toast.duration);
}

export function dismissToast(id: string): void {
  toastsState.items = toastsState.items.filter(t => t.id !== id);
}
