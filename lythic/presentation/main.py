"""Presentation — entry point `lythic`."""

from __future__ import annotations

import sys
from pathlib import Path


def main() -> None:
    """Launch Lythic vault window. --headless for CLI index demo."""
    from lythic.presentation.qt_compat import get_qt_binding

    args = sys.argv[1:]
    headless = "--headless" in args
    # first non-flag is vault path
    vault_candidates = [a for a in args if not a.startswith("-")]
    if vault_candidates:
        vault_arg = Path(vault_candidates[0])
        # make vault path robust to cwd (was FileNotFound for themes)
        if not vault_arg.is_absolute() and not vault_arg.exists():
            repo_vault = Path(__file__).resolve().parents[2] / vault_arg
            if repo_vault.exists():
                vault_arg = repo_vault
    else:
        vault_arg = Path.cwd() / "vault"
        if not vault_arg.exists():
            repo_fallback = Path(__file__).resolve().parents[2] / "vault"
            if repo_fallback.exists():
                vault_arg = repo_fallback
    binding = get_qt_binding()
    print(f"Lythic vault: {vault_arg} (Qt: {binding})")

    if headless or binding == "none":
        print("Run: uv run lythic [vault] or python -m lythic.presentation.main --headless vault")
        from lythic.application.vault_service import VaultService

        svc = VaultService(vault_arg)
        count = svc.index_all()
        print(f"Indexed {count} notes → {vault_arg / '.lythic' / 'cache.db'}")
        g = svc.build_graph()
        print(f"Graph: {len(g.nodes)} nodes, {len(g.edges)} edges")
        results = svc.search("Lythic")
        print(f"Search 'Lythic': {results[:5]}")
        svc.close()
        return

    from lythic.presentation.app import run_app

    raise SystemExit(run_app(vault_arg))


if __name__ == "__main__":
    main()
