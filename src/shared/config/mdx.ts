import rehypePrettyCode from "rehype-pretty-code";
import type { Pluggable } from "unified";

export const rehypePlugins: Pluggable[] = [
  [
    rehypePrettyCode,
    {
      theme: "github-dark-default",
      keepBackground: true,
    },
  ],
];
