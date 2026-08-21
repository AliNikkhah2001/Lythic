"""Presentation — EditorPane (QPlainTextEdit + QSyntaxHighlighter)."""

from __future__ import annotations

from pathlib import Path

try:
    from PySide6.QtGui import QSyntaxHighlighter, QTextCharFormat
    from PySide6.QtWidgets import QPlainTextEdit
except ImportError:  # pragma: no cover
    QSyntaxHighlighter = object
    QTextCharFormat = object
    QPlainTextEdit = object


class ObsidianHighlighter:
    """Highlights wiki-links, tags, callouts."""

    def __init__(self, text: str) -> None:
        self.text = text

    def has_wikilink(self) -> bool:
        return "[[" in self.text

    def has_tag(self) -> bool:
        return "#" in self.text

    def has_callout(self) -> bool:
        return "> [!" in self.text


class EditorPane:
    """Editor pane — domain logic decoupled for testing."""

    def __init__(self, file_path: Path | None = None) -> None:
        self.file_path = file_path
        self.content: str = ""
        if file_path and file_path.exists():
            self.content = file_path.read_text(encoding="utf-8", errors="ignore")

    def load(self, path: Path) -> None:
        """Load file into pane."""
        self.file_path = path
        self.content = path.read_text(encoding="utf-8", errors="ignore")

    def save(self) -> None:
        """Save content back."""
        if self.file_path is None:
            raise ValueError("no file path set")
        self.file_path.write_text(self.content, encoding="utf-8")

    def create_widget(self) -> object:
        """Create Qt widget when available."""
        try:
            from PySide6.QtWidgets import QPlainTextEdit

            w = QPlainTextEdit()
            w.setPlainText(self.content)
            return w
        except ImportError:
            return None
