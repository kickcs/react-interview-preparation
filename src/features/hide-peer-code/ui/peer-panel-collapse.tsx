"use client";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function PeerPanelCollapse({ collapsed, onToggle }: Props) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label={collapsed ? "Показать код" : "Скрыть код"}
      onClick={onToggle}
    >
      {collapsed ? <Eye /> : <EyeOff />}
    </Button>
  );
}
