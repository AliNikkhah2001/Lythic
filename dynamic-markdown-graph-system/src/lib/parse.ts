/** Pure markdown utilities: frontmatter, wiki-links, tags, outline, stats. */

export interface WikiRef {
  target: string;
  alias?: string;
  heading?: string;
  raw: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const WIKI_RE = /\[\[([^\[\]\n]+?)\]\]/g;
const TAG_RE = /(?:^|\s)#([A-Za-z][\w\-]*(?:\/[\w\-]+)*)/g;
const FENCE_RE = /```[\s\S]*?(?:```|$)/g;
const INLINE_CODE_RE = /`[^`\n]*`/g;

export function splitFrontmatter(raw: string): {
  props: Record<string, string[]>;
  body: string;
  hasFrontmatter: boolean;
} {
  const m = raw.match(FRONTMATTER_RE);
  if (!m) return { props: {}, body: raw, hasFrontmatter: false };
  const props: Record<string, string[]> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (!key) continue;
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1);
    }
    const parts = value
      .split(",")
      .map((v) => v.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    props[key] = parts;
  }
  return { props, body: raw.slice(m[0].length), hasFrontmatter: true };
}

/** Blank out code so links/tags inside code are ignored. */
export function neutralizeCode(body: string): string {
  return body
    .replace(FENCE_RE, (m) => m.replace(/[^\n]/g, " "))
    .replace(INLINE_CODE_RE, (m) => " ".repeat(m.length));
}

export function extractWikiLinks(body: string): WikiRef[] {
  const clean = neutralizeCode(body);
  const out: WikiRef[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  WIKI_RE.lastIndex = 0;
  while ((m = WIKI_RE.exec(clean))) {
    const inner = m[1];
    const pipe = inner.indexOf("|");
    const head = pipe >= 0 ? inner.slice(0, pipe) : inner;
    const alias = pipe >= 0 ? inner.slice(pipe + 1).trim() : undefined;
    const hash = head.indexOf("#");
    const target = (hash >= 0 ? head.slice(0, hash) : head).trim();
    const heading = hash >= 0 ? head.slice(hash + 1).trim() : undefined;
    if (!target) continue;
    const key = `${target}::${heading ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ target, alias, heading, raw: m[0] });
  }
  return out;
}

export function extractTags(body: string, fmTags: string[] = []): string[] {
  const clean = neutralizeCode(body);
  const set = new Set<string>(fmTags.map((t) => t.replace(/^#/, "")));
  let m: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(clean))) {
    const tag = m[1];
    if (/^\d+$/.test(tag)) continue; // #123 is not a tag
    set.add(tag);
  }
  return [...set];
}

/** All ancestor tags too: a/b/c -> [a, a/b, a/b/c] */
export function expandTagHierarchy(tags: string[]): string[] {
  const set = new Set<string>();
  for (const t of tags) {
    const parts = t.split("/");
    for (let i = 1; i <= parts.length; i++) set.add(parts.slice(0, i).join("/"));
  }
  return [...set];
}

export function extractHeadings(body: string): { level: number; text: string }[] {
  const out: { level: number; text: string }[] = [];
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) out.push({ level: m[1].length, text: m[2].replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, "$1").trim() });
  }
  return out;
}

export function excerpt(body: string, max = 150): string {
  const clean = neutralizeCode(body)
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/[#>*_`]/g, "")
    .replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_m, t, _p, a) => a ?? t)
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? clean.slice(0, max).trimEnd() + "…" : clean;
}

export function wordCount(body: string): number {
  const clean = body.replace(/^---[\s\S]*?---/, "").trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

export interface ParsedNote {
  props: Record<string, string[]>;
  body: string;
  links: WikiRef[];
  tags: string[];
  headings: { level: number; text: string }[];
  words: number;
}

export function parseNote(raw: string): ParsedNote {
  const { props, body } = splitFrontmatter(raw);
  const links = extractWikiLinks(body);
  const tags = expandTagHierarchy(extractTags(body, props.tags ?? props.tag ?? []));
  return { props, body, links, tags, headings: extractHeadings(body), words: wordCount(body) };
}
