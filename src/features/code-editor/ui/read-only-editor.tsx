"use client";
import { useMemo } from "react";
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
  const file = SANDPACK_FILES[language];
  const files = useMemo(
    () => ({ [file]: { code: value, active: true } }),
    [file, value],
  );
  return (
    <SandpackProvider
      template={SANDPACK_TEMPLATES[language]}
      theme="dark"
      files={files}
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
