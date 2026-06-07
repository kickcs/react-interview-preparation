"use client";
import { useEffect, useMemo, useRef } from "react";
import {
  SandpackProvider,
  SandpackCodeEditor,
  useSandpack,
} from "@codesandbox/sandpack-react";
import type { ConsoleMessage, Language } from "@/shared/contracts";
import {
  SANDPACK_TEMPLATES,
  SANDPACK_FILES,
  SANDPACK_OPTIONS,
} from "../lib/sandpack-config";
import { OutputPanel } from "./output-panel";
import { useSandpackConsoleSync } from "./use-sandpack-console-sync";

interface CodeEditorProps {
  value: string;
  language: Language;
  onChange: (value: string) => void;
  onConsoleBatch?: (logs: ConsoleMessage[]) => void;
  onConsoleClear?: () => void;
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

function ConsoleBridge({
  onBatch,
  onClear,
}: {
  onBatch: (logs: ConsoleMessage[]) => void;
  onClear: () => void;
}) {
  useSandpackConsoleSync({ onBatch, onClear });
  return null;
}

export function CodeEditor({
  value,
  language,
  onChange,
  onConsoleBatch,
  onConsoleClear,
}: CodeEditorProps) {
  const template = SANDPACK_TEMPLATES[language];
  const file = SANDPACK_FILES[language];
  const files = useMemo(
    () => ({ [file]: { code: value, active: true } }),
    [file, value],
  );
  const syncEnabled = Boolean(onConsoleBatch && onConsoleClear);

  return (
    <SandpackProvider
      key={language}
      template={template}
      theme="dark"
      files={files}
      options={SANDPACK_OPTIONS}
    >
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1">
          <SandpackCodeEditor
            showTabs={false}
            showLineNumbers
            showInlineErrors
            showRunButton
            closableTabs={false}
          />
        </div>
        <OutputPanel language={language} />
      </div>
      <ChangeBridge value={value} onChange={onChange} file={file} />
      {syncEnabled && onConsoleBatch && onConsoleClear && (
        <ConsoleBridge onBatch={onConsoleBatch} onClear={onConsoleClear} />
      )}
    </SandpackProvider>
  );
}
