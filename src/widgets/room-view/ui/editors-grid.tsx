"use client";
import type { ReactNode } from "react";

export function EditorsGrid({ children }: { children: ReactNode[] }) {
  return (
    <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-3">
      {children}
    </div>
  );
}
