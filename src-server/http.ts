import Fastify, { type FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { createRoom, getRoom } from "./state";
import type { StateStore } from "./types";
import { MAX_PARTICIPANTS, type TaskSource } from "@/shared/contracts";

export interface BuildAppOptions {
  store: StateStore;
  maxRooms: number;
  rateLimit: { max: number; timeWindow: string };
  logger?: boolean;
}

function isTaskSource(x: unknown): x is TaskSource {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (o.kind === "catalog") {
    return typeof o.category === "string" && typeof o.slug === "string";
  }
  if (o.kind === "custom") {
    return typeof o.title === "string" && typeof o.markdown === "string";
  }
  return false;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });

  await app.register(rateLimit, {
    max: opts.rateLimit.max,
    timeWindow: opts.rateLimit.timeWindow,
  });

  app.post<{ Body: { taskSource: unknown } }>(
    "/api/rooms",
    {
      config: {
        rateLimit: { max: opts.rateLimit.max, timeWindow: opts.rateLimit.timeWindow },
      },
    },
    async (req, reply) => {
      const body = req.body ?? ({} as { taskSource: unknown });
      if (!isTaskSource(body.taskSource)) {
        return reply.code(400).send({ error: "INVALID_TASK_SOURCE" });
      }
      const result = createRoom(opts.store, {
        taskSource: body.taskSource,
        maxRooms: opts.maxRooms,
      });
      if (!result.ok) {
        return reply.code(503).send({ error: result.error });
      }
      return reply.code(201).send({ id: result.room.id });
    }
  );

  app.get<{ Params: { id: string } }>("/api/rooms/:id", async (req, reply) => {
    const room = getRoom(opts.store, req.params.id);
    if (!room) {
      return reply.code(404).send({ exists: false });
    }
    return reply.code(200).send({
      exists: true,
      participantCount: room.participants.size,
      maxParticipants: MAX_PARTICIPANTS,
    });
  });

  return app;
}
