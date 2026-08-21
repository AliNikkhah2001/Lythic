"""Presentation — CodeBlockHighlighter (Pygments + QSyntaxHighlighter)."""

from __future__ import annotations

# mypy: ignore-errors
try:
    from PySide6.QtGui import QColor, QSyntaxHighlighter, QTextCharFormat

    try:
        from pygments import highlight
        from pygments.formatters import HtmlFormatter
        from pygments.lexers import get_lexer_by_name, guess_lexer

        HAS_PYGMENTS = True
    except ImportError:
        HAS_PYGMENTS = False

    class CodeBlockHighlighter(QSyntaxHighlighter):
        """Highlights ``` fences via Pygments token mapping."""

        def __init__(self, parent) -> None:
            super().__init__(parent)
            self._fmt = QTextCharFormat()
            self._fmt.setForeground(QColor("#a5b4fc"))

        def highlightBlock(self, text: str) -> None:  # type: ignore[override]
            if text.strip().startswith("```"):
                self.setFormat(0, len(text), self._fmt)
            elif "```" in text:
                self.setFormat(text.index("```"), len(text), self._fmt)

    def highlight_code(code: str, lang: str = "python") -> str:
        """Return HTML via Pygments HtmlFormatter (preview pane)."""
        if not HAS_PYGMENTS:
            return f"<pre><code>{code}</code></pre>"
        try:
            lexer = get_lexer_by_name(lang, stripall=True)
        except Exception:
            try:
                lexer = guess_lexer(code)
            except Exception:
                lexer = get_lexer_by_name("text", stripall=True)
        formatter = HtmlFormatter(linenos=False, cssclass="highlight")
        return highlight(code, lexer, formatter)

except ImportError:  # pragma: no cover

    class CodeBlockHighlighter:  # type: ignore[no-redef]
        def __init__(self, parent=None) -> None:
            pass

    def highlight_code(code: str, lang: str = "python") -> str:  # type: ignore[no-redef]
        return f"<pre><code>{code}</code></pre>"

    HAS_PYGMENTS = False  # type: ignore[no-redef]
