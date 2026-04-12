const BASE = "grid h-full min-h-0 gap-3";

export function gridClassForCount(count: number): string {
  if (count <= 1) return `${BASE} grid-cols-1 grid-rows-1`;
  if (count === 2) return `${BASE} grid-cols-2 grid-rows-1`;
  if (count === 3) return `${BASE} grid-cols-2 grid-rows-2 [&>*:first-child]:col-span-2`;
  return `${BASE} grid-cols-2 grid-rows-2`;
}
