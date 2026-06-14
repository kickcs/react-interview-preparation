import type { Language } from "@/shared/contracts";

export const SOLO_STARTERS: Record<Language, string> = {
  js: `// Solve the task here. Run your code with the Run button.\nconsole.log("Hello");\n`,
  ts: `// Solve the task here. Run your code with the Run button.\nconst greeting: string = "Hello";\nconsole.log(greeting);\n`,
  react: `export default function App() {\n  return <h1>Solve the task here</h1>;\n}\n`,
};
