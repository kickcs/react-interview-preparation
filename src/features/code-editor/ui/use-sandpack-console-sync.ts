"use client";
import { useEffect, useRef } from "react";
import { useSandpack } from "@codesandbox/sandpack-react";
import type { ConsoleMessage, ConsoleMethod } from "@/shared/contracts";
import { serializeConsoleArg } from "../lib/serialize-console-arg";

const FLUSH_DELAY_MS = 150;
const MAX_BATCH = 50;

interface Params {
  onBatch: (logs: ConsoleMessage[]) => void;
  onClear: () => void;
}

interface SandpackConsoleLogEntry {
  method?: ConsoleMethod;
  data?: unknown[];
}

interface SandpackMessage {
  type?: string;
  log?: SandpackConsoleLogEntry | SandpackConsoleLogEntry[];
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toMessage(entry: SandpackConsoleLogEntry): ConsoleMessage {
  const data = Array.isArray(entry.data) ? entry.data.map(serializeConsoleArg) : [];
  return {
    id: makeId(),
    method: entry.method ?? "log",
    data,
    timestamp: Date.now(),
  };
}

export function useSandpackConsoleSync({ onBatch, onClear }: Params): void {
  const { listen } = useSandpack();
  const bufferRef = useRef<ConsoleMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBatchRef = useRef(onBatch);
  const onClearRef = useRef(onClear);

  useEffect(() => { onBatchRef.current = onBatch; }, [onBatch]);
  useEffect(() => { onClearRef.current = onClear; }, [onClear]);

  useEffect(() => {
    const flush = () => {
      timerRef.current = null;
      if (bufferRef.current.length === 0) return;
      let batch = bufferRef.current;
      bufferRef.current = [];
      if (batch.length > MAX_BATCH) {
        const dropped = batch.length - MAX_BATCH;
        batch = batch.slice(-MAX_BATCH);
        batch.unshift({
          id: makeId(),
          method: "warn",
          data: [`… truncated ${dropped} lines`],
          timestamp: Date.now(),
        });
      }
      onBatchRef.current(batch);
    };

    const scheduleFlush = () => {
      if (timerRef.current) return;
      timerRef.current = setTimeout(flush, FLUSH_DELAY_MS);
    };

    const unsubscribe = listen((rawMessage) => {
      const message = rawMessage as SandpackMessage;
      if (message.type === "start") {
        bufferRef.current = [];
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        onClearRef.current();
        return;
      }
      if (message.type !== "console" || !message.log) return;
      const entries = Array.isArray(message.log) ? message.log : [message.log];
      for (const entry of entries) bufferRef.current.push(toMessage(entry));
      scheduleFlush();
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      bufferRef.current = [];
    };
  }, [listen]);
}
