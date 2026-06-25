import { describe, it, expect } from "vitest";
import { escapeHtml, escapeMarkdownText, mdLinkDestination } from "./escape";

describe("escapeHtml", () => {
  it("escapes angle brackets and ampersand", () => {
    expect(escapeHtml("<script>&")).toBe("&lt;script&gt;&amp;");
  });
  it("escapes quotes for attribute context", () => {
    expect(escapeHtml(`a"b'c`)).toBe("a&quot;b&#39;c");
  });
  it("escapes ampersand before entities to avoid double-encoding ambiguity", () => {
    expect(escapeHtml("a&b<c")).toBe("a&amp;b&lt;c");
  });
  it("neutralizes an attribute-breakout injection payload", () => {
    const out = escapeHtml(`"><img src=x onerror=alert(1)>`);
    expect(out).not.toContain("<img");
    expect(out).not.toContain(`">`);
    expect(out).toContain("&quot;&gt;&lt;img");
  });
});

describe("escapeMarkdownText", () => {
  it("escapes brackets and backslash", () => {
    expect(escapeMarkdownText("a]b[c\\d")).toBe("a\\]b\\[c\\\\d");
  });
  it("collapses newlines to a single space", () => {
    expect(escapeMarkdownText("a\nb\r\nc")).toBe("a b c");
  });
  it("leaves plain text untouched", () => {
    expect(escapeMarkdownText("Hello world")).toBe("Hello world");
  });
});

describe("mdLinkDestination", () => {
  it("angle-brackets the url so parens survive", () => {
    expect(mdLinkDestination("https://a.com/x(y)")).toBe("<https://a.com/x(y)>");
  });
  it("percent-encodes spaces and stray angle brackets", () => {
    expect(mdLinkDestination("https://a.com/a b")).toBe("<https://a.com/a%20b>");
    expect(mdLinkDestination("https://a.com/<x>")).toBe("<https://a.com/%3Cx%3E>");
  });
});
