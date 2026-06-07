"use client";
import type { ReactNode } from "react";
import { Spoiler } from "@/shared/ui/spoiler";

interface Props {
  id: string;
  title: string;
  questionContent: ReactNode;
}

export function SoloQuestionPanel({ id, title, questionContent }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Вопрос
        </p>
        <h2 className="mt-1 text-base font-semibold leading-tight">{title}</h2>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="prose prose-sm prose-invert max-w-none">
          <Spoiler id={id}>{questionContent}</Spoiler>
        </div>
      </div>
    </div>
  );
}
