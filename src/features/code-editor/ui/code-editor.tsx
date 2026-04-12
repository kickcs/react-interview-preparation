"use client";
import { useEffect } from "react";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";
import type { Language } from "@/shared/contracts";
import { SANDPACK_TEMPLATES, SANDPACK_FILES } from "../lib/sandpack-config";

interface CodeEditorProps {
  value: string;
  language: Language;
  onChange: (value: string) => void;
}

function ChangeBridge({ onChange, file }: { onChange: (v: string) => void; file: string }) {
  const { sandpack } = useSandpack();
  const code = sandpack.files[file]?.code ?? "";
  useEffect(() => {
    onChange(code);
  }, [code, onChange]);
  return null;
}

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const template = SANDPACK_TEMPLATES[language];
  const file = SANDPACK_FILES[language];
  return (
    <SandpackProvider
      template={template}
      theme="dark"
      files={{ [file]: { code: value, active: true } }}
      options={{ recompileMode: "delayed", recompileDelay: 400 }}
    >
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1">
          <SandpackCodeEditor showTabs={false} showLineNumbers showInlineErrors closableTabs={false} />
        </div>
        <div className="max-h-[120px] border-t border-dashed border-border">
          <SandpackConsole />
        </div>
      </div>
      <ChangeBridge onChange={onChange} file={file} />
    </SandpackProvider>
  );
}
