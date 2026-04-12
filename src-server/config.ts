function int(name: string, def: number): number {
  const raw = process.env[name];
  if (!raw) return def;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) {
    throw new Error(`Invalid env ${name}: ${raw}`);
  }
  return n;
}

export const config = {
  wsPort: int("WS_PORT", 3001),
  maxRooms: int("MAX_ROOMS", 500),
  roomTtlMs: int("ROOM_TTL_MS", 10 * 60 * 1000),
  cleanupIntervalMs: int("CLEANUP_INTERVAL_MS", 60 * 1000),
  maxCodeBytes: int("MAX_CODE_BYTES", 50 * 1024),
  maxRoomsPerIpPerMin: int("MAX_ROOMS_PER_IP_PER_MIN", 5),
  rateLimitTimeWindowMs: int("RATE_LIMIT_WINDOW_MS", 60 * 1000),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  logLevel: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
} as const;
