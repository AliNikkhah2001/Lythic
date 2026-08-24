import { colorOf, DISCIPLINES, type DisciplineId, type Vault } from "./palette";
import { parseNote } from "./parse";

export type NodeKind = "note" | "tag" | "ghost";

export interface GNode {
  id: string;
  kind: NodeKind;
  title: string;
  discipline?: DisciplineId;
  degree: number;
  tags: string[];
  snippet: string;
  color: string;
  modified: number;
  words: number;
}

export interface GLink {
  id: string;
  source: string;
  target: string;
  kind: "note" | "tag" | "nested";
  resolved: boolean;
}

export interface GraphOptions {
  showTags: boolean;
  showOrphans: boolean;
  showGhosts: boolean;
  query: string;
  active: Set<DisciplineId>;
}

export interface GraphModel {
  nodes: GNode[];
  links: GLink[];
  byId: Map<string, GNode>;
  adjacency: Map<string, Set<string>>;
}

export function buildGraph(vault: Vault, opts: GraphOptions): GraphModel {
  const parsed = new Map<string, ReturnType<typeof parseNote>>();
  for (const id of Object.keys(vault)) parsed.set(id, parseNote(vault[id].content));

  const byId = new Map<string, GNode>();
  const links: GLink[] = [];
  const adjacency = new Map<string, Set<string>>();
  const q = opts.query.trim().toLowerCase();

  const addNode = (n: GNode) => {
    if (!byId.has(n.id)) {
      byId.set(n.id, n);
      adjacency.set(n.id, new Set());
    }
    return byId.get(n.id)!;
  };
  const addLink = (l: GLink) => {
    links.push(l);
    adjacency.get(l.source)?.add(l.target);
    adjacency.get(l.target)?.add(l.source);
    const s = byId.get(l.source);
    const t = byId.get(l.target);
    if (s) s.degree += 1;
    if (t) t.degree += 1;
  };

  const tagIds = new Set<string>();

  for (const id of Object.keys(vault)) {
    const n = vault[id];
    const p = parsed.get(id)!;
    const matchesQuery =
      !q ||
      n.title.toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q));
    if (!opts.active.has(n.discipline)) continue;

    const node = addNode({
      id: n.id,
      kind: "note",
      title: n.title,
      discipline: n.discipline,
      degree: 0,
      tags: p.tags.filter((t) => !t.includes("/")),
      snippet: p.body.replace(/^---[\s\S]*?---/, "").slice(0, 220),
      color: colorOf(n.discipline),
      modified: n.modified,
      words: p.words,
    });
    (node as GNode & { matched?: boolean }).matched = matchesQuery;

    for (const ref of p.links) {
      const target = ref.target;
      const resolved = !!vault[target];
      if (!resolved && !opts.showGhosts) continue;
      if (!resolved) {
        addNode({
          id: target,
          kind: "ghost",
          title: target,
          degree: 0,
          tags: [],
          snippet: "",
          color: "#ff9d7a",
          modified: 0,
          words: 0,
        });
      } else if (!opts.active.has(vault[target].discipline)) continue;
      addLink({
        id: `${n.id}→${target}`,
        source: n.id,
        target,
        kind: "note",
        resolved,
      });
    }

    if (opts.showTags) {
      const leafTags = p.tags.filter((t) => t.split("/").length >= 1);
      for (const t of leafTags) {
        const tid = `#${t}`;
        tagIds.add(t);
        if (!byId.has(tid)) {
          addNode({
            id: tid,
            kind: "tag",
            title: t,
            degree: 0,
            tags: [],
            snippet: "",
            color: "#e3b062",
            modified: 0,
            words: 0,
          });
        }
        addLink({ id: `${n.id}→${tid}`, source: n.id, target: tid, kind: "tag", resolved: true });
      }
    }
  }

  if (opts.showTags) {
    for (const t of tagIds) {
      const parts = t.split("/");
      if (parts.length > 1) {
        const parent = parts.slice(0, -1).join("/");
        const pid = `#${parent}`;
        if (byId.has(pid) && byId.has(`#${t}`)) {
          addLink({ id: `${pid}→#${t}`, source: pid, target: `#${t}`, kind: "nested", resolved: true });
        }
      }
    }
  }

  let nodes = [...byId.values()];
  if (!opts.showOrphans) nodes = nodes.filter((n) => n.degree > 0 || n.kind !== "note");
  const filteredLinks = links.filter(
    (l) => byId.has(l.source) && byId.has(l.target) && nodes.some((n) => n.id === l.source) && nodes.some((n) => n.id === l.target)
  );

  return { nodes, links: filteredLinks, byId, adjacency };
}

export function neighborhood(graph: GraphModel, centerId: string, depth: number): Set<string> {
  const seen = new Set<string>([centerId]);
  let frontier = [centerId];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const nb of graph.adjacency.get(id) ?? []) {
        if (!seen.has(nb)) {
          seen.add(nb);
          next.push(nb);
        }
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return seen;
}

export function subgraph(graph: GraphModel, centerId: string, depth: number): GraphModel {
  const keep = neighborhood(graph, centerId, depth);
  const nodes = graph.nodes.filter((n) => keep.has(n.id));
  const links = graph.links.filter((l) => keep.has(l.source) && keep.has(l.target));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, Set<string>>();
  for (const n of nodes) adjacency.set(n.id, new Set());
  for (const l of links) {
    adjacency.get(l.source)?.add(l.target);
    adjacency.get(l.target)?.add(l.source);
  }
  return { nodes, links, byId, adjacency };
}

export interface VaultStats {
  notes: number;
  links: number;
  resolved: number;
  unresolved: number;
  orphans: number;
  tags: number;
  words: number;
  density: number;
  perDiscipline: { id: DisciplineId; name: string; color: string; notes: number; links: number }[];
  topLinked: { id: string; degree: number; color: string }[];
  linkCounts: { from: string; to: string; weight: number }[];
}

export function vaultStats(vault: Vault, graph: GraphModel): VaultStats {
  const parsed = new Map<string, ReturnType<typeof parseNote>>();
  let links = 0;
  let resolved = 0;
  let words = 0;
  const perDiscipline = Object.values(DISCIPLINES).map((d) => ({
    id: d.id,
    name: d.name,
    color: d.color,
    notes: 0,
    links: 0,
  }));
  const discIdx = new Map(perDiscipline.map((d, i) => [d.id, i]));
  const discOf = new Map<string, DisciplineId>();
  const pairs = new Map<string, number>();

  for (const id of Object.keys(vault)) {
    const n = vault[id];
    const p = parseNote(n.content);
    parsed.set(id, p);
    words += p.words;
    discOf.set(id, n.discipline);
    const di = discIdx.get(n.discipline);
    if (di !== undefined) perDiscipline[di].notes += 1;
    for (const ref of p.links) {
      links += 1;
      const ok = !!vault[ref.target];
      if (ok) {
        resolved += 1;
        if (di !== undefined) perDiscipline[di].links += 1;
        const key = [discOf.get(id)!, vault[ref.target].discipline].sort().join("·");
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
    }
  }

  const tagSet = new Set<string>();
  for (const p of parsed.values()) for (const t of p.tags) tagSet.add(t);

  const degrees = new Map<string, number>();
  for (const [a, set] of graph.adjacency) degrees.set(a, set.size);
  const orphans = Object.keys(vault).filter((id) => (degrees.get(id) ?? 0) === 0).length;

  const topLinked = [...degrees.entries()]
    .filter(([id]) => vault[id])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, degree]) => ({ id, degree, color: colorOf(vault[id].discipline) }));

  const n = Object.keys(vault).length;
  return {
    notes: n,
    links,
    resolved,
    unresolved: links - resolved,
    orphans,
    tags: tagSet.size,
    words,
    density: n > 1 ? resolved / (n * (n - 1)) : 0,
    perDiscipline: perDiscipline.filter((d) => d.notes > 0),
    topLinked,
    linkCounts: [...pairs.entries()]
      .map(([k, weight]) => {
        const [from, to] = k.split("·");
        return { from: DISCIPLINES[from as DisciplineId]?.name ?? from, to: DISCIPLINES[to as DisciplineId]?.name ?? to, weight };
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 7),
  };
}
