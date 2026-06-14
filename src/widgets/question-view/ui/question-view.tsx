import Link from "next/link";
import { Code2 } from "lucide-react";
import { Spoiler } from "@/shared/ui/spoiler";
import { QuestionNavigation } from "./question-navigation";
import type { QuestionMeta, AdjacentQuestions } from "@/entities/question";
import { MDXRemote } from "next-mdx-remote/rsc";
import { rehypePlugins } from "@/shared/config/mdx";
import { mdxComponents } from "@/shared/ui/mdx-components";

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
        <span className="text-muted-foreground/50">›</span> Question{" "}
        {questionIndex} of {totalQuestions}
      </div>

      <h1 className="mb-4 text-2xl font-bold md:text-3xl">{meta.title}</h1>

      <Link
        href={`/${meta.category}/${meta.slug}/solo`}
        className="mb-8 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium transition-colors hover:border-muted-foreground/50 hover:text-foreground"
      >
        <Code2 className="h-4 w-4" />
        Solve in editor
      </Link>

      <div className="content-separator" />

      <Spoiler id={`${meta.category}/${meta.slug}`}>
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{
            mdxOptions: { rehypePlugins },
          }}
        />
      </Spoiler>

      <div className="content-separator" />

      <QuestionNavigation adjacent={adjacent} />
    </article>
  );
}
