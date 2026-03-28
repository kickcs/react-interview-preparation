import { notFound } from "next/navigation";
import {
  getChallengeCategories,
  getChallengesByCategory,
  getChallenge,
  getAdjacentChallenges,
} from "@/entities/challenge";
import { ChallengeView } from "@/widgets/challenge-view";

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const categories = await getChallengeCategories();
  const allChallenges = await Promise.all(
    categories.map((c) => getChallengesByCategory(c.slug))
  );

  return categories.flatMap((category, i) =>
    allChallenges[i].map((challenge) => ({
      category: category.slug,
      slug: challenge.slug,
    }))
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { category, slug } = await params;
  try {
    const challenge = await getChallenge(category, slug);
    return {
      title: `${challenge.meta.title} — Live Coding`,
    };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function ChallengePage({ params }: PageProps) {
  const { category, slug } = await params;

  let challenge;
  try {
    challenge = await getChallenge(category, slug);
  } catch {
    notFound();
  }

  const categories = await getChallengeCategories();
  const categoryMeta = categories.find((c) => c.slug === category);
  const challenges = await getChallengesByCategory(category);
  const adjacent = await getAdjacentChallenges(category, slug);
  const challengeIndex = challenges.findIndex((c) => c.slug === slug) + 1;

  return (
    <ChallengeView
      meta={challenge.meta}
      content={challenge.content}
      adjacent={adjacent}
      categoryTitle={categoryMeta?.title ?? category}
      categoryHref={`/live-coding/${category}/${challenges[0]?.slug ?? slug}`}
      challengeIndex={challengeIndex}
      totalChallenges={challenges.length}
    />
  );
}
