import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Columns2, Focus, Orbit, PanelLeft, PanelRight, Search, Save, Square } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import GraphPanel from "./components/GraphPanel";
import Inspector from "./components/Inspector";
import StatusBar from "./components/StatusBar";
import CommandPalette from "./components/CommandPalette";
import type { GraphHandle, Physics } from "./components/GraphView";
import { buildGraph, neighborhood, subgraph, vaultStats } from "./lib/graph";
import { DISCIPLINES, type DisciplineId, type Note, type Vault } from "./lib/palette";
import { buildSeedVault, NOTE_TEMPLATE } from "./lib/vault";
import { parseNote } from "./lib/parse";
import { AlchemyMark, IconBtn } from "./components/ui";
import { cn } from "./utils/cn";

const STORAGE_KEY = "summa-alchemica.vault.v1";
type Layout = "split" | "graph" | "focus";

function loadVault(): Vault {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Vault;
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return buildSeedVault();
}

function uniqueTitle(vault: Vault, base: string): string {
  if (!vault[base]) return base;
  let i = 2;
  while (vault[`${base} ${i}`]) i += 1;
  return `${base} ${i}`;
}

export default function App() {
  const [vault, setVault] = useState<Vault>(loadVault);
  const [graphVault, setGraphVault] = useState<Vault>(vault);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const v = loadVault();
    return v["Entropy"] ? "Entropy" : (Object.keys(v)[0] ?? null);
  });
  const [mode, setMode] = useState<"write" | "read">("write");
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>("split");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [splitPct, setSplitPct] = useState(46);
  const [dirty, setDirty] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; tone: "gold" | "ember" | "verdigris" }[]>([]);
  const [hoverUi, setHoverUi] = useState<string | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, k: 0.9 });
  const [activity, setActivity] = useState({ alpha: 0, fps: 60 });

  const [physics, setPhysics] = useState<Physics>({ center: 0.6, repel: 220, linkForce: 0.75, linkDistance: 82, cluster: 0.7 });
  const [showLabels, setShowLabels] = useState(true);
  const [particles, setParticles] = useState(true);
  const [cluster, setCluster] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showOrphans, setShowOrphans] = useState(true);
  const [showGhosts, setShowGhosts] = useState(true);
  const [localMode, setLocalMode] = useState(false);
  const [localDepth, setLocalDepth] = useState(1);
  const [activeDisciplines, setActiveDisciplines] = useState<Set<DisciplineId>>(
    () => new Set(Object.keys(DISCIPLINES) as DisciplineId[])
  );

  const graphHandle = useRef<GraphHandle | null>(null);
  const spawnRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const toastId = useRef(0);

  /* ── toasts ─────────────────────────────────────────────────────────── */
  const toast = useCallback((text: string, tone: "gold" | "ember" | "verdigris" = "gold") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  /* ── debounce: files → graph, and persistence ───────────────────────── */
  useEffect(() => {
    const t = window.setTimeout(() => setGraphVault(vault), 110);
    return () => window.clearTimeout(t);
  }, [vault]);

  useEffect(() => {
    setDirty(true);
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
        setDirty(false);
      } catch {
        /* quota */
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [vault]);

  /* ── graph model ────────────────────────────────────────────────────── */
  const fullGraph = useMemo(
    () =>
      buildGraph(graphVault, {
        showTags,
        showOrphans,
        showGhosts,
        query: query.trim(),
        active: activeDisciplines,
      }),
    [graphVault, showTags, showOrphans, showGhosts, query, activeDisciplines]
  );

  const model = useMemo(
    () => (localMode && activeId && fullGraph.byId.has(activeId) ? subgraph(fullGraph, activeId, localDepth) : fullGraph),
    [fullGraph, localMode, activeId, localDepth]
  );

  const stats = useMemo(() => vaultStats(vault, fullGraph), [vault, fullGraph]);

  const highlightIds = useMemo(() => {
    if (hoverUi) return neighborhood(fullGraph, hoverUi, 1);
    if (tagFilter) {
      const set = new Set<string>();
      for (const id of Object.keys(graphVault)) {
        if (parseNote(graphVault[id].content).tags.some((t) => t === tagFilter || t.startsWith(`${tagFilter}/`))) set.add(id);
      }
      return set;
    }
    return null;
  }, [hoverUi, tagFilter, graphVault, fullGraph]);

  const activeNote: Note | null = activeId ? vault[activeId] ?? null : null;

  /* ── mutations ──────────────────────────────────────────────────────── */
  const updateContent = useCallback(
    (content: string) => {
      if (!activeId) return;
      const id = activeId;
      setVault((v) => (v[id] ? { ...v, [id]: { ...v[id], content, modified: Date.now() } } : v));
    },
    [activeId]
  );

  const createNote = useCallback(
    (baseTitle?: string, at?: { x: number; y: number }, discipline: DisciplineId = "9") => {
      const title = uniqueTitle(vault, baseTitle?.trim() || "Untitled");
      const now = Date.now();
      const content = `---\naliases: ["${title}"]\ntags: []\n---\n\n${NOTE_TEMPLATE}`;
      const note: Note = { id: title, title, discipline, content, created: now, modified: now };
      if (at) spawnRef.current.set(title, at);
      setVault((v) => ({ ...v, [title]: note }));
      setActiveId(title);
      setMode("write");
      toast(`Forged “${title}”`, "gold");
      window.setTimeout(() => graphHandle.current?.reheat(0.6), 60);
      return title;
    },
    [vault, toast]
  );

  const deleteNote = useCallback(
    (id: string) => {
      setVault((v) => {
        const next = { ...v };
        delete next[id];
        return next;
      });
      setActiveId((cur) => {
        if (cur !== id) return cur;
        const rest = Object.keys(vault).filter((k) => k !== id);
        return rest[0] ?? null;
      });
      toast(`Dissolved “${id}”`, "ember");
    },
    [vault, toast]
  );

  const renameNote = useCallback(
    (id: string, nextTitle: string) => {
      const clean = uniqueTitle({ ...vault, [id]: undefined } as unknown as Vault, nextTitle);
      let rewired = 0;
      setVault((v) => {
        const next: Vault = {};
        for (const key of Object.keys(v)) {
          const n = v[key];
          if (key === id) {
            next[clean] = { ...n, id: clean, title: clean, modified: Date.now() };
          } else {
            const content = n.content.replace(
              new RegExp(`\\[\\[${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\||#|\\]\\])`, "g"),
              (_m, tail: string) => {
                rewired += 1;
                return `[[${clean}${tail}`;
              }
            );
            next[key] = { ...n, content, modified: content === n.content ? n.modified : Date.now() };
          }
        }
        return next;
      });
      setActiveId(clean);
      toast(`Renamed → ${clean} · ${rewired} links rewired`, "verdigris");
    },
    [vault, toast]
  );

  const openWiki = useCallback(
    (target: string) => {
      if (vault[target]) {
        setActiveId(target);
        setMode("write");
        return;
      }
      createNote(target, undefined, activeNote?.discipline ?? "9");
    },
    [vault, createNote, activeNote]
  );

  const selectFromGraph = useCallback(
    (id: string) => {
      if (id.startsWith("#")) {
        const tag = id.slice(1);
        setTagFilter((cur) => (cur === tag ? null : tag));
        toast(`Tag filter · #${tag}`, "gold");
        return;
      }
      if (!vault[id]) {
        createNote(id);
        return;
      }
      setActiveId(id);
      setMode("write");
      window.setTimeout(() => graphHandle.current?.centerOn(id), 60);
    },
    [vault, createNote, toast]
  );

  const toggleDiscipline = useCallback((d: DisciplineId) => {
    setActiveDisciplines((s) => {
      const next = new Set(s);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }, []);

  /* ── keyboard ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((s) => !s);
      } else if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((s) => !s);
      } else if (mod && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setInspectorOpen((s) => !s);
      } else if (mod && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setLayout((l) => (l === "graph" ? "split" : "graph"));
      } else if (mod && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setMode((m) => (m === "write" ? "read" : "write"));
      } else if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        createNote();
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createNote]);

  /* ── splitter ───────────────────────────────────────────────────────── */
  const draggingSplit = useRef(false);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!draggingSplit.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      setSplitPct(Math.max(26, Math.min(68, pct - (sidebarOpen ? 12 : 0))));
    };
    const up = () => {
      draggingSplit.current = false;
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [sidebarOpen]);

  const layoutLabel = layout === "split" ? "split view" : layout === "graph" ? "immersive graph" : "deep read";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ink-950 text-parchment">
      {/* ── title bar ── */}
      <header className="relative z-40 flex h-11 shrink-0 items-center gap-3 border-b border-white/6 bg-ink-900/90 px-3 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 anim-sheen opacity-40" />
        {/* sheen layer above must never swallow clicks */}
        <IconBtn title="Toggle vault explorer (Ctrl/Cmd+B)" active={sidebarOpen} onClick={() => setSidebarOpen((s) => !s)}>
          <PanelLeft size={13} />
        </IconBtn>
        <div className="flex items-center gap-2">
          <span className="text-gold">
            <AlchemyMark size={18} />
          </span>
          <span className="font-display text-[13.5px] font-semibold tracking-[-0.01em] text-parchment">
            {activeNote ? activeNote.title : "Summa Alchemica"}
          </span>
          {activeNote && (
            <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">
              · {DISCIPLINES[activeNote.discipline].name}
            </span>
          )}
        </div>

        <div className="mx-auto flex items-center gap-0.5 rounded-lg border border-white/8 bg-ink-950/60 p-0.5">
          {(
            [
              { id: "split", icon: <Columns2 size={12} />, label: "Split" },
              { id: "graph", icon: <Orbit size={12} />, label: "Graph" },
              { id: "focus", icon: <Focus size={12} />, label: "Read" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setLayout(m.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
                layout === m.id ? "bg-gold/15 text-gold shadow-[0_0_18px_-6px_rgba(227,176,98,0.9)]" : "text-muted hover:text-parchment"
              )}
            >
              {m.icon}
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-muted transition-all duration-200 hover:border-gold/35 hover:text-parchment"
        >
          <Search size={12} />
          <span className="hidden md:inline">Search vault</span>
          <kbd className="hidden rounded border border-white/12 px-1 py-[1px] font-mono text-[9px] md:inline">⌘K</kbd>
        </button>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
            setDirty(false);
            toast("Snapshot committed to local vault", "verdigris");
          }}
          title="Commit snapshot"
          className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-muted transition-all duration-200 hover:border-gold/35 hover:text-parchment"
        >
          <Save size={12} />
          <span className={cn("h-1.5 w-1.5 rounded-full", dirty ? "bg-ember" : "bg-verdigris")} />
        </button>
        <IconBtn title="Toggle inspector (Ctrl/Cmd+I)" active={inspectorOpen} onClick={() => setInspectorOpen((s) => !s)}>
          <PanelRight size={13} />
        </IconBtn>
      </header>

      {/* ── body ── */}
      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && (
          <div className="w-[262px] shrink-0 anim-rise">
            <Sidebar
              vault={vault}
              graph={fullGraph}
              activeId={activeId}
              query={query}
              onQuery={setQuery}
              tagFilter={tagFilter}
              onTagFilter={setTagFilter}
              onSelect={(id) => {
                setActiveId(id);
                setMode("write");
              }}
              onHoverNode={setHoverUi}
              onNewNote={() => createNote()}
              activeDisciplines={activeDisciplines}
              onToggleDiscipline={toggleDiscipline}
            />
          </div>
        )}

        {layout !== "graph" && (
          <div
            className="relative min-w-0 flex-1"
            style={layout === "split" ? { flexBasis: `${splitPct}%`, flexGrow: 0, flexShrink: 0 } : undefined}
          >
            {activeNote ? (
              <Editor
                note={activeNote}
                vault={vault}
                onChange={updateContent}
                onRename={(t) => renameNote(activeNote.id, t)}
                onDelete={() => deleteNote(activeNote.id)}
                onWiki={openWiki}
                onTag={(t) => setTagFilter(t)}
                onHoverNode={setHoverUi}
                onCenterInGraph={() => activeId && graphHandle.current?.centerOn(activeId)}
                mode={mode}
                onMode={setMode}
              />
            ) : (
              <div className="grid h-full place-items-center bg-ink-900">
                <div className="text-center">
                  <span className="mx-auto mb-3 block text-gold/60">
                    <AlchemyMark size={44} />
                  </span>
                  <p className="font-display text-[18px] text-parchment-dim">No atom selected</p>
                  <button
                    type="button"
                    onClick={() => createNote()}
                    className="mt-3 rounded-lg border border-gold/35 bg-gold/10 px-3 py-1.5 text-[12px] text-gold transition-colors hover:bg-gold/20"
                  >
                    Forge a note
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {layout === "split" && (
          <div
            onPointerDown={() => {
              draggingSplit.current = true;
              document.body.style.cursor = "col-resize";
            }}
            className="group relative w-[5px] shrink-0 cursor-col-resize bg-white/[0.02] transition-colors hover:bg-gold/25"
          >
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/8 group-hover:bg-gold/60" />
          </div>
        )}

        {/* graph stays mounted in read mode so the simulation keeps its layout */}
        <div className={cn("min-w-0 flex-1", layout === "focus" && "hidden")}>
            <GraphPanel
              model={model}
              activeId={activeId}
              physics={physics}
              onPhysics={setPhysics}
              showLabels={showLabels}
              particles={particles}
              cluster={cluster}
              showTags={showTags}
              showOrphans={showOrphans}
              showGhosts={showGhosts}
              localDepth={localDepth}
              localMode={localMode}
              highlightIds={highlightIds}
              query={query}
              activeDisciplines={activeDisciplines}
              onToggleDiscipline={toggleDiscipline}
              onToggle={(key, v) => {
                if (key === "showLabels") setShowLabels(v);
                if (key === "particles") setParticles(v);
                if (key === "cluster") setCluster(v);
                if (key === "showTags") setShowTags(v);
                if (key === "showOrphans") setShowOrphans(v);
                if (key === "showGhosts") setShowGhosts(v);
                if (key === "localMode") setLocalMode(v);
              }}
              onLocalDepth={setLocalDepth}
              onSelect={selectFromGraph}
              onCreateAt={(p) => createNote(undefined, p)}
              onHoverNode={setHoverUi}
              onCamera={setCamera}
              onActivity={setActivity}
              spawnRef={spawnRef}
              handleRef={graphHandle}
            />
        </div>

        {inspectorOpen && (
          <div className="w-[286px] shrink-0 anim-rise">
            <Inspector
              note={activeNote}
              vault={vault}
              graph={fullGraph}
              stats={stats}
              onWiki={openWiki}
              onTag={setTagFilter}
              onHoverNode={setHoverUi}
              onClose={() => setInspectorOpen(false)}
            />
          </div>
        )}
      </div>

      <StatusBar stats={stats} zoom={camera.k} alpha={activity.alpha} fps={activity.fps} dirty={dirty} mode={layoutLabel} />

      {/* ── toasts ── */}
      <div className="pointer-events-none fixed bottom-10 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "anim-toast flex items-center gap-2 rounded-full border bg-ink-900/95 px-3.5 py-1.5 text-[12px] shadow-panel backdrop-blur-md",
              t.tone === "gold" && "border-gold/35 text-gold-soft",
              t.tone === "ember" && "border-ember/40 text-ember",
              t.tone === "verdigris" && "border-verdigris/40 text-verdigris"
            )}
          >
            <Square size={7} className="fill-current" />
            {t.text}
          </div>
        ))}
      </div>

      <CommandPalette
        open={paletteOpen}
        vault={vault}
        onClose={() => setPaletteOpen(false)}
        onSelect={(id) => {
          setActiveId(id);
          setMode("write");
        }}
        onNew={(title) => createNote(title)}
        onAction={(a) => {
          if (a === "fit") graphHandle.current?.fit();
          if (a === "reheat") graphHandle.current?.reheat(0.9);
          if (a === "toggleGraph") setLayout((l) => (l === "graph" ? "split" : "graph"));
          if (a === "toggleInspector") setInspectorOpen((s) => !s);
        }}
      />
    </div>
  );
}
