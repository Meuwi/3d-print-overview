#!/usr/bin/env python3
"""
3D-Druck-Uebersicht
Kleine lokale Web-App, die einen Ordner nach STL/3MF-Dateien durchsucht,
zusammengehoerige Dateien (Ordner, oder Ordner + zugehoerige lose 3MF-Datei)
zu "Projekten" gruppiert und eine uebersichtliche Galerie mit Vorschaubildern
anzeigt.

Start:
    python app.py                  # scannt den Standardordner (siehe DEFAULT_ROOT)
    python app.py C:\\pfad\\zu\\ordner  # scannt einen anderen Ordner

Danach im Browser oeffnen: http://localhost:8743
Keine Installation noetig - nutzt nur die Python-Standardbibliothek.
"""

import fnmatch
import glob
import io
import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import traceback
import uuid
import xml.etree.ElementTree as ET
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse
import urllib.error
import urllib.request

# Pillow ist optional (siehe Start.bat, versucht sie beim Start leise zu
# installieren) - wird nur benutzt, um sehr hochaufgeloeste Bilddateien (z.B.
# 20-Megapixel-Druckvorlagen) vor der Anzeige als Kachel zu verkleinern, damit
# der Browser sie nicht komplett in Originalgroesse laden/dekodieren muss.
# Ohne Pillow funktioniert alles weiterhin, Bilder werden dann einfach in
# Originalgroesse ausgeliefert (wie bisher).
try:
    from PIL import Image as PILImage

    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# pywebview ist optional: wird fuer das eigene Programmfenster (statt eines
# Browser-Tabs) verwendet, wenn die App als .exe gepackt ist (siehe app.spec
# und build_exe.bat). Ist es nicht installiert (z.B. beim Entwickeln/Testen
# hier im Projektordner ohne "pip install -r requirements.txt"), faellt die
# App automatisch auf den normalen Browser-Tab zurueck - kein Fehler.
try:
    import webview

    WEBVIEW_AVAILABLE = True
except ImportError:
    WEBVIEW_AVAILABLE = False

# ---------------------------------------------------------------------------
# Konfiguration
# ---------------------------------------------------------------------------

DEFAULT_ROOT = os.path.expanduser("~/Downloads")
PORT = 8743

# Versionsnummer dieser App - wird im Menue angezeigt und mit der neuesten
# GitHub-Release-Version verglichen (siehe check_for_update()). Bei jeder
# veroeffentlichten Aktualisierung hier erhoehen.
APP_VERSION = "1.0.1"

# GitHub-Repository, in dem die Updates (als Releases mit angehaengter .exe)
# veroeffentlicht werden, im Format "benutzername/repo-name". Solange hier
# noch der Platzhalter steht, ist die Update-Pruefung automatisch
# deaktiviert (kein Fehler, die App laeuft ganz normal weiter) - siehe
# UPDATE_SETUP.md fuer die Einrichtung.
UPDATE_REPO = "Meuwi/3d-print-overview"

# Pseudo-Quellen-ID fuer die "Alle"-Ansicht, die die Ergebnisse aller
# Bibliotheksordner gleichzeitig anzeigt (siehe combined_scan_result()).
ALL_ID = "__all__"

# Mehrere durchsuchbare Ordner, zwischen denen im Frontend umgeschaltet werden
# kann (siehe /api/sources, /api/switch-source), sowie die anzuzeigenden
# Dateitypen sind jetzt in library_config.json persistiert und ueber das
# "Bibliothek verwalten"-Popup im Frontend editierbar (siehe LibraryConfig
# weiter unten). Diese Listen hier sind nur die Werte fuer den allerersten
# Start, wenn noch keine Konfigurationsdatei existiert.
DEFAULT_SOURCES = [
    {"id": "downloads", "label": "Downloads", "path": DEFAULT_ROOT},
]
DEFAULT_FILETYPES = [
    {"ext": "stl", "label": "STL", "enabled": True, "builtin": True},
    {"ext": "3mf", "label": "3MF", "enabled": True, "builtin": True},
    {"ext": "f3d", "label": "F3D", "enabled": True, "builtin": True},
]
# Allgemeine Darstellungs-Einstellungen (per "Bibliothek verwalten"- bzw.
# Menue-Popup umschaltbar). render3d: Live-3D-Rendering der Kachel-
# Vorschaubilder im Browser (fuer STL-Dateien und 3MF-Dateien ohne
# eingebettetes Slicer-Bild) - auf langsamen Rechnern ausschaltbar, zeigt
# dann nur ein Platzhalterbild. theme: "system" | "light" | "dark".
# language: "de" | "en".
DEFAULT_SETTINGS = {"render3d": True, "theme": "system", "language": "de", "auto_backup": False, "default_slicer": ""}

# Erlaubte Werte fuer die nicht-booleschen Einstellungen (siehe /api/set-setting) -
# schuetzt vor Muell in der Konfigurationsdatei bei einer fehlerhaften Anfrage.
SETTING_CHOICES = {
    "theme": {"system", "light", "dark"},
    "language": {"de", "en"},
}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
# Bildformate, die Pillow oeffnen/verkleinern kann (SVG ist Vektorgrafik, GIF
# koennte animiert sein - beide unveraendert lassen statt neu zu encodieren).
IMAGE_THUMB_RESIZABLE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
IMAGE_THUMB_MAX_DIM = 640  # laengste Kante der verkleinerten Vorschau in Pixeln

# Vorgefertigter Katalog bekannter, aber nicht eingebauter Dateitypen fuers
# "Bibliothek verwalten"-Popup (siehe /api/known-filetypes) - per Klick
# aktivierbar statt die Endung manuell eintippen zu muessen. Nutzt intern
# exakt dieselben LibraryConfig.add_filetype/toggle_filetype-Methoden wie ein
# manuell hinzugefuegter Dateityp; "category" ist rein informativ fuers
# gruppierte Frontend-Layout. Bilddateien (Kategorie "images") werden im
# Scanner unabhaengig von model_exts IMMER als Thumbnail-Kandidat erfasst
# (siehe IMAGE_EXTS/_walk_dir_collect) - als Filetype aktiviert erscheinen
# sie zusaetzlich als eigene, klickbare Datei-Kachel.
KNOWN_FILETYPES = {
    "models": [
        {"ext": "obj", "label": "OBJ"},
        {"ext": "ply", "label": "PLY"},
        {"ext": "amf", "label": "AMF"},
    ],
    "print_jobs": [
        {"ext": "gcode", "label": "G-Code"},
        {"ext": "bgcode", "label": "BG-Code"},
        {"ext": "ctb", "label": "CTB"},
        {"ext": "goo", "label": "GOO"},
    ],
    "cad_sources": [
        {"ext": "step", "label": "STEP"},
        {"ext": "stp", "label": "STP"},
        {"ext": "fcstd", "label": "FreeCAD"},
        {"ext": "scad", "label": "OpenSCAD"},
        {"ext": "iges", "label": "IGES"},
        {"ext": "igs", "label": "IGS"},
        {"ext": "dxf", "label": "DXF"},
    ],
    "images": [
        {"ext": "jpg", "label": "JPG"},
        {"ext": "jpeg", "label": "JPEG"},
        {"ext": "png", "label": "PNG"},
        {"ext": "webp", "label": "WebP"},
        {"ext": "gif", "label": "GIF"},
        {"ext": "svg", "label": "SVG"},
    ],
}

DEFAULT_EXCLUDES = {"extensions": [], "patterns": []}

# Dateiendungen, die sich sinnvoll in einem Slicer oeffnen lassen (Modell-
# bzw. CAD-Quelldateien - Bilddateien, G-Code-Auftraege etc. nicht).
SLICER_OPENABLE_EXTS = {"stl", "3mf", "obj", "step", "stp", "amf", "ply"}

# Die vier verbreitetsten Slicer/Editoren fuers 3D-Druck-Community, siehe
# /api/slicers. "candidates" sind ueblicherweise Installationspfade auf
# Windows (per Umgebungsvariable + optional Versions-Wildcard, da manche
# Installer den Programmordner mit Versionsnummer benennen). Wird beim
# Aufruf von /api/slicers automatisch durchsucht, falls kein manuell
# festgelegter Pfad in library_config.json hinterlegt ist (oder der
# hinterlegte Pfad nicht mehr existiert).
SLICER_DEFS = [
    {
        "id": "bambustudio",
        "label": "Bambu Studio",
        "candidates": [
            r"%PROGRAMFILES%\Bambu Studio\bambu-studio.exe",
            r"%PROGRAMFILES%\Bambu Studio*\bambu-studio.exe",
            r"%LOCALAPPDATA%\Programs\Bambu Studio\bambu-studio.exe",
            r"%LOCALAPPDATA%\BambuStudio\bambu-studio.exe",
            "/Applications/BambuStudio.app/Contents/MacOS/BambuStudio",
        ],
    },
    {
        "id": "prusaslicer",
        "label": "PrusaSlicer",
        "candidates": [
            r"%PROGRAMFILES%\Prusa3D\PrusaSlicer\prusa-slicer.exe",
            r"%PROGRAMFILES(X86)%\Prusa3D\PrusaSlicer\prusa-slicer.exe",
            r"%LOCALAPPDATA%\Programs\PrusaSlicer\prusa-slicer.exe",
            "/Applications/PrusaSlicer.app/Contents/MacOS/PrusaSlicer",
        ],
    },
    {
        "id": "cura",
        "label": "Cura",
        "candidates": [
            r"%PROGRAMFILES%\Ultimaker Cura*\UltiMaker-Cura.exe",
            r"%PROGRAMFILES%\Ultimaker Cura*\Cura.exe",
            r"%LOCALAPPDATA%\Programs\Ultimaker Cura*\UltiMaker-Cura.exe",
            "/Applications/Ultimaker Cura.app/Contents/MacOS/Ultimaker-Cura",
            "/Applications/UltiMaker Cura.app/Contents/MacOS/UltiMaker-Cura",
        ],
    },
    {
        "id": "orcaslicer",
        "label": "OrcaSlicer",
        "candidates": [
            r"%LOCALAPPDATA%\Programs\OrcaSlicer\orca-slicer.exe",
            r"%PROGRAMFILES%\OrcaSlicer\orca-slicer.exe",
            r"%PROGRAMFILES%\OrcaSlicer*\orca-slicer.exe",
            "/Applications/OrcaSlicer.app/Contents/MacOS/OrcaSlicer",
        ],
    },
]

# "" (kein Standard-Slicer gewaehlt) + alle bekannten Slicer-IDs - siehe
# /api/set-setting?key=default_slicer.
SETTING_CHOICES["default_slicer"] = {""} | {s["id"] for s in SLICER_DEFS}


def detect_slicer_path(slicer_id):
    """Sucht an den ueblichen Installationsorten nach dem Slicer und gibt
    den ersten gefundenen, tatsaechlich vorhandenen Pfad zurueck (oder None).
    Umgebungsvariablen wie %PROGRAMFILES% werden aufgeloest, "*"-Platzhalter
    (z.B. fuer versionsnummerierte Cura-Ordner) per glob durchsucht - dabei
    wird bei mehreren Treffern die zuletzt geaenderte (= vermutlich neueste)
    Installation bevorzugt."""
    defn = next((s for s in SLICER_DEFS if s["id"] == slicer_id), None)
    if not defn:
        return None
    for pattern in defn["candidates"]:
        expanded = os.path.expandvars(pattern)
        if "*" in expanded:
            matches = glob.glob(expanded)
            matches = [m for m in matches if os.path.isfile(m)]
            if matches:
                matches.sort(key=lambda m: os.path.getmtime(m), reverse=True)
                return matches[0]
        elif os.path.isfile(expanded):
            return expanded
    return None

# Bevorzugte Pfade fuer eingebettete 3MF-Vorschaubilder (in dieser Reihenfolge probieren)
THUMB_CANDIDATES = [
    "Metadata/plate_1.png",
    "Metadata/plate_no_light_1.png",
    "Auxiliaries/.thumbnails/thumbnail_middle.png",
    "Metadata/thumbnail.png",
    "Auxiliaries/.thumbnails/thumbnail_small.png",
    "Auxiliaries/.thumbnails/thumbnail_3mf.png",
]

# .f3d-Dateien sind ebenfalls ZIP-Archive (Fusion-360-Projektarchiv) und
# enthalten ueblicherweise ein Vorschaubild unter ".../Previews/small.png".
# Der Ordnername davor ("FusionAssetName[Active]" o.ae.) kann variieren,
# daher wird per Endung gesucht statt per festem Pfad.
F3D_PREVIEW_SUFFIX = "previews/small.png"

# Als .exe gepackt (siehe app.spec/PyInstaller) zeigt __file__ auf einen
# temporaeren Entpack-Ordner (sys._MEIPASS), der nach jedem Beenden wieder
# verschwindet. Das mitgelieferte static/-Verzeichnis (reine, unveraenderliche
# Programmressource) darf dort ruhig liegen - RESOURCE_DIR zeigt darauf.
# Dauerhafte Nutzerdaten (favorites.json, notes.json, Papierkorb, Backups,
# ...) muessen dagegen an einem stabilen Ort liegen, der zwischen Programm-
# starts erhalten bleibt: direkt neben der eigentlichen .exe-Datei -
# APP_DIR zeigt darauf. Im normalen (nicht gepackten) Python-Lauf sind beide
# identisch (der Ordner, in dem app.py liegt).
if getattr(sys, "frozen", False):
    APP_DIR = os.path.dirname(os.path.abspath(sys.executable))
    RESOURCE_DIR = sys._MEIPASS
else:
    APP_DIR = os.path.dirname(os.path.abspath(__file__))
    RESOURCE_DIR = APP_DIR

STATIC_DIR = os.path.join(RESOURCE_DIR, "static")
FAVORITES_FILE = os.path.join(APP_DIR, "favorites.json")
LIBRARY_CONFIG_FILE = os.path.join(APP_DIR, "library_config.json")
NOTES_FILE = os.path.join(APP_DIR, "notes.json")
TRASH_FILE = os.path.join(APP_DIR, "trash.json")
TRASH_DIR = os.path.join(APP_DIR, ".trash")
TRASH_MAX_AGE_DAYS = 30  # danach werden Papierkorb-Eintraege endgueltig geloescht
TAGS_FILE = os.path.join(APP_DIR, "tags.json")
AUTO_BACKUP_DIR = os.path.join(APP_DIR, "backups")
AUTO_BACKUP_KEEP = 14  # so viele taegliche Auto-Sicherungen werden aufbewahrt, aeltere geloescht
AUTO_BACKUP_CHECK_INTERVAL = 3600  # Sekunden zwischen zwei Pruefungen, ob eine neue Sicherung faellig ist

# Maximale Laenge eines gespeicherten Notiz-Textes (Schutz vor Missbrauch ueber
# die Query-String-Schnittstelle - fuer normale Druckeinstellungs-Notizen
# mehr als ausreichend).
MAX_NOTE_LENGTH = 4000

# Wird in main() gesetzt und danach von den Scan-/Gruppierungsfunktionen
# gelesen (LIBRARY.enabled_exts()), damit aktivierte/deaktivierte bzw. vom
# Nutzer selbst hinzugefuegte Dateitypen sofort beim naechsten Scan wirken.
LIBRARY = None

# ---------------------------------------------------------------------------
# Hilfsfunktionen: Normalisierung & Gruppierung
# ---------------------------------------------------------------------------


def strip_ext(name: str) -> str:
    root, ext = os.path.splitext(name)
    return root if ext.lower() in LIBRARY.enabled_exts() else name


def normalize_key(name: str) -> str:
    """Erzeugt einen Vergleichsschluessel, damit z.B. 'Foo.3mf' und
    'Foo_stls' (bzw. 'Foo+stls (1)') als dasselbe Projekt erkannt werden."""
    s = strip_ext(name)
    try:
        s = unquote(s)
    except Exception:
        pass
    s = s.replace("+", " ")
    # Reihenfolge wichtig: erst die " (1)"-Kopie-Endung entfernen, DANN "_stls" -
    # sonst wird z.B. "Foo_stls (1)" nicht mit "Foo_stls" bzw. "Foo.3mf" gematcht.
    s = re.sub(r"\s*\(\d+\)\s*$", "", s)
    s = re.sub(r"[_\s]+stls$", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s*\(\d+\)\s*$", "", s)
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s or name.lower()


def pretty_name(name: str) -> str:
    s = strip_ext(name)
    try:
        s = unquote(s)
    except Exception:
        pass
    s = s.replace("+", " ")
    s = re.sub(r"\s*\(\d+\)\s*$", "", s)
    s = re.sub(r"[_\s]+stls$", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s+", " ", s).strip()
    return s or name


def path_overlap(a: str, b: str) -> str:
    """Vergleicht zwei absolute Ordnerpfade und meldet, ob sie sich
    ueberschneiden wuerden - wichtig beim Hinzufuegen eines Bibliothekordners,
    damit nicht derselbe Ordner (oder ein Unterordner eines bereits
    vorhandenen Hauptordners) ein zweites Mal hinzugefuegt wird, was sonst zu
    doppelt eingelesenen Dateien fuehren wuerde. Gibt "same" (identisch),
    "a_in_b" (a liegt unterhalb von b), "b_in_a" (b liegt unterhalb von a)
    oder "" (keine Ueberschneidung) zurueck."""
    norm_a = os.path.normcase(os.path.normpath(a))
    norm_b = os.path.normcase(os.path.normpath(b))
    if norm_a == norm_b:
        return "same"
    if norm_a.startswith(norm_b + os.sep):
        return "a_in_b"
    if norm_b.startswith(norm_a + os.sep):
        return "b_in_a"
    return ""


def human_size(n: int) -> str:
    size = float(n)
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size < 1024 or unit == "TB":
            return f"{size:.0f} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


def format_duration_h(seconds) -> str:
    """z.B. 3723 -> '1h 02min'."""
    try:
        total_min = round(int(seconds) / 60)
    except (TypeError, ValueError):
        return ""
    h, m = divmod(total_min, 60)
    if h and m:
        return f"{h}h {m:02d}min"
    if h:
        return f"{h}h"
    return f"{m}min"


def annotate_duplicates(groups):
    """Markiert Dateien, die (nach Name + Groesse) mehrfach in der uebergebenen
    Gruppenliste vorkommen (z.B. dieselbe Datei in zwei verschiedenen
    Projektordnern) mit einem 'dup_count'-Feld (>1, wenn Duplikate existieren).
    Wird sowohl je Einzel-Quelle (_scan_impl) als auch nochmal ueber die
    zusammengefuehrte "Alle Ordner"-Ansicht (combined_scan_result) aufgerufen,
    da eine Datei erst quellenuebergreifend als Duplikat auffallen kann."""
    counts = {}
    for g in groups:
        for f in g["files"]:
            sig = (f["name"].lower(), f["size"])
            counts[sig] = counts.get(sig, 0) + 1
    for g in groups:
        for f in g["files"]:
            sig = (f["name"].lower(), f["size"])
            f["dup_count"] = counts[sig]


# ---------------------------------------------------------------------------
# Scanner
# ---------------------------------------------------------------------------


# Sicherheitsbremse: Ordner, die (noch) keine Modell-Datei enthalten und mehr
# als so viele Dateien haben, werden abgebrochen statt komplett durchsucht zu
# werden. Verhindert, dass ein einzelner riesiger, themenfremder Ordner (z.B.
# ein Node-Modules- oder Foto-Ordner) den ganzen Scan lahmlegt.
MAX_FILES_PER_TOPLEVEL_DIR = 40000


class Scanner:
    def __init__(self, root):
        self.root = os.path.abspath(root)
        self._lock = threading.Lock()
        self._cache = None  # letztes fertiges Scan-Ergebnis
        self._status = "idle"  # idle | scanning | done | error
        self._progress = {"done": 0, "total": 0, "current": ""}
        self._error = None

    def safe_join(self, relpath):
        """Loest relpath gegen root auf und stellt sicher, dass das Ergebnis
        innerhalb von root bleibt (schuetzt vor Path-Traversal)."""
        relpath = relpath.lstrip("/\\")
        full = os.path.abspath(os.path.join(self.root, relpath))
        if not (full == self.root or full.startswith(self.root + os.sep)):
            raise ValueError("invalid path")
        return full

    def reveal_in_file_manager(self, relpath):
        """Oeffnet den Datei-Explorer (bzw. Finder/Dateimanager) mit der
        angegebenen Datei markiert. Laeuft nur lokal auf dem Rechner des
        Nutzers - kein Sicherheitsrisiko, da der Server ausschliesslich an
        127.0.0.1 gebunden ist."""
        full = self.safe_join(relpath)
        if not os.path.exists(full):
            raise FileNotFoundError(full)
        if sys.platform.startswith("win"):
            # WICHTIG: als String uebergeben, nicht als Liste. Python quotet
            # Listen-Argumente mit Leerzeichen automatisch komplett ein
            # (also z.B. "/select,C:\...\datei mit leerzeichen.stl" - mit der
            # Anfuehrung VOR "/select"). Explorer erkennt "/select," dann
            # nicht mehr und oeffnet stattdessen den Standardordner
            # (typischerweise Dokumente). Als reiner String mit dem Komma
            # direkt hinter /select und Anfuehrungszeichen nur um den Pfad
            # herum funktioniert es zuverlaessig, auch bei Leerzeichen.
            subprocess.Popen('explorer /select,"{}"'.format(full))
        elif sys.platform == "darwin":
            subprocess.Popen(["open", "-R", full])
        else:
            subprocess.Popen(["xdg-open", os.path.dirname(full)])

    # -- Hintergrund-Scan ---------------------------------------------------

    def start_background_scan(self):
        with self._lock:
            if self._status == "scanning":
                return
            self._status = "scanning"
            self._progress = {"done": 0, "total": 0, "current": ""}
            self._error = None
        t = threading.Thread(target=self._run_scan, daemon=True)
        t.start()

    def _run_scan(self):
        try:
            data = self._scan_impl()
            with self._lock:
                self._cache = data
                self._status = "done"
        except Exception as e:
            traceback.print_exc()
            with self._lock:
                self._status = "error"
                self._error = f"{type(e).__name__}: {e}"

    def get_status(self):
        with self._lock:
            return {
                "status": self._status,
                "progress": dict(self._progress),
                "error": self._error,
                "data": self._cache,
            }

    def _set_progress(self, done=None, total=None, current=None):
        with self._lock:
            if done is not None:
                self._progress["done"] = done
            if total is not None:
                self._progress["total"] = total
            if current is not None:
                self._progress["current"] = current

    def find_group(self, key):
        with self._lock:
            data = self._cache
        if not data:
            return None
        for g in data["groups"]:
            if g["key"] == key:
                return g
        return None

    # -- eigentlicher Scan (laeuft im Hintergrund-Thread) -------------------

    def _is_excluded(self, excl, rel, name, ext_no_dot):
        """Prueft die Ausschlussliste (siehe LibraryConfig.excludes, einmal
        pro Scan geladen und durchgereicht statt pro Datei neu abgefragt) -
        hat immer Vorrang vor der Dateityp-Auswahl. Ein Muster wird gegen
        drei Varianten geprueft (Shell-Wildcards *, ?, Gross-/Kleinschreibung
        wird ignoriert): den reinen Dateinamen, den vollen relativen Pfad ab
        Bibliotheksordner, und den relativen Pfad mit einem "*/"-Praefix -
        letzteres sorgt dafuer, dass z.B. "Entwuerfe/*.obj" jeden so
        benannten Unterordner faengt, egal in welchem Projekt/auf welcher
        Tiefe er liegt, statt den kompletten Pfad ab Scan-Wurzel eintippen
        zu muessen."""
        if ext_no_dot.lower() in excl["extensions"]:
            return True
        rel_norm = rel.replace(os.sep, "/").lower()
        name_lower = name.lower()
        for pat in excl["patterns"]:
            pat_norm = pat.replace("\\", "/").lower().lstrip("/")
            if (
                fnmatch.fnmatch(name_lower, pat_norm)
                or fnmatch.fnmatch(rel_norm, pat_norm)
                or fnmatch.fnmatch(rel_norm, "*/" + pat_norm)
            ):
                return True
        return False

    def _walk_dir_collect(self, full, excl):
        """Sammelt Modell- und Bilddateien unterhalb von `full`. Bricht robust
        ab bei Berechtigungsfehlern und bei uebermaessig grossen, themenfremden
        Ordnern (siehe MAX_FILES_PER_TOPLEVEL_DIR)."""
        model_exts = LIBRARY.enabled_exts()
        model_files = []
        images = []
        seen_files = 0

        def onerror(exc):
            pass  # einzelne unlesbare Unterordner einfach ignorieren

        for dirpath, dirnames, filenames in os.walk(full, onerror=onerror):
            dirnames[:] = [d for d in dirnames if not d.startswith(".")]
            for fn in filenames:
                seen_files += 1
                ext = os.path.splitext(fn)[1].lower()
                if ext not in model_exts and ext not in IMAGE_EXTS:
                    continue
                fp = os.path.join(dirpath, fn)
                rel = os.path.relpath(fp, self.root)
                ext_no_dot = ext.lstrip(".")
                if self._is_excluded(excl, rel, fn, ext_no_dot):
                    continue
                try:
                    st = os.stat(fp)
                except OSError:
                    continue
                # Bewusst zwei unabhaengige ifs statt if/elif: eine Bilddatei
                # zaehlt IMMER als Thumbnail-Kandidat (fuer Projekte ohne
                # 3MF/STL), UND zusaetzlich als eigene, klickbare Datei-
                # Kachel, sobald ihr Bildtyp separat aktiviert wurde (siehe
                # KNOWN_FILETYPES "images") - eines schliesst das andere
                # nicht aus.
                if ext in model_exts:
                    model_files.append(
                        {
                            "path": rel.replace(os.sep, "/"),
                            "name": fn,
                            "ext": ext_no_dot,
                            "size": st.st_size,
                            "mtime": st.st_mtime,
                        }
                    )
                if ext in IMAGE_EXTS:
                    images.append(
                        {"path": rel.replace(os.sep, "/"), "size": st.st_size}
                    )
            if seen_files > MAX_FILES_PER_TOPLEVEL_DIR and not model_files:
                # Riesiger Ordner ohne jeden Treffer bisher - abbrechen statt
                # den kompletten Scan zu blockieren.
                break
        return model_files, images

    def _scan_impl(self):
        if not os.path.isdir(self.root):
            return {
                "root": self.root,
                "error": f"Ordner nicht gefunden: {self.root}",
                "generated_at": time.time(),
                "stats": {},
                "groups": [],
            }

        entries = {}  # top-level name -> dict(kind, model_files=[...], images=[...])
        excl = LIBRARY.excludes()  # einmal pro Scan geladen, siehe _is_excluded

        try:
            top_level = sorted(os.listdir(self.root))
        except PermissionError:
            top_level = []

        self._set_progress(done=0, total=len(top_level), current="")

        for i, name in enumerate(top_level):
            self._set_progress(done=i, current=name)
            if name.startswith("."):
                continue
            full = os.path.join(self.root, name)
            try:
                if os.path.islink(full):
                    continue
                is_dir = os.path.isdir(full)
            except OSError:
                continue

            try:
                if is_dir:
                    model_files, images = self._walk_dir_collect(full, excl)
                    if model_files:
                        entries[name] = {
                            "kind": "dir",
                            "model_files": model_files,
                            "images": images,
                        }
                else:
                    ext = os.path.splitext(name)[1].lower()
                    if ext in LIBRARY.enabled_exts() and not self._is_excluded(excl, name, name, ext.lstrip(".")):
                        try:
                            st = os.stat(full)
                        except OSError:
                            continue
                        entries[name] = {
                            "kind": "file",
                            "model_files": [
                                {
                                    "path": name,
                                    "name": name,
                                    "ext": ext.lstrip("."),
                                    "size": st.st_size,
                                    "mtime": st.st_mtime,
                                }
                            ],
                            # Eine lose Bilddatei direkt im Quellordner (ohne
                            # eigenen Unterordner) ist selbst ihr einziger
                            # Vorschaubild-Kandidat - sonst bliebe
                            # thumbnail_type unten bei "none" haengen und die
                            # Kachel zeigt nie ein Bild an (siehe elif
                            # g["images"]: unten).
                            "images": (
                                [{"path": name, "size": st.st_size}]
                                if ext in IMAGE_EXTS
                                else []
                            ),
                        }
            except Exception:
                # Ein einzelner problematischer Ordner soll den Gesamt-Scan
                # nicht zum Absturz bringen.
                traceback.print_exc()
                continue

        self._set_progress(done=len(top_level), current="")

        # Gruppieren nach normalisiertem Schluessel
        groups = {}
        for name, info in entries.items():
            key = normalize_key(name)
            g = groups.setdefault(
                key, {"sources": [], "model_files": [], "images": []}
            )
            g["sources"].append(name)
            g["model_files"].extend(info["model_files"])
            g["images"].extend(info["images"])

        result_groups = []
        total_size = 0
        total_files = 0
        stl_count = 0
        mf_count = 0
        f3d_count = 0
        stats_ext_counts = {}

        for key, g in groups.items():
            files = g["model_files"]
            if not files:
                continue
            files.sort(key=lambda f: f["path"].lower())
            group_size = sum(f["size"] for f in files)
            last_mod = max(f["mtime"] for f in files)
            has_3mf = any(f["ext"] == "3mf" for f in files)
            has_stl = any(f["ext"] == "stl" for f in files)
            has_f3d = any(f["ext"] == "f3d" for f in files)
            ext_counts = {}
            for f in files:
                ext_counts[f["ext"]] = ext_counts.get(f["ext"], 0) + 1
                stats_ext_counts[f["ext"]] = stats_ext_counts.get(f["ext"], 0) + 1

            # Anzeigename: bevorzugt die kuerzeste, nicht auf '_stls' endende Quelle
            sources_sorted = sorted(
                g["sources"], key=lambda s: (s.lower().endswith("stls"), len(s))
            )
            display_name = pretty_name(sources_sorted[0])

            # Thumbnail-Strategie bestimmen. F3D-Geometrie kann nicht gerendert
            # werden (proprietaeres Fusion-360-Format ohne verfuegbaren
            # Parser), aber die Datei enthaelt meist ein eingebettetes
            # Vorschaubild, das sich genau wie bei 3MF extrahieren laesst.
            thumb_type = "none"
            thumb_source = None
            if has_3mf:
                thumb_type = "3mf"
                thumb_source = next(f["path"] for f in files if f["ext"] == "3mf")
            elif g["images"]:
                thumb_type = "image"
                best_img = max(g["images"], key=lambda im: im["size"])
                thumb_source = best_img["path"]
            elif has_stl:
                thumb_type = "render"
            elif has_f3d:
                thumb_type = "f3d"
                thumb_source = next(f["path"] for f in files if f["ext"] == "f3d")

            # Druckzeit/Filamentverbrauch: nur aus Bambu-Studio-3MF-Dateien
            # auslesbar (Metadata/slice_info.config) - bei PrusaSlicer oder
            # 3MFs ohne diese Datei bleibt es einfach leer (kein Fehler).
            print_time_s = None
            filament_g = None
            if has_3mf:
                mf_path = next(f["path"] for f in files if f["ext"] == "3mf")
                try:
                    full_mf = self.safe_join(mf_path)
                    print_time_s, filament_g = self._print_stats_from_3mf(full_mf)
                except Exception:
                    # Eine einzelne problematische 3MF-Datei soll den
                    # gesamten Scan des Ordners nicht zum Absturz bringen.
                    traceback.print_exc()

            total_size += group_size
            total_files += len(files)
            stl_count += sum(1 for f in files if f["ext"] == "stl")
            mf_count += sum(1 for f in files if f["ext"] == "3mf")
            f3d_count += sum(1 for f in files if f["ext"] == "f3d")

            result_groups.append(
                {
                    "key": key,
                    "name": display_name,
                    "sources": g["sources"],
                    "file_count": len(files),
                    "total_size": group_size,
                    "total_size_h": human_size(group_size),
                    "last_modified": last_mod,
                    "has_3mf": has_3mf,
                    "has_stl": has_stl,
                    "has_f3d": has_f3d,
                    "ext_counts": ext_counts,
                    "thumbnail_type": thumb_type,
                    "thumbnail_url": (
                        f"/api/thumbnail?key={key}"
                        if thumb_type in ("3mf", "image", "f3d")
                        else None
                    ),
                    "print_time_s": print_time_s,
                    "print_time_h": format_duration_h(print_time_s) if print_time_s else None,
                    "filament_g": round(filament_g, 1) if filament_g else None,
                    "files": files,
                }
            )

        result_groups.sort(key=lambda g: g["name"].lower())
        annotate_duplicates(result_groups)

        return {
            "root": self.root,
            "generated_at": time.time(),
            "stats": {
                "groups": len(result_groups),
                "files": total_files,
                "total_size": total_size,
                "total_size_h": human_size(total_size),
                "stl_count": stl_count,
                "mf_count": mf_count,
                "f3d_count": f3d_count,
                "ext_counts": stats_ext_counts,
            },
            "groups": result_groups,
        }

    def _thumb_from_3mf(self, full):
        """Extrahiert das eingebettete Vorschaubild aus einer einzelnen
        3MF-Datei (unabhaengig von der Gruppierung)."""
        try:
            with zipfile.ZipFile(full) as z:
                names = set(z.namelist())
                ordered = [c for c in THUMB_CANDIDATES if c in names]
                imgs = sorted(
                    (n for n in names if os.path.splitext(n)[1].lower() in IMAGE_EXTS),
                    key=lambda n: z.getinfo(n).file_size,
                    reverse=True,
                )
                # erst die bekannten Bambu-Pfade probieren, dann alle
                # anderen Bilder im Archiv (groesstes zuerst) - manche
                # Dateien nutzen intern eine Komprimierung (z.B. Zstd),
                # die Pythons zipfile nicht lesen kann; in dem Fall
                # einfach die naechste Kandidatin versuchen statt
                # abzubrechen.
                for cand in ordered + [n for n in imgs if n not in ordered]:
                    try:
                        data = z.read(cand)
                    except Exception:
                        continue
                    ext = os.path.splitext(cand)[1].lower()
                    ctype = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
                    return data, ctype
        except (zipfile.BadZipFile, OSError):
            return None, None
        return None, None

    def _print_stats_from_3mf(self, full):
        """Liest geschaetzte Druckzeit (Sekunden) und Filamentverbrauch
        (Gramm) aus der 'slice_info.config' einer 3MF-Datei - dieses Format
        wird von Bambu Studio / OrcaSlicer eingebettet, ABER nur wenn die
        Datei tatsaechlich einmal geslict wurde (ein nur gespeichertes/
        heruntergeladenes Projekt, das nie in Bambu Studio geslict wurde,
        enthaelt diese Datei nicht - auch wenn es urspruenglich mit Bambu
        Studio erstellt wurde). PrusaSlicer-Projektdateien enthalten sie
        generell nicht. In allen diesen Faellen wird einfach (None, None)
        zurueckgegeben statt eines Fehlers.

        Robustheit: der Pfad wird case-insensitiv gesucht (manche Tools
        packen den Ordner klein geschrieben), und <metadata>-Eintraege
        werden ueberall im Dokument gesucht statt nur direkt unter <plate>
        (unterschiedliche Bambu-Studio-/OrcaSlicer-Versionen verschachteln
        das leicht anders). Jede Art von Fehler (kaputtes Zip, nicht
        unterstuetzte Kompression einzelner Eintraege, kaputtes XML, ...)
        wird abgefangen, damit eine einzelne problematische 3MF-Datei nie
        den kompletten Scan des Ordners zum Absturz bringt."""
        try:
            with zipfile.ZipFile(full) as z:
                target = None
                for name in z.namelist():
                    if name.lower().endswith("metadata/slice_info.config"):
                        target = name
                        break
                if not target:
                    return None, None
                data = z.read(target)
            root = ET.fromstring(data)
            total_time = 0
            total_weight = 0.0
            found = False
            for meta in root.iter("metadata"):
                key = meta.get("key")
                value = meta.get("value")
                if value is None:
                    continue
                if key == "prediction":
                    try:
                        total_time += int(float(value))
                        found = True
                    except ValueError:
                        pass
                elif key == "weight":
                    try:
                        total_weight += float(value)
                        found = True
                    except ValueError:
                        pass
            if not found:
                return None, None
            return (total_time or None), (total_weight or None)
        except Exception:
            traceback.print_exc()
            return None, None

    def _thumb_from_f3d(self, full):
        """Extrahiert das eingebettete Vorschaubild aus einer einzelnen
        F3D-Datei (unabhaengig von der Gruppierung)."""
        try:
            with zipfile.ZipFile(full) as z:
                names = z.namelist()
                # Bevorzugt ".../Previews/small.png" (uebliches Fusion-360-
                # Layout), sonst irgendein Bild unterhalb eines "Previews"-
                # Ordners, sonst als letzter Versuch irgendein Bild im
                # Archiv. Manche .f3d-Dateien komprimieren ihre Eintraege
                # mit einem Verfahren (z.B. Zstd), das Pythons zipfile
                # nicht lesen kann - dann einfach die naechste Kandidatin
                # probieren statt mit einem Serverfehler abzubrechen.
                exact = [n for n in names if n.lower().endswith(F3D_PREVIEW_SUFFIX)]
                preview_dir = [
                    n
                    for n in names
                    if "/previews/" in n.lower()
                    and os.path.splitext(n)[1].lower() in IMAGE_EXTS
                ]
                any_img = [
                    n for n in names if os.path.splitext(n)[1].lower() in IMAGE_EXTS
                ]
                ordered, seen = [], set()
                for grp in (exact, preview_dir, any_img):
                    for n in sorted(grp, key=lambda n: z.getinfo(n).file_size, reverse=True):
                        if n not in seen:
                            seen.add(n)
                            ordered.append(n)
                for cand in ordered:
                    try:
                        data = z.read(cand)
                    except Exception:
                        continue
                    ext = os.path.splitext(cand)[1].lower()
                    ctype = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
                    return data, ctype
        except (zipfile.BadZipFile, OSError):
            return None, None
        return None, None

    def _thumb_from_image(self, full, ext):
        """Verkleinerte Vorschau fuer Bilddateien. Manche Bilder (z.B. als
        Druckvorlage exportierte PNGs mit zehntausenden Pixeln Kantenlaenge)
        sind trotz kleiner Dateigroesse beim Dekodieren extrem
        speicherhungrig und lassen die Kachel im Browser leer bleiben. Mit
        Pillow wird hier vorab auf IMAGE_THUMB_MAX_DIM verkleinert; ist
        Pillow nicht installiert oder das Bild schon klein genug, liefert
        die Funktion (None, None) zurueck - der Aufrufer faellt dann auf
        das unveraenderte Original zurueck (/api/file), was fuer normal
        grosse Fotos ohnehin problemlos funktioniert."""
        if not PIL_AVAILABLE or ext not in IMAGE_THUMB_RESIZABLE_EXTS:
            return None, None
        try:
            with PILImage.open(full) as im:
                im.load()
                if max(im.size) <= IMAGE_THUMB_MAX_DIM:
                    return None, None
                im.thumbnail((IMAGE_THUMB_MAX_DIM, IMAGE_THUMB_MAX_DIM))
                buf = io.BytesIO()
                if ext == ".png" or im.mode in ("RGBA", "LA", "P"):
                    if im.mode not in ("RGBA", "LA", "P", "L", "RGB"):
                        im = im.convert("RGBA")
                    im.save(buf, format="PNG", optimize=True)
                    return buf.getvalue(), "image/png"
                if im.mode not in ("RGB", "L"):
                    im = im.convert("RGB")
                im.save(buf, format="JPEG", quality=82)
                return buf.getvalue(), "image/jpeg"
        except Exception:
            # Beschaedigte/exotische Bilddatei - lieber stillschweigend auf
            # das Original zurueckfallen als den ganzen Request scheitern
            # zu lassen.
            return None, None

    def get_file_thumbnail(self, rel_path):
        """Vorschaubild fuer eine einzelne Datei (unabhaengig von der
        Projekt-Gruppierung) - fuer die Karten in der 'Einzelne Dateien'-
        Ansicht."""
        try:
            full = self.safe_join(rel_path)
        except ValueError:
            return None, None
        if not os.path.isfile(full):
            return None, None
        ext = os.path.splitext(rel_path)[1].lower()
        if ext == ".3mf":
            return self._thumb_from_3mf(full)
        if ext == ".f3d":
            return self._thumb_from_f3d(full)
        if ext in IMAGE_EXTS:
            return self._thumb_from_image(full, ext)
        return None, None

    def get_thumbnail(self, key):
        g = self.find_group(key)
        if not g:
            return None, None
        if g["thumbnail_type"] == "3mf":
            mf_path = next(f["path"] for f in g["files"] if f["ext"] == "3mf")
            full = self.safe_join(mf_path)
            return self._thumb_from_3mf(full)
        elif g["thumbnail_type"] == "image":
            best_img_path = None
            # thumbnail_url baut auf group-level image auf; wir muessen es erneut ermitteln
            # (einfachster Weg: alle Bilder in den Quellordnern erneut sammeln)
            for src in g["sources"]:
                full_src = os.path.join(self.root, src)
                if os.path.isdir(full_src):
                    for dirpath, dirnames, filenames in os.walk(full_src):
                        for fn in filenames:
                            if os.path.splitext(fn)[1].lower() in IMAGE_EXTS:
                                fp = os.path.join(dirpath, fn)
                                if best_img_path is None or os.path.getsize(
                                    fp
                                ) > os.path.getsize(best_img_path):
                                    best_img_path = fp
                elif os.path.isfile(full_src):
                    # Lose Bilddatei direkt im Quellordner (kein eigener
                    # Unterordner, "src" ist hier der Dateiname selbst statt
                    # eines Ordnerpfads) - zaehlt ebenfalls als Kandidat.
                    if os.path.splitext(full_src)[1].lower() in IMAGE_EXTS:
                        if best_img_path is None or os.path.getsize(
                            full_src
                        ) > os.path.getsize(best_img_path):
                            best_img_path = full_src
            if best_img_path:
                ext = os.path.splitext(best_img_path)[1].lower()
                data, ctype = self._thumb_from_image(best_img_path, ext)
                if data is not None:
                    return data, ctype
                ctype = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
                with open(best_img_path, "rb") as fh:
                    return fh.read(), ctype
        elif g["thumbnail_type"] == "f3d":
            f3d_path = next(f["path"] for f in g["files"] if f["ext"] == "f3d")
            full = self.safe_join(f3d_path)
            return self._thumb_from_f3d(full)
        return None, None


# ---------------------------------------------------------------------------
# Favoriten (persistiert in favorites.json, getrennt je Quelle)
# ---------------------------------------------------------------------------


class FavoritesStore:
    def __init__(self, path):
        self.path = path
        self._lock = threading.Lock()
        self._data = self._load()

    def _load(self):
        try:
            with open(self.path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, dict):
                return data
        except (OSError, ValueError):
            pass
        return {}

    def _save(self):
        tmp = self.path + ".tmp"
        try:
            with open(tmp, "w", encoding="utf-8") as fh:
                json.dump(self._data, fh, ensure_ascii=False, indent=2)
            os.replace(tmp, self.path)
        except OSError:
            traceback.print_exc()

    def get(self, source_id):
        with self._lock:
            entry = self._data.get(source_id, {})
            return {
                "groups": list(entry.get("groups", [])),
                "files": list(entry.get("files", [])),
            }

    def toggle(self, source_id, kind, key):
        """kind: 'groups' oder 'files'. Gibt den neuen Zustand zurueck."""
        with self._lock:
            entry = self._data.setdefault(source_id, {"groups": [], "files": []})
            lst = entry.setdefault(kind, [])
            if key in lst:
                lst.remove(key)
                active = False
            else:
                lst.append(key)
                active = True
            self._save()
            return active

    def set(self, source_id, kind, key, active):
        """Setzt den Favoriten-Status explizit (statt umzuschalten) - genutzt
        fuer Mehrfachauswahl, wo alle ausgewaehlten Eintraege auf denselben
        Zielzustand gebracht werden sollen."""
        with self._lock:
            entry = self._data.setdefault(source_id, {"groups": [], "files": []})
            lst = entry.setdefault(kind, [])
            if active and key not in lst:
                lst.append(key)
            elif not active and key in lst:
                lst.remove(key)
            self._save()
            return active

    def remove(self, source_id, kind, key):
        """Entfernt einen Eintrag still (z.B. wenn eine favorisierte Datei
        geloescht wird) - ohne Fehler, falls er nicht vorhanden ist."""
        with self._lock:
            entry = self._data.get(source_id)
            if not entry:
                return
            lst = entry.get(kind, [])
            if key in lst:
                lst.remove(key)
                self._save()


# ---------------------------------------------------------------------------
# Notizen je Projekt (persistiert in notes.json, getrennt je Quelle - gleiches
# Muster wie FavoritesStore). Ein leerer Text loescht den Eintrag wieder.
# ---------------------------------------------------------------------------


class NotesStore:
    def __init__(self, path):
        self.path = path
        self._lock = threading.Lock()
        self._data = self._load()

    def _load(self):
        try:
            with open(self.path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, dict):
                return data
        except (OSError, ValueError):
            pass
        return {}

    def _save(self):
        tmp = self.path + ".tmp"
        try:
            with open(tmp, "w", encoding="utf-8") as fh:
                json.dump(self._data, fh, ensure_ascii=False, indent=2)
            os.replace(tmp, self.path)
        except OSError:
            traceback.print_exc()

    def get_all(self, source_id):
        with self._lock:
            return dict(self._data.get(source_id, {}))

    def get(self, source_id, key):
        with self._lock:
            return self._data.get(source_id, {}).get(key, "")

    def set(self, source_id, key, text):
        with self._lock:
            entry = self._data.setdefault(source_id, {})
            text = (text or "").strip()
            if text:
                entry[key] = text
            else:
                entry.pop(key, None)
            self._save()
            return text

    def remove(self, source_id, key):
        with self._lock:
            entry = self._data.get(source_id)
            if entry and key in entry:
                del entry[key]
                self._save()


MAX_TAGS_PER_ITEM = 20
MAX_TAG_LENGTH = 30


class TagsStore:
    """Eigene Tags/Kategorien je Projekt oder Datei (persistiert in
    tags.json, getrennt je Quelle - gleiches Muster wie NotesStore, nur dass
    hier eine Liste von Tag-Texten statt eines einzelnen Freitexts
    gespeichert wird)."""

    def __init__(self, path):
        self.path = path
        self._lock = threading.Lock()
        self._data = self._load()

    def _load(self):
        try:
            with open(self.path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, dict):
                return data
        except (OSError, ValueError):
            pass
        return {}

    def _save(self):
        tmp = self.path + ".tmp"
        try:
            with open(tmp, "w", encoding="utf-8") as fh:
                json.dump(self._data, fh, ensure_ascii=False, indent=2)
            os.replace(tmp, self.path)
        except OSError:
            traceback.print_exc()

    def get_all(self, source_id):
        with self._lock:
            return {k: list(v) for k, v in self._data.get(source_id, {}).items()}

    def get(self, source_id, key):
        with self._lock:
            return list(self._data.get(source_id, {}).get(key, []))

    def set(self, source_id, key, tags):
        """tags: Liste von Strings - wird bereinigt (getrimmt, leere/doppelte
        entfernt, auf MAX_TAGS_PER_ITEM begrenzt, jeweils auf
        MAX_TAG_LENGTH Zeichen gekuerzt)."""
        with self._lock:
            entry = self._data.setdefault(source_id, {})
            cleaned = []
            seen = set()
            for tag in tags:
                tag = (tag or "").strip()[:MAX_TAG_LENGTH]
                if not tag:
                    continue
                low = tag.lower()
                if low in seen:
                    continue
                seen.add(low)
                cleaned.append(tag)
                if len(cleaned) >= MAX_TAGS_PER_ITEM:
                    break
            if cleaned:
                entry[key] = cleaned
            else:
                entry.pop(key, None)
            self._save()
            return cleaned

    def remove(self, source_id, key):
        with self._lock:
            entry = self._data.get(source_id)
            if entry and key in entry:
                del entry[key]
                self._save()

    def all_tags(self, source_id):
        """Alle unterschiedlichen Tags in dieser Quelle, alphabetisch
        sortiert - fuer den Filter-Vorschlag im Frontend."""
        with self._lock:
            seen = {}
            for tags in self._data.get(source_id, {}).values():
                for tag in tags:
                    seen.setdefault(tag.lower(), tag)
            return sorted(seen.values(), key=lambda s: s.lower())


# ---------------------------------------------------------------------------
# Papierkorb (persistiert in trash.json) - geloeschte Dateien landen statt
# eines endgueltigen os.remove() zunaechst in TRASH_DIR (siehe move_to_trash)
# und lassen sich von dort wiederherstellen. Eintraege, die laenger als
# TRASH_MAX_AGE_DAYS dort liegen, werden bei Gelegenheit (Start, Abruf der
# Liste) endgueltig entfernt.
# ---------------------------------------------------------------------------


class TrashStore:
    def __init__(self, path):
        self.path = path
        self._lock = threading.Lock()
        self._data = self._load()

    def _load(self):
        try:
            with open(self.path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, dict) and isinstance(data.get("items"), list):
                return data
        except (OSError, ValueError):
            pass
        return {"items": []}

    def _save(self):
        tmp = self.path + ".tmp"
        try:
            with open(tmp, "w", encoding="utf-8") as fh:
                json.dump(self._data, fh, ensure_ascii=False, indent=2)
            os.replace(tmp, self.path)
        except OSError:
            traceback.print_exc()

    def list_all(self):
        with self._lock:
            return [dict(it) for it in self._data["items"]]

    def add(self, entry):
        with self._lock:
            self._data["items"].append(entry)
            self._save()

    def get(self, item_id):
        with self._lock:
            for it in self._data["items"]:
                if it["id"] == item_id:
                    return dict(it)
        return None

    def remove(self, item_id):
        with self._lock:
            before = len(self._data["items"])
            self._data["items"] = [it for it in self._data["items"] if it["id"] != item_id]
            changed = len(self._data["items"]) != before
            if changed:
                self._save()
            return changed

    def purge_expired(self, max_age_days):
        """Loescht alle Eintraege (samt Datei in TRASH_DIR), die laenger als
        max_age_days im Papierkorb liegen, endgueltig. Gibt die Anzahl
        entfernter Eintraege zurueck."""
        cutoff = time.time() - max_age_days * 86400
        with self._lock:
            keep = []
            removed = 0
            for it in self._data["items"]:
                if it.get("deleted_at", 0) < cutoff:
                    try:
                        full = os.path.join(TRASH_DIR, it["source_id"], it["trash_name"])
                        if os.path.isfile(full):
                            os.remove(full)
                    except OSError:
                        pass
                    removed += 1
                else:
                    keep.append(it)
            if removed:
                self._data["items"] = keep
                self._save()
            return removed


def move_to_trash(sid, rel_path, full_path):
    """Verschiebt eine einzelne Datei in den Papierkorb statt sie endgueltig
    zu loeschen, und registriert sie in trash.json. Wirft OSError, falls das
    Verschieben fehlschlaegt (z.B. Datei gerade durch ein anderes Programm
    geoeffnet)."""
    name = os.path.basename(full_path)
    ext = os.path.splitext(name)[1].lstrip(".").lower()
    size = os.path.getsize(full_path)
    item_id = uuid.uuid4().hex
    trash_name = f"{item_id}_{name}"
    dest_dir = os.path.join(TRASH_DIR, sid)
    os.makedirs(dest_dir, exist_ok=True)
    shutil.move(full_path, os.path.join(dest_dir, trash_name))
    entry = {
        "id": item_id,
        "source_id": sid,
        "rel_path": rel_path,
        "name": name,
        "ext": ext,
        "size": size,
        "deleted_at": time.time(),
        "trash_name": trash_name,
    }
    Handler.trash.add(entry)
    return entry


def build_backup_bundle():
    """Baut das komplette Sicherungs-Bundle (Bibliothekseinstellungen +
    Favoriten/Notizen/Zuletzt-gedruckt/Tags/Warteliste je Quelle) - genutzt
    sowohl vom manuellen Download (/api/export-backup) als auch von der
    automatischen Sicherung (siehe write_auto_backup())."""
    sources = LIBRARY.sources()
    return {
        "exported_at": time.time(),
        "library_config": sources and {
            "sources": sources,
            "filetypes": LIBRARY.filetypes(),
            "settings": LIBRARY.settings(),
        },
        "favorites": {s["id"]: Handler.favorites.get(s["id"]) for s in sources},
        "notes": {s["id"]: Handler.notes.get_all(s["id"]) for s in sources},
        "tags": {s["id"]: Handler.tags.get_all(s["id"]) for s in sources},
    }


def write_auto_backup():
    """Schreibt eine Sicherungsdatei fuer heute (ueberspringt, wenn bereits
    eine fuer heute existiert) und loescht die aeltesten Dateien, sobald mehr
    als AUTO_BACKUP_KEEP vorhanden sind. Gibt den geschriebenen Dateipfad
    zurueck, oder None, wenn heute bereits gesichert wurde."""
    os.makedirs(AUTO_BACKUP_DIR, exist_ok=True)
    fname = f"auto-backup-{time.strftime('%Y-%m-%d')}.json"
    fpath = os.path.join(AUTO_BACKUP_DIR, fname)
    if os.path.exists(fpath):
        return None
    bundle = build_backup_bundle()
    tmp = fpath + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(bundle, fh, ensure_ascii=False, indent=2)
    os.replace(tmp, fpath)
    # Aelteste Sicherungen jenseits AUTO_BACKUP_KEEP entfernen (nach Dateiname
    # sortiert - das Datumsformat im Namen sortiert sich von selbst korrekt).
    try:
        existing = sorted(
            f for f in os.listdir(AUTO_BACKUP_DIR) if f.startswith("auto-backup-") and f.endswith(".json")
        )
        for old in existing[:-AUTO_BACKUP_KEEP] if len(existing) > AUTO_BACKUP_KEEP else []:
            try:
                os.remove(os.path.join(AUTO_BACKUP_DIR, old))
            except OSError:
                pass
    except OSError:
        pass
    return fpath


def latest_auto_backup():
    """Gibt (dateiname, unix_zeitstempel) der juengsten Auto-Sicherung
    zurueck, oder (None, None) wenn noch keine existiert."""
    try:
        existing = sorted(
            f for f in os.listdir(AUTO_BACKUP_DIR) if f.startswith("auto-backup-") and f.endswith(".json")
        )
    except OSError:
        existing = []
    if not existing:
        return None, None
    fname = existing[-1]
    try:
        mtime = os.path.getmtime(os.path.join(AUTO_BACKUP_DIR, fname))
    except OSError:
        mtime = None
    return fname, mtime


def auto_backup_loop():
    """Laeuft als Daemon-Thread im Hintergrund: prueft in regelmaessigen
    Abstaenden, ob die automatische Sicherung aktiviert ist und ob fuer
    heute schon eine Datei existiert - falls nicht, wird eine geschrieben.
    Absichtlich sehr einfach gehalten (kein exaktes Zeitfenster noetig, da
    write_auto_backup() ohnehin pro Tag nur einmal schreibt)."""
    while True:
        try:
            if LIBRARY and LIBRARY.settings().get("auto_backup"):
                write_auto_backup()
        except Exception:
            traceback.print_exc()
        time.sleep(AUTO_BACKUP_CHECK_INTERVAL)


# ---------------------------------------------------------------------------
# Update-Pruefung ueber GitHub Releases (siehe UPDATE_SETUP.md). Nutzt nur
# urllib aus der Standardbibliothek - kein zusaetzliches Paket noetig. Bei
# jedem Fehler (kein Internet, Repo noch nicht eingerichtet, GitHub nicht
# erreichbar) wird einfach "kein Update verfuegbar" zurueckgegeben, damit die
# App auch offline ganz normal weiter funktioniert.
# ---------------------------------------------------------------------------


def _version_tuple(v):
    parts = []
    for piece in str(v).split("."):
        m = re.match(r"\d+", piece)
        parts.append(int(m.group()) if m else 0)
    return tuple(parts)


def check_for_update():
    result = {"available": False, "current_version": APP_VERSION}
    if not UPDATE_REPO or "/" not in UPDATE_REPO or UPDATE_REPO.startswith("DEIN-"):
        return result
    try:
        url = f"https://api.github.com/repos/{UPDATE_REPO}/releases/latest"
        req = urllib.request.Request(
            url,
            headers={"Accept": "application/vnd.github+json", "User-Agent": "3D-Druck-Sammlung"},
        )
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.load(resp)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError, OSError):
        return result

    latest_tag = str(data.get("tag_name") or "").lstrip("vV")
    if not latest_tag or _version_tuple(latest_tag) <= _version_tuple(APP_VERSION):
        return result

    download_url = data.get("html_url", "")
    for asset in data.get("assets", []) or []:
        name = str(asset.get("name") or "").lower()
        if name.endswith(".exe"):
            download_url = asset.get("browser_download_url", download_url)
            break

    return {
        "available": True,
        "current_version": APP_VERSION,
        "latest_version": latest_tag,
        "download_url": download_url,
        "notes_url": data.get("html_url", ""),
    }


# ---------------------------------------------------------------------------
# Bibliothekskonfiguration (Ordner + Dateitypen), persistiert in
# library_config.json - editierbar ueber das "Bibliothek verwalten"-Popup.
# ---------------------------------------------------------------------------


class LibraryConfig:
    def __init__(self, path):
        self.path = path
        self._lock = threading.Lock()
        self._data = self._load()

    def _load(self):
        try:
            with open(self.path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, dict) and data.get("sources") and data.get("filetypes"):
                # "settings"/"excludes" gibt es erst seit spaeteren Versionen -
                # bei aelteren Konfigurationsdateien nachtraeglich ergaenzen.
                data.setdefault("settings", dict(DEFAULT_SETTINGS))
                data.setdefault("excludes", {"extensions": [], "patterns": []})
                data["excludes"].setdefault("extensions", [])
                data["excludes"].setdefault("patterns", [])
                data.setdefault("slicers", {})
                return data
        except (OSError, ValueError):
            pass
        # Erststart (oder kaputte/fehlende Datei): mit den Standardwerten
        # initialisieren und gleich abspeichern.
        data = {
            "sources": [dict(s) for s in DEFAULT_SOURCES],
            "filetypes": [dict(f) for f in DEFAULT_FILETYPES],
            "settings": dict(DEFAULT_SETTINGS),
            "excludes": {"extensions": [], "patterns": []},
            "slicers": {},
        }
        self._data = data
        self._save()
        return data

    def _save(self):
        tmp = self.path + ".tmp"
        try:
            with open(tmp, "w", encoding="utf-8") as fh:
                json.dump(self._data, fh, ensure_ascii=False, indent=2)
            os.replace(tmp, self.path)
        except OSError:
            traceback.print_exc()

    def sources(self):
        with self._lock:
            return [dict(s) for s in self._data["sources"]]

    def filetypes(self):
        with self._lock:
            return [dict(f) for f in self._data["filetypes"]]

    def enabled_exts(self):
        with self._lock:
            return {"." + f["ext"] for f in self._data["filetypes"] if f["enabled"]}

    def settings(self):
        with self._lock:
            merged = dict(DEFAULT_SETTINGS)
            merged.update(self._data.get("settings", {}))
            return merged

    def toggle_setting(self, key):
        with self._lock:
            settings = self._data.setdefault("settings", dict(DEFAULT_SETTINGS))
            if key not in DEFAULT_SETTINGS:
                return None
            current = settings.get(key, DEFAULT_SETTINGS[key])
            settings[key] = not current
            self._save()
            return settings[key]

    def set_setting(self, key, value):
        """Setzt eine nicht-boolesche Einstellung (z.B. theme/language) auf
        einen bestimmten Wert aus SETTING_CHOICES[key]. Gibt den gespeicherten
        Wert zurueck, oder None wenn der Schluessel/Wert ungueltig ist."""
        with self._lock:
            allowed = SETTING_CHOICES.get(key)
            if allowed is None or value not in allowed:
                return None
            settings = self._data.setdefault("settings", dict(DEFAULT_SETTINGS))
            settings[key] = value
            self._save()
            return value

    def add_source(self, path, label):
        with self._lock:
            base = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-") or "ordner"
            existing_ids = {s["id"] for s in self._data["sources"]}
            sid = base
            n = 2
            while sid in existing_ids:
                sid = f"{base}-{n}"
                n += 1
            entry = {"id": sid, "label": label, "path": path}
            self._data["sources"].append(entry)
            self._save()
            return dict(entry)

    def remove_source(self, source_id):
        with self._lock:
            self._data["sources"] = [s for s in self._data["sources"] if s["id"] != source_id]
            self._save()

    def add_filetype(self, ext, label):
        with self._lock:
            if any(f["ext"] == ext for f in self._data["filetypes"]):
                return None
            entry = {"ext": ext, "label": label, "enabled": True, "builtin": False}
            self._data["filetypes"].append(entry)
            self._save()
            return dict(entry)

    def remove_filetype(self, ext):
        with self._lock:
            before = len(self._data["filetypes"])
            self._data["filetypes"] = [
                f for f in self._data["filetypes"] if not (f["ext"] == ext and not f["builtin"])
            ]
            changed = len(self._data["filetypes"]) != before
            if changed:
                self._save()
            return changed

    def toggle_filetype(self, ext):
        with self._lock:
            for f in self._data["filetypes"]:
                if f["ext"] == ext:
                    f["enabled"] = not f["enabled"]
                    self._save()
                    return f["enabled"]
            return None

    def edit_filetype(self, ext, new_ext, label):
        """Bearbeitet einen selbst angelegten Dateityp (Endung und/oder
        Anzeigename) - z.B. um einen Tippfehler in der Endung zu korrigieren.
        Eingebaute Typen (stl/3mf/f3d) lassen sich nicht umbenennen. Gibt das
        aktualisierte Dict zurueck, "duplicate" wenn new_ext bereits von einem
        anderen Eintrag belegt ist, oder None wenn ext nicht gefunden/nicht
        bearbeitbar ist."""
        with self._lock:
            target = None
            for f in self._data["filetypes"]:
                if f["ext"] == ext and not f["builtin"]:
                    target = f
                    break
            if target is None:
                return None
            if new_ext != ext and any(f["ext"] == new_ext for f in self._data["filetypes"]):
                return "duplicate"
            target["ext"] = new_ext
            target["label"] = label
            self._save()
            return dict(target)

    def slicer_paths(self):
        """Manuell hinterlegte/zuletzt erkannte Slicer-Pfade (id -> Pfad).
        Fehlende Eintraege bedeutet nicht "kein Slicer installiert" - siehe
        detect_slicer_path() fuer die automatische Suche, die /api/slicers
        als Fallback benutzt."""
        with self._lock:
            return dict(self._data.get("slicers", {}))

    def set_slicer_path(self, slicer_id, path):
        with self._lock:
            slicers = self._data.setdefault("slicers", {})
            if path:
                slicers[slicer_id] = path
            else:
                slicers.pop(slicer_id, None)
            self._save()
            return dict(slicers)

    def excludes(self):
        with self._lock:
            ex = self._data.get("excludes") or {}
            return {
                "extensions": list(ex.get("extensions", [])),
                "patterns": list(ex.get("patterns", [])),
            }

    def set_excludes(self, extensions, patterns):
        """Setzt die Ausschlussliste komplett neu (Endungen ohne Punkt,
        Muster als rohe Strings) - haben immer Vorrang vor der
        Dateityp-Auswahl (siehe Scanner._is_excluded). Leere/doppelte
        Eintraege werden herausgefiltert."""
        with self._lock:
            clean_exts = []
            for e in extensions or []:
                e = str(e).strip().lstrip(".").lower()
                if e and e not in clean_exts:
                    clean_exts.append(e)
            clean_patterns = []
            for p in patterns or []:
                p = str(p).strip()
                if p and p not in clean_patterns:
                    clean_patterns.append(p)
            self._data["excludes"] = {"extensions": clean_exts, "patterns": clean_patterns}
            self._save()
            return {"extensions": list(clean_exts), "patterns": list(clean_patterns)}

    def apply_filetype_preset(self, preset):
        """"default" = auf die eingebauten Standardtypen zuruecksetzen
        (alle selbst hinzugefuegten Typen entfernt), "all" = jeden bekannten
        Katalogtyp (siehe KNOWN_FILETYPES) hinzufuegen/aktivieren, "none" =
        alle vorhandenen Typen deaktivieren (bleiben aber definiert, damit
        man sie einzeln wieder anschalten kann, statt sie zu loeschen).
        Gibt die neue Dateityp-Liste zurueck, oder None bei unbekanntem
        preset."""
        with self._lock:
            if preset == "default":
                self._data["filetypes"] = [dict(f) for f in DEFAULT_FILETYPES]
            elif preset == "all":
                existing_exts = {f["ext"] for f in self._data["filetypes"]}
                for cat in KNOWN_FILETYPES.values():
                    for known in cat:
                        if known["ext"] not in existing_exts:
                            self._data["filetypes"].append(
                                {"ext": known["ext"], "label": known["label"], "enabled": True, "builtin": False}
                            )
                            existing_exts.add(known["ext"])
                # Auch bereits vorhandene (eingebaute + eigene) Typen mit
                # einschliessen, nicht nur den Katalog.
                for f in self._data["filetypes"]:
                    f["enabled"] = True
            elif preset == "none":
                for f in self._data["filetypes"]:
                    f["enabled"] = False
            else:
                return None
            self._save()
            return [dict(f) for f in self._data["filetypes"]]

    def restore_snapshot(self, snapshot):
        """Setzt sources/filetypes/excludes/render3d komplett auf einen
        zuvor vom Frontend erfassten Stand zurueck - fuer den
        "Abbrechen"-Knopf im "Bibliothek verwalten"-Popup, der alle seit dem
        Oeffnen des Popups vorgenommenen Aenderungen verwirft. Erwartet
        exakt die Form, die das Frontend beim Oeffnen des Popups selbst aus
        /api/sources, /api/filetypes und /api/excludes zusammengestellt hat -
        keine weitere Validierung noetig, da die Daten von hier stammen."""
        with self._lock:
            if isinstance(snapshot.get("sources"), list) and snapshot["sources"]:
                self._data["sources"] = [dict(s) for s in snapshot["sources"]]
            if isinstance(snapshot.get("filetypes"), list):
                self._data["filetypes"] = [dict(f) for f in snapshot["filetypes"]]
            if isinstance(snapshot.get("excludes"), dict):
                ex = snapshot["excludes"]
                self._data["excludes"] = {
                    "extensions": list(ex.get("extensions", [])),
                    "patterns": list(ex.get("patterns", [])),
                }
            if "render3d" in snapshot:
                settings = self._data.setdefault("settings", dict(DEFAULT_SETTINGS))
                settings["render3d"] = bool(snapshot["render3d"])
            if isinstance(snapshot.get("slicers"), dict):
                self._data["slicers"] = dict(snapshot["slicers"])
            self._save()
            return {
                "sources": [dict(s) for s in self._data["sources"]],
                "filetypes": [dict(f) for f in self._data["filetypes"]],
                "excludes": {
                    "extensions": list(self._data["excludes"]["extensions"]),
                    "patterns": list(self._data["excludes"]["patterns"]),
                },
                "slicers": dict(self._data.get("slicers", {})),
                "render3d": self._data.get("settings", {}).get("render3d", True),
            }


def rescan_all():
    """Stoesst fuer alle bekannten Quellen einen Hintergrund-Scan an - noetig
    nachdem sich die aktivierten Dateitypen geaendert haben, da das Ergebnis
    sonst noch die alte Dateitypen-Auswahl zeigen wuerde."""
    for scanner in Handler.scanners.values():
        scanner.start_background_scan()


def resolve_source_and_id(identifier):
    """Loest einen Gruppen-Schluessel oder Datei-Pfad zur richtigen Quelle
    auf. In der "Alle Ordner"-Ansicht (siehe combined_scan_result()) sind
    diese Bezeichner als 'quelle::key' bzw. 'quelle::pfad' praefixiert -
    einfache, nicht praefixierte Bezeichner beziehen sich wie bisher auf die
    aktuell aktive Einzel-Quelle. Gibt (scanner, echter_key_oder_pfad,
    quelle_id) zurueck, oder (None, None, None) wenn die Quelle unbekannt ist."""
    if identifier and "::" in identifier:
        sid, real = identifier.split("::", 1)
        scanner = Handler.scanners.get(sid)
        if scanner:
            return scanner, real, sid
        return None, None, None
    sid = Handler.active_id if Handler.active_id != ALL_ID else None
    scanner = Handler.scanners.get(sid) if sid else None
    if not scanner:
        return None, None, None
    return scanner, identifier, sid


MAX_BULK_ITEMS = 500


def parse_bulk_items(qs):
    """Liest den 'items'-Query-Parameter (JSON-Array von {"type": "file"|
    "group", "key": "..."}-Objekten) fuer Mehrfachauswahl-Aktionen ein und
    gibt eine Liste von (kind, key)-Tupeln zurueck, oder None bei ungueltigem
    Format."""
    raw = qs.get("items", [None])[0]
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except ValueError:
        return None
    if not isinstance(parsed, list) or not parsed:
        return None
    out = []
    for entry in parsed[:MAX_BULK_ITEMS]:
        if not isinstance(entry, dict):
            continue
        kind = entry.get("type")
        key = entry.get("key")
        if kind not in ("file", "group") or not key or not isinstance(key, str):
            continue
        out.append((kind, key))
    return out or None


def combined_scan_result():
    """Fasst die (bereits fertig gescannten) Ergebnisse aller Quellen zu
    einer einzigen 'Alle Ordner'-Ansicht zusammen. Gruppen-Schluessel werden
    dabei mit ihrer Quelle praefixiert ('quelle::key'), damit sie sich beim
    Anklicken (Thumbnail, Favorit, Loeschen) eindeutig wieder der richtigen
    Quelle zuordnen lassen (siehe resolve_source_and_id()). Einzelne
    Datei-Pfade innerhalb einer Gruppe bleiben unveraendert (relativ zu ihrer
    Quelle), da sie z.B. fuer den Ordnerbaum im Popup unveraendert bleiben
    muessen - die Zuordnung zur Quelle ergibt sich dort aus der Gruppe."""
    sources = LIBRARY.sources()
    any_scanning = False
    progress_done = 0
    progress_total = 0
    datas = []
    for s in sources:
        scanner = Handler.scanners.get(s["id"])
        if not scanner:
            continue
        st = scanner.get_status()
        if st["status"] == "idle":
            scanner.start_background_scan()
            st = scanner.get_status()
        if st["status"] == "scanning":
            any_scanning = True
            p = st["progress"] or {}
            progress_done += p.get("done", 0)
            progress_total += p.get("total", 0)
        elif st["status"] == "done" and st["data"]:
            datas.append((s, st["data"]))
        # bei "error" wird diese Quelle einfach uebersprungen - eine kaputte
        # Quelle soll die anderen nicht blockieren

    if any_scanning:
        return {"status": "scanning", "progress": {"done": progress_done, "total": progress_total, "current": ""}}

    merged_groups = []
    total_size = 0
    total_files = 0
    stl_count = 0
    mf_count = 0
    f3d_count = 0
    ext_counts = {}
    for s, data in datas:
        stats = data.get("stats", {})
        total_size += stats.get("total_size", 0)
        total_files += stats.get("files", 0)
        stl_count += stats.get("stl_count", 0)
        mf_count += stats.get("mf_count", 0)
        f3d_count += stats.get("f3d_count", 0)
        for ext, c in (stats.get("ext_counts") or {}).items():
            ext_counts[ext] = ext_counts.get(ext, 0) + c
        for g in data.get("groups", []):
            g2 = dict(g)
            namespaced_key = f"{s['id']}::{g['key']}"
            g2["key"] = namespaced_key
            g2["source_id"] = s["id"]
            g2["source_label"] = s["label"]
            g2["thumbnail_url"] = f"/api/thumbnail?key={namespaced_key}" if g.get("thumbnail_url") else None
            # Eigene Datei-Dicts (nicht die im Scanner-Cache!) mit der Quelle
            # markieren, damit das Frontend beim Anklicken einzelner Dateien
            # (Vorschau/Reveal/Loeschen/Favorit) weiss, gegen welche Quelle
            # der Aufruf gehen muss, ohne den relativen Pfad selbst antasten
            # zu muessen (der wird z.B. fuer den Ordnerbaum unveraendert
            # gebraucht).
            g2["files"] = [dict(f, _src=s["id"]) for f in g["files"]]
            merged_groups.append(g2)

    merged_groups.sort(key=lambda g: g["name"].lower())
    # Duplikat-Erkennung ueber alle Quellen hinweg neu berechnen - eine Datei
    # kann innerhalb ihrer eigenen Quelle einzigartig sein, aber in einer
    # anderen Quelle nochmal vorkommen (genau der Fall, den "Alle Ordner"
    # aufdecken soll).
    annotate_duplicates(merged_groups)

    return {
        "root": "Alle Ordner",
        "generated_at": time.time(),
        "stats": {
            "groups": len(merged_groups),
            "files": total_files,
            "total_size": total_size,
            "total_size_h": human_size(total_size),
            "stl_count": stl_count,
            "mf_count": mf_count,
            "f3d_count": f3d_count,
            "ext_counts": ext_counts,
        },
        "groups": merged_groups,
    }


def pick_folder_dialog():
    """Oeffnet einen nativen Ordner-Auswahldialog auf dem Rechner des Nutzers
    und gibt den gewaehlten Pfad zurueck (oder None bei Abbruch/Fehler).
    Laeuft nur lokal - der Server ist ausschliesslich an 127.0.0.1 gebunden."""
    try:
        import tkinter
        from tkinter import filedialog

        root = tkinter.Tk()
        root.withdraw()
        try:
            root.attributes("-topmost", True)
        except Exception:
            pass
        path = filedialog.askdirectory(title="Bibliotheksordner auswaehlen")
        root.destroy()
        return path or None
    except Exception:
        traceback.print_exc()
        return None


def pick_file_dialog(title, filetypes):
    """Oeffnet einen nativen Datei-Auswahldialog (z.B. um manuell auf eine
    Slicer-.exe zu zeigen, falls die automatische Suche nichts findet) und
    gibt den gewaehlten Pfad zurueck, oder None bei Abbruch/Fehler."""
    try:
        import tkinter
        from tkinter import filedialog

        root = tkinter.Tk()
        root.withdraw()
        try:
            root.attributes("-topmost", True)
        except Exception:
            pass
        path = filedialog.askopenfilename(title=title, filetypes=filetypes)
        root.destroy()
        return path or None
    except Exception:
        traceback.print_exc()
        return None


# ---------------------------------------------------------------------------
# HTTP-Server
# ---------------------------------------------------------------------------


class Handler(BaseHTTPRequestHandler):
    scanners: dict = {}   # source-id -> Scanner, wird in main() gesetzt
    active_id: str = None  # aktuell gewaehlte Quelle, wird in main() gesetzt
    favorites: FavoritesStore = None  # wird in main() gesetzt
    notes: NotesStore = None  # wird in main() gesetzt
    trash: TrashStore = None  # wird in main() gesetzt
    tags: TagsStore = None  # wird in main() gesetzt

    def get_scanner(self):
        """Scanner der aktuell aktiven Quelle - liefert None, wenn gerade die
        "Alle Ordner"-Ansicht aktiv ist (dort gibt es keine einzelne
        Quelle; siehe combined_scan_result() und resolve_source_and_id())."""
        if Handler.active_id == ALL_ID:
            return None
        return Handler.scanners.get(Handler.active_id)

    def log_message(self, fmt, *args):
        pass  # ruhiger Server, kein Konsolen-Spam

    def _send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_bytes(self, data, content_type, cache=True):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        if cache:
            self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        self.wfile.write(data)

    def _send_file(self, full_path, cache=True, download_name=None):
        try:
            size = os.path.getsize(full_path)
        except OSError:
            self.send_error(404)
            return
        ctype = mimetypes.guess_type(full_path)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(size))
        if download_name:
            self.send_header("Content-Disposition", f'attachment; filename="{download_name}"')
        if cache:
            self.send_header("Cache-Control", "public, max-age=3600")
        else:
            # Oberflaechen-Dateien (HTML/CSS/JS) aendern sich waehrend der
            # Entwicklung haeufig - nicht cachen, sonst zeigt der Browser nach
            # einem Update weiter die alte Version an.
            self.send_header("Cache-Control", "no-store, must-revalidate")
        self.end_headers()
        with open(full_path, "rb") as fh:
            while True:
                chunk = fh.read(1024 * 256)
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except BrokenPipeError:
                    break

    def _serve_static(self, path):
        if path == "/":
            path = "/index.html"
        safe_path = os.path.normpath(path).lstrip("/\\")
        full = os.path.join(STATIC_DIR, safe_path)
        if not full.startswith(STATIC_DIR) or not os.path.isfile(full):
            self.send_error(404)
            return
        self._send_file(full, cache=False)

    def do_GET(self):
        parsed = urlparse(self.path)
        # keep_blank_values=True ist wichtig: sonst wirft parse_qs
        # Parameter mit leerem Wert (z.B. "...&value=" zum Zuruecksetzen
        # einer Einstellung auf leer) komplett weg, statt sie als leeren
        # String zu behalten - das wuerde sie ununterscheidbar von "Parameter
        # fehlt ganz" machen und z.B. das Entfernen des Standard-Slicers
        # unmoeglich machen (führte faelschlich zu 400 Bad Request).
        qs = parse_qs(parsed.query, keep_blank_values=True)

        if parsed.path == "/api/sources":
            self._send_json({"sources": LIBRARY.sources(), "active": Handler.active_id})
            return

        if parsed.path == "/api/switch-source":
            sid = qs.get("id", [None])[0]
            if not sid or (sid != ALL_ID and sid not in Handler.scanners):
                self.send_error(400)
                return
            Handler.active_id = sid
            if sid == ALL_ID:
                for scanner in Handler.scanners.values():
                    if scanner.get_status()["status"] == "idle":
                        scanner.start_background_scan()
            else:
                scanner = Handler.scanners[sid]
                if scanner.get_status()["status"] == "idle":
                    scanner.start_background_scan()
            self._send_json({"ok": True, "active": sid})
            return

        if parsed.path == "/api/pick-folder":
            path = pick_folder_dialog()
            self._send_json({"path": path})
            return

        if parsed.path == "/api/slicers":
            configured = LIBRARY.slicer_paths()
            result = []
            for defn in SLICER_DEFS:
                manual = configured.get(defn["id"])
                if manual and os.path.isfile(manual):
                    path, detected = manual, False
                else:
                    path, detected = detect_slicer_path(defn["id"]), True
                result.append(
                    {
                        "id": defn["id"],
                        "label": defn["label"],
                        "path": path,
                        "detected": detected,
                        # Roh-Konfiguration (nur manuell gesetzt, ohne Auto-
                        # Erkennung) - fuer den "Abbrechen"-Snapshot des
                        # "Bibliothek verwalten"-Popups (siehe restore_snapshot).
                        "configured_path": manual if manual and os.path.isfile(manual) else None,
                    }
                )
            self._send_json({"slicers": result})
            return

        if parsed.path == "/api/pick-slicer-file":
            slicer_id = qs.get("id", [None])[0]
            defn = next((s for s in SLICER_DEFS if s["id"] == slicer_id), None)
            if not defn:
                self.send_error(400)
                return
            filetypes = [("Programm", "*.exe"), ("Alle Dateien", "*.*")] if sys.platform.startswith("win") else [("Alle Dateien", "*.*")]
            path = pick_file_dialog(f"{defn['label']} auswaehlen", filetypes)
            self._send_json({"path": path})
            return

        if parsed.path == "/api/set-slicer-path":
            slicer_id = qs.get("id", [None])[0]
            path = qs.get("path", [None])[0]
            if not any(s["id"] == slicer_id for s in SLICER_DEFS):
                self._send_json({"ok": False, "error": "Unbekannter Slicer."}, status=400)
                return
            if path and not os.path.isfile(path):
                self._send_json({"ok": False, "error": "Datei nicht gefunden."}, status=400)
                return
            LIBRARY.set_slicer_path(slicer_id, path)
            self._send_json({"ok": True})
            return

        if parsed.path == "/api/open-with-slicer":
            slicer_id = qs.get("id", [None])[0]
            rel = qs.get("path", [None])[0]
            defn = next((s for s in SLICER_DEFS if s["id"] == slicer_id), None)
            if not defn or not rel:
                self.send_error(400)
                return
            scanner, real_path, _sid = resolve_source_and_id(rel)
            if not scanner:
                self.send_error(400)
                return
            try:
                full = scanner.safe_join(real_path)
            except ValueError:
                self.send_error(403)
                return
            if not os.path.isfile(full):
                self._send_json({"ok": False, "error": "Datei nicht gefunden."}, status=404)
                return
            configured = LIBRARY.slicer_paths()
            exe = configured.get(slicer_id)
            if not exe or not os.path.isfile(exe):
                exe = detect_slicer_path(slicer_id)
            if not exe:
                self._send_json(
                    {"ok": False, "error": f"{defn['label']} wurde nicht gefunden. Bitte den Pfad in \"Bibliothek verwalten\" festlegen."},
                    status=400,
                )
                return
            try:
                subprocess.Popen([exe, full])
            except OSError as e:
                self._send_json({"ok": False, "error": str(e)}, status=500)
                return
            self._send_json({"ok": True})
            return

        if parsed.path == "/api/add-source":
            path = qs.get("path", [None])[0]
            label = (qs.get("label", [None])[0] or "").strip()
            if not path or not os.path.isdir(path):
                self._send_json({"ok": False, "error": "Ordner nicht gefunden."}, status=400)
                return
            path = os.path.abspath(path)
            if not label:
                label = os.path.basename(path.rstrip("/\\")) or path
            for s in LIBRARY.sources():
                relation = path_overlap(path, os.path.abspath(s["path"]))
                if relation == "same":
                    self._send_json(
                        {"ok": False, "error": "Dieser Ordner ist bereits in der Bibliothek."},
                        status=400,
                    )
                    return
                if relation == "a_in_b":
                    self._send_json(
                        {
                            "ok": False,
                            "error": f'Dieser Ordner liegt bereits innerhalb von "{s["label"]}" und wird darüber schon durchsucht. Ein zweites Hinzufügen würde Dateien doppelt einlesen.',
                        },
                        status=400,
                    )
                    return
                if relation == "b_in_a":
                    self._send_json(
                        {
                            "ok": False,
                            "error": f'"{s["label"]}" liegt bereits innerhalb dieses Ordners und wird darüber schon durchsucht. Ein zweites Hinzufügen würde Dateien doppelt einlesen.',
                        },
                        status=400,
                    )
                    return
            entry = LIBRARY.add_source(path, label)
            Handler.scanners[entry["id"]] = Scanner(entry["path"])
            Handler.scanners[entry["id"]].start_background_scan()
            self._send_json({"ok": True, "sources": LIBRARY.sources(), "active": Handler.active_id})
            return

        if parsed.path == "/api/remove-source":
            sid = qs.get("id", [None])[0]
            sources = LIBRARY.sources()
            if not sid or sid not in Handler.scanners:
                self.send_error(400)
                return
            if len(sources) <= 1:
                self._send_json({"ok": False, "error": "Mindestens ein Ordner muss vorhanden bleiben."}, status=400)
                return
            LIBRARY.remove_source(sid)
            del Handler.scanners[sid]
            if Handler.active_id == sid:
                Handler.active_id = LIBRARY.sources()[0]["id"]
                if Handler.scanners[Handler.active_id].get_status()["status"] == "idle":
                    Handler.scanners[Handler.active_id].start_background_scan()
            self._send_json({"ok": True, "sources": LIBRARY.sources(), "active": Handler.active_id})
            return

        if parsed.path == "/api/filetypes":
            self._send_json({"filetypes": LIBRARY.filetypes()})
            return

        if parsed.path == "/api/settings":
            self._send_json(LIBRARY.settings())
            return

        if parsed.path == "/api/toggle-setting":
            key = qs.get("key", [None])[0]
            if not key:
                self.send_error(400)
                return
            value = LIBRARY.toggle_setting(key)
            if value is None:
                self.send_error(404)
                return
            if key == "auto_backup" and value:
                # Sofort eine erste Sicherung schreiben, statt bis zu einer
                # Stunde auf den naechsten Hintergrund-Check zu warten (siehe
                # auto_backup_loop) - so sieht man direkt ein Ergebnis.
                try:
                    write_auto_backup()
                except Exception:
                    traceback.print_exc()
            self._send_json({"ok": True, "key": key, "value": value})
            return

        if parsed.path == "/api/set-setting":
            key = qs.get("key", [None])[0]
            value = qs.get("value", [None])[0]
            if not key or value is None:
                self.send_error(400)
                return
            saved = LIBRARY.set_setting(key, value)
            if saved is None:
                self._send_json({"ok": False, "error": "Ungültiger Schlüssel oder Wert."}, status=400)
                return
            self._send_json({"ok": True, "key": key, "value": saved})
            return

        if parsed.path == "/api/add-filetype":
            raw_ext = (qs.get("ext", [None])[0] or "").strip().lower().lstrip(".")
            label = (qs.get("label", [None])[0] or "").strip() or raw_ext.upper()
            if not re.fullmatch(r"[a-z0-9]{1,10}", raw_ext):
                self._send_json(
                    {"ok": False, "error": "Ungueltige Dateiendung (nur Buchstaben/Zahlen, max. 10 Zeichen)."},
                    status=400,
                )
                return
            entry = LIBRARY.add_filetype(raw_ext, label)
            if entry is None:
                self._send_json({"ok": False, "error": "Dieser Dateityp existiert bereits."}, status=400)
                return
            rescan_all()
            self._send_json({"ok": True, "filetypes": LIBRARY.filetypes()})
            return

        if parsed.path == "/api/edit-filetype":
            ext = qs.get("ext", [None])[0]
            new_ext = (qs.get("new_ext", [None])[0] or "").strip().lower().lstrip(".")
            label = (qs.get("label", [None])[0] or "").strip() or new_ext.upper()
            if not ext or not re.fullmatch(r"[a-z0-9]{1,10}", new_ext):
                self._send_json(
                    {"ok": False, "error": "Ungueltige Dateiendung (nur Buchstaben/Zahlen, max. 10 Zeichen)."},
                    status=400,
                )
                return
            result = LIBRARY.edit_filetype(ext, new_ext, label)
            if result is None:
                self._send_json({"ok": False, "error": "Dieser Dateityp kann nicht bearbeitet werden."}, status=400)
                return
            if result == "duplicate":
                self._send_json({"ok": False, "error": "Diese Dateiendung wird bereits verwendet."}, status=400)
                return
            rescan_all()
            self._send_json({"ok": True, "filetypes": LIBRARY.filetypes()})
            return

        if parsed.path == "/api/remove-filetype":
            ext = qs.get("ext", [None])[0]
            if not ext:
                self.send_error(400)
                return
            changed = LIBRARY.remove_filetype(ext)
            if not changed:
                self._send_json({"ok": False, "error": "Dieser Dateityp kann nicht entfernt werden."}, status=400)
                return
            rescan_all()
            self._send_json({"ok": True, "filetypes": LIBRARY.filetypes()})
            return

        if parsed.path == "/api/toggle-filetype":
            ext = qs.get("ext", [None])[0]
            if not ext:
                self.send_error(400)
                return
            enabled = LIBRARY.toggle_filetype(ext)
            if enabled is None:
                self.send_error(404)
                return
            rescan_all()
            self._send_json({"ok": True, "enabled": enabled, "filetypes": LIBRARY.filetypes()})
            return

        if parsed.path == "/api/known-filetypes":
            self._send_json({"categories": KNOWN_FILETYPES})
            return

        if parsed.path == "/api/apply-filetype-preset":
            preset = qs.get("preset", [None])[0]
            filetypes = LIBRARY.apply_filetype_preset(preset)
            if filetypes is None:
                self._send_json({"ok": False, "error": "Unbekannte Voreinstellung."}, status=400)
                return
            rescan_all()
            self._send_json({"ok": True, "filetypes": filetypes})
            return

        if parsed.path == "/api/excludes":
            self._send_json(LIBRARY.excludes())
            return

        if parsed.path == "/api/set-excludes":
            # Endungen kommastrennt, Muster zeilenweise (siehe app.js) - beide
            # als einzelne, URL-kodierte Query-Parameter uebergeben, damit wir
            # nicht vom sonst reinen GET-Stil dieser API abweichen muessen.
            raw_exts = qs.get("extensions", [""])[0]
            raw_patterns = qs.get("patterns", [""])[0]
            extensions = [e for e in raw_exts.split(",") if e.strip()]
            patterns = [p for p in raw_patterns.split("\n") if p.strip()]
            result = LIBRARY.set_excludes(extensions, patterns)
            rescan_all()
            self._send_json({"ok": True, **result})
            return

        if parsed.path == "/api/restore-config":
            # "Abbrechen"-Knopf im "Bibliothek verwalten"-Popup: verwirft
            # alle seit dem Oeffnen des Popups vorgenommenen Aenderungen
            # (Ordner, Dateitypen, Ausschluesse, 3D-Live-Vorschau), indem der
            # beim Oeffnen vom Frontend erfasste Stand wiederhergestellt
            # wird. raw JSON kommt als einzelner "data"-Parameter, damit wir
            # nicht vom sonst reinen GET-Stil dieser API abweichen muessen.
            raw = qs.get("data", [None])[0]
            try:
                snapshot = json.loads(raw) if raw else None
            except (ValueError, TypeError):
                snapshot = None
            if not isinstance(snapshot, dict):
                self._send_json({"ok": False, "error": "Ungueltige Daten."}, status=400)
                return
            result = LIBRARY.restore_snapshot(snapshot)

            # Laufende Scanner-Objekte (Handler.scanners) an die
            # wiederhergestellte Quellenliste angleichen - LIBRARY kennt nur
            # die Konfiguration, nicht die dazugehoerigen Live-Scanner.
            new_sources = result["sources"]
            new_ids = {s["id"] for s in new_sources}
            for sid in list(Handler.scanners.keys()):
                if sid not in new_ids:
                    del Handler.scanners[sid]
            for s in new_sources:
                if s["id"] not in Handler.scanners:
                    Handler.scanners[s["id"]] = Scanner(s["path"])
            if Handler.active_id != ALL_ID and Handler.active_id not in Handler.scanners:
                Handler.active_id = new_sources[0]["id"] if new_sources else None

            rescan_all()
            self._send_json({"ok": True, **result, "active": Handler.active_id})
            return

        if parsed.path == "/api/scan":
            if Handler.active_id == ALL_ID:
                self._send_json(combined_scan_result())
                return
            st = self.get_scanner().get_status()
            if st["status"] == "done":
                self._send_json(st["data"])
            elif st["status"] == "error":
                self._send_json(
                    {"error": st["error"] or "Unbekannter Fehler beim Scan", "stats": {}, "groups": []}
                )
            else:
                # idle oder scanning -> Hintergrund-Scan sicherstellen und
                # Fortschritt zurueckmelden, damit das Frontend pollen kann
                if st["status"] == "idle":
                    self.get_scanner().start_background_scan()
                self._send_json({"status": "scanning", "progress": st["progress"]})
            return

        if parsed.path == "/api/rescan":
            if Handler.active_id == ALL_ID:
                rescan_all()
            else:
                self.get_scanner().start_background_scan()
            self._send_json({"status": "scanning"})
            return

        if parsed.path == "/api/thumbnail":
            key = qs.get("key", [None])[0]
            if not key:
                self.send_error(400)
                return
            scanner, real_key, _sid = resolve_source_and_id(key)
            if not scanner:
                self.send_error(400)
                return
            data, ctype = scanner.get_thumbnail(real_key)
            if data is None:
                self.send_error(404)
                return
            self._send_bytes(data, ctype)
            return

        if parsed.path == "/api/file-thumbnail":
            rel = qs.get("path", [None])[0]
            if not rel:
                self.send_error(400)
                return
            scanner, real_path, _sid = resolve_source_and_id(rel)
            if not scanner:
                self.send_error(400)
                return
            data, ctype = scanner.get_file_thumbnail(real_path)
            if data is None:
                self.send_error(404)
                return
            self._send_bytes(data, ctype, cache=False)
            return

        if parsed.path == "/api/file":
            rel = qs.get("path", [None])[0]
            if not rel:
                self.send_error(400)
                return
            scanner, real_path, _sid = resolve_source_and_id(rel)
            if not scanner:
                self.send_error(400)
                return
            try:
                full = scanner.safe_join(real_path)
            except ValueError:
                self.send_error(403)
                return
            if not os.path.isfile(full):
                self.send_error(404)
                return
            download = qs.get("dl", [None])[0] == "1"
            self._send_file(full, download_name=os.path.basename(full) if download else None)
            return

        if parsed.path == "/api/reveal":
            rel = qs.get("path", [None])[0]
            if not rel:
                self.send_error(400)
                return
            scanner, real_path, _sid = resolve_source_and_id(rel)
            if not scanner:
                self.send_error(400)
                return
            try:
                scanner.reveal_in_file_manager(real_path)
            except ValueError:
                self.send_error(403)
                return
            except FileNotFoundError:
                self.send_error(404)
                return
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, status=500)
                return
            self._send_json({"ok": True})
            return

        if parsed.path == "/api/favorites":
            if Handler.active_id == ALL_ID:
                merged = {"groups": [], "files": []}
                for s in LIBRARY.sources():
                    fav = Handler.favorites.get(s["id"])
                    merged["groups"].extend(f"{s['id']}::{k}" for k in fav["groups"])
                    merged["files"].extend(f"{s['id']}::{k}" for k in fav["files"])
                self._send_json(merged)
                return
            self._send_json(Handler.favorites.get(Handler.active_id))
            return

        if parsed.path == "/api/favorite-toggle":
            kind = qs.get("type", [None])[0]
            key = qs.get("key", [None])[0]
            if kind not in ("group", "file") or not key:
                self.send_error(400)
                return
            _scanner, real_key, sid = resolve_source_and_id(key)
            if not sid:
                self.send_error(400)
                return
            active = Handler.favorites.toggle(sid, "groups" if kind == "group" else "files", real_key)
            self._send_json({"ok": True, "active": active})
            return

        if parsed.path == "/api/notes":
            if Handler.active_id == ALL_ID:
                merged = {}
                for s in LIBRARY.sources():
                    for k, v in Handler.notes.get_all(s["id"]).items():
                        merged[f"{s['id']}::{k}"] = v
                self._send_json(merged)
                return
            self._send_json(Handler.notes.get_all(Handler.active_id))
            return

        if parsed.path == "/api/set-note":
            key = qs.get("key", [None])[0]
            text = qs.get("text", [""])[0]
            if not key:
                self.send_error(400)
                return
            if len(text) > MAX_NOTE_LENGTH:
                self._send_json({"ok": False, "error": "Notiz ist zu lang."}, status=400)
                return
            _scanner, real_key, sid = resolve_source_and_id(key)
            if not sid:
                self.send_error(400)
                return
            saved = Handler.notes.set(sid, real_key, text)
            self._send_json({"ok": True, "text": saved})
            return

        if parsed.path == "/api/backup-status":
            fname, mtime = latest_auto_backup()
            self._send_json({
                "enabled": bool(LIBRARY.settings().get("auto_backup")),
                "last_backup": mtime,
                "last_backup_file": fname,
                "keep": AUTO_BACKUP_KEEP,
            })
            return

        if parsed.path == "/api/check-update":
            self._send_json(check_for_update())
            return

        if parsed.path == "/api/tags":
            if Handler.active_id == ALL_ID:
                merged = {}
                for s in LIBRARY.sources():
                    for k, v in Handler.tags.get_all(s["id"]).items():
                        merged[f"{s['id']}::{k}"] = v
                self._send_json(merged)
                return
            self._send_json(Handler.tags.get_all(Handler.active_id))
            return

        if parsed.path == "/api/set-tags":
            key = qs.get("key", [None])[0]
            raw = qs.get("tags", [""])[0]
            if not key:
                self.send_error(400)
                return
            tags = [t for t in raw.split(",")] if raw else []
            _scanner, real_key, sid = resolve_source_and_id(key)
            if not sid:
                self.send_error(400)
                return
            saved = Handler.tags.set(sid, real_key, tags)
            self._send_json({"ok": True, "tags": saved})
            return

        if parsed.path == "/api/all-tags":
            if Handler.active_id == ALL_ID:
                seen = {}
                for s in LIBRARY.sources():
                    for tag in Handler.tags.all_tags(s["id"]):
                        seen.setdefault(tag.lower(), tag)
                self._send_json({"tags": sorted(seen.values(), key=lambda s: s.lower())})
                return
            self._send_json({"tags": Handler.tags.all_tags(Handler.active_id)})
            return

        if parsed.path == "/api/export-backup":
            bundle = build_backup_bundle()
            body = json.dumps(bundle, ensure_ascii=False, indent=2).encode("utf-8")
            fname = f"3d-druck-sammlung-sicherung-{time.strftime('%Y-%m-%d')}.json"
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Disposition", f'attachment; filename="{fname}"')
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return

        if parsed.path == "/api/download-group":
            key = qs.get("key", [None])[0]
            if not key:
                self.send_error(400)
                return
            scanner, real_key, _sid = resolve_source_and_id(key)
            if not scanner:
                self.send_error(400)
                return
            group = scanner.find_group(real_key)
            if not group:
                self.send_error(404)
                return
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for f in group["files"]:
                    try:
                        full = scanner.safe_join(f["path"])
                        zf.write(full, arcname=f["path"])
                    except (ValueError, OSError):
                        continue
            data = buf.getvalue()
            safe_name = re.sub(r'[\\/:*?"<>|]+', "_", group["name"]) or "projekt"
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", f'attachment; filename="{safe_name}.zip"')
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == "/api/delete-file":
            rel = qs.get("path", [None])[0]
            if not rel:
                self.send_error(400)
                return
            scanner, real_path, sid = resolve_source_and_id(rel)
            if not scanner:
                self.send_error(400)
                return
            try:
                full = scanner.safe_join(real_path)
            except ValueError:
                self.send_error(403)
                return
            if not os.path.isfile(full):
                self.send_error(404)
                return
            try:
                move_to_trash(sid, real_path, full)
            except OSError as e:
                self._send_json({"ok": False, "error": str(e)}, status=500)
                return
            Handler.favorites.remove(sid, "files", real_path)
            Handler.tags.remove(sid, real_path)
            scanner.start_background_scan()
            self._send_json({"ok": True})
            return

        if parsed.path == "/api/delete-group":
            key = qs.get("key", [None])[0]
            if not key:
                self.send_error(400)
                return
            scanner, real_key, sid = resolve_source_and_id(key)
            if not scanner:
                self.send_error(400)
                return
            group = scanner.find_group(real_key)
            if not group:
                self.send_error(404)
                return
            errors = []
            deleted = 0
            for f in group["files"]:
                try:
                    full = scanner.safe_join(f["path"])
                    move_to_trash(sid, f["path"], full)
                    deleted += 1
                    Handler.favorites.remove(sid, "files", f["path"])
                except OSError as e:
                    errors.append(f"{f['path']}: {e}")
            Handler.favorites.remove(sid, "groups", real_key)
            Handler.notes.remove(sid, real_key)
            Handler.tags.remove(sid, real_key)
            scanner.start_background_scan()
            self._send_json({"ok": len(errors) == 0, "deleted": deleted, "errors": errors})
            return

        if parsed.path == "/api/bulk-delete":
            items = parse_bulk_items(qs)
            if items is None:
                self._send_json({"ok": False, "error": "Ungültige Auswahl."}, status=400)
                return
            errors = []
            deleted = 0
            touched_scanners = set()
            for kind, key in items:
                scanner, real_key, sid = resolve_source_and_id(key)
                if not scanner:
                    errors.append(f"{key}: Quelle nicht gefunden.")
                    continue
                if kind == "group":
                    group = scanner.find_group(real_key)
                    if not group:
                        errors.append(f"{key}: Projekt nicht gefunden.")
                        continue
                    for f in group["files"]:
                        try:
                            full = scanner.safe_join(f["path"])
                            move_to_trash(sid, f["path"], full)
                            deleted += 1
                            Handler.favorites.remove(sid, "files", f["path"])
                        except OSError as e:
                            errors.append(f"{f['path']}: {e}")
                    Handler.favorites.remove(sid, "groups", real_key)
                    Handler.notes.remove(sid, real_key)
                    Handler.tags.remove(sid, real_key)
                else:
                    try:
                        full = scanner.safe_join(real_key)
                        move_to_trash(sid, real_key, full)
                        deleted += 1
                        Handler.favorites.remove(sid, "files", real_key)
                        Handler.tags.remove(sid, real_key)
                    except (ValueError, OSError) as e:
                        errors.append(f"{key}: {e}")
                touched_scanners.add(scanner)
            for scanner in touched_scanners:
                scanner.start_background_scan()
            self._send_json({"ok": len(errors) == 0, "deleted": deleted, "errors": errors})
            return

        if parsed.path == "/api/bulk-favorite":
            items = parse_bulk_items(qs)
            value = qs.get("value", ["1"])[0] not in ("0", "false", "")
            if items is None:
                self._send_json({"ok": False, "error": "Ungültige Auswahl."}, status=400)
                return
            errors = []
            updated = 0
            for kind, key in items:
                _scanner, real_key, sid = resolve_source_and_id(key)
                if not sid:
                    errors.append(f"{key}: Quelle nicht gefunden.")
                    continue
                Handler.favorites.set(sid, "groups" if kind == "group" else "files", real_key, value)
                updated += 1
            self._send_json({"ok": len(errors) == 0, "updated": updated, "errors": errors, "value": value})
            return

        if parsed.path == "/api/download-zip":
            items = parse_bulk_items(qs)
            if items is None:
                self._send_json({"ok": False, "error": "Ungültige Auswahl."}, status=400)
                return
            buf = io.BytesIO()
            used_names = set()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for kind, key in items:
                    scanner, real_key, _sid = resolve_source_and_id(key)
                    if not scanner:
                        continue
                    if kind == "group":
                        group = scanner.find_group(real_key)
                        if not group:
                            continue
                        base = re.sub(r'[\\/:*?"<>|]+', "_", group["name"]) or "projekt"
                        folder = base
                        n = 1
                        while folder in used_names:
                            n += 1
                            folder = f"{base} ({n})"
                        used_names.add(folder)
                        for f in group["files"]:
                            try:
                                full = scanner.safe_join(f["path"])
                                zf.write(full, arcname=f"{folder}/{f['path']}")
                            except (ValueError, OSError):
                                continue
                    else:
                        try:
                            full = scanner.safe_join(real_key)
                            name = os.path.basename(real_key)
                            arcname = name
                            n = 1
                            while arcname in used_names:
                                n += 1
                                base, ext = os.path.splitext(name)
                                arcname = f"{base} ({n}){ext}"
                            used_names.add(arcname)
                            zf.write(full, arcname=arcname)
                        except (ValueError, OSError):
                            continue
            data = buf.getvalue()
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", 'attachment; filename="auswahl.zip"')
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == "/api/trash-list":
            Handler.trash.purge_expired(TRASH_MAX_AGE_DAYS)
            items = Handler.trash.list_all()
            source_labels = {s["id"]: s["label"] for s in LIBRARY.sources()}
            for it in items:
                it["source_label"] = source_labels.get(it["source_id"], it["source_id"])
            items.sort(key=lambda it: it["deleted_at"], reverse=True)
            self._send_json({"items": items, "max_age_days": TRASH_MAX_AGE_DAYS})
            return

        if parsed.path == "/api/trash-restore":
            item_id = qs.get("id", [None])[0]
            entry = Handler.trash.get(item_id) if item_id else None
            if not entry:
                self._send_json({"ok": False, "error": "Eintrag nicht gefunden."}, status=404)
                return
            scanner = Handler.scanners.get(entry["source_id"])
            if not scanner:
                self._send_json(
                    {"ok": False, "error": "Der ursprüngliche Bibliothekordner ist nicht mehr vorhanden."},
                    status=400,
                )
                return
            trash_full = os.path.join(TRASH_DIR, entry["source_id"], entry["trash_name"])
            if not os.path.isfile(trash_full):
                Handler.trash.remove(item_id)
                self._send_json({"ok": False, "error": "Datei im Papierkorb nicht gefunden."}, status=404)
                return
            try:
                dest = scanner.safe_join(entry["rel_path"])
            except ValueError:
                self._send_json({"ok": False, "error": "Ungültiger Zielpfad."}, status=400)
                return
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            if os.path.exists(dest):
                # Am urspruenglichen Ort liegt inzwischen wieder eine Datei
                # mit demselben Namen - nicht ueberschreiben, sondern mit
                # Zusatz wiederherstellen.
                base, ext = os.path.splitext(dest)
                candidate = f"{base} (wiederhergestellt){ext}"
                n = 1
                while os.path.exists(candidate):
                    n += 1
                    candidate = f"{base} (wiederhergestellt {n}){ext}"
                dest = candidate
            try:
                shutil.move(trash_full, dest)
            except OSError as e:
                self._send_json({"ok": False, "error": str(e)}, status=500)
                return
            Handler.trash.remove(item_id)
            scanner.start_background_scan()
            self._send_json({"ok": True})
            return

        if parsed.path == "/api/trash-delete-forever":
            item_id = qs.get("id", [None])[0]
            entry = Handler.trash.get(item_id) if item_id else None
            if not entry:
                self._send_json({"ok": False, "error": "Eintrag nicht gefunden."}, status=404)
                return
            trash_full = os.path.join(TRASH_DIR, entry["source_id"], entry["trash_name"])
            try:
                if os.path.isfile(trash_full):
                    os.remove(trash_full)
            except OSError as e:
                self._send_json({"ok": False, "error": str(e)}, status=500)
                return
            Handler.trash.remove(item_id)
            self._send_json({"ok": True})
            return

        if parsed.path == "/api/trash-empty":
            errors = []
            for it in Handler.trash.list_all():
                trash_full = os.path.join(TRASH_DIR, it["source_id"], it["trash_name"])
                try:
                    if os.path.isfile(trash_full):
                        os.remove(trash_full)
                except OSError as e:
                    errors.append(str(e))
                Handler.trash.remove(it["id"])
            self._send_json({"ok": len(errors) == 0, "errors": errors})
            return

        self._serve_static(parsed.path)


class WebviewAPI:
    """Wird dem pywebview-Fenster als JS-API mitgegeben (window.pywebview.api
    im Frontend) - aktuell nur fuer einen Zweck: einen Link (z.B. den
    Update-Download) im normalen System-Browser statt im App-Fenster selbst
    zu oeffnen."""

    def open_external(self, url):
        if not url or not str(url).lower().startswith(("http://", "https://")):
            return False
        import webbrowser

        webbrowser.open(str(url))
        return True


def main():
    global LIBRARY
    LIBRARY = LibraryConfig(LIBRARY_CONFIG_FILE)
    sources = LIBRARY.sources()
    if len(sys.argv) > 1 and sources:
        # Kommandozeilenargument ueberschreibt (nur fuer diesen Lauf, nicht
        # persistiert) den Pfad der ersten Quelle - praktisch zum Testen.
        sources[0] = dict(sources[0])
        sources[0]["path"] = os.path.abspath(os.path.expanduser(sys.argv[1]))

    Handler.scanners = {s["id"]: Scanner(s["path"]) for s in sources}
    Handler.active_id = sources[0]["id"] if sources else None
    if Handler.active_id:
        Handler.scanners[Handler.active_id].start_background_scan()
    Handler.favorites = FavoritesStore(FAVORITES_FILE)
    Handler.notes = NotesStore(NOTES_FILE)
    Handler.trash = TrashStore(TRASH_FILE)
    Handler.trash.purge_expired(TRASH_MAX_AGE_DAYS)
    Handler.tags = TagsStore(TAGS_FILE)
    threading.Thread(target=auto_backup_loop, daemon=True).start()

    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"3D-Druck-Uebersicht laeuft. (Version {APP_VERSION})")
    for s in sources:
        print(f"Quelle '{s['label']}': {s['path']}")
    print(f"Adresse: http://localhost:{PORT}")

    # Server im Hintergrund-Thread laufen lassen: pywebview muss auf manchen
    # Betriebssystemen (v.a. macOS) im Haupt-Thread laufen, deshalb kann der
    # Haupt-Thread hier nicht gleichzeitig serve_forever() blockieren.
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    if WEBVIEW_AVAILABLE:
        # Eigenes Programmfenster statt Browser-Tab - fuehlt sich wie ein
        # "echtes" Windows-Programm an (siehe app.spec/build_exe.bat). Sollte
        # das Erstellen des Fensters aus irgendeinem Grund fehlschlagen (z.B.
        # fehlende WebView2-Runtime auf einem sehr alten Windows), faellt die
        # App automatisch auf den normalen Browser-Tab zurueck, statt einfach
        # abzustuerzen.
        try:
            webview.create_window(
                "3D-Druck Sammlung",
                f"http://127.0.0.1:{PORT}",
                width=1440,
                height=900,
                min_size=(960, 640),
                js_api=WebviewAPI(),
            )
            webview.start()
            return
        except Exception:
            traceback.print_exc()
            print("Konnte kein eigenes Fenster oeffnen - oeffne stattdessen den Browser.")

    import webbrowser

    threading.Timer(0.6, lambda: webbrowser.open(f"http://localhost:{PORT}")).start()
    print("Zum Beenden: Strg+C bzw. dieses Fenster schliessen")
    try:
        server_thread.join()
    except KeyboardInterrupt:
        print("\nBeendet.")


if __name__ == "__main__":
    main()
