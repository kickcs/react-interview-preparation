import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { CONTENT_DIR } from "@/shared/config/constants";
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
  const index = questions.findIndex((q) => q.slug === questionSlug);

  return {
    prev: index > 0 ? questions[index - 1] : null,
    next: index < questions.length - 1 ? questions[index + 1] : null,
  };
}
