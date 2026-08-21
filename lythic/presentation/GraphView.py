"""Presentation — GraphView (QWebEngineView + Cytoscape.js via QWebChannel)."""

from __future__ import annotations

import json
from pathlib import Path

from lythic.domain.vault import VaultGraph
from lythic.infrastructure.resources import assets_root, base_url


class GraphView:
    """Bridge Python VaultGraph → Cytoscape.js JSON."""

    def __init__(self) -> None:
        self.graph: VaultGraph | None = None
        self.cytoscape_json: dict[str, object] | None = None
        self.theme: str = "default"

    def set_theme(self, name: str) -> None:
        """Set active theme for graph rendering."""
        self.theme = name if name else "default"

    def set_graph(self, graph: VaultGraph) -> dict[str, object]:
        """Set graph and return Cytoscape JSON with spring_layout positions."""
        self.graph = graph
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
        bundle_path = assets_root() / "vendor/cytoscape.min.js"
        if bundle_path.exists():
            return bundle_path.read_text(encoding="utf-8")
        return ""

    def _read_asset(self, rel: str) -> str:
        """Read asset file content or empty string."""
        path = assets_root() / rel
        return path.read_text(encoding="utf-8") if path.exists() else ""

    def export_html(self, out_path: Path) -> Path:
        """Export Cytoscape HTML — full design system (tokens+glass+theme-manager)."""
        data_json = json.dumps(self.cytoscape_json or {"nodes": [], "edges": []})
        bundle_js = self._cytoscape_bundle()
        bundle_tag = (
            f"<script>{bundle_js}</script>"
            if bundle_js
            else '<script src="https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js"></script>'
        )
        tokens_css = self._read_asset("css/tokens.css")
        theme_css = self._read_asset(f"css/themes/{self.theme}.css")
        glass_css = self._read_asset("css/glass.css")
        components_css = self._read_asset("css/components.css")
        theme_js = self._read_asset("js/theme-manager.js")
        html = (
            "<!doctype html><html><head><meta charset='utf-8'>"
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            f"<style>{tokens_css}</style>"
            f"<style>{theme_css}</style>"
            f"<style>{glass_css}</style>"
            f"<style>{components_css}</style>"
            "<style>#cy{position:absolute;inset:0;width:100%;height:100vh}"
            "#info{position:absolute;top:12px;left:12px;z-index:10;"
            "padding:8px 14px;font-size:12px;color:var(--text)}"
            "</style>"
            f"{bundle_tag}"
            '<script src="qrc:///qtwebchannel/qwebchannel.js"></script>'
            f"<script>{theme_js}</script>"
            "</head><body data-theme='" + self.theme + "'>"
            "<div id='cy'></div>"
            "<div class='glass' id='info'>Lythic Graph</div>"
            f"<script>var data={data_json};"
            "var accent=getComputedStyle(document.documentElement)"
            ".getPropertyValue('--accent').trim()||'#38bdf8';"
            "var muted=getComputedStyle(document.documentElement)"
            ".getPropertyValue('--text-muted').trim()||'#94a3b8';"
            "var textColor=getComputedStyle(document.documentElement)"
            ".getPropertyValue('--text').trim()||'#e2e8f0';"
            "var cy=cytoscape({"
            'container:document.getElementById("cy"),'
            "elements:[...data.nodes,...data.edges],"
            'style:[{selector:"node",'
            'style:{"background-color":accent,"label":"data(label)",'
            '"color":textColor,"text-valign":"center",'
            '"text-halign":"center","font-size":"10px",'
            '"border-width":1,"border-color":"rgba(255,255,255,0.25)",'
            '"transition-property":"background-color","transition-duration":"120ms"}},'
            '{selector:"node:active",'
            'style:{"background-color":"#fbbf24"}},'
            '{selector:"edge",style:{"width":2,"line-color":muted,'
            '"target-arrow-color":muted,'
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
                html = tmp.read_text(encoding="utf-8")
                view.setHtml(html, base_url())
            return view
        except ImportError:
            return None
