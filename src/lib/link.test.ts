import { describe, it, expect } from "vitest";
import { createLink } from "./link";
import { DEFAULT_LINK_COLOR } from "../types";

describe("createLink (#3)", () => {
  it("fills in the defaults every new-link call site needs", () => {
    const link = createLink({ url: "https://example.com/page" });
    expect(link.id).toBeTruthy();
    expect(link.url).toBe("https://example.com/page");
    expect(link.color).toBe(DEFAULT_LINK_COLOR);
    expect(link.tags).toEqual([]);
    expect(link.order).toBe(0);
    expect(link.favicon).toBeUndefined();
  });

  it("uses the given title when non-empty", () => {
    expect(createLink({ url: "https://example.com", title: "Example" }).title).toBe("Example");
  });

  it("falls back to the hostname when title is omitted", () => {
    expect(createLink({ url: "https://example.com/page" }).title).toBe("example.com");
  });

  it("falls back to the hostname when title is an empty string", () => {
    expect(createLink({ url: "https://example.com/page", title: "" }).title).toBe("example.com");
  });

  it("carries the favicon through when given", () => {
    expect(createLink({ url: "https://example.com", favicon: "https://example.com/f.ico" }).favicon)
      .toBe("https://example.com/f.ico");
  });

  it("stamps createdAt and updatedAt from the same instant", () => {
    const link = createLink({ url: "https://example.com" });
    expect(link.updatedAt).toBe(link.createdAt);
  });

  it("generates a distinct id each call", () => {
    const a = createLink({ url: "https://example.com" });
    const b = createLink({ url: "https://example.com" });
    expect(a.id).not.toBe(b.id);
  });
});
