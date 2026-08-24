import { useMemo, useState } from "react";
import { ChevronRight, FilePlus2, Hash, Search, Tag, X } from "lucide-react";
import { DISCIPLINES, DISCIPLINE_LIST, type DisciplineId, type Vault } from "../lib/palette";
import { parseNote } from "../lib/parse";
import type { GraphModel } from "../lib/graph";
import { cn } from "../utils/cn";
import { AlchemyMark, IconBtn } from "./ui";

interface Props {
  vault: Vault;
  graph: GraphModel;
  activeId: string | null;
  query: string;
  onQuery: (q: string) => void;
  tagFilter: string | null;
  onTagFilter: (t: string | null) => void;
  onSelect: (id: string) => void;
  onHoverNode: (id: string | null) => void;
  onNewNote: () => void;
  activeDisciplines: Set<DisciplineId>;
  onToggleDiscipline: (d: DisciplineId) => void;
}

interface TreeNode {
  name: string;
  full: string;
  count: number;
  children: TreeNode[];
}

export default function Sidebar(props: Props) {
  const { vault, graph, activeId, query, onQuery, tagFilter, onTagFilter, onSelect, onHoverNode, onNewNote } = props;
  const [openBins, setOpenBins] = useState<Record<string, boolean>>({
    "0": true,
    "1": true,
    "2": true,
    "3": false,
    "4": false,
    "5": false,
    "6": false,
    "7": false,
    "8": true,
    "9": false,
    A: false,
    B: false,
  });
  const [openTags, setOpenTags] = useState<Record<string, boolean>>({ physics: true, systems: true });
  const [showTags, setShowTags] = useState(true);

  const notes = useMemo(() => Object.values(vault), [vault]);
  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      notes.filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          parseNote(n.content).tags.some((t) => t.includes(q))
      ),
    [notes, q]
  );

  const degrees = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of graph.nodes) m.set(n.id, n.degree);
    return m;
  }, [graph]);

  const tagTree = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of notes) for (const t of parseNote(n.content).tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    const roots: TreeNode[] = [];
    const map = new Map<string, TreeNode>();
    for (const full of [...counts.keys()].sort()) {
      const parts = full.split("/");
      let acc = "";
      for (let i = 0; i < parts.length; i++) {
        acc = i === 0 ? parts[0] : `${acc}/${parts[i]}`;
        if (!map.has(acc)) {
          const node: TreeNode = { name: parts[i], full: acc, count: 0, children: [] };
          map.set(acc, node);
          if (i === 0) roots.push(node);
          else map.get(parts.slice(0, i).join("/"))?.children.push(node);
        }
        map.get(acc)!.count += 1;
      }
    }
    return roots;
  }, [notes]);

  const renderRow = (id: string) => {
    const n = vault[id];
    if (!n) return null;
    const active = activeId === id;
    return (
      <button
        key={id}
        type="button"
        onMouseEnter={() => onHoverNode(id)}
        onMouseLeave={() => onHoverNode(null)}
        onClick={() => onSelect(id)}
        className={cn(
          "group flex w-full items-center gap-2 rounded-md py-[5px] pl-2 pr-1.5 text-left transition-all duration-200",
          active ? "bg-gold/12 text-parchment" : "text-parchment-dim hover:bg-white/[0.045] hover:text-parchment"
        )}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300"
          style={{
            background: DISCIPLINES[n.discipline].color,
            boxShadow: active ? `0 0 10px ${DISCIPLINES[n.discipline].color}` : "none",
          }}
        />
        <span className={cn("min-w-0 flex-1 truncate text-[12.5px]", active && "font-medium")}>{n.title}</span>
        <span
          className={cn(
            "font-mono text-[9.5px] tabular-nums transition-opacity",
            active ? "text-gold/80 opacity-100" : "text-muted/60 opacity-0 group-hover:opacity-100"
          )}
        >
          {degrees.get(id) ?? 0}
        </span>
      </button>
    );
  };

  const renderTagNode = (node: TreeNode, depth: number): React.ReactNode => (
    <div key={node.full}>
      <button
        type="button"
        onClick={() => {
          if (node.children.length) setOpenTags((s) => ({ ...s, [node.full]: !s[node.full] }));
          onTagFilter(tagFilter === node.full ? null : node.full);
        }}
        className={cn(
          "group flex w-full items-center gap-1.5 rounded-md py-[4px] pr-1.5 text-left transition-colors",
          tagFilter === node.full ? "bg-gold/12 text-gold" : "text-parchment-dim hover:bg-white/[0.04] hover:text-parchment"
        )}
        style={{ paddingLeft: 6 + depth * 11 }}
      >
        {node.children.length ? (
          <ChevronRight
            size={11}
            className={cn("shrink-0 text-muted transition-transform duration-200", openTags[node.full] && "rotate-90")}
          />
        ) : (
          <Hash size={10} className="ml-[3px] mr-[1px] shrink-0 text-gold/50" />
        )}
        <span className="min-w-0 flex-1 truncate font-mono text-[11px]">{node.name}</span>
        <span className="font-mono text-[9.5px] tabular-nums text-muted/60">{node.count}</span>
      </button>
      {openTags[node.full] && node.children.map((c) => renderTagNode(c, depth + 1))}
    </div>
  );

  const binned = DISCIPLINE_LIST.filter((d) => !d.flat);
  const flat = DISCIPLINE_LIST.filter((d) => d.flat);

  return (
    <aside className="relative flex h-full w-full flex-col border-r border-white/6 bg-ink-900/80">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_20%_0%,rgba(227,176,98,0.13),transparent_70%)]" />

      <header className="relative flex items-center gap-2.5 px-3.5 pb-3 pt-3.5">
        <span className="text-gold">
          <AlchemyMark size={27} className="anim-breathe" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-[17px] font-semibold leading-none tracking-[-0.01em] text-parchment">
            Summa Alchemica
          </h1>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
            {notes.length} atoms · {graph.links.length} bonds
          </p>
        </div>
      </header>

      <div className="relative px-3">
        <div className="group relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-gold" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search vault…"
            className="w-full rounded-lg border border-white/8 bg-ink-950/70 py-1.5 pl-8 pr-7 text-[12.5px] text-parchment outline-none transition-all placeholder:text-muted/60 focus:border-gold/40 focus:shadow-[0_0_0_3px_rgba(227,176,98,0.08)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-parchment"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <IconBtn title="New note (Ctrl/Cmd+N)" onClick={onNewNote}>
            <FilePlus2 size={13} />
          </IconBtn>
          <div className="flex flex-1 items-center gap-1 rounded-lg border border-white/6 bg-white/[0.02] px-2 py-1">
            <Tag size={10} className="text-gold/70" />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
              {tagFilter ? `#${tagFilter}` : "no tag filter"}
            </span>
            {tagFilter && (
              <button type="button" onClick={() => onTagFilter(null)} className="ml-auto text-muted hover:text-parchment">
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="scroll-thin relative mt-2 flex-1 overflow-y-auto px-2 pb-4">
        <div className="px-1.5 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted/70">Vault</div>

        {binned.map((d) => {
          const kids = filtered.filter((n) => n.discipline === d.id).sort((a, b) => a.title.localeCompare(b.title));
          const open = openBins[d.id] !== false;
          const off = !props.activeDisciplines.has(d.id);
          return (
            <div key={d.id} className="mb-0.5">
              <div
                className={cn("group flex w-full items-center gap-1.5 rounded-md py-[5px] pr-1.5 transition-colors hover:bg-white/[0.04]", off && "opacity-40")}
              >
                <button
                  type="button"
                  onClick={() => setOpenBins((s) => ({ ...s, [d.id]: !open }))}
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                >
                  <ChevronRight size={11} className={cn("shrink-0 text-muted transition-transform duration-200", open && "rotate-90")} />
                  <span className="font-mono text-[10px] text-muted/70">{d.id}</span>
                  <span className="truncate text-[12.5px] font-medium text-parchment-dim group-hover:text-parchment">{d.name}</span>
                  <span className="font-mono text-[9.5px] tabular-nums text-muted/50">{kids.length}</span>
                </button>
                <button
                  type="button"
                  title={off ? `Show ${d.name}` : `Hide ${d.name} in graph`}
                  onClick={() => props.onToggleDiscipline(d.id)}
                  className="h-3 w-3 shrink-0 rounded-full transition-all duration-200 hover:scale-125"
                  style={{ background: d.color, boxShadow: off ? "none" : `0 0 8px ${d.color}` }}
                />
              </div>
              {open && <div className="ml-3 border-l border-white/6 pl-1">{kids.map((n) => renderRow(n.id))}</div>}
            </div>
          );
        })}

        <div className="mb-0.5 mt-2">
          <div className="flex w-full items-center gap-1.5 rounded-md py-[5px] pr-1.5">
            <span className="ml-[3px] font-mono text-[10px] text-muted/70">/</span>
            <span className="truncate text-[12.5px] font-medium text-parchment-dim">root</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted/50">flattened</span>
            <span className="ml-auto font-mono text-[9.5px] tabular-nums text-muted/50">
              {filtered.filter((n) => DISCIPLINES[n.discipline].flat).length}
            </span>
          </div>
          <div className="ml-3 border-l border-white/6 pl-1">
            {flat.map((d) => {
              const kids = filtered.filter((n) => n.discipline === d.id).sort((a, b) => a.title.localeCompare(b.title));
              if (!kids.length) return null;
              return (
                <div key={d.id} className="mb-0.5">
                  <button
                    type="button"
                    onClick={() => setOpenBins((s) => ({ ...s, [d.id]: !openBins[d.id] }))}
                    className="flex w-full items-center gap-1.5 rounded-md py-[5px] pr-1.5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <ChevronRight
                      size={11}
                      className={cn("shrink-0 text-muted transition-transform duration-200", openBins[d.id] && "rotate-90")}
                    />
                    <span className="font-mono text-[10px] text-muted/70">{d.id}</span>
                    <span className="truncate text-[12.5px] text-parchment-dim">{d.name}</span>
                    <span className="font-mono text-[9.5px] tabular-nums text-muted/50">{kids.length}</span>
                  </button>
                  {openBins[d.id] && <div className="ml-3 border-l border-white/6 pl-1">{kids.map((n) => renderRow(n.id))}</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between px-1.5 pb-1 pt-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted/70">Nested tags</span>
          <button
            type="button"
            onClick={() => setShowTags((s) => !s)}
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-gold/70 transition-colors hover:text-gold"
          >
            {showTags ? "hide" : "show"}
          </button>
        </div>
        {showTags && <div className="px-0.5">{tagTree.map((t) => renderTagNode(t, 0))}</div>}
      </div>
    </aside>
  );
}
