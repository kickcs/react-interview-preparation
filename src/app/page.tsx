import { redirect } from "next/navigation";
import { getCategories } from "@/entities/category";
import { getQuestionsByCategory } from "@/entities/question";

export default async function Home() {
  const categories = await getCategories();

  if (categories.length === 0) {
    return <div className="p-8">No content available.</div>;
  }

  const firstCategory = categories[0];
  const questions = await getQuestionsByCategory(firstCategory.slug);

  if (questions.length === 0) {
    return <div className="p-8">No questions available.</div>;
  }

  redirect(`/${firstCategory.slug}/${questions[0].slug}`);
}
