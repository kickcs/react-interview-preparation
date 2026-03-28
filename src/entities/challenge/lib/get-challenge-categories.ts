import { cache } from "react";
import fs from "fs/promises";
import path from "path";
import { LIVE_CODING_DIR } from "@/shared/config/constants";
import type { ChallengeCategoryMeta } from "../model/types";

export const getChallengeCategories = cache(
  async (): Promise<ChallengeCategoryMeta[]> => {
    const entries = await fs.readdir(LIVE_CODING_DIR, { withFileTypes: true });
    const categories: ChallengeCategoryMeta[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const metaPath = path.join(LIVE_CODING_DIR, entry.name, "_meta.json");
      try {
        const raw = await fs.readFile(metaPath, "utf-8");
        const meta = JSON.parse(raw);
        categories.push({
          title: meta.title,
          order: meta.order,
          description: meta.description,
          slug: entry.name,
          icon: meta.icon,
        });
      } catch {
        // Skip directories without _meta.json
      }
    }

    return categories.sort((a, b) => a.order - b.order);
  }
);
