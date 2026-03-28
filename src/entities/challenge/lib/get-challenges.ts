import { cache } from "react";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { LIVE_CODING_DIR } from "@/shared/config/constants";
import { fileNameToSlug } from "@/shared/lib/content-utils";
import { getChallengeCategories } from "./get-challenge-categories";
import type { ChallengeMeta, ChallengeFull, AdjacentChallenges } from "../model/types";

export const getChallengesByCategory = cache(
  async (categorySlug: string): Promise<ChallengeMeta[]> => {
    const categoryDir = path.join(LIVE_CODING_DIR, categorySlug);

    try {
      const files = await fs.readdir(categoryDir);
      const mdxFiles = files.filter((f) => f.endsWith(".mdx"));

      const challenges = await Promise.all(
        mdxFiles.map(async (file) => {
          const raw = await fs.readFile(path.join(categoryDir, file), "utf-8");
          const { data } = matter(raw);
          return {
            title: data.title as string,
            order: data.order as number,
            slug: fileNameToSlug(file),
            category: categorySlug,
          };
        })
      );

      return challenges.sort((a, b) => a.order - b.order);
    } catch {
      return [];
    }
  }
);

export const getChallenge = cache(
  async (categorySlug: string, challengeSlug: string): Promise<ChallengeFull> => {
    const categoryDir = path.join(LIVE_CODING_DIR, categorySlug);
    const files = await fs.readdir(categoryDir);
    const fileName = files.find(
      (f) => f.endsWith(".mdx") && fileNameToSlug(f) === challengeSlug
    );

    if (!fileName) {
      throw new Error(`Challenge not found: ${categorySlug}/${challengeSlug}`);
    }

    const filePath = path.join(categoryDir, fileName);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);

    return {
      meta: {
        title: data.title as string,
        order: data.order as number,
        slug: challengeSlug,
        category: categorySlug,
      },
      content,
    };
  }
);

export async function getAdjacentChallenges(
  categorySlug: string,
  challengeSlug: string
): Promise<AdjacentChallenges> {
  const challenges = await getChallengesByCategory(categorySlug);
  const challengeIndex = challenges.findIndex((c) => c.slug === challengeSlug);
  const categories = await getChallengeCategories();
  const categoryIndex = categories.findIndex((c) => c.slug === categorySlug);

  let prev: ChallengeMeta | null = null;
  let next: ChallengeMeta | null = null;

  if (challengeIndex > 0) {
    prev = challenges[challengeIndex - 1];
  } else if (challengeIndex === 0 && categoryIndex > 0) {
    const prevChallenges = await getChallengesByCategory(
      categories[categoryIndex - 1].slug
    );
    if (prevChallenges.length > 0) {
      prev = prevChallenges[prevChallenges.length - 1];
    }
  }

  if (challengeIndex < challenges.length - 1) {
    next = challenges[challengeIndex + 1];
  } else if (
    challengeIndex === challenges.length - 1 &&
    categoryIndex < categories.length - 1
  ) {
    const nextChallenges = await getChallengesByCategory(
      categories[categoryIndex + 1].slug
    );
    if (nextChallenges.length > 0) {
      next = nextChallenges[0];
    }
  }

  return { prev, next };
}
