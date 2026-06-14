"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  NICKNAME_MAX_LEN,
  ROOM_ERROR_LABELS,
  validateNickname,
  type TaskSource,
} from "@/shared/contracts";
import { WS_BASE_URL } from "@/shared/config/ws";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { FieldLabel } from "@/shared/ui/field-label";

interface CatalogOption {
  category: string;
  slug: string;
  title: string;
}

interface CreateRoomFormProps {
  catalog: CatalogOption[];
}

const selectClasses =
  "h-9 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 pr-8 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30";

export function CreateRoomForm({ catalog }: CreateRoomFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"catalog" | "custom">("catalog");
  const [nickname, setNickname] = useState("");
  const [selected, setSelected] = useState(catalog[0]?.slug ?? "");
  const [customTitle, setCustomTitle] = useState("");
  const [customMd, setCustomMd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setError(null);
    const nickCheck = validateNickname(nickname);
    if (!nickCheck.ok) {
      setError(ROOM_ERROR_LABELS.NICKNAME_INVALID);
      return;
    }
    let taskSource: TaskSource;
    if (mode === "catalog") {
      const item = catalog.find((c) => c.slug === selected);
      if (!item) {
        setError("Pick a task");
        return;
      }
      taskSource = { kind: "catalog", category: item.category, slug: item.slug };
    } else {
      if (!customTitle.trim() || !customMd.trim()) {
        setError("Fill in the title and description");
        return;
      }
      taskSource = { kind: "custom", title: customTitle.trim(), markdown: customMd };
    }

    start(async () => {
      try {
        const res = await fetch(`${WS_BASE_URL}/api/rooms`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ taskSource }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(`Error: ${body.error ?? res.status}`);
          return;
        }
        const { id } = (await res.json()) as { id: string };
        sessionStorage.setItem(`rooms.nickname.${id}`, nickCheck.value);
        router.push(`/rooms/${id}`);
      } catch {
        setError("Server unavailable");
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div>
        <FieldLabel>Task source</FieldLabel>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === "catalog" ? "default" : "outline"}
            onClick={() => setMode("catalog")}
          >
            Catalog
          </Button>
          <Button
            type="button"
            variant={mode === "custom" ? "default" : "outline"}
            onClick={() => setMode("custom")}
          >
            Custom
          </Button>
        </div>
      </div>

      <div className="my-5 border-t border-border" />

      {mode === "catalog" ? (
        <div className="space-y-2">
          <FieldLabel htmlFor="room-task">Task</FieldLabel>
          <select
            id="room-task"
            className={selectClasses}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {catalog.map((c) => (
              <option key={`${c.category}/${c.slug}`} value={c.slug}>
                {c.category} / {c.title}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="room-title">Title</FieldLabel>
            <Input
              id="room-title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Throttle hook"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="room-md">Description (Markdown)</FieldLabel>
            <Textarea
              id="room-md"
              rows={8}
              value={customMd}
              onChange={(e) => setCustomMd(e.target.value)}
              className="font-mono leading-relaxed resize-y"
              placeholder="## Task..."
            />
          </div>
        </div>
      )}

      <div className="my-5 border-t border-border" />

      <div className="space-y-2">
        <FieldLabel htmlFor="room-nickname">Your nickname</FieldLabel>
        <Input
          id="room-nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={NICKNAME_MAX_LEN}
          placeholder="alice"
        />
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6">
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={pending}
          onClick={submit}
        >
          {pending ? "Creating…" : "Create room"}
        </Button>
      </div>
    </div>
  );
}
