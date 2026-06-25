import { describe, it, expect } from "vitest";
import { serializeJson, serializeMarkdown, serializeHtml } from "./export";
import type { SavedLink } from "../types";

function link(over: Partial<SavedLink>): SavedLink {
  return {
    id: "1", title: "T", url: "https://a.com", color: "default", tags: [],
    order: 0, createdAt: 0, updatedAt: 0, ...over,
  };
}

describe("serializeHtml — injection safety (B1)", () => {
  it("escapes a markup-injecting title", () => {
    const out = serializeHtml([link({ title: "<img src=x onerror=alert(1)>" })]);
    expect(out).not.toContain("<img src=x");
    expect(out).toContain("&lt;img");
  });
  it("prevents an attribute breakout via the URL", () => {
    const out = serializeHtml([link({ url: 'https://a.com/"><script>x</script>' })]);
    expect(out).not.toContain('"><script>');
    expect(out).toContain("&quot;&gt;&lt;script&gt;");
  });
  it("emits exactly one anchor per link", () => {
    const out = serializeHtml([link({}), link({ id: "2" })]);
    expect(out.match(/<A HREF=/g)?.length).toBe(2);
  });
});

describe("serializeMarkdown — injection safety (B2)", () => {
  it("keeps one link per row despite brackets and parens", () => {
    const out = serializeMarkdown([link({ title: "a] hijack [b", url: "https://a.com/p(q)" })]);
    const row = out.split("\n").find((l) => l.startsWith("- "))!;
    expect(row).toBe("- [a\\] hijack \\[b](<https://a.com/p(q)>)");
  });
  it("groups by tag", () => {
    const out = serializeMarkdown([link({ tags: ["work"] }), link({ id: "2" })]);
    expect(out).toContain("## work");
    expect(out).toContain("## other");
  });
});

describe("serializeJson — unchanged behavior (anti-criterion)", () => {
  it("matches JSON.stringify(items, null, 2) exactly", () => {
    const items = [link({}), link({ id: "2", title: "x" })];
    expect(serializeJson(items)).toBe(JSON.stringify(items, null, 2));
  });
});
