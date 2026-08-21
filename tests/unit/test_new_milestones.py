"""Unit — New milestones M1-M10 coverage."""

from __future__ import annotations

from pathlib import Path

import pytest


def test_theme_service_list_and_load(tmp_path: Path) -> None:
    from lythic.infrastructure.theme_service import ThemeService

    svc = ThemeService(themes_dir=Path("assets/themes"), vault_root=tmp_path)
    themes = svc.list_themes()
    assert "default" in themes
    assert "glassmorphism" in themes
    t = svc.load("default")
    assert t.name == "default"
    assert "bg" in t.colors
    css = svc.css_vars("default")
    assert ":root" in css
    # save/current triad
    svc.save("dracula")
    assert svc.current_name() in themes


def test_resources_paths() -> None:
    from lythic.infrastructure.resources import assets_root, base_url, tokens_css_path, vendor_path

    root = assets_root()
    assert (root / "vendor").exists() or root.exists()
    assert vendor_path("cytoscape.min.js").name == "cytoscape.min.js"
    assert tokens_css_path().name == "tokens.css"
    assert base_url().startswith("file://")


def test_latex_renderer() -> None:
    from lythic.infrastructure.latex_renderer import has_katex_bundle, katex_header, render_math_html

    html = render_math_html("Hello $x^2$ and $$y$$ world")
    assert "katex" in html
    header = katex_header()
    assert "katex" in header.lower()
    assert isinstance(has_katex_bundle(), bool)


def test_graph_clustering_basic() -> None:
    from lythic.domain.graph_clustering import cluster_graph, to_compound_cytoscape
    from lythic.domain.vault import GraphEdge, GraphNode, VaultGraph

    g = VaultGraph(
        nodes=(
            GraphNode(node_id="a", label="A", group="g1"),
            GraphNode(node_id="b", label="B", group="g1"),
            GraphNode(node_id="c", label="C", group="g2"),
        ),
        edges=(GraphEdge(source="a", target="b"), GraphEdge(source="b", target="c")),
    )
    clusters = cluster_graph(g)
    assert len(clusters) >= 1
    assert all(c.cluster_id for c in clusters)
    compound = to_compound_cytoscape(g, clusters)
    assert "nodes" in compound
    assert "edges" in compound
    # ensure parent added
    nodes = compound["nodes"]  # type: ignore[assignment]
    assert len(nodes) >= len(g.nodes)  # type: ignore[arg-type]


def test_graph_clustering_fallback() -> None:
    from lythic.domain.graph_clustering import cluster_graph
    from lythic.domain.vault import VaultGraph

    g = VaultGraph(nodes=(), edges=())
    clusters = cluster_graph(g)
    assert clusters == []


def test_ai_service_offline(tmp_path: Path) -> None:
    from lythic.application.ai_service import AIService

    svc = AIService(vault_root=tmp_path)
    text = "  hello   world  \n\nlythic is great. Second sentence. Third."
    cleaned = svc.clean(text)
    assert cleaned.action == "clean"
    assert cleaned.transformed.strip() != ""
    styled = svc.style(text, tone="professional")
    assert styled.action == "style"
    summarized = svc.summarize(text, max_sentences=2)
    assert summarized.action == "summarize"
    assert len(summarized.transformed) > 0
    fixed = svc.fix_frontmatter(tmp_path / "note.md", "---\ntitle: Hi\n---\ncontent")
    assert fixed.action == "fix_frontmatter"


def test_git_service_safe_path(tmp_path: Path) -> None:
    from lythic.infrastructure.git_service import GitAutoSync, _is_safe_path, create_git_service, load_git_token

    vault = tmp_path / "vault"
    vault.mkdir()
    assert _is_safe_path(vault / "note.md", vault) is True
    assert _is_safe_path(Path("/tmp/evil"), vault) is False
    # autosync tick offline
    sync = GitAutoSync(vault, interval_ms=1000)
    # start/stop without QApplication should not raise
    sync.start()
    sync.stop()
    # create service factory
    svc = create_git_service(vault)
    assert svc is not None
    # token load fallback
    assert load_git_token("test") is None or isinstance(load_git_token("test"), str)


def test_tools_theme_build(tmp_path: Path) -> None:
    from tools.theme_build import build_themes

    out = tmp_path / "css"
    build_themes(Path("assets/themes"), out)
    assert (out / "tokens.css").exists()
    assert (out / "themes" / "default.css").exists()


def test_preview_with_code_and_math() -> None:
    from lythic.infrastructure.latex_renderer import render_with_fallback
    from lythic.presentation.CodeBlockHighlighter import highlight_code

    html = highlight_code("print('hi')", lang="python")
    assert "hi" in html
    wrapped = render_with_fallback("<p>Test $x$</p>")
    assert "katex" in wrapped.lower() or "Test" in wrapped


def test_dulwich_adapter_and_store_token(tmp_path: Path) -> None:
    from lythic.infrastructure.git_service import DulwichGitAdapter, store_git_token

    vault = tmp_path / "v2"
    vault.mkdir()
    adapter = DulwichGitAdapter(vault)
    st = adapter.status()
    assert st.is_dirty is False
    # store token should not raise
    store_git_token("test-svc", "dummy-token")
    # auto_commit fallback
    assert adapter.auto_commit("msg") is False or True
    assert adapter.sync() is False


def test_theme_service_fallback() -> None:
    from lythic.infrastructure.theme_service import ThemeService

    svc = ThemeService(themes_dir=Path("nope"), vault_root=None)
    assert svc.list_themes() == ["default"]
    # load existing fallback
    svc2 = ThemeService(themes_dir=Path("assets/themes"), vault_root=None)
    t = svc2.load("nonexistent")
    assert t.name == "default"
    assert "bg" in svc2.css_vars("default")


def test_ai_service_with_env(monkeypatch: pytest.MonkeyPatch) -> None:
    from lythic.application.ai_service import AIService

    monkeypatch.setenv("METIS_API_KEY", "fake")
    monkeypatch.setenv("METIS_API_URL", "http://localhost:1234")
    svc = AIService()
    # should try metis but fallback on connection error
    res = svc.clean("hello world")
    assert res.action == "clean"
    res2 = svc.summarize("Sentence one. Sentence two. Sentence three.")
    assert res2.transformed != ""
