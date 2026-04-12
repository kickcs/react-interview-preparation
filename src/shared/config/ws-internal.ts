const port = process.env.WS_PORT ?? "3001";

export const WS_INTERNAL_URL =
  process.env.WS_INTERNAL_URL ?? `http://127.0.0.1:${port}`;
