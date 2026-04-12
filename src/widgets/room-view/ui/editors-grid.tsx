"use client";
import type { ReactNode } from "react";

export function EditorsGrid({ children }: { children: ReactNode[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridTemplateRows: "repeat(2, 1fr)",
        gap: 12,
        height: "100%",
        minHeight: 0,
      }}
    >
      {children}
    </div>
  );
}
