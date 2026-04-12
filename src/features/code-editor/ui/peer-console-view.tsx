"use client";
import { useEffect, useRef } from "react";
import type { ConsoleMessage } from "@/shared/contracts";
import { cn } from "@/shared/lib/utils";

interface Props {
  logs: ConsoleMessage[];
}

const METHOD_COLOR: Record<ConsoleMessage["method"], string> = {
  log: "text-foreground/80",
  debug: "text-foreground/60",
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

export function PeerConsoleView({ logs }: Props) {
  const containerRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="flex min-h-[140px] max-h-[200px] items-center justify-center border-t border-dashed border-border text-xs text-muted-foreground">
        Нет вывода
      </div>
    );
  }

  return (
    <ul
      ref={containerRef}
      className="min-h-[140px] max-h-[200px] overflow-auto border-t border-dashed border-border bg-background/40 px-3 py-2 font-mono text-[11px] leading-relaxed"
    >
      {logs.map((log) => (
        <li key={log.id} className={cn("whitespace-pre-wrap break-words", METHOD_COLOR[log.method])}>
          {log.data.join(" ")}
        </li>
      ))}
    </ul>
  );
}
