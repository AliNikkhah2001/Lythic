import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { DISCIPLINE_LIST } from "../lib/palette";
import type { GraphModel, NodeKind } from "../lib/graph";

export interface Physics {
  center: number;
  repel: number;
  linkForce: number;
  linkDistance: number;
  cluster: number;
}

export interface Camera {
  x: number;
  y: number;
  k: number;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  kind: NodeKind;
  title: string;
  color: string;
  r: number;
  degree: number;
  matched: boolean;
  discipline?: string;
  pinned?: boolean;
  born: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  kind: "note" | "tag" | "nested";
  resolved: boolean;
  mix: string;
}

interface Particle {
  link: number;
  t: number;
  sp: number;
  size: number;
}

export interface GraphHandle {
  fit: () => void;
  reheat: (a?: number) => void;
  centerOn: (id: string) => void;
  zoomBy: (f: number) => void;
}

interface Props {
  model: GraphModel;
  activeId: string | null;
  physics: Physics;
  showLabels: boolean;
  particlesOn: boolean;
  cluster: boolean;
  highlightIds: Set<string> | null;
  query: string;
  onSelect: (id: string) => void;
  onCreateAt: (world: { x: number; y: number }) => void;
  onHover?: (id: string | null) => void;
  onCamera?: (c: Camera) => void;
  onActivity?: (info: { alpha: number; fps: number }) => void;
  spawnRef?: React.MutableRefObject<Map<string, { x: number; y: number }>>;
  handleRef: React.MutableRefObject<GraphHandle | null>;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
function mixHex(a: string, b: string): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const m = A.map((v, i) => Math.round((v + B[i]) / 2));
  return `${m[0]},${m[1]},${m[2]}`;
}
function rgba(rgb: string, a: number) {
  return `rgba(${rgb},${a})`;
}

const ANCHOR_RADIUS = 300;
function anchorFor(discipline?: string): { x: number; y: number } {
  if (!discipline) return { x: 0, y: 0 };
  const idx = DISCIPLINE_LIST.findIndex((d) => d.id === discipline);
  if (idx < 0) return { x: 0, y: 0 };
  const a = (idx / DISCIPLINE_LIST.length) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(a) * ANCHOR_RADIUS, y: Math.sin(a) * ANCHOR_RADIUS };
}

function radiusFor(kind: NodeKind, degree: number): number {
  const base = kind === "note" ? 6.4 : kind === "tag" ? 4.6 : 4.4;
  return base + Math.log1p(degree) * (kind === "note" ? 3.1 : 1.5);
}

export default function GraphView(props: Props) {
  const {
    model,
    activeId,
    physics,
    showLabels,
    particlesOn,
    cluster,
    highlightIds,
    query,
    onSelect,
    onCreateAt,
    onHover,
    onCamera,
    onActivity,
    spawnRef,
    handleRef,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const camRef = useRef<Camera>({ x: 0, y: 0, k: 0.9 });
  const camTargetRef = useRef<Camera>({ x: 0, y: 0, k: 0.9 });
  const hoverRef = useRef<string | null>(null);
  const dragRef = useRef<{ id: string | null; moved: number; pan: boolean }>({ id: null, moved: 0, pan: false });
  const physRef = useRef(physics);
  const clusterRef = useRef(cluster);
  const optsRef = useRef({ showLabels, particlesOn, highlightIds, activeId, query });
  const sizeRef = useRef({ w: 1, h: 1, dpr: 1 });
  const pointerRef = useRef({ x: 0, y: 0 });
  const cbRef = useRef({ onSelect, onCreateAt, onHover, onCamera, onActivity });
  cbRef.current = { onSelect, onCreateAt, onHover, onCamera, onActivity };

  const [tooltip, setTooltip] = useState<{ x: number; y: number; id: string } | null>(null);
  const tooltipRef = useRef<{ x: number; y: number; id: string } | null>(null);
  tooltipRef.current = tooltip;

  physRef.current = physics;
  clusterRef.current = cluster;
  optsRef.current = { showLabels, particlesOn, highlightIds, activeId, query };

  /* ── sync model into simulation ─────────────────────────────────────── */
  useEffect(() => {
    const prev = new Map(nodesRef.current.map((n) => [n.id, n]));
    const now = performance.now();

    const nodes: SimNode[] = model.nodes.map((n) => {
      const old = prev.get(n.id);
      const degree = n.degree;
      const r = radiusFor(n.kind, degree);
      if (old) {
        old.kind = n.kind;
        old.title = n.title;
        old.color = n.color;
        old.r = r;
        old.degree = degree;
        old.matched = (n as typeof n & { matched?: boolean }).matched ?? true;
        old.discipline = n.discipline;
        return old;
      }
      // spawn new nodes where the user asked, else near the middle
      const spawn = spawnRef?.current.get(n.id);
      if (spawn) spawnRef?.current.delete(n.id);
      const a = Math.random() * Math.PI * 2;
      const rad = 60 + Math.random() * 140;
      return {
        id: n.id,
        kind: n.kind,
        title: n.title,
        color: n.color,
        r,
        degree,
        matched: (n as typeof n & { matched?: boolean }).matched ?? true,
        discipline: n.discipline,
        x: spawn?.x ?? Math.cos(a) * rad,
        y: spawn?.y ?? Math.sin(a) * rad,
        vx: 0,
        vy: 0,
        born: now,
      };
    });

    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = model.links
      .filter((l) => nodeById.has(l.source) && nodeById.has(l.target))
      .map((l) => {
        const s = nodeById.get(l.source)!;
        const t = nodeById.get(l.target)!;
        return {
          id: l.id,
          source: s,
          target: t,
          kind: l.kind,
          resolved: l.resolved,
          mix: mixHex(s.color, t.color),
        };
      });

    nodesRef.current = nodes;
    linksRef.current = links;

    // particles — one per link, staggered
    particlesRef.current = links.map((_, i) => ({
      link: i,
      t: (i * 0.37) % 1,
      sp: 0.0022 + (i % 5) * 0.0009,
      size: 0.9 + ((i * 7) % 5) * 0.22,
    }));

    const sim = simRef.current ?? forceSimulation<SimNode, SimLink>();
    sim.stop();
    sim.nodes(nodes);
    sim.alpha(0.62).alphaDecay(0.017).alphaMin(0.0015).velocityDecay(0.28);
    applyForces(sim);
    sim.on("tick", () => {});
    sim.restart();
    simRef.current = sim;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  /* ── forces react to sliders ────────────────────────────────────────── */
  const applyForces = useCallback((sim: Simulation<SimNode, SimLink>) => {
    const p = physRef.current;
    const cl = clusterRef.current;
    sim
      .force(
        "link",
        forceLink<SimNode, SimLink>(linksRef.current)
          .id((d) => d.id)
          .distance((l) => (l.kind === "tag" ? 40 : p.linkDistance) * (l.kind === "note" ? 1 : 0.75))
          .strength((l) => (l.kind === "tag" ? 0.14 : 0.42) * p.linkForce)
      )
      .force(
        "charge",
        forceManyBody<SimNode>()
          .strength((d) => -p.repel * (d.kind === "note" ? 1 : 0.55) * (1 + Math.min(d.degree, 14) * 0.035))
          .distanceMax(520)
          .theta(0.85)
      )
      .force("center", forceCenter(0, 0).strength(0.045 * p.center + 0.006))
      .force("collide", forceCollide<SimNode>((d) => d.r + 7).strength(0.72).iterations(2))
      .force("x", forceX<SimNode>((d) => (cl ? anchorFor(d.discipline).x : 0)).strength(cl ? 0.05 * p.cluster + 0.004 : 0.012 * p.center))
      .force("y", forceY<SimNode>((d) => (cl ? anchorFor(d.discipline).y : 0)).strength(cl ? 0.05 * p.cluster + 0.004 : 0.012 * p.center));
  }, []);

  useEffect(() => {
    if (simRef.current) {
      applyForces(simRef.current);
      simRef.current.alpha(Math.max(simRef.current.alpha(), 0.35)).restart();
    }
  }, [physics, cluster, applyForces]);

  /* ── resize ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      if (camRef.current.k === 0.9 && camTargetRef.current.x === 0) {
        camRef.current = { x: w / 2, y: h / 2, k: 0.9 };
        camTargetRef.current = { ...camRef.current };
      }
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  /* ── camera helpers ─────────────────────────────────────────────────── */
  const toWorld = useCallback((sx: number, sy: number) => {
    const c = camRef.current;
    return { x: (sx - c.x) / c.k, y: (sy - c.y) / c.k };
  }, []);

  const fit = useCallback(() => {
    const nodes = nodesRef.current;
    const { w, h } = sizeRef.current;
    if (!nodes.length) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      if (!isFinite(n.x!) || !isFinite(n.y!)) continue;
      minX = Math.min(minX, n.x!);
      minY = Math.min(minY, n.y!);
      maxX = Math.max(maxX, n.x!);
      maxY = Math.max(maxY, n.y!);
    }
    if (!isFinite(minX)) return;
    const pad = 90;
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const k = Math.max(0.18, Math.min(2.4, Math.min((w - pad * 2) / bw, (h - pad * 2) / bh)));
    camTargetRef.current = {
      k,
      x: w / 2 - ((minX + maxX) / 2) * k,
      y: h / 2 - ((minY + maxY) / 2) * k,
    };
  }, []);

  const centerOn = useCallback(
    (id: string) => {
      const n = nodesRef.current.find((v) => v.id === id);
      const { w, h } = sizeRef.current;
      if (!n || !isFinite(n.x!)) return;
      const k = Math.max(camTargetRef.current.k, 0.95);
      camTargetRef.current = { k, x: w / 2 - n.x! * k, y: h / 2 - n.y! * k };
    },
    []
  );

  const zoomBy = useCallback((f: number) => {
    const { w, h } = sizeRef.current;
    const c = camTargetRef.current;
    const k = Math.max(0.15, Math.min(3.2, c.k * f));
    camTargetRef.current = { k, x: w / 2 - ((w / 2 - c.x) / c.k) * k, y: h / 2 - ((h / 2 - c.y) / c.k) * k };
  }, []);

  useImperativeHandle(handleRef, () => ({
    fit,
    reheat: (a = 0.75) => simRef.current?.alpha(a).restart(),
    centerOn,
    zoomBy,
  }));

  // frame the vault once the layout has opened up
  const fittedOnce = useRef(false);
  useEffect(() => {
    if (fittedOnce.current) return;
    fittedOnce.current = true;
    const a = window.setTimeout(() => fit(), 750);
    const b = window.setTimeout(() => fit(), 2400);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [fit]);

  /* ── draw loop ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let frames = 0;
    let fpsMark = performance.now();
    let fps = 60;
    let lastStat = performance.now();

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);
      const { w, h, dpr } = sizeRef.current;
      if (w < 2) return;
      const cam = camRef.current;
      const ct = camTargetRef.current;
      cam.x += (ct.x - cam.x) * 0.14;
      cam.y += (ct.y - cam.y) * 0.14;
      cam.k += (ct.k - cam.k) * 0.16;

      const nodes = nodesRef.current;
      const links = linksRef.current;
      const o = optsRef.current;
      const hover = hoverRef.current;
      const act = o.activeId;

      const focus = new Set<string>();
      // dimming follows the pointer (or an external highlight), never the mere selection
      const anyFocus = hover ?? null;
      if (anyFocus) {
        focus.add(anyFocus);
        for (const l of links) {
          const s = (l.source as SimNode).id;
          const t = (l.target as SimNode).id;
          if (s === anyFocus) focus.add(t);
          if (t === anyFocus) focus.add(s);
        }
        if (o.highlightIds) for (const id of o.highlightIds) focus.add(id);
      } else if (o.highlightIds) {
        for (const id of o.highlightIds) focus.add(id);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // ambient dot grid (screen space, subtle parallax with camera)
      const step = 42;
      const ox = ((cam.x % step) + step) % step;
      const oy = ((cam.y % step) + step) % step;
      ctx.fillStyle = "rgba(150,165,200,0.055)";
      for (let x = ox; x < w; x += step) {
        for (let y = oy; y < h; y += step) ctx.fillRect(x, y, 1.2, 1.2);
      }

      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.scale(cam.k, cam.k);

      const dimAll = !!anyFocus || (o.query.length > 0);

      // ── links ──
      for (let i = 0; i < links.length; i++) {
        const l = links[i];
        const s = l.source as SimNode;
        const t = l.target as SimNode;
        if (!isFinite(s.x!) || !isFinite(t.x!)) continue;
        const sx = s.x!;
        const sy = s.y!;
        const tx = t.x!;
        const ty = t.y!;
        const dx = tx - sx;
        const dy = ty - sy;
        const curve = l.kind === "tag" ? 0.05 : 0.1;
        const cx = (sx + tx) / 2 - dy * curve;
        const cy = (sy + ty) / 2 + dx * curve;

        const touched = anyFocus ? focus.has(s.id) && focus.has(t.id) : true;
        const unmatched = o.query.length > 0 && !(s.matched || t.matched);
        let alpha = l.kind === "tag" ? 0.16 : l.kind === "nested" ? 0.22 : 0.3;
        if (dimAll) alpha = touched && !unmatched ? 0.78 : 0.045;
        if (l.resolved === false) alpha *= 0.75;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cx, cy, tx, ty);
        ctx.lineWidth = (touched && dimAll ? 1.5 : 0.75) / Math.max(0.4, Math.min(cam.k, 1.6));
        ctx.strokeStyle = rgba(l.mix, alpha);
        if (!l.resolved) ctx.setLineDash([3 / cam.k, 3 / cam.k]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);

        // travelling energy particle
        if (o.particlesOn && (!dimAll || touched)) {
          const p = particlesRef.current[i];
          if (p) {
            p.t += p.sp;
            if (p.t > 1) p.t -= 1;
            const tt = p.t;
            const mt = 1 - tt;
            const px = mt * mt * sx + 2 * mt * tt * cx + tt * tt * tx;
            const py = mt * mt * sy + 2 * mt * tt * cy + tt * tt * ty;
            const pr = p.size * 2.2;
            const g = ctx.createRadialGradient(px, py, 0, px, py, pr * 2.4);
            g.addColorStop(0, rgba(l.mix, 0.95));
            g.addColorStop(1, rgba(l.mix, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(px, py, pr * 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ── nodes ──
      for (const n of nodes) {
        if (!isFinite(n.x!) || !isFinite(n.y!)) continue;
        const x = n.x!;
        const y = n.y!;
        const breathe = 1 + Math.sin(time / 1500 + n.id.length * 0.7 + x * 0.01) * 0.035;
        const r = n.r * breathe;
        const isFocus = focus.has(n.id);
        const isHover = hover === n.id;
        const isActive = act === n.id;
        const unmatched = o.query.length > 0 && !n.matched;
        const dim = (dimAll && !isFocus) || unmatched;
        const alpha = dim ? 0.14 : 1;

        // halo
        if (!dim) {
          const hg = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * (isHover || isActive ? 5.2 : 3.4));
          hg.addColorStop(0, rgba(mixHex(n.color, n.color), isHover || isActive ? 0.42 : 0.2));
          hg.addColorStop(1, rgba(mixHex(n.color, n.color), 0));
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(x, y, r * (isHover || isActive ? 5.2 : 3.4), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = alpha;

        if (n.kind === "tag") {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 4);
          const sz = r * 1.05;
          ctx.beginPath();
          ctx.rect(-sz, -sz, sz * 2, sz * 2);
          ctx.fillStyle = rgba(mixHex(n.color, "#1a1408"), 0.9);
          ctx.fill();
          ctx.lineWidth = 1 / cam.k;
          ctx.strokeStyle = rgba("227,176,98", 0.75);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          if (n.kind === "ghost") {
            ctx.fillStyle = "rgba(12,14,20,0.55)";
            ctx.fill();
            ctx.setLineDash([2.5 / cam.k, 2.5 / cam.k]);
            ctx.lineWidth = 1.2 / cam.k;
            ctx.strokeStyle = rgba("255,157,122", 0.75);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            const g = ctx.createLinearGradient(x, y - r, x, y + r);
            const [rr, gg, bb] = hexToRgb(n.color);
            g.addColorStop(0, `rgba(${Math.min(255, rr + 55)},${Math.min(255, gg + 55)},${Math.min(255, bb + 55)},0.98)`);
            g.addColorStop(1, `rgba(${Math.round(rr * 0.55)},${Math.round(gg * 0.55)},${Math.round(bb * 0.6)},0.96)`);
            ctx.fillStyle = g;
            ctx.fill();
            ctx.lineWidth = 1 / cam.k;
            ctx.strokeStyle = `rgba(255,255,255,${isHover || isActive ? 0.5 : 0.14})`;
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;

        // birth pulse
        const age = time - n.born;
        if (age > 0 && age < 900 && n.born > 0) {
          const p = age / 900;
          ctx.beginPath();
          ctx.arc(x, y, r + p * 26, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(mixHex(n.color, n.color), 0.5 * (1 - p));
          ctx.lineWidth = 1.4 / cam.k;
          ctx.stroke();
        }

        // active marker
        if (isActive) {
          const p = (time % 2200) / 2200;
          ctx.beginPath();
          ctx.arc(x, y, r + 6 + p * 18, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(242,217,168,${0.55 * (1 - p)})`;
          ctx.lineWidth = 1.6 / cam.k;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(242,217,168,0.95)";
          ctx.lineWidth = 1.5 / cam.k;
          ctx.stroke();
        }

        if (n.pinned) {
          ctx.beginPath();
          ctx.arc(x, y, r + 3.5, 0, Math.PI * 2);
          ctx.setLineDash([2 / cam.k, 2.4 / cam.k]);
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.lineWidth = 1 / cam.k;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // labels
        const bigEnough = cam.k * n.r > 4.6;
        if ((o.showLabels && bigEnough && !dim) || isHover || isActive || (dimAll && isFocus && !dim)) {
          const fs = Math.max(9, 11.5 / Math.max(0.55, Math.min(cam.k, 1.35)));
          ctx.font = `${isHover || isActive ? 600 : 500} ${fs}px "IBM Plex Sans", sans-serif`;
          const label = n.kind === "tag" ? `#${n.title}` : n.title;
          const ty = y + r + fs + 2;
          ctx.lineWidth = 3 / Math.max(0.6, cam.k);
          ctx.strokeStyle = "rgba(6,7,11,0.92)";
          ctx.textAlign = "center";
          ctx.strokeText(label, x, ty);
          ctx.fillStyle = isHover || isActive ? "#fff8ea" : dim ? "rgba(220,215,200,0.35)" : "rgba(226,222,210,0.92)";
          ctx.fillText(label, x, ty);
        }
      }

      ctx.restore();

      // vignette
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.78);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      // stats
      frames++;
      const nowT = performance.now();
      if (nowT - fpsMark > 500) {
        fps = (frames * 1000) / (nowT - fpsMark);
        frames = 0;
        fpsMark = nowT;
      }
      if (nowT - lastStat > 320) {
        lastStat = nowT;
        cbRef.current.onCamera?.({ ...cam });
        cbRef.current.onActivity?.({ alpha: simRef.current?.alpha() ?? 0, fps });
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── interaction ────────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hit = (sx: number, sy: number): SimNode | null => {
      const p = toWorld(sx, sy);
      const cam = camRef.current;
      let best: SimNode | null = null;
      let bestD = Infinity;
      for (const n of nodesRef.current) {
        if (!isFinite(n.x!)) continue;
        const d = Math.hypot(n.x! - p.x, n.y! - p.y);
        const rr = n.r + 6 / cam.k;
        if (d < rr && d < bestD) {
          best = n;
          bestD = d;
        }
      }
      return best;
    };

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const n = hit(sx, sy);
      dragRef.current = { id: n?.id ?? null, moved: 0, pan: !n };
      pointerRef.current = { x: sx, y: sy };
      if (n) {
        n.fx = n.x;
        n.fy = n.y;
        simRef.current?.alphaTarget(0.24).restart();
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const dx = sx - pointerRef.current.x;
      const dy = sy - pointerRef.current.y;
      const d = dragRef.current;

      if (d.id) {
        const p = toWorld(sx, sy);
        const n = nodesRef.current.find((v) => v.id === d.id);
        if (n) {
          n.fx = p.x;
          n.fy = p.y;
        }
        d.moved += Math.abs(dx) + Math.abs(dy);
      } else if (d.pan) {
        camRef.current.x += dx;
        camRef.current.y += dy;
        camTargetRef.current.x += dx;
        camTargetRef.current.y += dy;
        d.moved += Math.abs(dx) + Math.abs(dy);
      } else {
        const n = hit(sx, sy);
        const id = n?.id ?? null;
        if (id !== hoverRef.current) {
          hoverRef.current = id;
          cbRef.current.onHover?.(id);
          canvas.style.cursor = id ? "pointer" : "grab";
          if (id) setTooltip({ x: sx, y: sy, id });
          else setTooltip(null);
        } else if (id && tooltipRef.current?.id === id) {
          setTooltip({ x: sx, y: sy, id });
        }
      }
      pointerRef.current = { x: sx, y: sy };
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (d.id) {
        const n = nodesRef.current.find((v) => v.id === d.id);
        if (n && !n.pinned) {
          n.fx = null;
          n.fy = null;
        }
        simRef.current?.alphaTarget(0);
        if (d.moved < 4) cbRef.current.onSelect(d.id);
      }
      dragRef.current = { id: null, moved: 0, pan: false };
      canvas.style.cursor = hit(sx, sy) ? "pointer" : "grab";
    };

    const onLeave = () => {
      hoverRef.current = null;
      cbRef.current.onHover?.(null);
      setTooltip(null);
    };

    const onDbl = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const n = hit(sx, sy);
      if (n) {
        n.pinned = !n.pinned;
        if (n.pinned) {
          n.fx = n.x;
          n.fy = n.y;
        } else {
          n.fx = null;
          n.fy = null;
        }
        simRef.current?.alpha(0.4).restart();
      } else {
        cbRef.current.onCreateAt(toWorld(sx, sy));
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const c = camTargetRef.current;
      const factor = Math.exp(-e.deltaY * 0.0016);
      const k = Math.max(0.15, Math.min(3.4, c.k * factor));
      const wx = (sx - c.x) / c.k;
      const wy = (sy - c.y) / c.k;
      camTargetRef.current = { k, x: sx - wx * k, y: sy - wy * k };
      camRef.current = { ...camTargetRef.current };
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("dblclick", onDbl);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("dblclick", onDbl);
      canvas.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toWorld]);

  const tipNode = tooltip ? model.byId.get(tooltip.id) : null;

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_28%_18%,rgba(80,110,190,0.16),transparent_58%),radial-gradient(ellipse_at_78%_82%,rgba(227,176,98,0.12),transparent_55%)]" />
      <div className="grain pointer-events-none absolute inset-0 z-0" />
      <canvas ref={canvasRef} className="relative z-10 h-full w-full cursor-grab touch-none" />

      {tipNode && tooltip && (
        <div
          className="pointer-events-none absolute z-20 w-64 -translate-y-full rounded-xl border border-white/10 bg-ink-900/95 p-3 shadow-panel backdrop-blur-md anim-rise"
          style={{
            left: Math.min(Math.max(tooltip.x + 14, 8), (sizeRef.current.w || 400) - 268),
            top: Math.max(tooltip.y - 12, 120),
          }}
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: tipNode.color, boxShadow: `0 0 10px ${tipNode.color}` }} />
            <span className="font-display text-[15px] font-semibold text-parchment">{tipNode.title}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            <span>{tipNode.kind === "tag" ? "tag" : tipNode.kind === "ghost" ? "unresolved" : "note"}</span>
            <span>{tipNode.degree} links</span>
            {tipNode.words > 0 && <span>{tipNode.words} words</span>}
          </div>
          {tipNode.snippet && <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-parchment-dim">{tipNode.snippet}</p>}
        </div>
      )}
    </div>
  );
}
