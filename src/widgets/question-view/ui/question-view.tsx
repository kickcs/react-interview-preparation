import Link from "next/link";
import { Answer } from "@/shared/ui/answer";
import { AnswerGroup } from "@/shared/ui/answer-group";
import { Spoiler } from "@/shared/ui/spoiler";
import { QuestionNavigation } from "./question-navigation";
import type { QuestionMeta, AdjacentQuestions } from "@/entities/question";
import { MDXRemote } from "next-mdx-remote/rsc";
import { rehypePlugins } from "@/shared/config/mdx";

const mdxComponents = {
  Answer,
  AnswerGroup,
};

interface QuestionViewProps {
  meta: QuestionMeta;
  content: string;
  adjacent: AdjacentQuestions;
  categoryTitle: string;
  categoryHref: string;
  questionIndex: number;
  totalQuestions: number;
}

export async function QuestionView({
  meta,
  content,
  adjacent,
  categoryTitle,
  categoryHref,
  questionIndex,
  totalQuestions,
}: QuestionViewProps) {
  return (
    <article className="mx-auto max-w-[900px] px-4 py-6 md:px-12 md:py-10">
      <div className="mb-4 text-sm text-muted-foreground">
        <Link
          href={categoryHref}
          className="transition-colors hover:text-foreground"
        >
          {categoryTitle}
        </Link>{" "}
        <span className="text-muted-foreground/50">›</span> Вопрос{" "}
        {questionIndex} из {totalQuestions}
      </div>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">{meta.title}</h1>

      <Spoiler id={`${meta.category}/${meta.slug}`}>
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{
            mdxOptions: { rehypePlugins },
          }}
        />
      </Spoiler>

      <QuestionNavigation adjacent={adjacent} />
    </article>
  );
}
