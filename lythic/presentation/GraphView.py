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
        """Set graph and return Cytoscape JSON with spring_layout positions."""
        self.graph = graph
        # use positions for deterministic layout, fallback to deduped JSON
        self.cytoscape_json = graph.to_cytoscape_with_positions()
        return self.cytoscape_json

    def get_local_graph_json(self, center: str, depth: int = 2) -> dict[str, object]:
        """2-hop local graph around center."""
        if self.graph is None:
            raise ValueError("no graph set")
        local = self.graph.ego_graph(center, depth=depth)
        return local.to_cytoscape_json()

    def _cytoscape_bundle(self) -> str:
        """Load local cytoscape.min.js bundle, fallback to empty if missing."""
        bundle_path = Path(__file__).parent.parent / "assets/web/vendor/cytoscape.min.js"
        if bundle_path.exists():
            return bundle_path.read_text(encoding="utf-8")
        alt = Path(__file__).resolve().parents[1] / "assets/web/vendor/cytoscape.min.js"
        if alt.exists():
            return alt.read_text(encoding="utf-8")
        return ""

    def export_html(self, out_path: Path) -> Path:
        """Export Cytoscape HTML for QWebEngineView (local bundle, glass theme)."""
        data_json = json.dumps(self.cytoscape_json or {"nodes": [], "edges": []})
        bundle_js = self._cytoscape_bundle()
        # inline bundle if available, otherwise CDN fallback
        bundle_tag = (
            f"<script>{bundle_js}</script>"
            if bundle_js
            else '<script src="https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js"></script>'
        )
        html = (
            "<!doctype html><html><head><meta charset='utf-8'>"
            "<style>"
            "html,body{margin:0;padding:0;height:100%;"
            "background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif}"
            "#cy{width:100%;height:100vh;"
            "background:radial-gradient(ellipse at top,#1e293b,#0f172a)}"
            ".glass{position:absolute;top:12px;left:12px;"
            "padding:8px 12px;border-radius:12px;"
            "background:rgba(255,255,255,0.10);"
            "backdrop-filter:blur(16px) saturate(180%);"
            "border:1px solid rgba(255,255,255,0.18);"
            "box-shadow:0 8px 32px rgba(0,0,0,0.10);font-size:12px}"
            "</style>"
            f"{bundle_tag}"
            '<script src="qrc:///qtwebchannel/qwebchannel.js"></script>'
            "</head><body><div id='cy'></div>"
            "<div class='glass' id='info'>Lythic Graph</div>"
            f"<script>var data={data_json};"
            "var cy=cytoscape({"
            'container:document.getElementById("cy"),'
            "elements:[...data.nodes,...data.edges],"
            'style:[{selector:"node",'
            'style:{"background-color":"#38bdf8","label":"data(label)",'
            '"color":"#e2e8f0","text-valign":"center",'
            '"text-halign":"center","font-size":"10px"}},'
            '{selector:"edge",style:{"width":2,"line-color":"#94a3b8",'
            '"target-arrow-color":"#94a3b8",'
            '"target-arrow-shape":"triangle","curve-style":"bezier"}}],'
            "layout:{name:'preset'}});"
            "if(typeof QWebChannel!=='undefined' && "
            "typeof qt!=='undefined'){"
            "new QWebChannel(qt.webChannelTransport,function(ch){"
            "if(ch.objects.backend){ch.objects.backend.onGraphReady("
            "JSON.stringify(cy.nodes().map(n=>n.id())));}});}"
            "var info=document.getElementById('info');"
            "info.textContent='Nodes:'+data.nodes.length+"
            "' Edges:'+data.edges.length;"
            "cy.on('tap','node',function(e){"
            "info.textContent=e.target.id()+' — '+e.target.data('label');});"
            "</script></body></html>"
        )
        out_path.write_text(html, encoding="utf-8")
        return out_path

    def create_widget(self) -> object:
        """Create QWebEngineView when available, with QWebChannel bridge."""
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
            if self.cytoscape_json:
                tmp = Path("/tmp/lythic-graph.html")
                self.export_html(tmp)
                # use setHtml with baseUrl for local vendor resolution + qrc
                html = tmp.read_text(encoding="utf-8")
                base_url = Path(__file__).parent.parent / "assets/web"
                view.setHtml(html, base_url.as_uri() + "/")
            return view
        except ImportError:
            return None
