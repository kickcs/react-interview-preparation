import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../../../src/shared/lib/ui-store";

describe("ui-store sidebar", () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarCollapsed: false });
  });

  it("defaults to expanded", () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it("toggleSidebar flips the flag", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it("setSidebarCollapsed forces a value", () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });
});
