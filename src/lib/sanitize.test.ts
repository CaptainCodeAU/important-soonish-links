import { describe, it, expect } from "vitest";
import { sanitizeLink, sanitizeLinks } from "./sanitize";
import { DEFAULT_LINK_COLOR } from "../types";

const base = { id: "1", title: "T", url: "https://example.com" };

describe("sanitizeLink — color/tag coercion (A1)", () => {
  it("coerces missing color to default", () => {
    expect(sanitizeLink(base)?.color).toBe(DEFAULT_LINK_COLOR);
  });
  it("coerces invalid color to default", () => {
    expect(sanitizeLink({ ...base, color: "neon" })?.color).toBe(DEFAULT_LINK_COLOR);
  });
  it("keeps a valid color", () => {
    expect(sanitizeLink({ ...base, color: "blue" })?.color).toBe("blue");
  });
  it("drops an invalid tag", () => {
    expect(sanitizeLink({ ...base, tag: "nope" })?.tag).toBeUndefined();
  });
  it("keeps a valid tag", () => {
    expect(sanitizeLink({ ...base, tag: "work" })?.tag).toBe("work");
  });
});

describe("sanitizeLink — URL validation (A2)", () => {
  it("rejects a javascript: URL", () => {
    expect(sanitizeLink({ ...base, url: "javascript:alert(1)" })).toBeNull();
  });
  it("rejects a data: URL", () => {
    expect(sanitizeLink({ ...base, url: "data:text/html,<script>1</script>" })).toBeNull();
  });
  it("rejects a missing URL", () => {
    expect(sanitizeLink({ id: "1", title: "T" })).toBeNull();
  });
  it("accepts http and https", () => {
    expect(sanitizeLink({ ...base, url: "http://a.com" })).not.toBeNull();
    expect(sanitizeLink({ ...base, url: "https://a.com" })).not.toBeNull();
  });
});

describe("sanitizeLink — defaults & optionals", () => {
  it("fills id/order/timestamps when missing", () => {
    const l = sanitizeLink({ url: "https://a.com" });
    expect(l).not.toBeNull();
    expect(typeof l!.id).toBe("string");
    expect(l!.id.length).toBeGreaterThan(0);
    expect(l!.order).toBe(0);
    expect(typeof l!.createdAt).toBe("number");
    expect(l!.updatedAt).toBe(l!.createdAt);
  });
  it("falls back title to url when missing", () => {
    expect(sanitizeLink({ url: "https://a.com" })?.title).toBe("https://a.com");
  });
  it("preserves valid optional fields", () => {
    const l = sanitizeLink({ ...base, isRead: true, notes: "n", pinned: true, favicon: "https://a.com/f.ico" });
    expect(l?.isRead).toBe(true);
    expect(l?.notes).toBe("n");
    expect(l?.pinned).toBe(true);
    expect(l?.favicon).toBe("https://a.com/f.ico");
  });
  it("ignores wrong-typed optional fields", () => {
    const l = sanitizeLink({ ...base, isRead: "yes", notes: 5 });
    expect(l?.isRead).toBeUndefined();
    expect(l?.notes).toBeUndefined();
  });
});

describe("sanitizeLink — favicon hardening (B4)", () => {
  it("drops an http favicon", () => {
    expect(sanitizeLink({ ...base, favicon: "http://a.com/f.ico" })?.favicon).toBeUndefined();
  });
  it("drops a javascript: favicon", () => {
    expect(sanitizeLink({ ...base, favicon: "javascript:alert(1)" })?.favicon).toBeUndefined();
  });
  it("keeps an https favicon", () => {
    expect(sanitizeLink({ ...base, favicon: "https://a.com/f.ico" })?.favicon).toBe("https://a.com/f.ico");
  });
  it("keeps a data:image favicon", () => {
    expect(sanitizeLink({ ...base, favicon: "data:image/png;base64,AAAA" })?.favicon).toBe("data:image/png;base64,AAAA");
  });
});

describe("sanitizeLinks", () => {
  it("filters out invalid entries", () => {
    const out = sanitizeLinks([
      { id: "1", title: "ok", url: "https://a.com" },
      { id: "2", title: "bad", url: "ftp://x" },
      "garbage",
      null,
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].url).toBe("https://a.com");
  });
  it("returns [] for a non-array", () => {
    expect(sanitizeLinks("x")).toEqual([]);
    expect(sanitizeLinks(undefined)).toEqual([]);
  });
});
