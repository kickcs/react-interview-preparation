import { Badge } from "@/shared/ui/badge";

interface AnswerProps {
  lang: "en" | "ru";
  children: React.ReactNode;
}

const langConfig = {
  en: {
    label: "EN",
    sublabel: "English",
    badgeClassName: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  ru: {
    label: "RU",
    sublabel: "Русский",
    badgeClassName: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  },
} as const;

export function Answer({ lang, children }: AnswerProps) {
  const config = langConfig[lang];

  return (
    <div className="rounded-lg border border-border bg-card p-5 md:p-6">
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="outline" className={config.badgeClassName}>
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{config.sublabel}</span>
      </div>
      <div className="prose dark:prose-invert prose-sm max-w-none">{children}</div>
    </div>
  );
}
