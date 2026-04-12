import { describe, it, expect } from "vitest";
import { shouldAutoCollapse } from "../../../src/shared/lib/use-auto-collapse-on-route-enter";

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v); },
    removeItem: (k) => { map.delete(k); },
    clear: () => map.clear(),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size; },
  };
}

describe("shouldAutoCollapse", () => {
  it("returns true and sets sentinel on first call for a room", () => {
    const storage = fakeStorage();
    expect(shouldAutoCollapse("r1", storage)).toBe(true);
    expect(storage.getItem("rooms-auto-collapsed:r1")).toBe("1");
  });

  it("returns false on subsequent calls for the same room", () => {
    const storage = fakeStorage();
    shouldAutoCollapse("r1", storage);
    expect(shouldAutoCollapse("r1", storage)).toBe(false);
  });

  it("tracks different rooms independently", () => {
    const storage = fakeStorage();
    shouldAutoCollapse("r1", storage);
    expect(shouldAutoCollapse("r2", storage)).toBe(true);
  });
});
