const SCRIPT_RE = /<script\b[\s\S]*?<\/script\s*>/gi;
const EVENT_HANDLER_RE = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const IFRAME_RE = /<iframe\b[\s\S]*?<\/iframe\s*>/gi;
const STYLE_RE = /<style\b[\s\S]*?<\/style\s*>/gi;

export function sanitizeMarkdown(md: string): string {
  return md
    .replace(SCRIPT_RE, "")
    .replace(IFRAME_RE, "")
    .replace(STYLE_RE, "")
    .replace(EVENT_HANDLER_RE, "");
}
