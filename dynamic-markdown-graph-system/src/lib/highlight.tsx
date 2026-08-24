import type { ReactNode } from "react";

const MASTER = new RegExp(
  [
    "(^---\\n[\\s\\S]*?\\n---)", // 1 frontmatter
    "(^#{1,6}\\s[^\\n]*)", // 2 heading line
    "(^\\s*(?:[-*+]|\\d+\\.)\\s)", // 3 list marker
    "(^>\\s?[^\\n]*)", // 4 quote line
    "(\\[\\[[^\\]\\n]*\\]\\])", // 5 wiki link
    "(`[^`\\n]+`)", // 6 inline code
    "(\\*\\*[^*\\n]+\\*\\*)", // 7 strong
    "((?<!\\*)\\*(?!\\*)[^*\\n]+\\*)", // 8 em
    "(?<=^|\\s)(#[A-Za-z][\\w\\-]*(?:\\/[\\w\\-]+)*)", // 9 tag
    "(^\\s*```[^\\n]*)", // 10 fence
  ].join("|"),
  "gm"
);

const WIKI_INNER = /^\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]$/;

export function highlightSource(raw: string, resolve: (t: string) => boolean): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  MASTER.lastIndex = 0;

  while ((m = MASTER.exec(raw))) {
    const start = m.index + (m[0].startsWith("\n") ? 1 : 0);
    const tok = m[0].startsWith("\n") ? m[0].slice(1) : m[0];
    if (start > last) out.push(raw.slice(last, start));
    const key = `t${i++}`;

    if (m[1]) {
      out.push(
        <span key={key} className="md-token-frontmatter">
          {tok}
        </span>
      );
    } else if (m[2]) {
      const hm = tok.match(/^(#{1,6}\s)(.*)$/);
      out.push(
        <span key={key} className="md-token-heading">
          <span className="md-token-hash">{hm?.[1] ?? ""}</span>
          {hm?.[2] ?? tok}
        </span>
      );
    } else if (m[3]) {
      out.push(
        <span key={key}>
          <span className="md-token-list">{tok}</span>
        </span>
      );
    } else if (m[4]) {
      out.push(
        <span key={key} className="md-token-quote">
          {tok}
        </span>
      );
    } else if (m[5]) {
      const inner = tok.match(WIKI_INNER);
      const target = inner?.[1]?.trim() ?? "";
      const exists = resolve(target);
      out.push(
        <span key={key} className={exists ? "md-token-link" : "md-token-link-broken"}>
          {tok}
        </span>
      );
    } else if (m[6]) {
      out.push(
        <span key={key} className="md-token-code">
          {tok}
        </span>
      );
    } else if (m[7]) {
      out.push(
        <span key={key} className="md-token-strong">
          {tok}
        </span>
      );
    } else if (m[8]) {
      out.push(
        <span key={key} className="md-token-em">
          {tok}
        </span>
      );
    } else if (m[9]) {
      out.push(
        <span key={key} className="md-token-tag">
          {tok}
        </span>
      );
    } else if (m[10]) {
      out.push(
        <span key={key} className="md-token-code">
          {tok}
        </span>
      );
    }
    last = start + tok.length;
  }
  if (last < raw.length) out.push(raw.slice(last));
  return out;
}
