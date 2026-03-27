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
  const allQuestions = await Promise.all(
    categories.map((c) => getQuestionsByCategory(c.slug))
  );

  return categories.flatMap((category, i) =>
    allQuestions[i].map((question) => ({
      category: category.slug,
      slug: question.slug,
    }))
  );
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

  const firstQuestion = questions[0];
  const categoryHref = firstQuestion
    ? `/${category}/${firstQuestion.slug}`
    : `/${category}`;

  return (
    <QuestionView
      meta={question.meta}
      content={question.content}
      adjacent={adjacent}
      categoryTitle={categoryMeta?.title ?? category}
      categoryHref={categoryHref}
      questionIndex={questionIndex}
      totalQuestions={questions.length}
    />
  );
}
