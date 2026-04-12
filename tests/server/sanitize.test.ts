import { describe, it, expect } from "vitest";
import {
  validateNickname,
  sanitizeMarkdown,
  NICKNAME_MAX_LEN,
} from "@/shared/contracts";

describe("validateNickname", () => {
  it("accepts 1..20 printable chars", () => {
    expect(validateNickname("alice").ok).toBe(true);
    expect(validateNickname("a").ok).toBe(true);
    expect(validateNickname("a".repeat(NICKNAME_MAX_LEN)).ok).toBe(true);
  });

  it("rejects empty and whitespace-only", () => {
    expect(validateNickname("").ok).toBe(false);
    expect(validateNickname("   ").ok).toBe(false);
  });

  it("rejects too long", () => {
    expect(validateNickname("a".repeat(NICKNAME_MAX_LEN + 1)).ok).toBe(false);
  });

  it("rejects HTML brackets", () => {
    expect(validateNickname("<img>").ok).toBe(false);
    expect(validateNickname("a<b").ok).toBe(false);
  });

  it("trims and returns normalized value", () => {
    const result = validateNickname("  alice  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("alice");
  });
});

describe("sanitizeMarkdown", () => {
  it("passes plain markdown unchanged", () => {
    const md = "# hello\n\nparagraph";
    expect(sanitizeMarkdown(md)).toContain("# hello");
  });

  it("strips <script> tags", () => {
    const md = "# title\n\n<script>alert(1)</script>\n\nbody";
    const cleaned = sanitizeMarkdown(md);
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("alert(1)");
  });

  it("strips event handler attributes", () => {
    const md = '<a href="x" onclick="bad()">link</a>';
    const cleaned = sanitizeMarkdown(md);
    expect(cleaned).not.toContain("onclick");
  });

  it("keeps code blocks", () => {
    const md = "```js\nconsole.log(1)\n```";
    const cleaned = sanitizeMarkdown(md);
    expect(cleaned).toContain("```js");
    expect(cleaned).toContain("console.log");
  });
});
