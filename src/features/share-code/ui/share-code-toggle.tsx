"use client";
import { Share2 } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface Props {
  isSharing: boolean;
  onToggle: () => void;
}

export function ShareCodeToggle({ isSharing, onToggle }: Props) {
  return (
    <Button
      type="button"
      size="sm"
      variant={isSharing ? "default" : "outline"}
      onClick={onToggle}
    >
      <Share2 />
      {isSharing ? "Hide" : "Share"}
    </Button>
  );
}
