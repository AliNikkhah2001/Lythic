"""Presentation — entry point `lythic`."""

from __future__ import annotations

import sys
from pathlib import Path


def main() -> None:
    """Launch Lythic vault window."""
    # Lazy import Qt so --help works without display
    from lythic.presentation.qt_compat import get_qt_binding

    vault_arg = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd() / "vault"
    print(f"Lythic vault: {vault_arg} (Qt: {get_qt_binding()})")
    print("Run with: uv run lythic [vault_path]  or  python -m lythic.presentation.main vault")
    # Full QMainWindow wired in m4-editor milestone — for now index demo
    from lythic.application.vault_service import VaultService

    svc = VaultService(vault_arg)
    count = svc.index_all()
    print(f"Indexed {count} notes → {vault_arg / '.lythic' / 'cache.db'}")
    g = svc.build_graph()
    print(f"Graph: {len(g.nodes)} nodes, {len(g.edges)} edges")
    results = svc.search("Lythic")
    print(f"Search 'Lythic': {results[:5]}")
    svc.close()


if __name__ == "__main__":
    main()
