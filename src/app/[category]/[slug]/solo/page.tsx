import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllQuestionParams, getQuestion } from "@/entities/question";
import { rehypePlugins } from "@/shared/config/mdx";
import { mdxComponents } from "@/shared/ui/mdx-components";
import { SoloView } from "@/widgets/solo-view";

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export const generateStaticParams = getAllQuestionParams;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  try {
    const question = await getQuestion(category, slug);
    return {
      title: `${question.meta.title} — Solo`,
    };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function SoloQuestionPage({ params }: PageProps) {
  const { category, slug } = await params;

  const question = await getQuestion(category, slug).catch(() => notFound());

  const questionContent = (
    <MDXRemote
      source={question.content}
      components={mdxComponents}
      options={{
        mdxOptions: { rehypePlugins },
      }}
    />
  );

  return (
    <SoloView
      id={`${question.meta.category}/${question.meta.slug}`}
      title={question.meta.title}
      questionContent={questionContent}
    />
  );
}
