/**
 * Resolves the base URL the browser uses to reach the ws-server (socket.io +
 * /api/rooms). Computed at runtime, not build time, so dev works out of the box.
 *
 * Priority:
 *  1. NEXT_PUBLIC_WS_URL when set — explicit override wins.
 *  2. Local dev (browser on :3000) — connect directly to the ws-server on :3001,
 *     since there is no ingress proxy in `bun dev`.
 *  3. Otherwise "" (same-origin) — production sits behind the ingress proxy that
 *     forwards /socket.io and /api/rooms to the ws-server.
 */
const DEV_WS_PORT = "3001";

function resolveWsBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;

  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
    const { hostname, port, protocol } = window.location;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
    // In dev the Next app is served on a different port than the ws-server and
    // nothing proxies between them, so point the browser straight at :3001.
    if (isLocalHost && port && port !== DEV_WS_PORT) {
      return `${protocol}//${hostname}:${DEV_WS_PORT}`;
    }
  }

  return "";
}

export const WS_BASE_URL = resolveWsBaseUrl();
