"use client";
import { useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { CodeEditor } from "@/features/code-editor/ui/code-editor";
import type { ChallengeStarter } from "@/entities/challenge";

interface Props {
  title: string;
  description: ReactNode;
  starter: ChallengeStarter;
  onExit: () => void;
}

/**
 * Fullscreen mode for solving a live-coding task: description on the left
 * (with hints and solution under spoilers from the source MDX), editor with
 * console on the right. Language and starter code are fixed by the task —
 * no language switcher.
 */
export function ChallengeSoloView({ title, description, starter, onExit }: Props) {
  const [code, setCode] = useState<string>(starter.code);

  return (
    <main className="flex h-screen flex-col gap-3 p-3 md:p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-muted-foreground/50 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to description
        </button>
        <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(320px,38%)_1fr]">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Task
            </p>
            <h2 className="mt-1 text-base font-semibold leading-tight">{title}</h2>
          </div>
          <div className="flex-1 overflow-auto px-4 py-4">
            <div className="prose prose-sm prose-invert max-w-none">
              {description}
            </div>
          </div>
        </div>

        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-3 py-2">
            <span className="text-sm font-medium">Editor</span>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor
              value={code}
              language={starter.language}
              onChange={setCode}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
