"use client";
import { useState, type ReactNode } from "react";
import type { Language } from "@/shared/contracts";
import { SOLO_STARTERS } from "../lib/starters";
import { SoloQuestionPanel } from "./solo-question-panel";
import { SoloEditorCell } from "./solo-editor-cell";

interface Props {
  id: string;
  title: string;
  questionContent: ReactNode;
}

export function SoloView({ id, title, questionContent }: Props) {
  const [language, setLanguage] = useState<Language>("react");
  const [code, setCode] = useState<string>(SOLO_STARTERS.react);

  const handleLanguageChange = (next: Language) => {
    setLanguage(next);
    // Substitute the new language's starter only if the user hasn't edited the
    // code yet (the buffer equals the current language's starter). Otherwise
    // keep what was written — Sandpack will recreate itself for the new
    // template with the same code.
    if (code === SOLO_STARTERS[language]) {
      setCode(SOLO_STARTERS[next]);
    }
  };

  return (
    <main className="flex h-screen flex-col gap-3 p-3 md:p-4">
      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(320px,38%)_1fr]">
        <SoloQuestionPanel
          id={id}
          title={title}
          questionContent={questionContent}
        />
        <SoloEditorCell
          code={code}
          language={language}
          onCodeChange={setCode}
          onLanguageChange={handleLanguageChange}
        />
      </div>
    </main>
  );
}
