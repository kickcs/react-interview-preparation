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
    <main style={{ padding: "48px 24px", maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 2 }}>
      <pre style={{ color: "var(--room-phosphor)", margin: 0 }}>
{`╔══════════════════════════╗
║    ROOMS // live-coding   ║
╚══════════════════════════╝`}
      </pre>
      <p className="room-label" style={{ marginTop: 16 }}>
        pair-practice interview problems with up to 4 friends
      </p>
      <div style={{ marginTop: 32 }}>
        <CreateRoomForm catalog={catalog} />
      </div>
    </main>
  );
}
