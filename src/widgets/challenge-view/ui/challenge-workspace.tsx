"use client";
import { useState, type ReactNode } from "react";
import { Code2 } from "lucide-react";
import type { ChallengeStarter } from "@/entities/challenge";
import { ChallengeSoloView } from "./challenge-solo-view";

interface Props {
  title: string;
  /** Regular page view (description + navigation), server-rendered. */
  reading: ReactNode;
  /** Task description for solo mode (same MDX, without navigation). */
  soloDescription: ReactNode;
  /** Starter from the task; null — the "Solve in editor" button is not shown. */
  starter: ChallengeStarter | null;
}

/**
 * Toggles the task page between reading mode and fullscreen solo mode on the
 * same URL. The "Solve in editor" button appears only if the task has
 * recognized starter code.
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
          Solve in editor
        </button>
      )}
      {reading}
    </article>
  );
}
