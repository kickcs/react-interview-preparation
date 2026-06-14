import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { LIVE_CODING_DIR } from "@/shared/config/constants";
import { fileNameToSlug } from "@/shared/lib/content-utils";
import { CreateRoomForm } from "@/features/room-create/ui/create-room-form";

interface CatalogItem {
  category: string;
  slug: string;
  title: string;
}

async function loadCategory(category: string): Promise<CatalogItem[]> {
  const dir = path.join(LIVE_CODING_DIR, category);
  try {
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".mdx"));
    const entries = await Promise.all(
      files.map(async (file) => {
        const raw = await fs.readFile(path.join(dir, file), "utf8");
        const { data } = matter(raw);
        return {
          category,
          slug: fileNameToSlug(file),
          title: (data.title as string) ?? fileNameToSlug(file),
        };
      })
    );
    return entries;
  } catch {
    return [];
  }
}

async function loadCatalog(): Promise<CatalogItem[]> {
  const categories = await fs.readdir(LIVE_CODING_DIR).catch(() => []);
  const groups = await Promise.all(categories.map(loadCategory));
  return groups.flat();
}

export const revalidate = 3600;

export default async function RoomsLandingPage() {
  const catalog = await loadCatalog();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-16">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Live-coding rooms
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Collaborative interview practice — up to 4 participants, each with their
        own editor and sandbox.
      </p>
      <div className="mt-8">
        <CreateRoomForm catalog={catalog} />
      </div>
    </main>
  );
}
