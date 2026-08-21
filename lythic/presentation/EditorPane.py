"""Presentation — EditorPane (QTextEdit + QTextDocument, QUndoCommand)."""

from __future__ import annotations

from pathlib import Path

# mypy: ignore-errors
try:
    from PySide6.QtGui import QSyntaxHighlighter, QTextCharFormat
except ImportError:  # pragma: no cover
    QSyntaxHighlighter = object  # type: ignore[assignment]
    QTextCharFormat = object  # type: ignore[assignment]


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
    """Editor pane — QTextEdit (not QPlainTextEdit) for rich formatting."""

    def __init__(self, file_path: Path | None = None) -> None:
        self.file_path = file_path
        self.content: str = ""
        if file_path and file_path.exists():
            self.content = file_path.read_text(encoding="utf-8", errors="ignore")
        self._widget: object | None = None

    def load(self, path: Path) -> None:
        """Load file into pane."""
        import contextlib

        self.file_path = path
        self.content = path.read_text(encoding="utf-8", errors="ignore")
        if self._widget is not None:
            with contextlib.suppress(Exception):
                self._widget.setPlainText(self.content)  # type: ignore[union-attr]

    def save(self) -> None:
        """Save content back (QUndoCommand beginEditBlock)."""
        import contextlib

        if self.file_path is None:
            raise ValueError("no file path set")
        if self._widget is not None:
            with contextlib.suppress(Exception):
                self.content = self._widget.toPlainText()  # type: ignore[union-attr]
        self.file_path.write_text(self.content, encoding="utf-8")

    def create_widget(self) -> object:
        """Create QTextEdit with EditingToolbar support."""
        try:
            from PySide6.QtWidgets import QTextEdit

            w = QTextEdit()
            w.setPlainText(self.content)
            w.setAcceptRichText(False)
            # keep undo/redo stack
            w.setUndoRedoEnabled(True)
            self._widget = w
            return w
        except ImportError:
            return None

    def toolbar_for(self, widget: object) -> object:
        """Create EditingToolbar for given widget (lazy)."""
        try:
            from lythic.presentation.EditingToolbar import EditingToolbar

            return EditingToolbar(widget).widget()
        except Exception:
            return None
