import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import ColorPicker from "./ColorPicker.svelte";

describe("ColorPicker", () => {
  it("renders the color dot button", () => {
    const onChange = vi.fn();
    render(ColorPicker, { value: "default", onChange });
    expect(screen.getByRole("button", { name: /card color/i })).toBeTruthy();
  });

  it("swatches are hidden by default", () => {
    const onChange = vi.fn();
    render(ColorPicker, { value: "default", onChange });
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("shows swatches on mouseenter", async () => {
    const onChange = vi.fn();
    render(ColorPicker, { value: "default", onChange });
    const dot = screen.getByRole("button", { name: /card color/i });
    await fireEvent.mouseEnter(dot);
    await tick();
    expect(screen.getByRole("radiogroup")).toBeTruthy();
  });

  it("shows all 10 color swatches when open", async () => {
    const onChange = vi.fn();
    render(ColorPicker, { value: "default", onChange });
    const dot = screen.getByRole("button", { name: /card color/i });
    await fireEvent.mouseEnter(dot);
    await tick();
    const swatches = screen.getAllByRole("radio");
    expect(swatches).toHaveLength(10);
  });

  it("calls onChange when a swatch is clicked", async () => {
    const onChange = vi.fn();
    render(ColorPicker, { value: "default", onChange });
    const dot = screen.getByRole("button", { name: /card color/i });
    await fireEvent.mouseEnter(dot);
    await tick();
    const swatches = screen.getAllByRole("radio");
    await fireEvent.click(swatches[1]);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("current color swatch has aria-checked=true", async () => {
    const onChange = vi.fn();
    render(ColorPicker, { value: "default", onChange });
    const dot = screen.getByRole("button", { name: /card color/i });
    await fireEvent.mouseEnter(dot);
    await tick();
    const checked = screen.getAllByRole("radio").find(
      el => el.getAttribute("aria-checked") === "true"
    );
    expect(checked).toBeTruthy();
  });
});
