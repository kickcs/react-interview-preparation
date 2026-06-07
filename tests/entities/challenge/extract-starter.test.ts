import { describe, it, expect } from "vitest";
import { extractStarter } from "@/entities/challenge/lib/extract-starter";

describe("extractStarter", () => {
  it("extracts js starter and language from StarterCode block", () => {
    const mdx = [
      "Описание задачи.",
      "",
      "<StarterCode>",
      "",
      "```js",
      "function twoSum(nums, target) {",
      "  // Ваш код здесь",
      "}",
      "```",
      "",
      "</StarterCode>",
    ].join("\n");

    const result = extractStarter(mdx);

    expect(result).not.toBeNull();
    expect(result!.language).toBe("js");
    expect(result!.code).toContain("function twoSum(nums, target)");
    expect(result!.code.endsWith("\n")).toBe(true);
  });

  it("maps ts fence to ts language", () => {
    const mdx = "<StarterCode>\n```ts\nconst x: number = 1;\n```\n</StarterCode>";
    expect(extractStarter(mdx)?.language).toBe("ts");
  });

  it("maps jsx/tsx fences to react language", () => {
    const jsx = "<StarterCode>\n```jsx\nexport default () => null;\n```\n</StarterCode>";
    const tsx = "<StarterCode>\n```tsx\nexport default () => null;\n```\n</StarterCode>";
    expect(extractStarter(jsx)?.language).toBe("react");
    expect(extractStarter(tsx)?.language).toBe("react");
  });

  it("returns null when there is no StarterCode block", () => {
    expect(extractStarter("Просто текст без стартера")).toBeNull();
  });

  it("returns null when the fence language is unknown", () => {
    const mdx = "<StarterCode>\n```python\nprint(1)\n```\n</StarterCode>";
    expect(extractStarter(mdx)).toBeNull();
  });

  it("returns null when StarterCode has no fenced code block", () => {
    expect(extractStarter("<StarterCode>\nтолько текст\n</StarterCode>")).toBeNull();
  });

  it("takes only the first StarterCode block", () => {
    const mdx =
      "<StarterCode>\n```js\nfirst();\n```\n</StarterCode>\n" +
      "<StarterCode>\n```ts\nsecond();\n```\n</StarterCode>";
    const result = extractStarter(mdx);
    expect(result?.language).toBe("js");
    expect(result?.code).toContain("first()");
  });
});
