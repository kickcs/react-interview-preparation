import { describe, it, expect, beforeEach } from "vitest";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  useUIStore,
  selectSidebarCollapsed,
  partializeUIState,
  migrateUIState,
} from "../../../src/shared/lib/ui-store";

describe("ui-store sidebar", () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarCollapsed: false, roomCollapsed: false });
  });

  it("defaults to expanded", () => {
    expect(selectSidebarCollapsed(useUIStore.getState())).toBe(false);
  });

  it("toggleSidebar flips the flag", () => {
    useUIStore.getState().toggleSidebar();
    expect(selectSidebarCollapsed(useUIStore.getState())).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(selectSidebarCollapsed(useUIStore.getState())).toBe(false);
  });

  it("collapses while a room holds it collapsed", () => {
    useUIStore.getState().setRoomCollapsed(true);
    expect(selectSidebarCollapsed(useUIStore.getState())).toBe(true);
  });

  it("expands again once the room releases it", () => {
    useUIStore.getState().setRoomCollapsed(true);
    useUIStore.getState().setRoomCollapsed(false);
    expect(selectSidebarCollapsed(useUIStore.getState())).toBe(false);
  });

  it("keeps a manual collapse after the room releases it", () => {
    useUIStore.getState().toggleSidebar();
    useUIStore.getState().setRoomCollapsed(true);
    useUIStore.getState().setRoomCollapsed(false);
    expect(selectSidebarCollapsed(useUIStore.getState())).toBe(true);
  });

  it("toggling inside a room expands and releases the room hold", () => {
    useUIStore.getState().setRoomCollapsed(true);
    useUIStore.getState().toggleSidebar();
    expect(selectSidebarCollapsed(useUIStore.getState())).toBe(false);
    expect(useUIStore.getState().roomCollapsed).toBe(false);
  });
});

describe("partializeUIState", () => {
  it("never persists the room-scoped collapse", () => {
    const persisted = partializeUIState({
      ...useUIStore.getState(),
      sidebarCollapsed: false,
      roomCollapsed: true,
    });
    expect(persisted).not.toHaveProperty("roomCollapsed");
    expect(persisted.sidebarCollapsed).toBe(false);
  });

  it("persists the manual collapse preference", () => {
    const persisted = partializeUIState({
      ...useUIStore.getState(),
      sidebarCollapsed: true,
      roomCollapsed: false,
    });
    expect(persisted.sidebarCollapsed).toBe(true);
  });
});

describe("migrateUIState", () => {
  it("clears a v0 sidebar collapse that a room page left behind", () => {
    const migrated = migrateUIState(
      { sidebarCollapsed: true, allAnswersRevealed: true },
      0
    );
    expect(migrated).toEqual({
      sidebarCollapsed: false,
      allAnswersRevealed: true,
    });
  });

  it("keeps the rest of the persisted state intact", () => {
    const migrated = migrateUIState(
      { sidebarCollapsed: true, collapsedCategories: { hooks: true } },
      0
    );
    expect(migrated).toMatchObject({ collapsedCategories: { hooks: true } });
  });

  it("leaves current-version state untouched", () => {
    const persisted = { sidebarCollapsed: true };
    expect(migrateUIState(persisted, 1)).toBe(persisted);
  });

  it("passes through a missing or malformed payload", () => {
    expect(migrateUIState(undefined, 0)).toBeUndefined();
    expect(migrateUIState(null, 0)).toBeNull();
  });
});

/**
 * Guards the user-visible half of the fix: shipping the code is not enough if
 * the stale flag already sitting in a visitor's localStorage keeps the sidebar
 * hidden. Rehydration has to clear it.
 */
describe("persisted rehydration", () => {
  interface PersistedShape {
    sidebarCollapsed: boolean;
    allAnswersRevealed: boolean;
  }

  function storeFromPersisted(raw: string) {
    const map = new Map([["ui-store", raw]]);
    return create<PersistedShape>()(
      persist(
        (): PersistedShape => ({
          sidebarCollapsed: false,
          allAnswersRevealed: false,
        }),
        {
          name: "ui-store",
          version: 1,
          migrate: migrateUIState,
          storage: createJSONStorage(() => ({
            getItem: (k) => map.get(k) ?? null,
            setItem: (k, v) => void map.set(k, v),
            removeItem: (k) => void map.delete(k),
          })),
        }
      )
    );
  }

  it("expands a sidebar left collapsed by the old room behaviour", () => {
    const store = storeFromPersisted(
      JSON.stringify({ state: { sidebarCollapsed: true }, version: 0 })
    );
    expect(store.getState().sidebarCollapsed).toBe(false);
  });

  it("keeps unrelated persisted state through the migration", () => {
    const store = storeFromPersisted(
      JSON.stringify({
        state: { sidebarCollapsed: true, allAnswersRevealed: true },
        version: 0,
      })
    );
    expect(store.getState().allAnswersRevealed).toBe(true);
  });

  it("honours a collapse stored after the fix shipped", () => {
    const store = storeFromPersisted(
      JSON.stringify({ state: { sidebarCollapsed: true }, version: 1 })
    );
    expect(store.getState().sidebarCollapsed).toBe(true);
  });
});
