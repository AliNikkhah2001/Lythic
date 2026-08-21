"""Infrastructure — Obsidian-flavored markdown parser.

Wraps markdown-it-py + python-frontmatter + custom wiki/callout plugins.
Domain port: MarkdownParser. Infra adapter: ObsidianMarkdownParser.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import frontmatter
from markdown_it import MarkdownIt

from lythic.domain.vault import Note, Tag, WikiLink

_WIKI_RE = re.compile(r"(!?)\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]")
_TAG_RE = re.compile(r"(?:^|[\s])(#[\w\/\-]+)")
_CALLOUT_RE = re.compile(r"^>\s*\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]", re.IGNORECASE)
_HEADING_RE = re.compile(r"^#{1,6}\s+(.+)$", re.MULTILINE)


class MarkdownParser(Protocol):
    """Domain port."""

    def parse(self, path: Path, raw: str, mtime: float) -> Note: ...


@dataclass(frozen=True, slots=True)
class ParsedMarkdown:
    """Intermediate parse result."""

    frontmatter: dict[str, object]
    content: str
    tags: tuple[Tag, ...]
    links: tuple[WikiLink, ...]
    headings: tuple[str, ...]


def _extract_frontmatter(raw: str) -> tuple[dict[str, object], str]:
    try:
        post = frontmatter.loads(raw)
        meta = dict(post.metadata) if isinstance(post.metadata, dict) else {}
        return meta, post.content
    except Exception:
        return {}, raw


def _extract_tags(content: str) -> tuple[Tag, ...]:
    seen: dict[str, Tag] = {}
    for m in _TAG_RE.finditer(content):
        raw = m.group(1).lstrip("#")
        if raw and raw not in seen:
            try:
                seen[raw] = Tag(name=raw)
            except ValueError:
                continue
    return tuple(seen.values())


def _extract_wikilinks(content: str) -> tuple[WikiLink, ...]:
    links: list[WikiLink] = []
    for m in _WIKI_RE.finditer(content):
        is_embed = m.group(1) == "!"
        target = m.group(2).strip()
        heading = m.group(3).strip() if m.group(3) else None
        alias = m.group(4).strip() if m.group(4) else None
        if not target:
            continue
        links.append(
            WikiLink(target=target, heading=heading, alias=alias, is_embed=is_embed, raw=m.group(0))
        )
    return tuple(links)


def _extract_headings(content: str) -> tuple[str, ...]:
    return tuple(m.group(1).strip() for m in _HEADING_RE.finditer(content))


def _word_count(content: str) -> int:
    return len(content.split())


class ObsidianMarkdownParser:
    """Obsidian-flavored parser — infra adapter.

    Also exposes markdown-it renderer for preview pane HTML.
    """

    def __init__(self) -> None:
        self._md = MarkdownIt("commonmark")
        # mdit-py-plugins can be added via .use() when needed (callouts/tasks)

    def parse(self, path: Path, raw: str, mtime: float) -> Note:
        fm, content = _extract_frontmatter(raw)
        tags = _extract_tags(content)
        links = _extract_wikilinks(content)
        headings = _extract_headings(content)
        content_hash = hashlib.sha1(raw.encode("utf-8")).hexdigest()
        return Note(
            path=path,
            mtime=mtime,
            content_hash=content_hash,
            raw_content=raw,
            frontmatter=fm,
            tags=tags,
            links=links,
            headings=headings,
            word_count=_word_count(content),
        )

    def render_html(self, markdown_text: str) -> str:
        """Render markdown to HTML for QWebEngine preview."""
        # Strip frontmatter for preview
        _, content = _extract_frontmatter(markdown_text)
        result: str = self._md.render(content)
        return result

    # Exposed for testing
    def extract_tags(self, content: str) -> tuple[Tag, ...]:
        return _extract_tags(content)

    def extract_wikilinks(self, content: str) -> tuple[WikiLink, ...]:
        return _extract_wikilinks(content)


def is_callout_line(line: str) -> bool:
    """Heuristic — used by Editor highlighter to style > [!NOTE]."""
    return bool(_CALLOUT_RE.match(line.strip()))
