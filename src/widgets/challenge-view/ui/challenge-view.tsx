import Link from "next/link";
import { StarterCode } from "@/shared/ui/starter-code";
import { Hint } from "@/shared/ui/hint";
import { Solution } from "@/shared/ui/solution";
import { ChallengeNavigation } from "./challenge-navigation";
import { ChallengeWorkspace } from "./challenge-workspace";
import type {
  ChallengeMeta,
  AdjacentChallenges,
  ChallengeStarter,
} from "@/entities/challenge";
import { MDXRemote } from "next-mdx-remote/rsc";
import { rehypePlugins } from "@/shared/config/mdx";

interface ChallengeViewProps {
  meta: ChallengeMeta;
  content: string;
  starter: ChallengeStarter | null;
  adjacent: AdjacentChallenges;
  categoryTitle: string;
  categoryHref: string;
  challengeIndex: number;
  totalChallenges: number;
}

/**
 * Renders the task MDX (description + hints + solution). Reading and solo modes
 * are never in the DOM at the same time (mutually-exclusive toggle in
 * `ChallengeWorkspace`), so spoiler ids are identical in both — the expanded
 * state of hints/solution carries over when switching modes.
 *
 * `hideStarter` removes the `<StarterCode>` block in solo mode: there the
 * starter code is already open in the editor on the right, so duplicating it
 * in the description is unnecessary.
 */
function renderChallengeContent(
  content: string,
  challengeId: string,
  hideStarter = false
) {
  let hintCounter = 0;
  const mdxComponents = {
    StarterCode: hideStarter ? () => null : StarterCode,
    Hint: ({ title, children }: { title: string; children: React.ReactNode }) => {
      const id = `${challengeId}-hint-${hintCounter++}`;
      return (
        <Hint title={title} id={id}>
          {children}
        </Hint>
      );
    },
    Solution: ({ children }: { children: React.ReactNode }) => (
      <Solution id={challengeId}>{children}</Solution>
    ),
  };

  return (
    <MDXRemote
      source={content}
      components={mdxComponents}
      options={{ mdxOptions: { rehypePlugins } }}
    />
  );
}

export async function ChallengeView({
  meta,
  content,
  starter,
  adjacent,
  categoryTitle,
  categoryHref,
  challengeIndex,
  totalChallenges,
}: ChallengeViewProps) {
  const challengeId = `${meta.category}/${meta.slug}`;

  const reading = (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        <Link
          href={categoryHref}
          className="transition-colors hover:text-foreground"
        >
          {categoryTitle}
        </Link>{" "}
        <span className="text-muted-foreground/50">›</span> Task{" "}
        {challengeIndex} of {totalChallenges}
      </div>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">{meta.title}</h1>

      <div className="prose prose-invert max-w-none">
        {renderChallengeContent(content, challengeId)}
      </div>

      <ChallengeNavigation adjacent={adjacent} />
    </>
  );

  return (
    <ChallengeWorkspace
      title={meta.title}
      reading={reading}
      soloDescription={renderChallengeContent(content, challengeId, true)}
      starter={starter}
    />
  );
}
