import { describe, it, expect } from "vitest";
import { getTaskContent } from "../../../src/entities/room/lib/get-task-content";

describe("getTaskContent", () => {
  it("loads a real catalog task", async () => {
    const result = await getTaskContent({
      kind: "catalog",
      category: "javascript",
      slug: "debounce",
    });
    expect(result.title).toBeTruthy();
    expect(result.markdown.length).toBeGreaterThan(0);
  });

  it("throws for missing catalog slug", async () => {
    await expect(
      getTaskContent({ kind: "catalog", category: "nope", slug: "missing" })
    ).rejects.toThrow();
  });

  it("returns custom markdown sanitized", async () => {
    const result = await getTaskContent({
      kind: "custom",
      title: "ad-hoc",
      markdown: "# hi\n<script>alert(1)</script>",
    });
    expect(result.title).toBe("ad-hoc");
    expect(result.markdown).not.toContain("<script>");
    expect(result.markdown).toContain("# hi");
  });
});
