import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { CONTENT_DIR } from "@/shared/config/constants";
import { getCategories } from "@/entities/category/lib/get-categories";
import type { QuestionMeta, QuestionFull, AdjacentQuestions } from "../model/types";

function fileNameToSlug(fileName: string): string {
  return fileName
    .replace(/\.mdx$/, "")
    .replace(/^\d+-/, "");
}

export async function getQuestionsByCategory(
  categorySlug: string
): Promise<QuestionMeta[]> {
  const categoryDir = path.join(CONTENT_DIR, categorySlug);

  try {
    const files = await fs.readdir(categoryDir);
    const mdxFiles = files.filter((f) => f.endsWith(".mdx"));
    const questions: QuestionMeta[] = [];

    for (const file of mdxFiles) {
      const filePath = path.join(categoryDir, file);
      const raw = await fs.readFile(filePath, "utf-8");
      const { data } = matter(raw);

      questions.push({
        title: data.title,
        order: data.order,
        slug: fileNameToSlug(file),
        category: categorySlug,
      });
    }

    return questions.sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export async function getQuestion(
  categorySlug: string,
  questionSlug: string
): Promise<QuestionFull> {
  const categoryDir = path.join(CONTENT_DIR, categorySlug);
  const files = await fs.readdir(categoryDir);
  const fileName = files.find(
    (f) => f.endsWith(".mdx") && fileNameToSlug(f) === questionSlug
  );

  if (!fileName) {
    throw new Error(`Question not found: ${categorySlug}/${questionSlug}`);
  }

  const filePath = path.join(categoryDir, fileName);
  const raw = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    meta: {
      title: data.title,
      order: data.order,
      slug: questionSlug,
      category: categorySlug,
    },
    content,
  };
}

export async function getAdjacentQuestions(
  categorySlug: string,
  questionSlug: string
): Promise<AdjacentQuestions> {
  const questions = await getQuestionsByCategory(categorySlug);
  const questionIndex = questions.findIndex((q) => q.slug === questionSlug);

  let prev: QuestionMeta | null = null;
  let next: QuestionMeta | null = null;

  if (questionIndex > 0) {
    prev = questions[questionIndex - 1];
  } else if (questionIndex === 0) {
    const categories = await getCategories();
    const categoryIndex = categories.findIndex((c) => c.slug === categorySlug);
    if (categoryIndex > 0) {
      const prevQuestions = await getQuestionsByCategory(categories[categoryIndex - 1].slug);
      if (prevQuestions.length > 0) {
        prev = prevQuestions[prevQuestions.length - 1];
      }
    }
  }

  if (questionIndex < questions.length - 1) {
    next = questions[questionIndex + 1];
  } else if (questionIndex === questions.length - 1) {
    const categories = await getCategories();
    const categoryIndex = categories.findIndex((c) => c.slug === categorySlug);
    if (categoryIndex < categories.length - 1) {
      const nextQuestions = await getQuestionsByCategory(categories[categoryIndex + 1].slug);
      if (nextQuestions.length > 0) {
        next = nextQuestions[0];
      }
    }
  }

  return { prev, next };
}
