@echo off
cd /d "%~dp0"
title 3D-Druck-Uebersicht
rem Versucht leise, Pillow zu installieren (fuer verkleinerte Bild-
rem Vorschaubilder bei sehr hochaufgeloesten Fotos/Druckvorlagen). Rein
rem optional - falls das fehlschlaegt (kein Internet, kein pip, etc.),
rem startet die App trotzdem ganz normal weiter, nur ohne diese Verkleinerung.
python -m pip install --quiet --disable-pip-version-check pillow >nul 2>&1
python app.py
pause
