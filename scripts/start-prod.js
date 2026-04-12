#!/usr/bin/env node
const { spawn } = require("node:child_process");
const http = require("node:http");
const net = require("node:net");

const INGRESS_PORT = Number(process.env.PORT ?? 3000);
const INGRESS_HOST = process.env.HOSTNAME ?? "0.0.0.0";
const NEXT_INTERNAL_PORT = Number(process.env.NEXT_INTERNAL_PORT ?? 3100);
const WS_PORT = Number(process.env.WS_PORT ?? 3001);

const procs = [
  {
    name: "next",
    cmd: "node",
    args: ["server.js"],
    env: {
      ...process.env,
      PORT: String(NEXT_INTERNAL_PORT),
      HOSTNAME: "127.0.0.1",
    },
  },
  {
    name: "ws",
    cmd: "node",
    args: ["dist-server/src-server/ws-server.js"],
    env: process.env,
  },
];

const children = [];
let shuttingDown = false;

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 500).unref();
}

for (const p of procs) {
  const child = spawn(p.cmd, p.args, { stdio: "inherit", env: p.env });
  children.push(child);
  child.on("exit", (code, signal) => {
    console.error(`[start-prod] ${p.name} exited code=${code} signal=${signal}`);
    shutdown(code ?? 1);
  });
  child.on("error", (err) => {
    console.error(`[start-prod] ${p.name} error:`, err);
    shutdown(1);
  });
}

function isWsPath(url) {
  if (!url) return false;
  if (url === "/socket.io" || url.startsWith("/socket.io/") || url.startsWith("/socket.io?")) return true;
  if (url === "/api/rooms" || url.startsWith("/api/rooms/") || url.startsWith("/api/rooms?")) return true;
  return false;
}

function targetPort(url) {
  return isWsPath(url) ? WS_PORT : NEXT_INTERNAL_PORT;
}

const ingress = http.createServer((req, res) => {
  const port = targetPort(req.url);
  const upstreamReq = http.request(
    {
      host: "127.0.0.1",
      port,
      method: req.method,
      path: req.url,
      headers: req.headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstreamReq.on("error", (err) => {
    console.error(`[ingress] http proxy error (${port}):`, err.message);
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
    res.end("Bad Gateway");
  });
  req.on("error", () => upstreamReq.destroy());
  req.pipe(upstreamReq);
});

ingress.on("upgrade", (req, clientSocket, head) => {
  const port = targetPort(req.url);
  const upstream = net.connect(port, "127.0.0.1", () => {
    const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
    for (const [k, v] of Object.entries(req.headers)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) {
        for (const vv of v) lines.push(`${k}: ${vv}`);
      } else {
        lines.push(`${k}: ${v}`);
      }
    }
    upstream.write(lines.join("\r\n") + "\r\n\r\n");
    if (head && head.length) upstream.write(head);
    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);
  });
  upstream.on("error", (err) => {
    console.error(`[ingress] upgrade proxy error (${port}):`, err.message);
    clientSocket.destroy();
  });
  clientSocket.on("error", () => upstream.destroy());
});

ingress.listen(INGRESS_PORT, INGRESS_HOST, () => {
  console.log(`[ingress] listening on ${INGRESS_HOST}:${INGRESS_PORT} (next=${NEXT_INTERNAL_PORT}, ws=${WS_PORT})`);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => shutdown(0));
}
