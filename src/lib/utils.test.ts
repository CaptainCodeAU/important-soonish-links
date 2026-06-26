import { describe, it, expect } from "vitest";
import { validateUrl, generateId, hostnameFromUrl, isSafeFaviconUrl, normalizeUrl, containsUrl } from "./utils";

describe("validateUrl", () => {
  it("accepts http URL", () => expect(validateUrl("http://example.com")).toBe(true));
  it("accepts https URL", () => expect(validateUrl("https://example.com")).toBe(true));
  it("rejects chrome:// URL", () => expect(validateUrl("chrome://extensions")).toBe(false));
  it("rejects ftp:// URL", () => expect(validateUrl("ftp://example.com")).toBe(false));
  it("rejects empty string", () => expect(validateUrl("")).toBe(false));
  it("rejects plain text", () => expect(validateUrl("not a url")).toBe(false));
});

describe("generateId", () => {
  it("returns a non-empty string", () => expect(generateId().length).toBeGreaterThan(0));
  it("returns unique values", () => expect(generateId()).not.toBe(generateId()));
});

describe("hostnameFromUrl", () => {
  it("extracts hostname from https URL", () => {
    expect(hostnameFromUrl("https://www.example.com/path")).toBe("www.example.com");
  });
});

describe("isSafeFaviconUrl (B4)", () => {
  it("accepts https", () => expect(isSafeFaviconUrl("https://a.com/f.ico")).toBe(true));
  it("accepts data:image", () => expect(isSafeFaviconUrl("data:image/png;base64,AAAA")).toBe(true));
  it("rejects http (tracking beacon)", () => expect(isSafeFaviconUrl("http://a.com/f.ico")).toBe(false));
  it("rejects javascript:", () => expect(isSafeFaviconUrl("javascript:alert(1)")).toBe(false));
  it("rejects data:text/html", () => expect(isSafeFaviconUrl("data:text/html,<x>")).toBe(false));
  it("rejects empty string", () => expect(isSafeFaviconUrl("")).toBe(false));
});

describe("normalizeUrl (D6)", () => {
  it("treats a trailing slash as equal", () =>
    expect(normalizeUrl("https://a.com/")).toBe(normalizeUrl("https://a.com")));
  it("lowercases the host", () => expect(normalizeUrl("https://A.COM/x")).toBe("https://a.com/x"));
  it("drops a leading www.", () => expect(normalizeUrl("https://www.a.com")).toBe("https://a.com"));
  it("preserves the query string", () =>
    expect(normalizeUrl("https://a.com/s?q=1")).toBe("https://a.com/s?q=1"));
  it("preserves the hash so distinct SPA routes stay savable", () =>
    expect(normalizeUrl("https://a.com/p#a")).not.toBe(normalizeUrl("https://a.com/p#b")));
  it("does NOT unify http and https", () =>
    expect(normalizeUrl("http://a.com")).not.toBe(normalizeUrl("https://a.com")));
  it("falls back to a trimmed string for non-URLs", () =>
    expect(normalizeUrl("  not a url  ")).toBe("not a url"));
});

describe("containsUrl (#13)", () => {
  const links = [{ url: "https://example.com/" }];
  it("matches a normalized variant", () =>
    expect(containsUrl(links, "https://www.example.com")).toBe(true));
  it("does not match a distinct url", () =>
    expect(containsUrl(links, "https://other.com")).toBe(false));
  it("treats distinct hashes as distinct", () =>
    expect(containsUrl([{ url: "https://a.com/#/x" }], "https://a.com/#/y")).toBe(false));
});
