import { describe, it, expect } from "vitest";
import { gridClassForCount } from "../../../src/widgets/room-view/lib/grid-class-for-count";

describe("gridClassForCount", () => {
  it("1 → single cell", () => {
    expect(gridClassForCount(1)).toContain("grid-cols-1");
    expect(gridClassForCount(1)).toContain("grid-rows-1");
  });

  it("2 → two columns one row", () => {
    expect(gridClassForCount(2)).toContain("grid-cols-2");
    expect(gridClassForCount(2)).toContain("grid-rows-1");
  });

  it("3 → first cell spans two columns", () => {
    const cls = gridClassForCount(3);
    expect(cls).toContain("grid-cols-2");
    expect(cls).toContain("grid-rows-2");
    expect(cls).toContain("col-span-2");
  });

  it("4 → 2x2", () => {
    expect(gridClassForCount(4)).toContain("grid-cols-2");
    expect(gridClassForCount(4)).toContain("grid-rows-2");
    expect(gridClassForCount(4)).not.toContain("col-span-2");
  });

  it("0 / negative → falls back to grid-cols-1", () => {
    expect(gridClassForCount(0)).toContain("grid-cols-1");
    expect(gridClassForCount(-1)).toContain("grid-cols-1");
  });

  it("> 4 → clamps to 4-cell layout", () => {
    expect(gridClassForCount(5)).toBe(gridClassForCount(4));
  });
});
