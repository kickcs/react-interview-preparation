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
    // Подставляем стартер нового языка только если пользователь ещё не
    // редактировал код (буфер равен стартеру текущего языка). Иначе сохраняем
    // написанное — Sandpack пересоздастся под новый шаблон с тем же кодом.
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
