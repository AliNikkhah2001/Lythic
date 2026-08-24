import { GitBranch, Activity, Boxes, Link2, Orbit, Zap } from "lucide-react";
import type { VaultStats } from "../lib/graph";

interface Props {
  stats: VaultStats;
  zoom: number;
  alpha: number;
  fps: number;
  dirty: boolean;
  mode: string;
}

export default function StatusBar({ stats, zoom, alpha, fps, dirty, mode }: Props) {
  const energy = Math.min(1, alpha * 1.6);
  return (
    <footer className="relative z-30 flex h-7 shrink-0 items-center gap-4 border-t border-white/6 bg-ink-900/90 px-3 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted backdrop-blur-md">
      <span className="flex items-center gap-1.5 text-parchment-dim">
        <GitBranch size={10} className="text-gold/70" />
        vault · main
      </span>
      <span className={dirty ? "text-ember" : "text-verdigris/80"}>
        {dirty ? "unsaved" : "synced"}
      </span>

      <span className="ml-auto flex items-center gap-1.5">
        <Boxes size={10} /> {stats.notes} notes
      </span>
      <span className="flex items-center gap-1.5">
        <Link2 size={10} /> {stats.resolved}/{stats.links} resolved
      </span>
      <span className="flex items-center gap-1.5">
        <Orbit size={10} /> {stats.orphans} orphans
      </span>
      <span className="hidden items-center gap-1.5 lg:flex">
        <Activity size={10} /> {fps.toFixed(0)} fps
      </span>

      <span className="flex items-center gap-1.5">
        <Zap size={10} className={energy > 0.05 ? "text-gold" : "text-muted"} />
        <span className="relative h-1 w-14 overflow-hidden rounded-full bg-white/8">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold/50 to-gold transition-[width] duration-200"
            style={{ width: `${Math.max(3, energy * 100)}%` }}
          />
        </span>
        sim {Math.round(alpha * 100)}
      </span>

      <span className="flex items-center gap-1.5">
        zoom {Math.round(zoom * 100)}%
      </span>
      <span className="text-gold/70">{mode}</span>
      <span className="hidden text-muted/60 xl:inline">⌘K palette</span>
    </footer>
  );
}
