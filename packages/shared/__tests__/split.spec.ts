import { describe, it, expect } from "vitest";
import { computeSplit } from "../src/index";

describe("computeSplit", () => {
  it("splits 12%", () => {
    const { platform, creator } = computeSplit(1000);
    expect(platform).toBe(120);
    expect(creator).toBe(880);
  });
});
