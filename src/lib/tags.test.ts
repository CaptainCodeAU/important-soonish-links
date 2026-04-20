import { describe, it, expect } from "vitest";
import { DEFAULT_TAGS } from "./tags";
import { TAG_IDS } from "../types";

describe("DEFAULT_TAGS", () => {
  it("has 6 tags", () => expect(DEFAULT_TAGS).toHaveLength(6));
  it("covers all TagIds", () => {
    const ids = DEFAULT_TAGS.map(t => t.id);
    for (const id of TAG_IDS) {
      expect(ids).toContain(id);
    }
  });
  it("every tag has a label", () => {
    for (const tag of DEFAULT_TAGS) {
      expect(tag.label.length).toBeGreaterThan(0);
    }
  });
  it("every tag has an accentColor", () => {
    for (const tag of DEFAULT_TAGS) {
      expect(tag.accentColor).toBeTruthy();
    }
  });
});
