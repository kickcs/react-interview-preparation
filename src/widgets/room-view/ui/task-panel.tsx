"use client";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

interface Props {
  title: string;
  markdown: string;
}

function TaskPanelComponent({ title, markdown }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Задача
        </p>
        <h2 className="mt-1 text-base font-semibold leading-tight">{title}</h2>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export const TaskPanel = memo(TaskPanelComponent);
