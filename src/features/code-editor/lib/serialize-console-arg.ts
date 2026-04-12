export function serializeConsoleArg(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "function") {
    return value.toString().startsWith("function")
      ? value.toString()
      : `function ${value.name || "(anonymous)"}`;
  }
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}
