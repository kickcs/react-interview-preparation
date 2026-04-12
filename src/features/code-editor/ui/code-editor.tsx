"use client";
import { useEffect, useMemo, useRef } from "react";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";
import type { Language } from "@/shared/contracts";
import {
  SANDPACK_TEMPLATES,
  SANDPACK_FILES,
  SANDPACK_OPTIONS,
} from "../lib/sandpack-config";

interface CodeEditorProps {
  value: string;
  language: Language;
  onChange: (value: string) => void;
}

function ChangeBridge({
  value,
  onChange,
  file,
}: {
  value: string;
  onChange: (v: string) => void;
  file: string;
}) {
  const { sandpack } = useSandpack();
  const code = sandpack.files[file]?.code ?? "";
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (code !== value) {
      onChangeRef.current(code);
    }
  }, [code, value]);

  return null;
}

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const template = SANDPACK_TEMPLATES[language];
  const file = SANDPACK_FILES[language];
  const files = useMemo(
    () => ({ [file]: { code: value, active: true } }),
    [file, value],
  );
  return (
    <SandpackProvider
      template={template}
      theme="dark"
      files={files}
      options={SANDPACK_OPTIONS}
    >
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1">
          <SandpackCodeEditor showTabs={false} showLineNumbers showInlineErrors closableTabs={false} />
        </div>
        <div className="max-h-[120px] border-t border-dashed border-border">
          <SandpackConsole />
        </div>
      </div>
      <ChangeBridge value={value} onChange={onChange} file={file} />
    </SandpackProvider>
  );
}
