"use client";
import { useState } from "react";
import { SandpackConsole, SandpackPreview } from "@codesandbox/sandpack-react";
import type { Language } from "@/shared/contracts";
import { cn } from "@/shared/lib/utils";

interface Props {
  language: Language;
}

type Tab = "console" | "preview";

export function OutputPanel({ language }: Props) {
  const showPreviewTab = language === "react";
  const [tab, setTab] = useState<Tab>("console");
  const activeTab: Tab = showPreviewTab ? tab : "console";

  return (
    <div className="flex min-h-[200px] max-h-[280px] flex-col border-t border-dashed border-border">
      <div className="flex items-center gap-1 border-b border-border/60 bg-muted/20 px-2 py-1 text-xs">
        <TabButton active={activeTab === "console"} onClick={() => setTab("console")}>
          Console
        </TabButton>
        {showPreviewTab && (
          <TabButton active={activeTab === "preview"} onClick={() => setTab("preview")}>
            Preview
          </TabButton>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "console" ? (
          <SandpackConsole standalone />
        ) : (
          <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-2 py-0.5 font-medium transition-colors",
        active ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
