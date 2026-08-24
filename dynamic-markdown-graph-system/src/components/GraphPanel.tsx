import { useState } from "react";
import {
  Crosshair,
  FlaskConical,
  Focus,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Tag,
  Waypoints,
  X,
} from "lucide-react";
import GraphView, { type GraphHandle, type Physics } from "./GraphView";
import type { GraphModel } from "../lib/graph";
import { DISCIPLINE_LIST, type DisciplineId } from "../lib/palette";
import { Chip, IconBtn, Slider, Toggle } from "./ui";
import { cn } from "../utils/cn";

interface Props {
  model: GraphModel;
  activeId: string | null;
  physics: Physics;
  onPhysics: (p: Physics) => void;
  showLabels: boolean;
  particles: boolean;
  cluster: boolean;
  showTags: boolean;
  showOrphans: boolean;
  showGhosts: boolean;
  localDepth: number;
  localMode: boolean;
  highlightIds: Set<string> | null;
  query: string;
  activeDisciplines: Set<DisciplineId>;
  onToggleDiscipline: (d: DisciplineId) => void;
  onToggle: (key: "showLabels" | "particles" | "cluster" | "showTags" | "showOrphans" | "showGhosts" | "localMode", v: boolean) => void;
  onLocalDepth: (d: number) => void;
  onSelect: (id: string) => void;
  onCreateAt: (p: { x: number; y: number }) => void;
  onHoverNode: (id: string | null) => void;
  onCamera: (c: { x: number; y: number; k: number }) => void;
  onActivity: (a: { alpha: number; fps: number }) => void;
  spawnRef: React.MutableRefObject<Map<string, { x: number; y: number }>>;
  handleRef: React.MutableRefObject<GraphHandle | null>;
  className?: string;
}

export default function GraphPanel(props: Props) {
  const [labOpen, setLabOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);
  const { model, physics, onPhysics } = props;

  return (
    <div className={cn("relative h-full min-w-0 overflow-hidden border-l border-white/6 bg-ink-950", props.className)}>
      <GraphView
        model={model}
        activeId={props.activeId}
        physics={physics}
        showLabels={props.showLabels}
        particlesOn={props.particles}
        cluster={props.cluster}
        highlightIds={props.highlightIds}
        query={props.query}
        onSelect={props.onSelect}
        onCreateAt={props.onCreateAt}
        onHover={props.onHoverNode}
        onCamera={props.onCamera}
        onActivity={props.onActivity}
        spawnRef={props.spawnRef}
        handleRef={props.handleRef}
      />

      {/* ── top bar ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-ink-900/85 p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => props.onToggle("localMode", !props.localMode)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
                props.localMode ? "bg-gold/15 text-gold" : "text-muted hover:text-parchment"
              )}
              title="Local graph around the open note"
            >
              <Focus size={12} /> {props.localMode ? "Local" : "Global"}
            </button>
            {props.localMode && (
              <div className="flex items-center gap-1 pr-1">
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => props.onLocalDepth(d)}
                    className={cn(
                      "h-5 w-5 rounded-md font-mono text-[10px] transition-all duration-200",
                      props.localDepth === d ? "bg-gold/20 text-gold" : "text-muted hover:text-parchment"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-white/8 bg-ink-900/85 px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted backdrop-blur-md">
            {model.nodes.length} nodes · {model.links.length} edges
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-white/8 bg-ink-900/85 p-1 backdrop-blur-md">
          <IconBtn title="Zoom in" onClick={() => props.handleRef.current?.zoomBy(1.25)}>
            <Plus size={13} />
          </IconBtn>
          <IconBtn title="Zoom out" onClick={() => props.handleRef.current?.zoomBy(0.8)}>
            <Minus size={13} />
          </IconBtn>
          <IconBtn title="Fit graph to view" onClick={() => props.handleRef.current?.fit()}>
            <Maximize2 size={13} />
          </IconBtn>
          <IconBtn title="Centre on open note" onClick={() => props.activeId && props.handleRef.current?.centerOn(props.activeId)}>
            <Crosshair size={13} />
          </IconBtn>
          <IconBtn title="Reheat simulation" onClick={() => props.handleRef.current?.reheat(0.9)}>
            <RotateCcw size={13} />
          </IconBtn>
          <IconBtn title="Labels" active={props.showLabels} onClick={() => props.onToggle("showLabels", !props.showLabels)}>
            <span className="font-mono text-[9px] font-bold">Aa</span>
          </IconBtn>
          <IconBtn title="Energy particles" active={props.particles} onClick={() => props.onToggle("particles", !props.particles)}>
            <Sparkles size={13} />
          </IconBtn>
          <IconBtn title="Cluster by discipline" active={props.cluster} onClick={() => props.onToggle("cluster", !props.cluster)}>
            <Waypoints size={13} />
          </IconBtn>
          <IconBtn title="Tag nodes" active={props.showTags} onClick={() => props.onToggle("showTags", !props.showTags)}>
            <Tag size={13} />
          </IconBtn>
          <IconBtn title="Physics lab" active={labOpen} onClick={() => setLabOpen((s) => !s)}>
            <FlaskConical size={13} />
          </IconBtn>
        </div>
      </div>

      {/* ── physics lab ── */}
      {labOpen && (
        <div className="absolute right-3 top-14 z-30 w-64 anim-rise rounded-xl border border-white/10 bg-ink-900/95 p-3 shadow-panel backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2">
            <FlaskConical size={12} className="text-gold" />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-parchment-dim">Force engine</span>
            <button type="button" onClick={() => setLabOpen(false)} className="ml-auto text-muted hover:text-parchment">
              <X size={12} />
            </button>
          </div>
          <div className="space-y-2.5">
            <Slider label="Repel" value={physics.repel} min={20} max={600} step={5} onChange={(v) => onPhysics({ ...physics, repel: v })} />
            <Slider
              label="Link strength"
              value={physics.linkForce}
              min={0.05}
              max={1.6}
              step={0.05}
              onChange={(v) => onPhysics({ ...physics, linkForce: v })}
              format={(v) => v.toFixed(2)}
            />
            <Slider
              label="Link distance"
              value={physics.linkDistance}
              min={20}
              max={260}
              step={2}
              onChange={(v) => onPhysics({ ...physics, linkDistance: v })}
              format={(v) => `${v}px`}
            />
            <Slider
              label="Centre gravity"
              value={physics.center}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => onPhysics({ ...physics, center: v })}
              format={(v) => v.toFixed(2)}
            />
            <Slider
              label="Cluster pull"
              value={physics.cluster}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => onPhysics({ ...physics, cluster: v })}
              format={(v) => v.toFixed(2)}
            />
          </div>
          <div className="mt-3 space-y-0.5 border-t border-white/8 pt-2">
            <Toggle checked={props.showOrphans} onChange={(v) => props.onToggle("showOrphans", v)} label="Orphan notes" hint="notes with no links" />
            <Toggle checked={props.showGhosts} onChange={(v) => props.onToggle("showGhosts", v)} label="Unresolved links" hint="ghost targets" />
            <Toggle checked={props.cluster} onChange={(v) => props.onToggle("cluster", v)} label="Group by discipline" hint="anchor bins on a ring" />
          </div>
          <button
            type="button"
            onClick={() => onPhysics({ center: 0.6, repel: 220, linkForce: 0.75, linkDistance: 82, cluster: 0.7 })}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] py-1.5 text-[11px] text-parchment-dim transition-colors hover:border-gold/40 hover:text-gold"
          >
            <Settings2 size={11} /> Reset forces
          </button>
        </div>
      )}

      {/* ── legend ── */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-[min(420px,72%)]">
        <div className="pointer-events-auto rounded-xl border border-white/8 bg-ink-900/85 p-2 backdrop-blur-md">
          <div className="mb-1.5 flex items-center gap-2 px-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Disciplines</span>
            <button
              type="button"
              onClick={() => setLegendOpen((s) => !s)}
              className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-gold"
            >
              {legendOpen ? "collapse" : "expand"}
            </button>
          </div>
          {legendOpen && (
            <div className="flex flex-wrap gap-1 px-1 pb-0.5">
              {DISCIPLINE_LIST.map((d) => (
                <Chip
                  key={d.id}
                  color={d.color}
                  label={`${d.id} ${d.name}`}
                  active={props.activeDisciplines.has(d.id)}
                  onClick={() => props.onToggleDiscipline(d.id)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="mt-1.5 rounded-lg border border-white/6 bg-ink-900/70 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted/80 backdrop-blur-md">
          drag node · dbl-click canvas to forge a note · dbl-click node to pin
        </div>
      </div>
    </div>
  );
}
