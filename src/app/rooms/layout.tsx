import type { ReactNode } from "react";
import "./rooms.css";

export const metadata = { title: "Rooms — live-coding" };

export default function RoomsLayout({ children }: { children: ReactNode }) {
  return <div className="rooms-scope">{children}</div>;
}
