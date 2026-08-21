"""Unit — wiki-link + tag + callout + frontmatter parser (TDD RED first)."""

from __future__ import annotations

from pathlib import Path

import pytest

from lythic.infrastructure.markdown_parser import ObsidianMarkdownParser, is_callout_line


@pytest.fixture
def parser() -> ObsidianMarkdownParser:
    return ObsidianMarkdownParser()


def test_should_parse_simple_wikilink(parser: ObsidianMarkdownParser) -> None:
    links = parser.extract_wikilinks("See [[Welcome to Lythic]] for intro")
    assert len(links) == 1
    assert links[0].target == "Welcome to Lythic"
    assert links[0].alias is None
    assert links[0].is_embed is False


def test_should_parse_wikilink_with_heading_and_alias(parser: ObsidianMarkdownParser) -> None:
    links = parser.extract_wikilinks("See [[Note#Heading|alias]]")
    assert links[0].target == "Note"
    assert links[0].heading == "Heading"
    assert links[0].alias == "alias"


def test_should_parse_embed_wikilink(parser: ObsidianMarkdownParser) -> None:
    links = parser.extract_wikilinks("![[EmbedMe]]")
    assert links[0].is_embed is True
    assert links[0].target == "EmbedMe"


def test_should_parse_tags(parser: ObsidianMarkdownParser) -> None:
    tags = parser.extract_tags("hello #tag #nested/tag world #tag")
    names = {t.name for t in tags}
    assert "tag" in names
    assert "nested/tag" in names
    assert len(tags) == 2  # deduped


def test_should_detect_callout_line() -> None:
    assert is_callout_line("> [!NOTE] Title") is True
    assert is_callout_line("  > [!WARNING] hi") is True
    assert is_callout_line("> normal quote") is False


def test_should_parse_frontmatter_and_note(parser: ObsidianMarkdownParser) -> None:
    raw = "---\ntitle: Hi\n---\n# Hello\nContent [[Link]] #tag"
    note = parser.parse(Path("test.md"), raw, mtime=1234.0)
    assert note.frontmatter.get("title") == "Hi"
    assert len(note.links) == 1
    assert note.word_count > 0
    assert note.mtime == 1234.0


def test_should_render_html_strips_frontmatter(parser: ObsidianMarkdownParser) -> None:
    html = parser.render_html("---\ntitle: x\n---\n# Title\n**bold**")
    assert "<h1" in html or "<h1>" in html or "Title" in html
    assert "title: x" not in html


def test_should_not_create_wikilink_for_empty_target(parser: ObsidianMarkdownParser) -> None:
    links = parser.extract_wikilinks("[[]]")
    assert len(links) == 0
