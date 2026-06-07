import type { Language } from "@/shared/contracts";

export const SOLO_STARTERS: Record<Language, string> = {
  js: `// Решайте задачу здесь. Запустите код кнопкой Run.\nconsole.log("Hello");\n`,
  ts: `// Решайте задачу здесь. Запустите код кнопкой Run.\nconst greeting: string = "Hello";\nconsole.log(greeting);\n`,
  react: `export default function App() {\n  return <h1>Решайте задачу здесь</h1>;\n}\n`,
};
