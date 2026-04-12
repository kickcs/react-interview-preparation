import type React from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSanitize from "rehype-sanitize";

interface Props {
  title: string;
  markdown: string;
}

export function TaskPanel({ title, markdown }: Props) {
  return (
    <div
      className="room-box"
      data-boot
      style={{ height: "100%", overflow: "auto", "--boot-delay": "80ms" } as React.CSSProperties}
    >
      <div className="room-label">TASK — {title}</div>
      <hr className="room-hr" />
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        <MDXRemote
          source={markdown}
          options={{ mdxOptions: { rehypePlugins: [rehypeSanitize] } }}
        />
      </div>
    </div>
  );
}
