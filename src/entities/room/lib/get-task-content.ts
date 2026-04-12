import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { sanitizeMarkdown, type TaskContent, type TaskSource } from "@/shared/contracts";
import { LIVE_CODING_DIR } from "@/shared/config/constants";
import { fileNameToSlug } from "@/shared/lib/content-utils";

export async function getTaskContent(source: TaskSource): Promise<TaskContent> {
  if (source.kind === "custom") {
    return { title: source.title, markdown: sanitizeMarkdown(source.markdown) };
  }
  const dir = path.join(LIVE_CODING_DIR, source.category);
  const files = await fs.readdir(dir);
  const match = files.find(
    (f) => f.endsWith(".mdx") && fileNameToSlug(f) === source.slug
  );
  if (!match) {
    throw new Error(`Task not found: ${source.category}/${source.slug}`);
  }
  const raw = await fs.readFile(path.join(dir, match), "utf8");
  const { data, content } = matter(raw);
  return {
    title: (data.title as string) ?? source.slug,
    markdown: sanitizeMarkdown(content),
  };
}
