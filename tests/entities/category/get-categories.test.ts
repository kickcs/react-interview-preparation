import { describe, it, expect } from "vitest";
import { getCategories } from "@/entities/category";

describe("getCategories", () => {
  it("returns categories sorted by order", async () => {
    const categories = await getCategories();

    expect(categories.length).toBeGreaterThanOrEqual(2);
    expect(categories[0].slug).toBe("javascript-core");
    expect(categories[0].title).toBe("JavaScript Core");
    expect(categories[0].order).toBe(1);

    for (let i = 1; i < categories.length; i++) {
      expect(categories[i].order).toBeGreaterThan(categories[i - 1].order);
    }
  });

  it("each category has required fields", async () => {
    const categories = await getCategories();

    for (const category of categories) {
      expect(category).toHaveProperty("title");
      expect(category).toHaveProperty("order");
      expect(category).toHaveProperty("description");
      expect(category).toHaveProperty("slug");
    }
  });

  it("categories with icon field include it in result", async () => {
    const categories = await getCategories();
    const jsCategory = categories.find((c) => c.slug === "javascript-core");

    expect(jsCategory).toBeDefined();
    expect(jsCategory!.icon).toBe("javascript");
  });
});
