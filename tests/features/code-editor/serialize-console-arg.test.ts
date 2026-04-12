import { describe, it, expect } from "vitest";
import { serializeConsoleArg } from "../../../src/features/code-editor/lib/serialize-console-arg";

describe("serializeConsoleArg", () => {
  it("returns strings unchanged", () => {
    expect(serializeConsoleArg("hello")).toBe("hello");
  });

  it("stringifies numbers", () => {
    expect(serializeConsoleArg(42)).toBe("42");
  });

  it("pretty-prints plain objects", () => {
    expect(serializeConsoleArg({ a: 1 })).toContain("\"a\"");
  });

  it("handles cyclic references without throwing", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(() => serializeConsoleArg(obj)).not.toThrow();
    expect(typeof serializeConsoleArg(obj)).toBe("string");
  });

  it("handles undefined", () => {
    expect(serializeConsoleArg(undefined)).toBe("undefined");
  });

  it("handles functions", () => {
    expect(serializeConsoleArg(() => 1)).toContain("function");
  });

  it("handles bigint", () => {
    expect(serializeConsoleArg(10n)).toBe("10");
  });
});
