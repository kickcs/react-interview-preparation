"use client";
import {
  SandpackProvider,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import type { Language } from "@/shared/contracts";
import { SANDPACK_TEMPLATES, SANDPACK_FILES } from "../lib/sandpack-config";

interface ReadOnlyEditorProps {
  value: string;
  language: Language;
}

export function ReadOnlyEditor({ value, language }: ReadOnlyEditorProps) {
  return (
    <SandpackProvider
      template={SANDPACK_TEMPLATES[language]}
      theme="dark"
      files={{ [SANDPACK_FILES[language]]: { code: value, active: true } }}
    >
      <SandpackCodeEditor
        readOnly
        showTabs={false}
        showLineNumbers
        closableTabs={false}
      />
    </SandpackProvider>
  );
}
