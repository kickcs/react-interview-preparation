"use client";
interface Props {
  isSharing: boolean;
  onToggle: () => void;
}

export function ShareCodeToggle({ isSharing, onToggle }: Props) {
  return (
    <button
      className="room-btn"
      data-variant={isSharing ? "primary" : undefined}
      onClick={onToggle}
    >
      [ S {isSharing ? "UNSHARE" : "SHARE"} ]
    </button>
  );
}
