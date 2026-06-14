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
 * Extracts starter code and its language from the first `<StarterCode>` block
 * in raw MDX. The language is taken from the fenced-block info string
 * (```js / ```ts / ```jsx) and mapped to the editor `Language`. Returns null
 * if no block is found or the language is unknown — in that case the caller
 * hides the editor button.
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
