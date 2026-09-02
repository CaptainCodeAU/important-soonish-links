import { describe, it, expect } from "vitest";
import {
  validateUrl, generateId, hostnameFromUrl, isSafeFaviconUrl,
  normalizeUrl, containsUrl, dedupeByUrl, newUrlsOnly,
} from "./utils";

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

describe("dedupeByUrl (#2)", () => {
  it("keeps the first of a set of entries that normalize to the same URL", () => {
    const links = [{ url: "https://a.com" }, { url: "https://www.a.com/" }, { url: "https://b.com" }];
    expect(dedupeByUrl(links)).toEqual([{ url: "https://a.com" }, { url: "https://b.com" }]);
  });
  it("keeps every entry when none collide", () => {
    const links = [{ url: "https://a.com" }, { url: "https://b.com" }];
    expect(dedupeByUrl(links)).toEqual(links);
  });
});

describe("newUrlsOnly (#2)", () => {
  it("drops incoming links that already exist under normalized comparison", () => {
    const existing = [{ url: "https://a.com/" }];
    const incoming = [{ url: "https://www.a.com" }, { url: "https://b.com" }];
    expect(newUrlsOnly(existing, incoming)).toEqual([{ url: "https://b.com" }]);
  });
  it("keeps everything when existing is empty", () => {
    const incoming = [{ url: "https://a.com" }];
    expect(newUrlsOnly([], incoming)).toEqual(incoming);
  });
});

// The dedup rule used to be expressed three ways (containsUrl, and two hand-rolled
// SettingsView.svelte shapes); this pins all three call shapes to the one rule so they can
// never quietly diverge again. #2.
describe("the dedup rule agrees across every call shape (#2)", () => {
  const variants = [
    "https://A.com/x/",       // host case + trailing slash
    "https://www.a.com/x",    // www.
    "https://a.com/x",        // canonical
  ];
  const distinct = "https://a.com/y";

  it("normalizeUrl collapses every variant to the same key", () => {
    const keys = new Set(variants.map(normalizeUrl));
    expect(keys.size).toBe(1);
  });

  it("containsUrl treats every variant as a match against one stored link", () => {
    const links = [{ url: variants[0] }];
    for (const v of variants) expect(containsUrl(links, v)).toBe(true);
    expect(containsUrl(links, distinct)).toBe(false);
  });

  it("dedupeByUrl collapses a batch of variants to one entry", () => {
    expect(dedupeByUrl(variants.map(url => ({ url })))).toEqual([{ url: variants[0] }]);
  });

  it("newUrlsOnly rejects every variant against one existing link", () => {
    const existing = [{ url: variants[0] }];
    const incoming = [...variants, distinct].map(url => ({ url }));
    expect(newUrlsOnly(existing, incoming)).toEqual([{ url: distinct }]);
  });
});
