"use client";
interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function PeerPanelCollapse({ collapsed, onToggle }: Props) {
  return (
    <button className="room-btn" onClick={onToggle}>
      [ H {collapsed ? "SHOW" : "HIDE"} ]
    </button>
  );
}
