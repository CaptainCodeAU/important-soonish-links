import { describe, it, expect } from "vitest";
import { validateUrl, generateId, hostnameFromUrl } from "./utils";

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
