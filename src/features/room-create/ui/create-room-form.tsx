"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TaskSource } from "@/shared/contracts";
import { isValidNickname } from "@/entities/room/lib/is-valid-nickname";
import { WS_BASE_URL } from "@/shared/config/ws";

interface CatalogOption {
  category: string;
  slug: string;
  title: string;
}

interface CreateRoomFormProps {
  catalog: CatalogOption[];
}

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
    if (!isValidNickname(nickname)) {
      setError("Никнейм 1–20 символов без < >");
      return;
    }
    let taskSource: TaskSource;
    if (mode === "catalog") {
      const item = catalog.find((c) => c.slug === selected);
      if (!item) {
        setError("Выбери задачу");
        return;
      }
      taskSource = { kind: "catalog", category: item.category, slug: item.slug };
    } else {
      if (!customTitle.trim() || !customMd.trim()) {
        setError("Заполни заголовок и условие");
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
          setError(`Ошибка: ${body.error ?? res.status}`);
          return;
        }
        const { id } = (await res.json()) as { id: string };
        sessionStorage.setItem(`rooms.nickname.${id}`, nickname.trim());
        router.push(`/rooms/${id}`);
      } catch {
        setError("Сервер недоступен");
      }
    });
  };

  return (
    <div className="room-box" style={{ maxWidth: 520 }}>
      <div className="room-label">&gt; task source</div>
      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
        <button
          className="room-btn"
          data-variant={mode === "catalog" ? "primary" : undefined}
          onClick={() => setMode("catalog")}
        >
          ( {mode === "catalog" ? "◉" : " "} ) catalog
        </button>
        <button
          className="room-btn"
          data-variant={mode === "custom" ? "primary" : undefined}
          onClick={() => setMode("custom")}
        >
          ( {mode === "custom" ? "◉" : " "} ) custom
        </button>
      </div>

      <hr className="room-hr" />

      {mode === "catalog" ? (
        <>
          <div className="room-label">&gt; choose task</div>
          <select
            className="room-input"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ marginTop: 6 }}
          >
            {catalog.map((c) => (
              <option key={`${c.category}/${c.slug}`} value={c.slug}>
                {c.category} / {c.title}
              </option>
            ))}
          </select>
        </>
      ) : (
        <>
          <div className="room-label">&gt; title</div>
          <input
            className="room-input"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            style={{ marginTop: 6 }}
          />
          <div className="room-label" style={{ marginTop: 12 }}>&gt; markdown</div>
          <textarea
            className="room-input"
            rows={8}
            value={customMd}
            onChange={(e) => setCustomMd(e.target.value)}
            style={{ marginTop: 6, resize: "vertical" }}
          />
        </>
      )}

      <hr className="room-hr" />

      <div className="room-label">&gt; your nickname</div>
      <input
        className="room-input"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={20}
        style={{ marginTop: 6 }}
        placeholder="alice"
      />

      {error && (
        <div style={{ color: "var(--room-crimson)", marginTop: 12, fontSize: 12 }}>{error}</div>
      )}

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button className="room-btn" data-variant="primary" disabled={pending} onClick={submit}>
          [ {pending ? "CREATING…" : "CREATE ROOM"} ]
        </button>
      </div>
    </div>
  );
}
