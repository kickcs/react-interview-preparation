import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getCategories } from "@/entities/category";
import { getQuestionsByCategory } from "@/entities/question";
import { Sidebar, MobileSidebar } from "@/widgets/sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains-mono",
});

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
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <div className="flex min-h-screen">
          <Sidebar
            categories={categories}
            questionsByCategory={questionsByCategory}
          />
          <div className="flex-1 min-w-0">
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
