"""Presentation — PreviewPane (QWebEngineView HTML preview)."""

from __future__ import annotations

from lythic.infrastructure.markdown_parser import ObsidianMarkdownParser


class PreviewPane:
    """Renders markdown to HTML via markdown-it."""

    def __init__(self, parser: ObsidianMarkdownParser | None = None) -> None:
        self.parser = parser or ObsidianMarkdownParser()
        self.html: str = ""

    def update_content(self, markdown_text: str) -> str:
        """Render and return HTML."""
        self.html = self.parser.render_html(markdown_text)
        return self.html

    def create_widget(self) -> object:
        """Create QWebEngineView when available (shared cost with GraphView)."""
        try:
            from PySide6.QtWebEngineWidgets import QWebEngineView

            view = QWebEngineView()
            view.setHtml(self.html or "<p>Preview</p>")
            return view
        except ImportError:
            return None
