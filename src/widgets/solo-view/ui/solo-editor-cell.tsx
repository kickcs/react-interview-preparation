"use client";
import { CodeEditor } from "@/features/code-editor/ui/code-editor";
import { LanguageSwitch } from "@/features/language-switch/ui/language-switch";
import type { Language } from "@/shared/contracts";

interface Props {
  code: string;
  language: Language;
  onCodeChange: (code: string) => void;
  onLanguageChange: (next: Language) => void;
}

export function SoloEditorCell({
  code,
  language,
  onCodeChange,
  onLanguageChange,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-medium">Редактор</span>
        <LanguageSwitch value={language} onChange={onLanguageChange} />
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor value={code} language={language} onChange={onCodeChange} />
      </div>
    </div>
  );
}
