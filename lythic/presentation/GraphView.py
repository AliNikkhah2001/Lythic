"""Presentation — GraphView (QWebEngineView + Cytoscape.js via QWebChannel)."""

from __future__ import annotations

import json
from pathlib import Path

from lythic.domain.vault import VaultGraph


class GraphView:
    """Bridge Python VaultGraph → Cytoscape.js JSON."""

    def __init__(self) -> None:
        self.graph: VaultGraph | None = None
        self.cytoscape_json: dict[str, object] | None = None

    def set_graph(self, graph: VaultGraph) -> dict[str, object]:
        """Set graph and return Cytoscape JSON."""
        self.graph = graph
        self.cytoscape_json = graph.to_cytoscape_json()
        return self.cytoscape_json

    def get_local_graph_json(self, center: str, depth: int = 2) -> dict[str, object]:
        """2-hop local graph around center."""
        if self.graph is None:
            raise ValueError("no graph set")
        local = self.graph.ego_graph(center, depth=depth)
        return local.to_cytoscape_json()

    def export_html(self, out_path: Path) -> Path:
        """Export Cytoscape HTML for QWebEngineView."""
        data_json = json.dumps(self.cytoscape_json or {"nodes": [], "edges": []})
        html = (
            '<!doctype html><html><head>'
            '<script src="https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js"></script>'
            '</head><body><div id="cy" style="width:100%;height:100vh"></div>'
            f'<script>var data={data_json};var cy=cytoscape({{'
            'container:document.getElementById("cy"),'
            'elements:[...data.nodes,...data.edges],'
            'style:[{selector:"node",style:{"label":"data(label)"}},'
            '{selector:"edge",style:{"width":2}}],'
            'layout:{name:"cose"}}});</script></body></html>'
        )
        out_path.write_text(html, encoding="utf-8")
        return out_path

    def create_widget(self) -> object:
        """Create QWebEngineView when available."""
        try:
            from PySide6.QtWebEngineWidgets import QWebEngineView

            view = QWebEngineView()
            if self.cytoscape_json:
                tmp = Path("/tmp/lythic-graph.html")
                self.export_html(tmp)
                view.load(tmp.as_uri())
            return view
        except ImportError:
            return None
