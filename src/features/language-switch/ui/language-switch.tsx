"use client";
import type { Language } from "@/shared/contracts";
import { Button } from "@/shared/ui/button";

const OPTIONS: { value: Language; label: string }[] = [
  { value: "js", label: "JS" },
  { value: "ts", label: "TS" },
  { value: "react", label: "React" },
];

interface Props {
  value: Language;
  onChange: (next: Language) => void;
}

export function LanguageSwitch({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          size="sm"
          variant={value === opt.value ? "default" : "outline"}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
