"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface SpoilerProps {
  children: React.ReactNode;
}

export function Spoiler({ children }: SpoilerProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <button
        onClick={() => setRevealed(!revealed)}
        className="mb-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-5 py-3.5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
      >
        {revealed ? (
          <>
            <EyeOff className="h-4 w-4" />
            Скрыть ответ / Hide answer
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            Показать ответ / Show answer
          </>
        )}
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          revealed
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
