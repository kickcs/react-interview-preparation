import { describe, it, expect } from "vitest";
import {
  getQuestionsByCategory,
  getQuestion,
  getAdjacentQuestions,
} from "@/entities/question";

describe("getQuestionsByCategory", () => {
  it("returns questions sorted by order", async () => {
    const questions = await getQuestionsByCategory("react-basics");

    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions[0].slug).toBe("what-is-jsx");
    expect(questions[0].title).toBe("What is JSX?");
    expect(questions[0].order).toBe(1);
    expect(questions[0].category).toBe("react-basics");

    for (let i = 1; i < questions.length; i++) {
      expect(questions[i].order).toBeGreaterThan(questions[i - 1].order);
    }
  });

  it("returns empty array for non-existent category", async () => {
    const questions = await getQuestionsByCategory("nonexistent");
    expect(questions).toEqual([]);
  });
});

describe("getQuestion", () => {
  it("returns question data with content", async () => {
    const question = await getQuestion("react-basics", "what-is-jsx");

    expect(question.meta.title).toBe("What is JSX?");
    expect(question.meta.slug).toBe("what-is-jsx");
    expect(question.meta.category).toBe("react-basics");
    expect(question.content).toBeDefined();
    expect(question.content.length).toBeGreaterThan(0);
  });
});

describe("getAdjacentQuestions", () => {
  it("returns prev from previous category for first question in category", async () => {
    const adj = await getAdjacentQuestions("react-basics", "what-is-jsx");

    // react-basics (order 4) is after browser-network (order 3)
    expect(adj.prev).not.toBeNull();
    expect(adj.prev!.category).toBe("browser-network");
    expect(adj.next).not.toBeNull();
    expect(adj.next!.slug).toBe("components-and-props");
  });

  it("returns next from next category for last question in category", async () => {
    const adj = await getAdjacentQuestions("react-basics", "components-and-props");

    expect(adj.prev).not.toBeNull();
    expect(adj.prev!.slug).toBe("what-is-jsx");
    // react-basics (order 4) is before hooks (order 5)
    expect(adj.next).not.toBeNull();
    expect(adj.next!.category).toBe("hooks");
  });

  it("returns null prev for very first question overall", async () => {
    const adj = await getAdjacentQuestions("javascript-core", "closures");

    expect(adj.prev).toBeNull();
    expect(adj.next).not.toBeNull();
  });
});
