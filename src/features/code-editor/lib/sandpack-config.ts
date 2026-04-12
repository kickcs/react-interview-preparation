import type { Language } from "@/shared/contracts";

export const SANDPACK_TEMPLATES: Record<Language, "vanilla-ts" | "react-ts"> = {
  js: "vanilla-ts",
  ts: "vanilla-ts",
  react: "react-ts",
};

export const SANDPACK_FILES: Record<Language, string> = {
  js: "/index.ts",
  ts: "/index.ts",
  react: "/App.tsx",
};

export const SANDPACK_OPTIONS = {
  autorun: false,
  autoReload: false,
} as const;
