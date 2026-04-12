import { Server as IOServer } from "socket.io";
import { nanoid } from "nanoid";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { config } from "./config";
import { buildApp } from "./http";
import { attachWs } from "./ws";
import { createStore, cleanupExpiredRooms, getRoom } from "./state";
import type { StateStore } from "./types";
import { sanitizeMarkdown, type TaskContent } from "@/shared/contracts";

const catalogCache = new Map<string, TaskContent>();

async function loadCatalogTask(category: string, slug: string): Promise<TaskContent> {
  const key = `${category}/${slug}`;
  const cached = catalogCache.get(key);
  if (cached) return cached;
  const dir = path.join(process.cwd(), "content", "live-coding", category);
  try {
    const files = await fs.readdir(dir);
    const match = files.find(
      (f) => f.endsWith(".mdx") && f.replace(/^\d+-/, "").replace(/\.mdx$/, "") === slug
    );
    if (!match) return { title: slug, markdown: "" };
    const raw = await fs.readFile(path.join(dir, match), "utf8");
    const { data, content } = matter(raw);
    const result: TaskContent = {
      title: (data.title as string) ?? slug,
      markdown: sanitizeMarkdown(content),
    };
    catalogCache.set(key, result);
    return result;
  } catch {
    return { title: slug, markdown: "" };
  }
}

async function loadTaskContent(store: StateStore, roomId: string): Promise<TaskContent> {
  const room = getRoom(store, roomId);
  if (!room) return { title: "", markdown: "" };
  if (room.taskSource.kind === "catalog") {
    return loadCatalogTask(room.taskSource.category, room.taskSource.slug);
  }
  return {
    title: room.taskSource.title,
    markdown: sanitizeMarkdown(room.taskSource.markdown),
  };
}

async function main(): Promise<void> {
  const store = createStore({
    now: () => Date.now(),
    newRoomId: () => nanoid(8),
  });

  const fastify = await buildApp({
    store,
    maxRooms: config.maxRooms,
    rateLimit: {
      max: config.maxRoomsPerIpPerMin,
      timeWindow: `${config.rateLimitTimeWindowMs} ms`,
    },
    logger: true,
  });

  await fastify.ready();

  const io = new IOServer(fastify.server, {
    cors: { origin: config.corsOrigin },
    pingTimeout: 25_000,
    pingInterval: 10_000,
  });

  attachWs(io, {
    store,
    maxCodeBytes: config.maxCodeBytes,
    maxUpdatesPerSec: 5,
    loadTaskContent: (roomId) => loadTaskContent(store, roomId),
  });

  const interval = setInterval(() => {
    const { removed } = cleanupExpiredRooms(store, { ttlMs: config.roomTtlMs });
    if (removed > 0) fastify.log.info({ removed }, "cleaned up empty rooms");
  }, config.cleanupIntervalMs);
  interval.unref();

  await fastify.listen({ port: config.wsPort, host: "0.0.0.0" });

  const shutdown = async (signal: string) => {
    fastify.log.info({ signal }, "shutting down");
    await fastify.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("ws-server failed to start", err);
  process.exit(1);
});
