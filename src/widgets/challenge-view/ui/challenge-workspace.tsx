"use client";
import { useState, type ReactNode } from "react";
import { Code2 } from "lucide-react";
import type { ChallengeStarter } from "@/entities/challenge";
import { ChallengeSoloView } from "./challenge-solo-view";

interface Props {
  title: string;
  /** Обычный вид страницы (описание + навигация), отрендерен на сервере. */
  reading: ReactNode;
  /** Описание задачи для соло-режима (то же MDX, без навигации). */
  soloDescription: ReactNode;
  /** Стартер из задачи; null — кнопка решения не показывается. */
  starter: ChallengeStarter | null;
}

/**
 * Переключает страницу задачи между режимом чтения и полноэкранным соло-режимом
 * на том же URL. Кнопка «Решать в редакторе» появляется только если у задачи
 * есть распознанный стартовый код.
 */
export function ChallengeWorkspace({
  title,
  reading,
  soloDescription,
  starter,
}: Props) {
  const [solo, setSolo] = useState(false);

  if (solo && starter) {
    return (
      <ChallengeSoloView
        title={title}
        description={soloDescription}
        starter={starter}
        onExit={() => setSolo(false)}
      />
    );
  }

  return (
    <article className="mx-auto max-w-[900px] px-4 py-6 md:px-12 md:py-10">
      {starter && (
        <button
          type="button"
          onClick={() => setSolo(true)}
          className="mb-8 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium transition-colors hover:border-muted-foreground/50 hover:text-foreground"
        >
          <Code2 className="h-4 w-4" />
          Решать в редакторе
        </button>
      )}
      {reading}
    </article>
  );
}
