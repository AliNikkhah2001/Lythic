import { useEffect, useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
} from "chart.js";
import { ArrowUpRight, GitFork, Layers, ListTree, Tag as TagIcon, X } from "lucide-react";
import type { Note, Vault } from "../lib/palette";
import { DISCIPLINES } from "../lib/palette";
import { parseNote } from "../lib/parse";
import type { GraphModel, VaultStats } from "../lib/graph";
import { SectionLabel } from "./ui";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, BarController);

interface Props {
  note: Note | null;
  vault: Vault;
  graph: GraphModel;
  stats: VaultStats;
  onWiki: (t: string) => void;
  onTag: (t: string) => void;
  onHoverNode: (id: string | null) => void;
  onClose: () => void;
}

function backlinkContext(content: string, target: string): string {
  for (const line of content.split("\n")) {
    if (line.includes(`[[${target}`)) {
      return line.replace(/^[-\s#>]+/, "").replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (_m, t, a) => a ?? t).trim();
    }
  }
  return "";
}

export default function Inspector(props: Props) {
  const { note, vault, graph, stats, onWiki, onTag, onHoverNode, onClose } = props;
  const doughnutRef = useRef<HTMLCanvasElement | null>(null);
  const barRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChart = useRef<ChartJS | null>(null);
  const barChart = useRef<ChartJS | null>(null);

  const parsed = useMemo(() => (note ? parseNote(note.content) : null), [note]);

  const backlinks = useMemo(() => {
    if (!note) return [];
    const out: { from: string; color: string; ctx: string }[] = [];
    for (const id of Object.keys(vault)) {
      if (id === note.id) continue;
      const p = parseNote(vault[id].content);
      if (p.links.some((l) => l.target === note.id)) {
        out.push({ from: id, color: DISCIPLINES[vault[id].discipline].color, ctx: backlinkContext(vault[id].content, note.id) });
      }
    }
    return out;
  }, [note, vault]);

  const outgoing = useMemo(() => parsed?.links ?? [], [parsed]);

  useEffect(() => {
    if (!doughnutRef.current) return;
    const data = stats.perDiscipline;
    doughnutChart.current = new ChartJS(doughnutRef.current, {
      type: "doughnut",
      data: {
        labels: data.map((d) => d.name),
        datasets: [
          {
            data: data.map((d) => d.notes),
            backgroundColor: data.map((d) => `${d.color}cc`),
            borderColor: "rgba(6,7,11,0.9)",
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(13,16,23,0.96)",
            borderColor: "rgba(255,255,255,0.12)",
            borderWidth: 1,
            titleColor: "#e9e4d8",
            bodyColor: "#b9b3a6",
            titleFont: { family: "IBM Plex Sans", size: 12 },
            bodyFont: { family: "IBM Plex Mono", size: 11 },
            padding: 9,
          },
        },
      },
    });
    return () => {
      doughnutChart.current?.destroy();
      doughnutChart.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!barRef.current) return;
    const data = stats.linkCounts;
    barChart.current = new ChartJS(barRef.current, {
      type: "bar",
      data: {
        labels: data.map((d) => `${d.from} ↔ ${d.to}`),
        datasets: [
          {
            data: data.map((d) => d.weight),
            backgroundColor: "rgba(227,176,98,0.55)",
            hoverBackgroundColor: "rgba(242,217,168,0.85)",
            borderRadius: 3,
            barThickness: 9,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true, displayColors: false } },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#7e8697", font: { family: "IBM Plex Mono", size: 9 }, precision: 0 },
          },
          y: {
            grid: { display: false },
            ticks: { color: "#b9b3a6", font: { family: "IBM Plex Sans", size: 10 } },
          },
        },
      },
    });
    return () => {
      barChart.current?.destroy();
      barChart.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live-update chart data as the vault changes
  useEffect(() => {
    const d = doughnutChart.current;
    if (d) {
      d.data.labels = stats.perDiscipline.map((x) => x.name);
      const ds = d.data.datasets[0];
      ds.data = stats.perDiscipline.map((x) => x.notes);
      ds.backgroundColor = stats.perDiscipline.map((x) => `${x.color}cc`);
      d.update("none");
    }
    const b = barChart.current;
    if (b) {
      b.data.labels = stats.linkCounts.map((x) => `${x.from} ↔ ${x.to}`);
      b.data.datasets[0].data = stats.linkCounts.map((x) => x.weight);
      b.update("none");
    }
  }, [stats.perDiscipline, stats.linkCounts]);

  return (
    <aside className="relative flex h-full w-full flex-col overflow-hidden border-l border-white/6 bg-ink-900/85 backdrop-blur-sm">
      <header className="flex items-center gap-2 border-b border-white/6 px-3 py-2.5">
        <Layers size={12} className="text-gold" />
        <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-parchment-dim">Inspector</span>
        <button type="button" onClick={onClose} className="ml-auto text-muted transition-colors hover:text-parchment">
          <X size={13} />
        </button>
      </header>

      <div className="scroll-thin flex-1 overflow-y-auto pb-8">
        {note && parsed && (
          <>
            <SectionLabel>Properties</SectionLabel>
            <div className="space-y-2 px-3">
              <div className="flex flex-wrap gap-1">
                {parsed.tags.filter((t) => !parsed.tags.some((o) => o.startsWith(`${t}/`))).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onTag(t)}
                    className="rounded-md border border-gold/25 bg-gold/10 px-1.5 py-0.5 font-mono text-[10px] text-gold transition-colors hover:bg-gold/20"
                  >
                    #{t}
                  </button>
                ))}
                {parsed.tags.filter((t) => !parsed.tags.some((o) => o.startsWith(`${t}/`))).length === 0 && (
                  <span className="font-mono text-[10px] text-muted/60">no leaf tags</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  ["discipline", DISCIPLINES[note.discipline].name],
                  ["words", String(parsed.words)],
                  ["links", String(outgoing.length)],
                  ["backlinks", String(backlinks.length)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-md border border-white/6 bg-white/[0.02] px-2 py-1.5">
                    <div className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted/70">{k}</div>
                    <div className="mt-0.5 truncate text-[12px] text-parchment">{v}</div>
                  </div>
                ))}
              </div>
              {parsed.props.aliases && parsed.props.aliases.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  {parsed.props.aliases.slice(1).map((a) => (
                    <span key={a} className="rounded border border-white/8 px-1.5 py-0.5 font-mono text-[9.5px] text-muted">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <ListTree size={10} /> Outline
              </span>
            </SectionLabel>
            <div className="px-3">
              {parsed.headings.length === 0 && <p className="text-[11.5px] text-muted/60">No headings yet.</p>}
              <ul className="space-y-0.5">
                {parsed.headings.map((h, i) => (
                  <li key={`${h.text}-${i}`} style={{ paddingLeft: (h.level - 1) * 10 }}>
                    <span
                      className={`block truncate py-[2px] text-[11.5px] ${
                        h.level <= 2 ? "text-parchment-dim" : "text-muted"
                      }`}
                    >
                      <span className="mr-1.5 font-mono text-[9px] text-gold/50">{"#".repeat(h.level)}</span>
                      {h.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <ArrowUpRight size={10} /> Backlinks <span className="text-gold/70">{backlinks.length}</span>
              </span>
            </SectionLabel>
            <div className="space-y-1 px-3">
              {backlinks.length === 0 && <p className="text-[11.5px] text-muted/60">Nothing points here yet — a true orphan.</p>}
              {backlinks.map((b) => (
                <button
                  key={b.from}
                  type="button"
                  onMouseEnter={() => onHoverNode(b.from)}
                  onMouseLeave={() => onHoverNode(null)}
                  onClick={() => onWiki(b.from)}
                  className="group block w-full rounded-lg border border-white/6 bg-white/[0.02] p-2 text-left transition-all duration-200 hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.color, boxShadow: `0 0 7px ${b.color}` }} />
                    <span className="truncate text-[12px] font-medium text-parchment-dim group-hover:text-parchment">{b.from}</span>
                  </span>
                  {b.ctx && <span className="mt-1 block truncate font-mono text-[9.5px] text-muted/80">{b.ctx}</span>}
                </button>
              ))}
            </div>

            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <GitFork size={10} /> Outgoing <span className="text-gold/70">{outgoing.length}</span>
              </span>
            </SectionLabel>
            <div className="flex flex-wrap gap-1 px-3">
              {outgoing.map((l) => {
                const ok = !!vault[l.target];
                return (
                  <button
                    key={l.raw}
                    type="button"
                    onMouseEnter={() => onHoverNode(l.target)}
                    onMouseLeave={() => onHoverNode(null)}
                    onClick={() => onWiki(l.target)}
                    className={`rounded-md border px-1.5 py-0.5 text-[11px] transition-colors ${
                      ok
                        ? "border-white/8 bg-white/[0.03] text-parchment-dim hover:border-white/20 hover:text-parchment"
                        : "border-ember/25 bg-ember/[0.07] text-ember hover:border-ember/50"
                    }`}
                  >
                    {l.alias ?? l.target}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <SectionLabel>
          <span className="flex items-center gap-1.5">
            <TagIcon size={10} /> Vault statistics
          </span>
        </SectionLabel>
        <div className="px-3">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ["notes", stats.notes],
              ["links", stats.links],
              ["tags", stats.tags],
              ["words", stats.words],
              ["orphans", stats.orphans],
              ["unresolved", stats.unresolved],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-md border border-white/6 bg-white/[0.02] px-2 py-1.5 text-center">
                <div className="font-display text-[17px] font-semibold leading-none text-gold-soft">{v as number}</div>
                <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted/70">{k as string}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/6 bg-white/[0.02] p-2">
            <div className="h-24 w-24 shrink-0">
              <canvas ref={doughnutRef} />
            </div>
            <ul className="scroll-thin max-h-24 flex-1 space-y-[3px] overflow-y-auto pr-1">
              {stats.perDiscipline.map((d) => (
                <li key={d.id} className="flex items-center gap-1.5 font-mono text-[9.5px] text-parchment-dim">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                  <span className="truncate">{d.name}</span>
                  <span className="ml-auto tabular-nums text-muted">{d.notes}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 rounded-lg border border-white/6 bg-white/[0.02] p-2">
            <div className="mb-1 font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted/70">Cross-discipline bonds</div>
            <div className="h-32">
              <canvas ref={barRef} />
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-white/6 bg-gradient-to-br from-gold/[0.07] to-transparent p-2.5">
            <div className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted/80">Graph density</div>
            <div className="mt-1 flex items-end gap-1.5">
              <span className="font-display text-[22px] font-semibold leading-none text-gold-soft">
                {(stats.density * 100).toFixed(1)}%
              </span>
              <span className="pb-0.5 font-mono text-[9px] text-muted">of possible pairs</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold transition-all duration-700"
                style={{ width: `${Math.min(100, stats.density * 100 * 4)}%` }}
              />
            </div>
            <div className="mt-2 font-mono text-[9px] text-muted/80">
              {graph.nodes.length} visible nodes · {stats.resolved}/{stats.links} links resolved
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
