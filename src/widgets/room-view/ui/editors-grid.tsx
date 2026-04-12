"use client";
import type { ReactNode } from "react";
import { gridClassForCount } from "../lib/grid-class-for-count";

interface Props {
  count: number;
  children: ReactNode[];
}

export function EditorsGrid({ count, children }: Props) {
  return <div className={gridClassForCount(count)}>{children}</div>;
}
