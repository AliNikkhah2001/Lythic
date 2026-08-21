"""Unit — qt_compat shim."""

from __future__ import annotations


def test_should_return_binding_name() -> None:
    from lythic.presentation.qt_compat import get_qt_binding

    binding = get_qt_binding()
    assert binding in {"PySide6", "PyQt6", "none"}


def test_should_fallback_import() -> None:
    # Simulate PySide6 missing → fallback to PyQt6 path not tested here
    # Just ensure module imports
    import lythic.presentation.qt_compat as qc

    assert hasattr(qc, "Signal")
    assert hasattr(qc, "Slot")
