import { cache } from "react";
import fs from "fs/promises";
import path from "path";
import { CONTENT_DIR } from "@/shared/config/constants";
import type { CategoryMeta } from "../model/types";

export const getCategories = cache(async (): Promise<CategoryMeta[]> => {
  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  const categories: CategoryMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const metaPath = path.join(CONTENT_DIR, entry.name, "_meta.json");
    try {
      const raw = await fs.readFile(metaPath, "utf-8");
      const meta = JSON.parse(raw);
      categories.push({
        title: meta.title,
        order: meta.order,
        description: meta.description,
        slug: entry.name,
      });
    } catch {
      // Skip directories without _meta.json
    }
  }

  return categories.sort((a, b) => a.order - b.order);
});
