import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import FaviconImage from "./FaviconImage.svelte";

describe("FaviconImage — favicon guard (B4)", () => {
  it("renders an <img> for a safe https src", () => {
    const { container } = render(FaviconImage, {
      src: "https://a.com/f.ico", hostname: "a.com", color: "default",
    });
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("renders no <img> for an http src and shows the letter fallback", () => {
    const { container } = render(FaviconImage, {
      src: "http://a.com/f.ico", hostname: "alpha.com", color: "default",
    });
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".favicon-fallback")?.textContent?.trim()).toBe("A");
  });

  it("renders no <img> for a javascript: src", () => {
    const { container } = render(FaviconImage, {
      src: "javascript:alert(1)", hostname: "a.com", color: "default",
    });
    expect(container.querySelector("img")).toBeNull();
  });
});
