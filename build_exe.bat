@echo off
cd /d "%~dp0"
title 3D-Druck-Sammlung - Programm bauen

echo.
echo Baue die eigenstaendige .exe ...
echo (Kann beim ersten Mal 1-2 Minuten dauern.)
echo.

python -m pip install --quiet --disable-pip-version-check -r requirements.txt
if errorlevel 1 (
    echo.
    echo FEHLER: Konnte die benoetigten Pakete nicht installieren.
    echo Ist Python installiert und beim Einrichten "Add to PATH" angehakt worden?
    echo Python gibt es kostenlos unter https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

python -m PyInstaller --noconfirm app.spec
if errorlevel 1 (
    echo.
    echo FEHLER: Der Bau ist fehlgeschlagen - siehe Meldungen oben.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Fertig! Die fertige .exe liegt jetzt hier:
echo   dist\3D-Druck-Sammlung.exe
echo.
echo Diese Datei kannst du an einen beliebigen Ort verschieben
echo (z.B. auf den Desktop) und per Doppelklick starten.
echo ============================================================
echo.
pause
