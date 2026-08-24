import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, FilePlus2, Search, Waypoints } from "lucide-react";
import type { Vault } from "../lib/palette";
import { DISCIPLINES } from "../lib/palette";
import { parseNote } from "../lib/parse";

interface Props {
  open: boolean;
  vault: Vault;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: (title: string) => void;
  onAction: (a: "fit" | "toggleGraph" | "reheat" | "toggleInspector") => void;
}

export default function CommandPalette({ open, vault, onClose, onSelect, onNew, onAction }: Props) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    const notes = Object.values(vault)
      .filter((n) => !query || n.title.toLowerCase().includes(query) || parseNote(n.content).tags.some((t) => t.includes(query)))
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 9)
      .map((n) => ({
        kind: "note" as const,
        id: n.id,
        label: n.title,
        meta: DISCIPLINES[n.discipline].name,
        color: DISCIPLINES[n.discipline].color,
      }));

    const actions = [
      { kind: "action" as const, id: "fit", label: "Fit graph to view", meta: "view", color: "#e3b062" },
      { kind: "action" as const, id: "toggleGraph", label: "Toggle immersive graph", meta: "view", color: "#e3b062" },
      { kind: "action" as const, id: "reheat", label: "Reheat force simulation", meta: "physics", color: "#4fd1c5" },
      { kind: "action" as const, id: "toggleInspector", label: "Toggle inspector", meta: "view", color: "#e3b062" },
    ].filter((a) => !query || a.label.toLowerCase().includes(query));

    const create = query && !vault[q.trim()] ? [{ kind: "create" as const, id: q.trim(), label: `Create “${q.trim()}”`, meta: "new note", color: "#ff8f6b" }] : [];
    return [...notes, ...actions, ...create];
  }, [q, vault]);

  if (!open) return null;

  const run = (i: number) => {
    const it = items[i];
    if (!it) return;
    if (it.kind === "note") onSelect(it.id);
    else if (it.kind === "create") onNew(it.id);
    else onAction(it.id as "fit" | "toggleGraph" | "reheat" | "toggleInspector");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/70 pt-[14vh] backdrop-blur-[3px]" onClick={onClose}>
      <div
        className="w-[min(560px,92vw)] anim-rise overflow-hidden rounded-2xl border border-white/12 bg-ink-900/97 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-white/8 px-4 py-3">
          <Search size={14} className="text-gold" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => (i + 1) % Math.max(1, items.length));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => (i - 1 + items.length) % Math.max(1, items.length));
              }
              if (e.key === "Enter") {
                e.preventDefault();
                run(idx);
              }
              if (e.key === "Escape") onClose();
            }}
            placeholder="Search notes, tags and commands…"
            className="flex-1 bg-transparent font-display text-[16px] text-parchment outline-none placeholder:text-muted/60"
          />
          <kbd className="rounded border border-white/12 px-1.5 py-0.5 font-mono text-[9px] text-muted">esc</kbd>
        </div>
        <ul className="max-h-[46vh] overflow-y-auto scroll-thin py-1.5">
          {items.length === 0 && <li className="px-4 py-6 text-center text-[12.5px] text-muted">No matches in the vault.</li>}
          {items.map((it, i) => (
            <li key={`${it.kind}-${it.id}`}>
              <button
                type="button"
                onMouseEnter={() => setIdx(i)}
                onClick={() => run(i)}
                className={`flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors ${
                  i === idx ? "bg-gold/12" : ""
                }`}
              >
                {it.kind === "action" ? (
                  <Waypoints size={12} className="shrink-0 text-gold/70" />
                ) : it.kind === "create" ? (
                  <FilePlus2 size={12} className="shrink-0 text-ember" />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: it.color, boxShadow: `0 0 8px ${it.color}` }} />
                )}
                <span className="truncate text-[13px] text-parchment-dim">{it.label}</span>
                <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-muted/70">{it.meta}</span>
                {i === idx && <CornerDownLeft size={11} className="shrink-0 text-gold/70" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
