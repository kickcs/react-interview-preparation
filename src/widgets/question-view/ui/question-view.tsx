import { Answer } from "@/shared/ui/answer";
import { QuestionNavigation } from "./question-navigation";
import type { QuestionMeta, AdjacentQuestions } from "@/entities/question";
import { MDXRemote } from "next-mdx-remote/rsc";

const mdxComponents = {
  Answer,
};

interface QuestionViewProps {
  meta: QuestionMeta;
  content: string;
  adjacent: AdjacentQuestions;
  categoryTitle: string;
  questionIndex: number;
  totalQuestions: number;
}

export async function QuestionView({
  meta,
  content,
  adjacent,
  categoryTitle,
  questionIndex,
  totalQuestions,
}: QuestionViewProps) {
  return (
    <article className="mx-auto max-w-[720px] px-4 py-6 md:px-12 md:py-10">
      <div className="mb-4 text-sm text-muted-foreground">
        {categoryTitle}{" "}
        <span className="text-muted-foreground/50">›</span> Вопрос{" "}
        {questionIndex} из {totalQuestions}
      </div>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">{meta.title}</h1>

      <MDXRemote source={content} components={mdxComponents} />

      <QuestionNavigation adjacent={adjacent} />
    </article>
  );
}
