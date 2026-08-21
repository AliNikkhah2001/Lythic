# PyInstaller spec — Lythic PySide6 (120MB) — ADR-001
# pyinstaller --windowed --name Lythic --icon assets/lythic.icns tools/build.spec
# then: codesign --deep --force --sign "Developer ID" dist/Lythic.app && xcrun notarytool submit dist/Lythic.zip --keychain-profile notary && create-dmg dist/Lythic.app
# hiddenimports cover markdown-it, watchdog, dulwich

block_cipher = None

a = Analysis(
    ['../lythic/presentation/main.py'],
    pathex=[],
    binaries=[],
    datas=[('../vault', 'vault'), ('../docs', 'docs')],
    hiddenimports=[
        'markdown_it',
        'mdit_py_plugins',
        'frontmatter',
        'watchdog.observers',
        'dulwich',
        'keyring',
        'pathspec',
        'networkx',
        'structlog',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='Lythic',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='Lythic',
)
