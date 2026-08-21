"""Qt compatibility shim — PySide6 primary (LGPL), PyQt6 fallback.

Enforces ADR-001: PySide6 only for MIT distribution. CI must grep `pyqtSignal` → fail.
Import everything via this module so the rest of `lythic/presentation/*` stays agnostic.
"""

from __future__ import annotations

try:
    from PySide6.QtCore import QObject as _QObject
    from PySide6.QtCore import QTimer as _QTimer
    from PySide6.QtCore import Signal as _Signal
    from PySide6.QtCore import Slot as _Slot

    QT_BINDING = "PySide6"
    Signal = _Signal
    Slot = _Slot
    QObject = _QObject
    QTimer = _QTimer
except ImportError:
    try:  # pragma: no cover — fallback for devs with PyQt6 only
        from PyQt6.QtCore import QObject as _QObject2
        from PyQt6.QtCore import QTimer as _QTimer2
        from PyQt6.QtCore import pyqtSignal as _PyQtSignal
        from PyQt6.QtCore import pyqtSlot as _PyQtSlot

        QT_BINDING = "PyQt6"
        Signal = _PyQtSignal
        Slot = _PyQtSlot
        QObject = _QObject2
        QTimer = _QTimer2
    except ImportError:  # pragma: no cover — headless/test fallback

        class _DummyQObject:
            pass

        class _DummyQTimer:
            @staticmethod
            def singleShot(*_args: object, **_kwargs: object) -> None:
                return None

        def _dummy_signal(*_args: object, **_kwargs: object) -> object:
            class _Sig:
                def connect(self, *_a: object, **_k: object) -> None:
                    return None

                def emit(self, *_a: object, **_k: object) -> None:
                    return None

            return _Sig()

        def _dummy_slot(*_args: object, **_kwargs: object):  # type: ignore[no-untyped-def]
            def deco(fn):  # type: ignore[no-untyped-def]
                return fn

            return deco

        QT_BINDING = "none"
        Signal = _dummy_signal
        Slot = _dummy_slot
        QObject = _DummyQObject
        QTimer = _DummyQTimer


def get_qt_binding() -> str:
    """Return active binding name for diagnostics."""
    return QT_BINDING
