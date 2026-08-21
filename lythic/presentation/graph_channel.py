"""Presentation — Graph layout worker (QThread) + sigma.js WebGL switch."""

from __future__ import annotations

# mypy: ignore-errors
try:
    from PySide6.QtCore import QObject, QThread, Signal

    class LayoutWorker(QThread):
        """Off-main-thread spring_layout for 10k nodes."""

        finished = Signal(dict)

        def __init__(self, graph) -> None:
            super().__init__()
            self._graph = graph

        def run(self) -> None:  # type: ignore[override]
            result = self._graph.to_cytoscape_with_positions()
            self.finished.emit(result)

    class GraphChannel(QObject):
        """Channel for switching cose→sigma at 10k."""

        switchToSigma = Signal(bool)

        def __init__(self) -> None:
            super().__init__()
            self.threshold = 10000

        def should_use_sigma(self, node_count: int) -> bool:
            return node_count >= self.threshold

        def choose_renderer(self, node_count: int) -> str:
            return "sigma" if self.should_use_sigma(node_count) else "cytoscape"

except ImportError:  # pragma: no cover

    class LayoutWorker:  # type: ignore[no-redef]
        def __init__(self, graph) -> None:
            self._graph = graph

        def run(self) -> dict:
            return self._graph.to_cytoscape_with_positions()

    class GraphChannel:  # type: ignore[no-redef]
        threshold = 10000

        def should_use_sigma(self, node_count: int) -> bool:
            return node_count >= 10000

        def choose_renderer(self, node_count: int) -> str:
            return "sigma" if node_count >= 10000 else "cytoscape"
