#!/usr/bin/env node
const { spawn } = require("node:child_process");

const procs = [
  { name: "next", cmd: "node", args: ["server.js"] },
  { name: "ws", cmd: "node", args: ["dist-server/src-server/ws-server.js"] },
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
  const child = spawn(p.cmd, p.args, { stdio: "inherit", env: process.env });
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

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => shutdown(0));
}
