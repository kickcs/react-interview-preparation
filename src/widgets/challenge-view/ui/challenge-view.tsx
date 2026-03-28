import Link from "next/link";
import { StarterCode } from "@/shared/ui/starter-code";
import { Hint } from "@/shared/ui/hint";
import { Solution } from "@/shared/ui/solution";
import { ChallengeNavigation } from "./challenge-navigation";
import type { ChallengeMeta, AdjacentChallenges } from "@/entities/challenge";
import { MDXRemote } from "next-mdx-remote/rsc";
import { rehypePlugins } from "@/shared/config/mdx";

interface ChallengeViewProps {
  meta: ChallengeMeta;
  content: string;
  adjacent: AdjacentChallenges;
  categoryTitle: string;
  categoryHref: string;
  challengeIndex: number;
  totalChallenges: number;
}

export async function ChallengeView({
  meta,
  content,
  adjacent,
  categoryTitle,
  categoryHref,
  challengeIndex,
  totalChallenges,
}: ChallengeViewProps) {
  const challengeId = `${meta.category}/${meta.slug}`;
  let hintCounter = 0;

  const mdxComponents = {
    StarterCode,
    Hint: ({ title, children }: { title: string; children: React.ReactNode }) => {
      const id = `${challengeId}-hint-${hintCounter++}`;
      return <Hint title={title} id={id}>{children}</Hint>;
    },
    Solution: ({ children }: { children: React.ReactNode }) => (
      <Solution id={challengeId}>{children}</Solution>
    ),
  };

  return (
    <article className="mx-auto max-w-[900px] px-4 py-6 md:px-12 md:py-10">
      <div className="mb-4 text-sm text-muted-foreground">
        <Link
          href={categoryHref}
          className="transition-colors hover:text-foreground"
        >
          {categoryTitle}
        </Link>{" "}
        <span className="text-muted-foreground/50">›</span> Задача{" "}
        {challengeIndex} из {totalChallenges}
      </div>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">{meta.title}</h1>

      <div className="prose prose-invert max-w-none">
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{
            mdxOptions: { rehypePlugins },
          }}
        />
      </div>

      <ChallengeNavigation adjacent={adjacent} />
    </article>
  );
}
