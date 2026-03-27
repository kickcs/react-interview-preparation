import type { Metadata } from "next";
import { getCategories } from "@/entities/category";
import { getQuestionsByCategory } from "@/entities/question";
import { Sidebar, MobileSidebar } from "@/widgets/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "React Interview Preparation",
  description:
    "Подготовка к собеседованию для React-разработчиков на двух языках",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  const questionsByCategory: Record<string, Awaited<ReturnType<typeof getQuestionsByCategory>>> = {};
  for (const category of categories) {
    questionsByCategory[category.slug] = await getQuestionsByCategory(
      category.slug
    );
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen">
          <Sidebar
            categories={categories}
            questionsByCategory={questionsByCategory}
          />
          <div className="flex-1">
            <MobileSidebar
              categories={categories}
              questionsByCategory={questionsByCategory}
            />
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
