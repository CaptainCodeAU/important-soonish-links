import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import ConfirmDialog from "./ConfirmDialog.svelte";

const defaultProps = {
  title: "Start fresh?",
  body: "This will delete all saved links. Cannot be undone.",
  cancelLabel: "Cancel",
  confirmLabel: "Delete all",
  onCancel: vi.fn(),
  onConfirm: vi.fn(),
};

describe("ConfirmDialog", () => {
  it("renders title and body text", () => {
    render(ConfirmDialog, { ...defaultProps });
    expect(screen.getByText("Start fresh?")).toBeTruthy();
    expect(screen.getByText(/delete all saved links/i)).toBeTruthy();
  });

  it("renders cancel and confirm buttons", () => {
    render(ConfirmDialog, { ...defaultProps });
    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Delete all")).toBeTruthy();
  });

  it("calls onCancel when Cancel clicked", async () => {
    const onCancel = vi.fn();
    render(ConfirmDialog, { ...defaultProps, onCancel });
    await fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onConfirm when destructive button clicked", async () => {
    const onConfirm = vi.fn();
    render(ConfirmDialog, { ...defaultProps, onConfirm });
    await fireEvent.click(screen.getByText("Delete all"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Escape key pressed", async () => {
    const onCancel = vi.fn();
    render(ConfirmDialog, { ...defaultProps, onCancel });
    await fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("has role=alertdialog", () => {
    render(ConfirmDialog, { ...defaultProps });
    expect(screen.getByRole("alertdialog")).toBeTruthy();
  });
});
