"""Presentation — ThemeBridge for QWebChannel (graph + theme)."""

# mypy: ignore-errors
from __future__ import annotations

try:
    from PySide6.QtCore import Property, QObject, Signal, Slot
except ImportError:  # pragma: no cover - headless fallback
    QObject = object  # type: ignore[assignment,misc]

    def Signal(*_a: object, **_k: object) -> object:  # type: ignore[no-redef]
        return None

    def Slot(*_a: object, **_k: object) -> object:  # type: ignore[no-redef]
        def deco(fn: object) -> object:
            return fn

        return deco

    def Property(*_a: object, **_k: object) -> object:  # type: ignore[no-redef]
        return None


class ThemeBridge(QObject):  # type: ignore[valid-type]
    """Exposed to JS via QWebChannel as `backend`."""

    themeChanged = Signal(str)  # type: ignore[assignment]
    graphReady = Signal(str)  # type: ignore[assignment]

    def __init__(self) -> None:
        super().__init__()  # type: ignore[call-arg]
        self._theme = "default"
        self._last_graph: str = ""

    def getTheme(self) -> str:
        """Return current theme name."""
        return self._theme

    @Slot(str)  # type: ignore[misc]
    def setTheme(self, name: str) -> None:
        """Called from JS to switch theme."""
        self._theme = name
        self.themeChanged.emit(name)  # type: ignore[attr-defined]

    @Slot(str)  # type: ignore[misc]
    def onGraphReady(self, node_ids_json: str) -> None:
        """JS notifies graph rendered."""
        self._last_graph = node_ids_json
        self.graphReady.emit(node_ids_json)  # type: ignore[attr-defined]

    currentTheme = Property(str, getTheme, setTheme, notify=themeChanged)  # type: ignore[assignment]
