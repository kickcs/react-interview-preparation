"use client";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useUIStore } from "@/shared/lib/ui-store";

interface Props {
  variant?: "ghost" | "outline";
}

export function SidebarToggleButton({ variant = "ghost" }: Props) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <Button
      type="button"
      size="icon"
      variant={variant}
      onClick={toggle}
      aria-label={collapsed ? "Развернуть боковую панель" : "Свернуть боковую панель"}
    >
      <Icon />
    </Button>
  );
}
