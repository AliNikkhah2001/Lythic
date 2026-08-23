"""Presentation — PreviewPane (QWebEngineView HTML preview, glass design system)."""

from __future__ import annotations

from pathlib import Path

from lythic.infrastructure.latex_renderer import render_with_fallback
from lythic.infrastructure.markdown_parser import ObsidianMarkdownParser
from lythic.infrastructure.resources import assets_root, base_url


class PreviewPane:
    """Renders markdown to HTML via markdown-it with glass theme wrapper."""

    def __init__(self, parser: ObsidianMarkdownParser | None = None) -> None:
        self.parser = parser or ObsidianMarkdownParser()
        self.html: str = ""
        self.theme: str = "default"

    def set_theme(self, name: str) -> None:
        """Set active preview theme."""
        self.theme = name if name else "default"

    def _read_asset(self, rel: str) -> str:
        path = assets_root() / rel
        return path.read_text(encoding="utf-8") if path.exists() else ""

    def wrap_document(self, body_html: str) -> str:
        """Wrap rendered markdown in full glass document (tokens+glass+components)."""
        tokens_css = self._read_asset("css/tokens.css")
        theme_css = self._read_asset(f"css/themes/{self.theme}.css")
        glass_css = self._read_asset("css/glass.css")
        components_css = self._read_asset("css/components.css")
        theme_js = self._read_asset("js/theme-manager.js")
        return (
            "<!doctype html><html><head><meta charset='utf-8'>"
            f"<style>{tokens_css}</style>"
            f"<style>{theme_css}</style>"
            f"<style>{glass_css}</style>"
            f"<style>{components_css}</style>"
            "<style>.preview-body{max-width:760px;margin:0 auto;"
            "padding:var(--spacing-lg,24px)}</style>"
            f"<script>{theme_js}</script>"
            "</head><body data-theme='" + self.theme + "'>"
            f"<div class='preview-body'>{body_html}</div></body></html>"
        )

    def update_content(self, markdown_text: str) -> str:
        """Render and return themed HTML."""
        raw_html = self.parser.render_html(markdown_text)
        self.html = render_with_fallback(raw_html)
        return self.html

    def create_widget(self) -> object:
        """Create QWebEngineView when available (shared cost with GraphView)."""
        try:
            from PySide6.QtWebChannel import QWebChannel
            from PySide6.QtWebEngineWidgets import QWebEngineView

            from lythic.presentation.bridge.ThemeBridge import ThemeBridge

            view = QWebEngineView()
            channel = QWebChannel(view.page())
            bridge = ThemeBridge()
            channel.registerObject("backend", bridge)
            page = view.page()
            if page is not None:
                page.setWebChannel(channel)
            doc = self.wrap_document(self.html or "<p>Preview</p>")
            import tempfile

            tmp = Path(tempfile.gettempdir()) / "lythic-preview.html"
            tmp.write_text(doc, encoding="utf-8")
            view.setHtml(doc, base_url())
            return view
        except ImportError:
            return None
