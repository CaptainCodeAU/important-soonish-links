import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import Toast from "./Toast.svelte";
import type { Toast as ToastType } from "../store/toasts.svelte";

const makeToast = (overrides?: Partial<ToastType>): ToastType => ({
  id: "1",
  message: "Link deleted",
  duration: 2500,
  ...overrides,
});

describe("Toast", () => {
  it("renders the message", () => {
    render(Toast, { toast: makeToast({ message: "Saved!" }) });
    expect(screen.getByText("Saved!")).toBeTruthy();
  });

  it("has role=status", () => {
    render(Toast, { toast: makeToast() });
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("renders action button when action provided", () => {
    const onClick = vi.fn();
    render(Toast, {
      toast: makeToast({ action: { label: "Undo", onClick } }),
    });
    expect(screen.getByText("Undo")).toBeTruthy();
  });

  it("fires action onClick when Undo button clicked", async () => {
    const onClick = vi.fn();
    render(Toast, {
      toast: makeToast({ action: { label: "Undo", onClick } }),
    });
    await fireEvent.click(screen.getByText("Undo"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders no action button when no action provided", () => {
    render(Toast, { toast: makeToast({ action: undefined }) });
    expect(screen.queryByRole("button")).toBeNull();
  });
});
