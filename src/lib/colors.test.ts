import { describe, it, expect } from "vitest";
import { NOTION_PALETTE } from "./colors";
import { COLOR_IDS } from "../types";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

describe("NOTION_PALETTE", () => {
  it("has an entry for all 10 ColorIds", () => {
    for (const id of COLOR_IDS) {
      expect(NOTION_PALETTE[id]).toBeDefined();
    }
  });

  it("all entries have non-empty hex solid color", () => {
    for (const id of COLOR_IDS) {
      expect(NOTION_PALETTE[id].solid).toMatch(HEX_RE);
    }
  });

  it("all entries have non-empty hex lightBg color", () => {
    for (const id of COLOR_IDS) {
      expect(NOTION_PALETTE[id].lightBg).toMatch(HEX_RE);
    }
  });

  it("all entries have non-empty hex darkBg color", () => {
    for (const id of COLOR_IDS) {
      expect(NOTION_PALETTE[id].darkBg).toMatch(HEX_RE);
    }
  });
});
