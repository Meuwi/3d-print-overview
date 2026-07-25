; Inno-Setup-Skript fuer eine "echte" Windows-Installation der
; 3D-Druck-Sammlung: erzeugt eine Setup.exe mit Startmenue-Eintrag,
; optionalem Desktop-Symbol und einem sauberen Eintrag unter
; "Apps & Features" zum Deinstallieren - statt nur der portablen
; Einzeldatei-.exe aus build_exe.bat.
;
; Dieses Skript baut NICHT selbst die eigentliche App, sondern packt nur die
; bereits fertig gebaute dist\3D-Druck-Sammlung.exe (siehe app.spec /
; build_exe.bat) in ein Installationsprogramm. Am einfachsten dafuer
; build_installer.bat per Doppelklick starten - das baut beides
; nacheinander.
;
; Benoetigt den kostenlosen Inno Setup Compiler:
;   https://jrsoftware.org/isdl.php
;
; WICHTIG: MyAppVersion unten muss manuell zu APP_VERSION in app.py passen
; (aktuell 1.0.12) - es gibt (noch) keinen automatischen Abgleich zwischen
; beiden Stellen. Bei einer neuen Version also an beiden Stellen anpassen.

#define MyAppName "3D-Druck-Sammlung"
#define MyAppVersion "1.0.12"
#define MyAppExeName "3D-Druck-Sammlung.exe"
#define MyAppPublisher "3D-Druck-Sammlung"

[Setup]
; Feste, zufaellig erzeugte ID - identifiziert die App ueber Versionen
; hinweg (fuer sauberes Upgrade/Deinstallieren). NICHT mehr aendern, sobald
; einmal eine Setup.exe damit veroeffentlicht wurde.
AppId={{37D7F46A-4122-4770-ACAB-C224479EBCFD}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
; Installiert rein in den Benutzerordner (%LOCALAPPDATA%) statt nach
; "Programme" - dafuer sind KEINE Admin-Rechte noetig (kein UAC-Dialog).
; Passt ausserdem zur App selbst: sie legt ihre eigenen Datendateien
; (favorites.json, library_config.json, Papierkorb, Backups, ...) direkt
; neben der .exe ab (siehe APP_DIR in app.py) - unter "Programme" waere das
; ohne Admin-Rechte im laufenden Betrieb nicht beschreibbar gewesen.
PrivilegesRequired=lowest
OutputDir=installer_output
OutputBaseFilename=3D-Druck-Sammlung-Setup
SetupIconFile=app.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "german"; MessagesFile: "compiler:Languages\German.isl"

[Tasks]
Name: "desktopicon"; Description: "Desktop-Symbol erstellen"; GroupDescription: "Zusaetzliche Symbole:"

[Files]
Source: "dist\3D-Druck-Sammlung.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
