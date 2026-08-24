import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Crosshair, Eye, PencilLine, Trash2 } from "lucide-react";
import type { Note, Vault } from "../lib/palette";
import { DISCIPLINES } from "../lib/palette";
import { parseNote } from "../lib/parse";
import { renderMarkdown } from "../lib/render";
import { highlightSource } from "../lib/highlight";
import { cn } from "../utils/cn";
import { IconBtn } from "./ui";

interface Props {
  note: Note;
  vault: Vault;
  onChange: (content: string) => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onWiki: (target: string) => void;
  onTag: (tag: string) => void;
  onHoverNode: (id: string | null) => void;
  onCenterInGraph: () => void;
  mode: "write" | "read";
  onMode: (m: "write" | "read") => void;
}

function relTime(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.round(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.round(h / 24);
  return day < 30 ? `${day}d ago` : new Date(ts).toLocaleDateString();
}

export default function Editor(props: Props) {
  const { note, vault, onChange, onRename, onDelete, onWiki, onTag, onHoverNode, onCenterInGraph, mode, onMode } = props;
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(note.title);
  const [ac, setAc] = useState<{ open: boolean; frag: string; start: number; idx: number }>({
    open: false,
    frag: "",
    start: 0,
    idx: 0,
  });

  const parsed = useMemo(() => parseNote(note.content), [note.content]);
  const resolve = useMemo(() => (t: string) => !!vault[t], [vault]);

  useEffect(() => {
    setTitleDraft(note.title);
    setRenaming(false);
  }, [note.id, note.title]);

  const candidates = useMemo(() => {
    if (!ac.open) return [];
    const frag = ac.frag.toLowerCase();
    const matches = Object.keys(vault)
      .filter((t) => t.toLowerCase().includes(frag) && t !== note.title)
      .slice(0, 7);
    const create = ac.frag.trim() && !vault[ac.frag.trim()] ? [`＋ Create “${ac.frag.trim()}”`] : [];
    return [...matches, ...create];
  }, [ac, vault, note.title]);

  const syncScroll = () => {
    if (taRef.current && preRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  const handleChange = (value: string) => {
    onChange(value);
    const ta = taRef.current;
    const caret = ta?.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const m = before.match(/\[\[([^\[\]]*)$/);
    if (m) setAc({ open: true, frag: m[1], start: caret - m[0].length, idx: 0 });
    else setAc((s) => (s.open ? { ...s, open: false } : s));
  };

  const acceptCandidate = (c: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const caret = ta.selectionStart;
    const isCreate = c.startsWith("＋");
    const title = isCreate ? c.replace(/^＋ Create “|”$/g, "") : c;
    const next = `${note.content.slice(0, ac.start)}[[${title}]]${note.content.slice(caret)}`;
    onChange(next);
    setAc((s) => ({ ...s, open: false }));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = ac.start + title.length + 4;
      ta.setSelectionRange(pos, pos);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (ac.open && candidates.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAc((s) => ({ ...s, idx: (s.idx + 1) % candidates.length }));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setAc((s) => ({ ...s, idx: (s.idx - 1 + candidates.length) % candidates.length }));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        acceptCandidate(candidates[ac.idx]);
        return;
      }
      if (e.key === "Escape") {
        setAc((s) => ({ ...s, open: false }));
        return;
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const s = ta.selectionStart;
      const en = ta.selectionEnd;
      const next = `${note.content.slice(0, s)}  ${note.content.slice(en)}`;
      onChange(next);
      requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2));
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
      e.preventDefault();
      onMode(mode === "write" ? "read" : "write");
    }
  };

  const d = DISCIPLINES[note.discipline];

  return (
    <section className="relative flex h-full min-w-0 flex-col bg-ink-900">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70"
        style={{ background: `radial-gradient(ellipse at 70% -10%, ${d.color}22, transparent 62%)` }}
      />

      <header className="relative flex items-center gap-2 border-b border-white/6 px-4 py-2.5">
        <span
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md border font-mono text-[10px] font-semibold"
          style={{ borderColor: `${d.color}55`, color: d.color, background: `${d.color}14` }}
          title={d.name}
        >
          {note.discipline}
        </span>

        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                if (titleDraft.trim() && titleDraft !== note.title) onRename(titleDraft.trim());
                setRenaming(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="w-full rounded border border-gold/40 bg-ink-950 px-1.5 py-0.5 font-display text-[16px] font-semibold text-parchment outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              title="Click to rename"
              className="group flex items-center gap-1.5 text-left"
            >
              <span className="truncate font-display text-[16px] font-semibold tracking-[-0.01em] text-parchment">
                {note.title}
              </span>
              <PencilLine size={11} className="shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
            <span>{d.flat ? "root" : note.discipline} / {d.name}</span>
            <span className="text-white/15">·</span>
            <span>{parsed.words} words</span>
            <span className="text-white/15">·</span>
            <span>{relTime(note.modified)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <div className="mr-1 flex items-center gap-0.5 rounded-lg border border-white/8 bg-ink-950/60 p-0.5">
            <button
              type="button"
              onClick={() => onMode("write")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-all duration-200",
                mode === "write" ? "bg-gold/15 text-gold" : "text-muted hover:text-parchment"
              )}
            >
              <PencilLine size={11} /> Write
            </button>
            <button
              type="button"
              onClick={() => onMode("read")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-all duration-200",
                mode === "read" ? "bg-gold/15 text-gold" : "text-muted hover:text-parchment"
              )}
            >
              <Eye size={11} /> Read
            </button>
          </div>
          <IconBtn title="Centre in graph" onClick={onCenterInGraph}>
            <Crosshair size={13} />
          </IconBtn>
          <IconBtn title="Delete note" onClick={onDelete}>
            <Trash2 size={13} />
          </IconBtn>
        </div>
      </header>

      {mode === "write" ? (
        <div className="relative min-h-0 flex-1">
          <pre
            ref={preRef}
            aria-hidden
            className="md-layer scroll-thin pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap text-parchment-dim"
          >
            {highlightSource(note.content, resolve)}
          </pre>
          <textarea
            ref={taRef}
            value={note.content}
            onChange={(e) => handleChange(e.target.value)}
            onScroll={syncScroll}
            onKeyDown={onKeyDown}
            onClick={syncScroll}
            spellCheck={false}
            className="md-layer scroll-thin absolute inset-0 resize-none overflow-auto border-0 bg-transparent text-transparent caret-gold outline-none"
          />

          {ac.open && candidates.length > 0 && (
            <div className="pointer-events-auto absolute bottom-5 left-1/2 z-30 w-[min(380px,90%)] -translate-x-1/2 anim-rise overflow-hidden rounded-xl border border-white/10 bg-ink-850/97 shadow-panel backdrop-blur-xl">
              <div className="flex items-center gap-2 border-b border-white/6 px-3 py-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold/80">link to</span>
                <span className="truncate font-mono text-[10px] text-muted">{ac.frag || "all notes"}</span>
                <span className="ml-auto font-mono text-[9px] text-muted/60">↵ insert</span>
              </div>
              <ul className="max-h-56 overflow-y-auto scroll-thin py-1">
                {candidates.map((c, i) => {
                  const isCreate = c.startsWith("＋");
                  return (
                    <li key={c}>
                      <button
                        type="button"
                        onMouseEnter={() => setAc((s) => ({ ...s, idx: i }))}
                        onClick={() => acceptCandidate(c)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] transition-colors",
                          i === ac.idx ? "bg-gold/12 text-parchment" : "text-parchment-dim"
                        )}
                      >
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", isCreate && "border border-ember/70 bg-transparent")}
                          style={isCreate ? undefined : { background: DISCIPLINES[vault[c]?.discipline ?? "9"].color }}
                        />
                        <span className="truncate">{c}</span>
                        {!isCreate && (
                          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-muted/60">
                            {DISCIPLINES[vault[c]?.discipline ?? "9"].name}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="scroll-thin relative min-h-0 flex-1 overflow-y-auto px-7 pb-40 pt-6">
          <div className="mx-auto max-w-[68ch]">
            <div className="mb-5 flex flex-wrap items-center gap-1.5 border-b border-white/6 pb-4">
              {parsed.props.aliases?.slice(1).map((a) => (
                <span key={a} className="rounded-md border border-white/8 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-muted">
                  alias: {a}
                </span>
              ))}
              {(parsed.props.tags ?? []).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTag(t.replace(/^#/, ""))}
                  className="rounded-md border border-gold/25 bg-gold/10 px-2 py-0.5 font-mono text-[10px] text-gold transition-colors hover:bg-gold/20"
                >
                  #{t}
                </button>
              ))}
            </div>
            <article className="prose-vault">{renderMarkdown(parsed.body, { onWiki, onTag, resolve })}</article>

            {parsed.links.length > 0 && (
              <div className="mt-10 border-t border-white/6 pt-4">
                <div className="mb-2 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                  <BookOpen size={11} /> Outgoing links
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.links.map((l) => {
                    const ok = !!vault[l.target];
                    return (
                      <button
                        key={l.raw}
                        type="button"
                        onMouseEnter={() => onHoverNode(l.target)}
                        onMouseLeave={() => onHoverNode(null)}
                        onClick={() => onWiki(l.target)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-[11.5px] transition-all duration-200",
                          ok
                            ? "border-white/8 bg-white/[0.03] text-parchment-dim hover:border-white/20 hover:text-parchment"
                            : "border-ember/25 bg-ember/[0.07] text-ember hover:border-ember/50"
                        )}
                      >
                        {l.alias ?? l.target}
                        {!ok && <span className="ml-1 font-mono text-[9px] opacity-70">new</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
