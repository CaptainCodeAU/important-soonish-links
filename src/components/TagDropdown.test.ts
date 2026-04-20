import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import TagDropdown from "./TagDropdown.svelte";

describe("TagDropdown", () => {
  it("renders the tag trigger button", () => {
    const onChange = vi.fn();
    render(TagDropdown, { value: undefined, onChange });
    expect(screen.getByLabelText("Add tag")).toBeTruthy();
  });

  it("dropdown is hidden by default", () => {
    const onChange = vi.fn();
    render(TagDropdown, { value: undefined, onChange });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("shows dropdown with 7 options on click (6 tags + No tag)", async () => {
    const onChange = vi.fn();
    render(TagDropdown, { value: undefined, onChange });
    await fireEvent.click(screen.getByLabelText("Add tag"));
    await tick();
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(7);
  });

  it("shows 'No tag' option first", async () => {
    const onChange = vi.fn();
    render(TagDropdown, { value: undefined, onChange });
    await fireEvent.click(screen.getByLabelText("Add tag"));
    await tick();
    const options = screen.getAllByRole("option");
    expect(options[0].textContent).toContain("No tag");
  });

  it("calls onChange with tagId when a tag is selected", async () => {
    const onChange = vi.fn();
    render(TagDropdown, { value: undefined, onChange });
    await fireEvent.click(screen.getByLabelText("Add tag"));
    await tick();
    const options = screen.getAllByRole("option");
    await fireEvent.click(options[1]);
    expect(onChange).toHaveBeenCalledOnce();
    const [tagId] = onChange.mock.calls[0];
    expect(tagId).toBeTruthy();
  });

  it("calls onChange with undefined when 'No tag' is selected", async () => {
    const onChange = vi.fn();
    render(TagDropdown, { value: "read-later" as const, onChange });
    const trigger = screen.getByLabelText("Read later");
    await fireEvent.click(trigger);
    await tick();
    const noTag = screen.getByText("No tag");
    await fireEvent.click(noTag);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("renders tag pill when value is set", () => {
    const onChange = vi.fn();
    render(TagDropdown, { value: "read-later" as const, onChange });
    expect(screen.getByText("Read later")).toBeTruthy();
  });
});
