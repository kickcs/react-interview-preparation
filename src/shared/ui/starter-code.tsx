"use client";

import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface StarterCodeProps {
  children: React.ReactNode;
}

export function StarterCode({ children }: StarterCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const codeEl = containerRef.current?.querySelector("pre code");
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="my-6" ref={containerRef}>
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-border bg-emerald-500/10 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Стартовый код
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          aria-label="Копировать код"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <div className="[&>pre]:!mt-0 [&>pre]:!rounded-t-none">{children}</div>
    </div>
  );
}
