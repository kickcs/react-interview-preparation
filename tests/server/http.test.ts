import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../src-server/http";
import { createStore } from "../../src-server/state";
import type { StateStore } from "../../src-server/types";

function makeStore(nowRef: { t: number }): StateStore {
  let c = 0;
  return createStore({ now: () => nowRef.t, newRoomId: () => `r${++c}` });
}

describe("POST /api/rooms", () => {
  let store: StateStore;
  const now = { t: 1000 };

  beforeEach(() => {
    now.t = 1000;
    store = makeStore(now);
  });

  it("creates a catalog-task room", async () => {
    const app = await buildApp({ store, maxRooms: 500, rateLimit: { max: 1000, timeWindow: "1 minute" } });
    const res = await app.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { taskSource: { kind: "catalog", category: "react", slug: "debounce" } },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({ id: "r1" });
  });

  it("returns 400 on invalid task source", async () => {
    const app = await buildApp({ store, maxRooms: 500, rateLimit: { max: 1000, timeWindow: "1 minute" } });
    const res = await app.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { taskSource: { kind: "wat" } },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 503 when MAX_ROOMS reached", async () => {
    const app = await buildApp({ store, maxRooms: 1, rateLimit: { max: 1000, timeWindow: "1 minute" } });
    await app.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { taskSource: { kind: "catalog", category: "a", slug: "b" } },
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { taskSource: { kind: "catalog", category: "a", slug: "c" } },
    });
    expect(res.statusCode).toBe(503);
  });

  it("rate-limits after configured max", async () => {
    const app = await buildApp({ store, maxRooms: 500, rateLimit: { max: 2, timeWindow: "1 minute" } });
    const body = { taskSource: { kind: "catalog", category: "a", slug: "b" } };
    await app.inject({ method: "POST", url: "/api/rooms", payload: body });
    await app.inject({ method: "POST", url: "/api/rooms", payload: body });
    const third = await app.inject({ method: "POST", url: "/api/rooms", payload: body });
    expect(third.statusCode).toBe(429);
  });
});

describe("CORS", () => {
  it("answers preflight OPTIONS with 204 and CORS headers", async () => {
    const store = makeStore({ t: 1000 });
    const app = await buildApp({
      store,
      maxRooms: 500,
      rateLimit: { max: 1000, timeWindow: "1 minute" },
      corsOrigin: "*",
    });
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/rooms",
      headers: { origin: "http://localhost:3000" },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
  });

  it("echoes a configured origin and sets it on real responses", async () => {
    const store = makeStore({ t: 1000 });
    const app = await buildApp({
      store,
      maxRooms: 500,
      rateLimit: { max: 1000, timeWindow: "1 minute" },
      corsOrigin: "https://example.com",
    });
    const res = await app.inject({
      method: "GET",
      url: "/api/rooms/missing",
      headers: { origin: "https://example.com" },
    });
    expect(res.headers["access-control-allow-origin"]).toBe("https://example.com");
  });
});

describe("GET /api/rooms/:id", () => {
  it("returns 404 for missing room", async () => {
    const store = makeStore({ t: 1000 });
    const app = await buildApp({ store, maxRooms: 500, rateLimit: { max: 1000, timeWindow: "1 minute" } });
    const res = await app.inject({ method: "GET", url: "/api/rooms/missing" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ exists: false });
  });

  it("returns 200 with participantCount for existing room", async () => {
    const store = makeStore({ t: 1000 });
    const app = await buildApp({ store, maxRooms: 500, rateLimit: { max: 1000, timeWindow: "1 minute" } });
    await app.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { taskSource: { kind: "catalog", category: "a", slug: "b" } },
    });
    const res = await app.inject({ method: "GET", url: "/api/rooms/r1" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ exists: true, participantCount: 0, maxParticipants: 4 });
  });
});
