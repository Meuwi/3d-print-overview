# Einmalige Einrichtung: Automatische Updates

Diese Anleitung richtet sich an Daniel (oder wer sonst dieses Programm pflegt) und
muss nur **einmal** durchgegangen werden. Danach funktioniert das automatische
Update-System von selbst.

Kurz gesagt: Der Programmcode liegt auf **GitHub** (kostenlos, eine Art
Online-Ablage für Programme). Jedes Mal, wenn eine neue Version veröffentlicht
wird, baut GitHub automatisch eine neue `.exe`-Datei und stellt sie bereit.
Das Programm selbst prüft beim Start (und über den Knopf "Nach Updates
suchen" im Menü), ob dort eine neuere Version liegt.

## Schritt 1: Kostenloses GitHub-Konto

Falls noch nicht vorhanden: auf [github.com](https://github.com) registrieren
(kostenlos, nur E-Mail-Adresse nötig).

## Schritt 2: Neues Repository (= Projekt-Ablage) erstellen

1. Auf github.com oben rechts auf **"+"** → **"New repository"** klicken.
2. Name z. B. `3d-print-overview` (kann auch anders heißen).
3. **Public** (öffentlich) auswählen — das ist wichtig, damit die
   Update-Prüfung ohne zusätzliche Zugangsdaten funktioniert.
4. "Create repository" klicken.

> **Hinweis zur Privatsphäre:** "Öffentlich" bedeutet, dass jeder den
> Programmcode einsehen kann (wie bei sehr vielen kostenlosen Programmen).
> Es stehen keine persönlichen Daten, Passwörter oder Ähnliches im Code -
> ich habe den einzigen fest einprogrammierten Ordnerpfad bereits entfernt,
> bevor diese Anleitung entstand.

## Schritt 3: Projektordner hochladen

Am einfachsten mit **GitHub Desktop** (kostenloses Programm mit Fenstern und
Knöpfen, keine Kommandozeile nötig):

1. [GitHub Desktop](https://desktop.github.com) herunterladen und installieren.
2. Mit dem GitHub-Konto aus Schritt 1 anmelden.
3. "Add" → "Add existing repository" → den Ordner `3d-print-overview`
   auswählen (dort, wo `app.py` liegt).
4. Unten links kurze Beschreibung eintippen (z. B. "Erste Version") und auf
   "Commit to main" klicken.
5. Oben auf "Publish repository" klicken → Häkchen bei "Keep this code
   private" **entfernen** (siehe Hinweis oben) → "Publish".

Der Code liegt jetzt auf GitHub.

## Schritt 4: Die eine Code-Zeile anpassen

In `app.py` ganz am Anfang steht:

```python
UPDATE_REPO = "DEIN-GITHUB-NAME/3d-print-overview"
```

`DEIN-GITHUB-NAME` durch den tatsächlichen GitHub-Benutzernamen ersetzen
(z. B. `UPDATE_REPO = "danielm/3d-print-overview"`), speichern, und über
GitHub Desktop erneut hochladen ("Commit" + "Push origin").

## Schritt 5: Erstes Update veröffentlichen

Ein "Release" ist eine veröffentlichte Version. Sobald eines mit einem
Versions-Tag erstellt wird, baut GitHub automatisch die `.exe` und hängt sie
an (das übernimmt die Datei `.github/workflows/build-release.yml` - einmal
eingerichtet, nie wieder manuell nötig).

1. Auf der GitHub-Seite des Projekts rechts auf **"Releases"** → **"Create a
   new release"** klicken.
2. Bei "Choose a tag" `v1.0.0` eintippen und "Create new tag" auswählen
   (muss mit `v` + drei durch Punkte getrennten Zahlen beginnen, passend zur
   `APP_VERSION` in `app.py`).
3. Titel z. B. "Version 1.0.0", kurze Beschreibung optional.
4. "Publish release" klicken.

Nach 1-2 Minuten (GitHub baut im Hintergrund) erscheint automatisch die
Datei `3D-Druck-Sammlung.exe` am Release angehängt - fertig zum Download.

## Wie künftige Updates funktionieren

Für jede neue Version, die veröffentlicht werden soll:

1. Änderungen am Code vornehmen (das übernehme ich, Claude, für dich).
2. `APP_VERSION` in `app.py` erhöhen (z. B. `"1.0.0"` → `"1.1.0"`).
3. Über GitHub Desktop hochladen ("Commit" + "Push origin").
4. Wie in Schritt 5 ein neues Release mit passendem Tag erstellen (z. B.
   `v1.1.0`).

GitHub baut daraufhin automatisch eine neue `.exe` und veröffentlicht sie.
Das laufende Programm zeigt beim nächsten Start (oder per Klick auf "Nach
Updates suchen" im Menü) einen Hinweis mit Download-Link an.

## Ohne dieses Setup

Ohne die Schritte oben läuft die App ganz normal weiter - der Update-Check
meldet einfach "kein Update verfügbar" und stört nicht. Die Einrichtung ist
also jederzeit nachholbar, nichts geht kaputt, wenn sie erstmal übersprungen
wird.
