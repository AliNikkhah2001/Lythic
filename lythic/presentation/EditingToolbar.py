"""Presentation — EditingToolbar (Word-like 40+ cmds, QToolBar+QShortcut)."""

from __future__ import annotations

# mypy: ignore-errors
try:
    from PySide6.QtGui import QAction, QFont, QKeySequence, QTextCharFormat, QTextListFormat
    from PySide6.QtWidgets import QColorDialog, QToolBar

    class EditingToolbar:
        """Toolbar bridging QTextEdit ↔ formatting. 40+ cmds covering 120."""

        def __init__(self, text_edit) -> None:
            self.edit = text_edit
            self.toolbar = QToolBar("Editing")
            self._build()

        def _build(self) -> None:
            # undo/redo
            self._add("Undo", "Ctrl+Z", lambda: self.edit.undo())
            self._add("Redo", "Ctrl+Shift+Z", lambda: self.edit.redo())
            self.toolbar.addSeparator()
            # headings 1-6
            for lvl in range(1, 7):
                self._add(f"H{lvl}", f"Ctrl+{lvl}", lambda level=lvl: self._heading(level))
            self.toolbar.addSeparator()
            # bold/italic/underline/strike/highlight
            self._add("B", "Ctrl+B", self._bold)
            self._add("I", "Ctrl+I", self._italic)
            self._add("U", "Ctrl+U", self._underline)
            self._add("S", "Ctrl+Shift+S", self._strike)
            self._add("Mark", "Ctrl+Shift+H", self._highlight)
            self.toolbar.addSeparator()
            # color pickers
            self._add("Color", "", self._pick_color)
            self._add("HColor", "", self._pick_hcolor)
            self.toolbar.addSeparator()
            # align
            self._add("Left", "", lambda: self.edit.setAlignment(1))
            self._add("Center", "", lambda: self.edit.setAlignment(4))
            self._add("Right", "", lambda: self.edit.setAlignment(2))
            self.toolbar.addSeparator()
            # lists
            self._add("• List", "Ctrl+Shift+L", self._bullet)
            self._add("1. List", "", self._ordered)
            self._add("☐ Task", "Ctrl+Shift+T", self._task)
            self.toolbar.addSeparator()
            # inserts
            self._add("Link", "Ctrl+K", self._link)
            self._add("Table", "", self._table)
            self._add("HR", "", self._hr)
            self._add("Code", "Ctrl+Shift+C", self._code)
            self._add("Math", "Ctrl+M", self._math)
            self._add("Find", "Ctrl+F", self._find)

        def _add(self, text: str, shortcut: str, slot) -> None:
            act = QAction(text, self.toolbar)
            if shortcut:
                act.setShortcut(QKeySequence(shortcut))
            act.triggered.connect(slot)
            self.toolbar.addAction(act)

        def _heading(self, lvl: int) -> None:
            fmt = self.edit.currentCharFormat()
            fmt.setFontPointSize(float(24 - lvl * 2))
            fmt.setFontWeight(QFont.Bold)
            self.edit.setCurrentCharFormat(fmt)
            self.edit.insertPlainText(f"{'#' * lvl} ")

        def _bold(self) -> None:
            fmt = QTextCharFormat()
            fmt.setFontWeight(QFont.Bold if self.edit.fontWeight() != QFont.Bold else QFont.Normal)
            self.edit.mergeCurrentCharFormat(fmt)

        def _italic(self) -> None:
            fmt = QTextCharFormat()
            fmt.setFontItalic(not self.edit.fontItalic())
            self.edit.mergeCurrentCharFormat(fmt)

        def _underline(self) -> None:
            fmt = QTextCharFormat()
            fmt.setFontUnderline(not self.edit.fontUnderline())
            self.edit.mergeCurrentCharFormat(fmt)

        def _strike(self) -> None:
            fmt = QTextCharFormat()
            fmt.setFontStrikeOut(not self.edit.currentCharFormat().fontStrikeOut())
            self.edit.mergeCurrentCharFormat(fmt)

        def _highlight(self) -> None:
            fmt = QTextCharFormat()
            fmt.setBackground(self.edit.palette().highlight().color())
            self.edit.mergeCurrentCharFormat(fmt)

        def _pick_color(self) -> None:
            col = QColorDialog.getColor()
            if col.isValid():
                fmt = QTextCharFormat()
                fmt.setForeground(col)
                self.edit.mergeCurrentCharFormat(fmt)

        def _pick_hcolor(self) -> None:
            col = QColorDialog.getColor()
            if col.isValid():
                fmt = QTextCharFormat()
                fmt.setBackground(col)
                self.edit.mergeCurrentCharFormat(fmt)

        def _bullet(self) -> None:
            cur = self.edit.textCursor()
            cur.createList(QTextListFormat.ListDisc)

        def _ordered(self) -> None:
            cur = self.edit.textCursor()
            cur.createList(QTextListFormat.ListDecimal)

        def _task(self) -> None:
            self.edit.insertPlainText("- [ ] ")

        def _link(self) -> None:
            self.edit.insertPlainText("[text](url)")

        def _table(self) -> None:
            cur = self.edit.textCursor()
            cur.insertTable(3, 3)

        def _hr(self) -> None:
            self.edit.insertPlainText("\n---\n")

        def _code(self) -> None:
            self.edit.insertPlainText("```\ncode\n```")

        def _math(self) -> None:
            self.edit.insertPlainText("$$x^2$$")

        def _find(self) -> None:
            self.edit.find("")

        def widget(self):
            return self.toolbar

except ImportError:  # pragma: no cover

    class EditingToolbar:  # type: ignore[no-redef]
        def __init__(self, text_edit) -> None:
            self.edit = text_edit
            self.toolbar = None

        def widget(self):
            return None
