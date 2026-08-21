"""Presentation — ThemedWebView (QWebEngineView + glass CSS vars)."""

# mypy: ignore-errors
from __future__ import annotations

from pathlib import Path


class ThemedWebView:
    """Glass wrapper around QWebEngineView with theme vars."""

    def __init__(self) -> None:
        self._theme = "default"
        self._view: object | None = None

    def create_view(self, html: str) -> object:
        """Create QWebEngineView with html and QWebChannel."""
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
            themed_html = self._wrap_with_glass(html)
            base = Path(__file__).parent.parent / "assets/web"
            view.setHtml(themed_html, base.as_uri() + "/")
            self._view = view
            return view
        except ImportError:
            return None

    def _wrap_with_glass(self, inner: str) -> str:
        """Inject glass CSS vars (:root) into html."""
        glass_css = (
            ":root{--glass-bg:rgba(255,255,255,0.10);"
            "--glass-border:rgba(255,255,255,0.18);--color-accent:#38bdf8}"
            ".glass{background:var(--glass-bg);backdrop-filter:blur(16px) saturate(180%);"
            "border:1px solid var(--glass-border);border-radius:12px;"
            "box-shadow:0 8px 32px rgba(0,0,0,0.10)}"
            "[data-theme='glass']{--glass-bg:rgba(255,255,255,0.12)}"
        )
        if "<style>" in inner:
            return inner.replace("<style>", f"<style>{glass_css}", 1)
        return inner.replace("</head>", f"<style>{glass_css}</style></head>", 1)

    def set_theme(self, name: str) -> None:
        """Switch theme via JS without reload (<100ms)."""
        self._theme = name
        if self._view is None:
            return
        try:
            page = self._view.page()  # type: ignore[union-attr]
            if page is not None:
                page.runJavaScript(f"document.documentElement.setAttribute('data-theme','{name}')")
        except Exception:
            return
