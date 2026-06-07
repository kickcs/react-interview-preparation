import type { Language } from "@/shared/contracts";

export interface ChallengeStarter {
  code: string;
  language: Language;
}

const FENCE_LANG_TO_LANGUAGE: Record<string, Language> = {
  js: "js",
  javascript: "js",
  ts: "ts",
  typescript: "ts",
  jsx: "react",
  tsx: "react",
};

const STARTER_BLOCK = /<StarterCode>([\s\S]*?)<\/StarterCode>/;
const FENCE = /```([\w-]*)\r?\n([\s\S]*?)```/;

/**
 * Достаёт стартовый код и его язык из первого `<StarterCode>` блока в сыром MDX
 * задачи. Язык берётся из инфостроки fenced-блока (```js / ```ts / ```jsx) и
 * маппится в редакторный `Language`. Возвращает null, если блока нет или язык
 * неизвестен — вызывающий код в этом случае не показывает кнопку редактора.
 */
export function extractStarter(content: string): ChallengeStarter | null {
  const block = STARTER_BLOCK.exec(content);
  if (!block) return null;

  const fence = FENCE.exec(block[1]);
  if (!fence) return null;

  const language = FENCE_LANG_TO_LANGUAGE[fence[1].toLowerCase()];
  if (!language) return null;

  return { code: fence[2].replace(/\s+$/, "") + "\n", language };
}
