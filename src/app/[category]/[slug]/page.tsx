import { notFound } from "next/navigation";
import { getCategories } from "@/entities/category";
import {
  getQuestionsByCategory,
  getQuestion,
  getAdjacentQuestions,
} from "@/entities/question";
import { QuestionView } from "@/widgets/question-view";

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  const params: { category: string; slug: string }[] = [];

  for (const category of categories) {
    const questions = await getQuestionsByCategory(category.slug);
    for (const question of questions) {
      params.push({
        category: category.slug,
        slug: question.slug,
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { category, slug } = await params;
  try {
    const question = await getQuestion(category, slug);
    return {
      title: `${question.meta.title} — React Interview Prep`,
    };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function QuestionPage({ params }: PageProps) {
  const { category, slug } = await params;

  let question;
  try {
    question = await getQuestion(category, slug);
  } catch {
    notFound();
  }

  const categories = await getCategories();
  const categoryMeta = categories.find((c) => c.slug === category);
  const questions = await getQuestionsByCategory(category);
  const adjacent = await getAdjacentQuestions(category, slug);
  const questionIndex = questions.findIndex((q) => q.slug === slug) + 1;

  return (
    <QuestionView
      meta={question.meta}
      content={question.content}
      adjacent={adjacent}
      categoryTitle={categoryMeta?.title ?? category}
      questionIndex={questionIndex}
      totalQuestions={questions.length}
    />
  );
}
