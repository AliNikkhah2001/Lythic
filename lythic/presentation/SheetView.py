"""Presentation — SheetView (QTextTable tier1 + openpyxl tier2)."""

from __future__ import annotations

from pathlib import Path

# mypy: ignore-errors
try:
    from PySide6.QtWidgets import QTableView

    class SheetView:
        """Spreadsheet view: tier1 QTextTable, tier2 openpyxl QTableView."""

        def __init__(self) -> None:
            self._view: QTableView | None = None

        def create_table(self, rows: int = 3, cols: int = 3, parent=None):
            """Tier1: QTextTable via QTextCursor."""
            try:
                from PySide6.QtWidgets import QTextEdit

                edit = QTextEdit(parent)
                cur = edit.textCursor()
                cur.insertTable(rows, cols)
                return edit
            except Exception:
                return None

        def load_excel(self, path: Path, parent=None):
            """Tier2: load .xlsx via openpyxl into QTableView."""
            try:
                import openpyxl
                from PySide6.QtGui import QStandardItem, QStandardItemModel

                wb = openpyxl.load_workbook(path, data_only=True)
                ws = wb.active
                model = QStandardItemModel()
                view = QTableView(parent)
                for row in ws.iter_rows(values_only=True):  # type: ignore[union-attr]
                    items = [QStandardItem(str(c) if c is not None else "") for c in row]
                    model.appendRow(items)
                view.setModel(model)
                self._view = view
                return view
            except Exception:
                return self.create_table(parent=parent)

except ImportError:  # pragma: no cover

    class SheetView:  # type: ignore[no-redef]
        def create_table(self, rows=3, cols=3, parent=None):  # type: ignore[no-untyped-def]
            return None

        def load_excel(self, path, parent=None):  # type: ignore[no-untyped-def]
            return None
