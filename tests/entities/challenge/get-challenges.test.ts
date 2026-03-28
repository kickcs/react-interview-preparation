import { describe, it, expect } from "vitest";
import {
  getChallengeCategories,
  getChallengesByCategory,
  getChallenge,
  getAdjacentChallenges,
} from "@/entities/challenge";

describe("getChallengeCategories", () => {
  it("returns challenge subcategories sorted by order", async () => {
    const categories = await getChallengeCategories();

    expect(categories.length).toBeGreaterThanOrEqual(1);
    expect(categories[0].slug).toBe("javascript");
    expect(categories[0].title).toBe("JavaScript");
    expect(categories[0].order).toBe(1);

    for (let i = 1; i < categories.length; i++) {
      expect(categories[i].order).toBeGreaterThan(categories[i - 1].order);
    }
  });

  it("each category has required fields", async () => {
    const categories = await getChallengeCategories();

    for (const category of categories) {
      expect(category).toHaveProperty("title");
      expect(category).toHaveProperty("order");
      expect(category).toHaveProperty("description");
      expect(category).toHaveProperty("slug");
    }
  });
});

describe("getChallengesByCategory", () => {
  it("returns challenges sorted by order", async () => {
    const challenges = await getChallengesByCategory("javascript");

    expect(challenges.length).toBeGreaterThanOrEqual(2);
    expect(challenges[0].slug).toBe("closure-counter");
    expect(challenges[0].title).toBe("Замыкание-счётчик");
    expect(challenges[0].order).toBe(1);
    expect(challenges[0].category).toBe("javascript");

    for (let i = 1; i < challenges.length; i++) {
      expect(challenges[i].order).toBeGreaterThan(challenges[i - 1].order);
    }
  });

  it("returns empty array for non-existent category", async () => {
    const challenges = await getChallengesByCategory("nonexistent");
    expect(challenges).toEqual([]);
  });
});

describe("getChallenge", () => {
  it("returns challenge data with content", async () => {
    const challenge = await getChallenge("javascript", "closure-counter");

    expect(challenge.meta.title).toBe("Замыкание-счётчик");
    expect(challenge.meta.slug).toBe("closure-counter");
    expect(challenge.meta.category).toBe("javascript");
    expect(challenge.content).toBeDefined();
    expect(challenge.content.length).toBeGreaterThan(0);
  });
});

describe("getAdjacentChallenges", () => {
  it("returns null prev for first challenge in first category", async () => {
    const adj = await getAdjacentChallenges("javascript", "closure-counter");

    expect(adj.prev).toBeNull();
    expect(adj.next).not.toBeNull();
    expect(adj.next!.slug).toBe("currying");
  });

  it("returns prev and next within same category", async () => {
    const adj = await getAdjacentChallenges("javascript", "currying");

    expect(adj.prev).not.toBeNull();
    expect(adj.prev!.slug).toBe("closure-counter");
  });
});
