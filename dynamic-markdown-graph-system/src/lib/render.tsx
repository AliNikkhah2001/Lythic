import type { ReactNode } from "react";

interface RenderOpts {
  onWiki: (target: string) => void;
  onTag: (tag: string) => void;
  resolve: (target: string) => boolean;
}

const INLINE_RE =
  /(\[\[[^\[\]\n]+\]\])|(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\s][^*\n]*\*)|((?:^|\s)#[A-Za-z][\w\-]*(?:\/[\w\-]+)*)|(\[[^\]\n]+\]\([^)\s]+\))|(https?:\/\/[^\s)]+)/g;

function renderInline(text: string, opts: RenderOpts, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  const push = (node: ReactNode) => out.push(node);

  while ((m = INLINE_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;

    if (m[1]) {
      const inner = tok.slice(2, -2);
      const pipe = inner.indexOf("|");
      const head = pipe >= 0 ? inner.slice(0, pipe) : inner;
      const alias = pipe >= 0 ? inner.slice(pipe + 1) : undefined;
      const hash = head.indexOf("#");
      const target = (hash >= 0 ? head.slice(0, hash) : head).trim();
      const exists = opts.resolve(target);
      push(
        <button
          key={k}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            opts.onWiki(target);
          }}
          title={exists ? target : `Create “${target}”`}
          className={
            exists
              ? "md-embed group/link relative rounded-[5px] px-1 -mx-1 text-[color:var(--link-c,#7fd4ff)] transition-colors hover:text-white"
              : "md-embed-broken group/link relative rounded-[5px] px-1 -mx-1 text-[#ff9d7a] transition-colors hover:text-white"
          }
        >
          <span className="opacity-40">[[</span>
          {alias ?? target}
          <span className="opacity-40">]]</span>
        </button>
      );
    } else if (m[2]) {
      push(
        <code key={k} className="rounded-[5px] bg-[#8ee6b8]/10 px-1.5 py-0.5 font-mono text-[0.86em] text-[#8ee6b8]">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (m[3]) {
      push(
        <strong key={k} className="font-semibold text-parchment">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (m[4]) {
      push(
        <em key={k} className="italic text-parchment-dim">
          {tok.slice(1, -1)}
        </em>
      );
    } else if (m[5]) {
      const lead = tok.startsWith(" ") || tok.startsWith("\n") ? tok[0] : "";
      const tag = tok.trim().slice(1);
      push(
        <span key={k}>
          {lead}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              opts.onTag(tag);
            }}
            className="md-tag rounded-full border border-gold/25 bg-gold/10 px-2 py-[1px] font-sans text-[0.74em] font-medium text-gold transition-all hover:border-gold/60 hover:bg-gold/20"
          >
            #{tag}
          </button>
        </span>
      );
    } else if (m[6]) {
      const mm = tok.match(/\[([^\]]+)\]\(([^)\s]+)\)/);
      if (mm) {
        push(
          <a
            key={k}
            href={mm[2]}
            target="_blank"
            rel="noreferrer"
            className="text-verdigris underline decoration-verdigris/30 underline-offset-2 transition-colors hover:decoration-verdigris"
          >
            {mm[1]}
          </a>
        );
      } else out.push(tok);
    } else if (m[7]) {
      const host = tok.replace(/^https?:\/\//, "").split("/")[0];
      push(
        <a
          key={k}
          href={tok}
          target="_blank"
          rel="noreferrer"
          className="text-verdigris/90 underline decoration-verdigris/25 underline-offset-2 transition-colors hover:text-verdigris"
        >
          {host}
          <span className="text-muted">↗</span>
        </a>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

interface Block {
  type: string;
  [k: string]: unknown;
}

function parseBlocks(body: string): Block[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  let listBuf: { indent: number; ordered: boolean; text: string }[] = [];

  const flushList = () => {
    if (listBuf.length) {
      blocks.push({ type: "list", items: listBuf });
      listBuf = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      flushList();
      const lang = line.trim().slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      blocks.push({ type: "code", lang, text: buf.join("\n") });
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushList();
      blocks.push({ type: "heading", level: h[1].length, text: h[2].trim() });
      i++;
      continue;
    }
    if (/^\s*([-*_])\s*\1\s*\1[\s-*_]*$/.test(line)) {
      flushList();
      blocks.push({ type: "hr" });
      i++;
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      flushList();
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push({ type: "quote", text: buf.join("\n") });
      continue;
    }
    const li = line.match(/^(\s*)(?:([-*+])|(\d+)\.)\s+(.*)$/);
    if (li) {
      listBuf.push({
        indent: Math.floor(li[1].replace(/\t/g, "  ").length / 2),
        ordered: !!li[3],
        text: li[4],
      });
      i++;
      continue;
    }
    if (!line.trim()) {
      flushList();
      i++;
      continue;
    }
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*(?:```|#{1,6}\s|>|[-*+]\s|\d+\.\s)/.test(lines[i])
    )
      buf.push(lines[i++]);
    flushList();
    blocks.push({ type: "para", text: buf.join(" ") });
  }
  flushList();
  return blocks;
}

const HEAD_STYLES: Record<number, string> = {
  1: "font-display text-[2.15rem] leading-[1.12] font-semibold tracking-[-0.015em] text-parchment",
  2: "font-display text-[1.55rem] leading-tight font-semibold tracking-[-0.01em] text-gold-soft",
  3: "font-display text-[1.18rem] font-semibold text-parchment",
  4: "text-[0.98rem] font-semibold tracking-wide text-parchment-dim uppercase",
  5: "text-[0.88rem] font-semibold tracking-wide text-muted uppercase",
  6: "text-[0.8rem] font-semibold tracking-[0.14em] text-muted uppercase",
};

export function renderMarkdown(body: string, opts: RenderOpts): ReactNode[] {
  const blocks = parseBlocks(body);
  const out: ReactNode[] = [];

  blocks.forEach((b, bi) => {
    const key = `b${bi}`;
    if (b.type === "heading") {
      const level = b.level as number;
      const Comp = (`h${Math.min(level, 6)}` as unknown) as "h1";
      out.push(
        <Comp
          key={key}
          id={`h-${(b.text as string).toLowerCase().replace(/[^\w]+/g, "-")}`}
          className={`${HEAD_STYLES[level]} mt-7 mb-3 first:mt-1 scroll-mt-6 group`}
        >
          <span className="mr-2 select-none font-mono text-[0.6em] text-gold/0 transition-colors group-hover:text-gold/60">
            §
          </span>
          {renderInline(b.text as string, opts, key)}
        </Comp>
      );
    } else if (b.type === "para") {
      out.push(
        <p key={key} className="mb-3.5 text-[15px] leading-[1.75] text-parchment-dim text-balance-pretty">
          {renderInline(b.text as string, opts, key)}
        </p>
      );
    } else if (b.type === "hr") {
      out.push(
        <div key={key} className="my-6 flex items-center gap-3 text-gold/40">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-white/12" />
          <span className="font-display text-xs">✦</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent via-white/12 to-white/12" />
        </div>
      );
    } else if (b.type === "quote") {
      out.push(
        <blockquote
          key={key}
          className="my-4 border-l-2 border-gold/50 bg-gradient-to-r from-gold/[0.07] to-transparent py-2 pl-4 pr-3 font-display text-[1.02rem] italic leading-relaxed text-parchment-dim"
        >
          {renderInline(b.text as string, opts, key)}
        </blockquote>
      );
    } else if (b.type === "code") {
      out.push(
        <pre
          key={key}
          className="my-4 overflow-x-auto scroll-thin rounded-lg border border-white/8 bg-ink-950/80 p-4 font-mono text-[12.5px] leading-relaxed text-[#9fdcc0]"
        >
          <code>{b.text as string}</code>
        </pre>
      );
    } else if (b.type === "list") {
      const items = b.items as { indent: number; ordered: boolean; text: string }[];
      const renderLevel = (start: number, depth: number): { nodes: ReactNode[]; next: number } => {
        const nodes: ReactNode[] = [];
        let idx = start;
        while (idx < items.length) {
          const it = items[idx];
          if (it.indent < depth) break;
          if (it.indent > depth) {
            const sub = renderLevel(idx, it.indent);
            nodes.push(<div key={`n${idx}`}>{sub.nodes}</div>);
            idx = sub.next;
            continue;
          }
          const ordered = it.ordered;
          const marker = ordered ? null : (
            <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold/70" />
          );
          nodes.push(
            <li key={`l${idx}`} className="group/li flex gap-2.5 py-[3px]">
              {marker ?? (
                <span className="mt-[0.28em] shrink-0 font-mono text-[0.78em] text-gold/60">
                  {String(idx - start + 1).padStart(2, "0")}
                </span>
              )}
              <span className="text-[14.5px] leading-[1.7] text-parchment-dim">
                {renderInline(it.text, opts, `l${idx}`)}
              </span>
            </li>
          );
          idx++;
        }
        return { nodes, next: idx };
      };
      out.push(
        <ul key={key} className="my-3 space-y-0.5 pl-1">
          {renderLevel(0, 0).nodes}
        </ul>
      );
    }
  });

  return out;
}
