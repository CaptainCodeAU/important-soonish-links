import type { Component } from "svelte";

export interface Toast {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
  duration: number;
}

let nextId = 0;
export const toastsState = $state({ items: [] as Toast[] });

export function pushToast(
  message: string,
  opts?: { action?: { label: string; onClick: () => void }; duration?: number }
): void {
  const id = String(nextId++);
  const toast: Toast = { id, message, duration: opts?.duration ?? 2500, action: opts?.action };
  toastsState.items = [...toastsState.items, toast];
  setTimeout(() => dismissToast(id), toast.duration);
}

export function dismissToast(id: string): void {
  toastsState.items = toastsState.items.filter(t => t.id !== id);
}
