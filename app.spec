# PyInstaller-Baurezept fuer die eigenstaendige Windows-.exe.
#
# Wird nicht direkt mit "python app.spec" ausgefuehrt, sondern ueber:
#   python -m PyInstaller --noconfirm app.spec
# (siehe build_exe.bat - normalerweise reicht ein Doppelklick darauf).
#
# Baut eine einzelne Datei ("onefile"), ohne sichtbares Konsolenfenster
# ("windowed"), mit dem static/-Ordner (HTML/CSS/JS) als mitgelieferte
# Ressource. Persistente Nutzerdaten (favorites.json usw.) werden bewusst
# NICHT mit eingepackt - die App legt sie beim ersten Start automatisch
# neben der .exe an (siehe APP_DIR in app.py).

# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ["app.py"],
    pathex=[],
    binaries=[],
    datas=[("static", "static")],
    hiddenimports=["webview.platforms.edgechromium", "webview.platforms.winforms"],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    cipher=block_cipher,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="3D-Druck-Sammlung",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon="app.ico",
)
