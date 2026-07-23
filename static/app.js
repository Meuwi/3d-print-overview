import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { unzipSync } from "three/addons/libs/fflate.module.js";

// ---------------------------------------------------------------------------
// Uebersetzungen (Deutsch/Englisch) - siehe Menü-Popup oben links.
// t(key, vars) liefert den Text in der aktuell gewaehlten Sprache (siehe
// currentLang weiter unten); {platzhalter} in vars werden ersetzt.
// applyTranslations() aktualisiert alle statischen Textstellen im HTML;
// dynamisch erzeugte Texte (Kacheln, Popups, Meldungen) rufen t() direkt an
// ihrer jeweiligen Stelle auf.
// ---------------------------------------------------------------------------

const TRANSLATIONS = {
  de: {
    page_title: "3D-Druck Sammlung",
    menu_btn_title: "Menü",
    manage_library: "Bibliothek verwalten",
    menu_title: "Menü",
    theme_heading: "Farbschema",
    theme_system: "System",
    theme_light: "Hell",
    theme_dark: "Dunkel",
    render3d_toggle_title: "3D-Live-Vorschau umschalten",
    eyebrow_text: "Lokales Druckarchiv",
    stand_label: "Stand",
    app_title_1: "3D-Druck",
    app_title_2: "Sammlung",
    search_placeholder: "Suchen … (Projekt-/Dateiname oder Notiz)",
    sort_name: "Name A–Z",
    sort_date: "Neueste zuerst",
    sort_size: "Größte zuerst",
    sort_count: "Meiste Dateien",
    sort_favorite: "Favoriten zuerst",
    refresh: "Neu einlesen",
    pill_favorites: "Favoriten",
    pill_duplicates: "Duplikate",
    pill_duplicates_title: "Dateien, die (gleicher Name + gleiche Größe) mehrfach in deiner Sammlung vorkommen",
    view_grid: "3D-Ansicht",
    view_list: "Liste",
    empty_state: "Keine Dateien gefunden.",
    loading_initial: "Durchsuche Ordner…",
    error_prefix: "Fehler: ",
    loading_error_prefix: "Fehler beim Laden: ",
    lib_title: "Bibliothek verwalten",
    lib_sources_heading: "Bibliothekordner",
    lib_add_source: "Ordner hinzufügen",
    lib_filetypes_heading: "Angezeigte Dateitypen",
    lib_new_ext_placeholder: "Endung, z. B. obj",
    lib_new_ext_label_placeholder: "Anzeigename (optional)",
    lib_add_filetype: "Hinzufügen",
    lib_display_heading: "Darstellung",
    render3d_label: "3D-Live-Vorschau",
    render3d_sub: "Rendert Vorschaubilder ohne Slicer-Bild direkt im Browser. Für langsame Rechner ausschaltbar – zeigt dann nur ein Platzhalterbild.",
    lib_backup_heading: "Sicherung",
    lib_backup_sub: "Speichert Favoriten, Notizen und die Bibliothekseinstellungen als Datei.",
    lib_backup_btn: "Sicherung herunterladen",

    stat_projects: "Projekte",
    stat_projects_sub: "Ordner",
    stat_files: "Dateien",
    stat_files_sub: "gesamt",
    stat_storage: "Speicher",
    stat_storage_sub: "gesamt",
    stat_type_sub_builtin: "Modelle",
    stat_type_sub_custom: "eigener Typ",

    fav_remove: "Aus Favoriten entfernen",
    fav_add: "Zu Favoriten hinzufügen",
    reveal_title: "Im Explorer anzeigen",
    reveal_project_title: "Projektordner im Explorer anzeigen",
    download_file_title: "Datei herunterladen",
    download_project_title: "Projekt als ZIP herunterladen",
    delete_file_title: "Datei löschen",
    delete_project_title: "Projekt löschen",
    confirm_delete_file: "Datei „{name}“ wirklich löschen?\n\nDies kann nicht rückgängig gemacht werden.",
    delete_failed: "Löschen fehlgeschlagen: ",
    delete_failed_unknown: "Unbekannter Fehler",
    confirm_delete_project: "Projekt „{name}“ mit {count} {word} wirklich löschen?\n\nDies kann nicht rückgängig gemacht werden.",
    word_file_singular: "Datei",
    word_file_plural: "Dateien",
    some_files_not_deleted: "Einige Dateien konnten nicht gelöscht werden:\n",
    click_for_3d_preview: "Klicken für 3D-Vorschau",
    dup_file_tooltip: "Diese Datei kommt {count}× in deiner Sammlung vor",
    dup_group_tooltip: "Enthält Dateien, die auch anderswo in deiner Sammlung liegen",
    dup_tag_label: "Duplikat",
    est_print_time_title: "Geschätzte Druckzeit",
    filament_label: "Filament",
    viewer_hint: "Zum Drehen ziehen · Scrollen zum Zoomen",
    contains_label: "Enthält: ",
    tree_heading: "Ordnerstruktur — Datei anklicken für 3D-Vorschau",
    no_3d_disabled: "3D-Live-Vorschau ist in den Einstellungen deaktiviert.",
    back_to_project: "⬅ Projekt-Vorschau",
    view_in_3d: "🔄 In 3D ansehen",
    view_static_image: "🖼 Vorschaubild",
    f3d_no_preview: "Fusion&nbsp;360-Datei (.f3d) – keine 3D-Vorschau möglich<br>(proprietäres Format, kein Parser verfügbar).<br>Öffne die Datei mit dem 📁-Symbol unten in Fusion&nbsp;360.",
    f3d_no_preview_short: "Fusion&nbsp;360-Datei – keine 3D-Vorschau möglich.",
    no_3d_view_possible: "Keine 3D-Ansicht möglich",
    file_too_large: "Datei zu groß für Live-Vorschau",
    too_large_short: "zu groß",
    notes_heading: "Notizen",
    notes_placeholder: "z. B. Druckeinstellungen, die gut funktioniert haben …",
    notes_saving: "Speichert …",
    notes_saved: "Gespeichert ✓",
    notes_save_failed: "Konnte nicht gespeichert werden.",
    sort_disabled_dup_title: "Im Duplikate-Filter fest nach übereinstimmenden Dateien sortiert",
    all_folders_root: "Alle Ordner",
    source_all_label: "Alle",
    source_all_title: "Dateien aus allen Bibliothekordnern gleichzeitig anzeigen",
    lib_remove_source_min: "Mindestens ein Ordner muss vorhanden bleiben",
    lib_remove_source_title: "Ordner aus der Bibliothek entfernen",
    lib_source_remove_confirm: "„{label}“ aus der Bibliothek entfernen? Die Dateien im Ordner werden dabei nicht gelöscht.",
    lib_source_add_failed: "Ordner konnte nicht hinzugefügt werden.",
    lib_source_remove_failed: "Ordner konnte nicht entfernt werden.",
    lib_sources_load_failed: "Konnte Ordnerliste nicht laden.",
    lib_picking_folder: "Ordner auswählen …",
    lib_folder_name_prompt: "Name für diesen Ordner:",
    lib_edit_ext_placeholder: "Endung",
    lib_edit_label_placeholder: "Anzeigename",
    lib_save_title: "Speichern",
    lib_cancel_title: "Abbrechen",
    lib_builtin: "Eingebaut",
    lib_custom_type: "Eigener Dateityp",
    lib_toggle_enable_title: "Aktivieren",
    lib_toggle_disable_title: "Deaktivieren",
    lib_edit_type_title: "Dateityp bearbeiten",
    lib_remove_type_title: "Dateityp entfernen",
    lib_invalid_ext: "Bitte eine gültige Dateiendung eingeben (nur Buchstaben/Zahlen, max. 10 Zeichen).",
    lib_type_save_failed: "Dateityp konnte nicht gespeichert werden.",
    lib_type_add_failed: "Dateityp konnte nicht hinzugefügt werden.",
    lib_type_remove_failed: "Dateityp konnte nicht entfernt werden.",
    lib_type_toggle_failed: "Dateityp konnte nicht geändert werden.",
    lib_type_remove_confirm: "Dateityp „{label}“ entfernen? Dateien dieses Typs verschwinden dann aus der Übersicht (werden nicht gelöscht).",
    lib_type_exists: "Dieser Dateityp existiert bereits.",
    lib_type_not_editable: "Dieser Dateityp kann nicht bearbeitet werden.",
    lib_type_duplicate_ext: "Diese Dateiendung wird bereits verwendet.",
    lib_type_not_removable: "Dieser Dateityp kann nicht entfernt werden.",
    lib_source_not_found: "Ordner nicht gefunden.",
    lib_source_exists: "Dieser Ordner ist bereits in der Bibliothek.",
    files_word: "Dateien",
    file_word: "Datei",
    meta_files_size_date: "{count} {word} · {size} · {date}",
    folder_word_singular: "Ordner",
    folder_word_plural: "Ordner",
    folder_back: "⬅ Zurück",
    folder_root_label: "🏠 Start",
    sort_disabled_folder_title: "In der Ordneransicht wird immer alphabetisch nach Name sortiert",
    nav_folder_view: "Ordner",
    nav_flat_view: "Dateien",
    preset_default: "Standard",
    preset_all: "Alle",
    preset_none: "Keine",
    lib_cat_models: "Modelldateien",
    lib_cat_print_jobs: "Druckaufträge",
    lib_cat_cad_sources: "CAD-Quellformate",
    lib_cat_images: "Bilder",
    lib_custom_types_heading: "Eigene Dateitypen",
    lib_excludes_heading: "Ausschlüsse",
    lib_excludes_sub: "Dateien, die hier passen, werden nie angezeigt – auch wenn ihr Dateityp oben aktiviert ist.",
    lib_excludes_ext_label: "Endungen ausschließen (mit Komma getrennt, z. B. bak, tmp)",
    lib_excludes_pattern_label: "Dateien oder Ordner ausschließen (ein Muster pro Zeile, z. B. Entwuerfe/*.obj)",
    lib_excludes_saving: "Speichert …",
    lib_excludes_saved: "Gespeichert.",
    lib_excludes_save_failed: "Speichern fehlgeschlagen.",
    lib_excludes_ext_placeholder: "bak, tmp",
    lib_excludes_pattern_placeholder: "Entwuerfe/*.obj\ndefektes-modell.stl",
    lib_cancel: "Abbrechen",
    lib_save: "Speichern",
    lib_modal_saved: "Gespeichert.",
    lib_modal_cancel_failed: "Zurücksetzen fehlgeschlagen. Bitte erneut versuchen.",
    open_with_title: "Mit Standard-Slicer öffnen",
    open_with_choose_title: "Anderes Programm wählen …",
    open_with_default_tag: "Standard",
    open_with_loading: "Lädt …",
    open_with_not_found: "Nicht gefunden – Pfad in „Bibliothek verwalten“ festlegen",
    open_with_failed: "Konnte nicht geöffnet werden.",
    lib_slicers_heading: "Slicer",
    lib_slicers_sub: "Klick auf den Kreis legt den Standard-Slicer fest – auf Datei-Kacheln öffnet dann ein Klick auf 🖨 direkt in diesem Programm. Über ▾ lässt sich einmalig ein anderes wählen.",
    lib_slicer_auto_detected: "automatisch erkannt",
    lib_slicer_not_found: "Nicht gefunden",
    lib_slicer_pick_title: "Programm auswählen",
    lib_slicer_set_failed: "Konnte nicht gespeichert werden.",
    lib_slicer_default_set_title: "Als Standard-Slicer festlegen",
    lib_slicer_default_unset_title: "Standard-Slicer entfernen",
    lib_slicer_default_tag: "Standard",
    trash_btn: "Papierkorb",
    trash_btn_title: "Papierkorb öffnen",
    trash_title: "Papierkorb",
    trash_sub: "Gelöschte Dateien landen hier und werden nach 30 Tagen automatisch endgültig entfernt.",
    trash_empty_state: "Papierkorb ist leer.",
    trash_empty_all: "Papierkorb leeren",
    trash_load_failed: "Papierkorb konnte nicht geladen werden.",
    trash_restore_title: "Wiederherstellen",
    trash_delete_forever_title: "Endgültig löschen",
    trash_deleted_on: "Gelöscht am {date}",
    trash_days_left: "noch {n} Tage",
    trash_days_left_one: "noch 1 Tag",
    trash_expires_today: "läuft heute ab",
    trash_confirm_delete_forever: "„{name}“ endgültig löschen? Das kann nicht rückgängig gemacht werden.",
    trash_confirm_empty: "Papierkorb wirklich vollständig leeren? Das kann nicht rückgängig gemacht werden.",
    trash_restore_failed: "Wiederherstellen fehlgeschlagen: ",
    trash_delete_failed: "Löschen fehlgeschlagen: ",
    trash_restored_hint: "Wiederhergestellt.",
    selection_mode_btn: "Auswählen",
    selection_favorite: "Favorisieren",
    selection_unfavorite: "Favorit entfernen",
    selection_download: "Herunterladen",
    selection_delete: "Löschen",
    selection_clear: "Abbrechen",
    selection_count: "{n} ausgewählt",
    selection_confirm_delete: "{n} ausgewählte Elemente wirklich in den Papierkorb verschieben?",
    selection_delete_failed: "Löschen fehlgeschlagen: ",
    selection_favorite_failed: "Konnte Favoriten nicht aktualisieren: ",
    selection_download_failed: "Download fehlgeschlagen.",
    tag_filter_all: "Alle Tags",
    tags_heading: "Tags",
    tags_placeholder: "Tag hinzufügen … (Enter)",
    tags_remove_title: "Tag entfernen",
    auto_backup_label: "Automatische Sicherung",
    auto_backup_sub: "Schreibt einmal täglich automatisch eine Sicherungsdatei (die letzten 14 Tage werden aufbewahrt).",
    auto_backup_last: "Letzte Sicherung: {date}",
    auto_backup_never: "Noch keine automatische Sicherung erstellt.",
    update_heading: "Version",
    update_check_btn: "Nach Updates suchen",
    update_download_btn: "Herunterladen",
    update_checking: "Prüfe …",
    update_none_found: "Kein Update gefunden",
    update_check_failed: "Prüfung fehlgeschlagen",
    update_version_label: "Version {version}",
    update_available: "Neue Version {version} verfügbar",
    update_pill_label: "Update {version} verfügbar",
  },
  en: {
    page_title: "3D Print Collection",
    menu_btn_title: "Menu",
    manage_library: "Manage library",
    menu_title: "Menu",
    theme_heading: "Color scheme",
    theme_system: "System",
    theme_light: "Light",
    theme_dark: "Dark",
    render3d_toggle_title: "Toggle live 3D preview",
    eyebrow_text: "Local print archive",
    stand_label: "As of",
    app_title_1: "3D Print",
    app_title_2: "Collection",
    search_placeholder: "Search … (project/file name or note)",
    sort_name: "Name A–Z",
    sort_date: "Newest first",
    sort_size: "Largest first",
    sort_count: "Most files",
    sort_favorite: "Favorites first",
    refresh: "Rescan",
    pill_favorites: "Favorites",
    pill_duplicates: "Duplicates",
    pill_duplicates_title: "Files that appear more than once in your collection (same name + same size)",
    view_grid: "3D view",
    view_list: "List",
    empty_state: "No files found.",
    loading_initial: "Scanning folders…",
    error_prefix: "Error: ",
    loading_error_prefix: "Error loading: ",
    lib_title: "Manage library",
    lib_sources_heading: "Library folders",
    lib_add_source: "Add folder",
    lib_filetypes_heading: "Displayed file types",
    lib_new_ext_placeholder: "Extension, e.g. obj",
    lib_new_ext_label_placeholder: "Display name (optional)",
    lib_add_filetype: "Add",
    lib_display_heading: "Display",
    render3d_label: "Live 3D preview",
    render3d_sub: "Renders preview images without a slicer thumbnail directly in the browser. Can be turned off on slower computers – shows a placeholder image instead.",
    lib_backup_heading: "Backup",
    lib_backup_sub: "Saves favorites, notes and library settings as a file.",
    lib_backup_btn: "Download backup",

    stat_projects: "Projects",
    stat_projects_sub: "Folders",
    stat_files: "Files",
    stat_files_sub: "total",
    stat_storage: "Storage",
    stat_storage_sub: "total",
    stat_type_sub_builtin: "Models",
    stat_type_sub_custom: "custom type",

    fav_remove: "Remove from favorites",
    fav_add: "Add to favorites",
    reveal_title: "Show in file explorer",
    reveal_project_title: "Show project folder in file explorer",
    download_file_title: "Download file",
    download_project_title: "Download project as ZIP",
    delete_file_title: "Delete file",
    delete_project_title: "Delete project",
    confirm_delete_file: 'Really delete file "{name}"?\n\nThis cannot be undone.',
    delete_failed: "Delete failed: ",
    delete_failed_unknown: "Unknown error",
    confirm_delete_project: 'Really delete project "{name}" with {count} {word}?\n\nThis cannot be undone.',
    word_file_singular: "file",
    word_file_plural: "files",
    some_files_not_deleted: "Some files could not be deleted:\n",
    click_for_3d_preview: "Click for 3D preview",
    dup_file_tooltip: "This file appears {count}× in your collection",
    dup_group_tooltip: "Contains files that also exist elsewhere in your collection",
    dup_tag_label: "Duplicate",
    est_print_time_title: "Estimated print time",
    filament_label: "filament",
    viewer_hint: "Drag to rotate · Scroll to zoom",
    contains_label: "Contains: ",
    tree_heading: "Folder structure — click a file for 3D preview",
    no_3d_disabled: "Live 3D preview is disabled in settings.",
    back_to_project: "⬅ Back to project",
    view_in_3d: "🔄 View in 3D",
    view_static_image: "🖼 Preview image",
    f3d_no_preview: "Fusion&nbsp;360 file (.f3d) – no 3D preview possible<br>(proprietary format, no parser available).<br>Open the file with the 📁 icon below in Fusion&nbsp;360.",
    f3d_no_preview_short: "Fusion&nbsp;360 file – no 3D preview possible.",
    no_3d_view_possible: "No 3D view possible",
    file_too_large: "File too large for live preview",
    too_large_short: "too large",
    notes_heading: "Notes",
    notes_placeholder: "e.g. print settings that worked well …",
    notes_saving: "Saving …",
    notes_saved: "Saved ✓",
    notes_save_failed: "Could not be saved.",
    sort_disabled_dup_title: "Sorting is fixed to matching files while the duplicate filter is active",
    all_folders_root: "All folders",
    source_all_label: "All",
    source_all_title: "Show files from all library folders at once",
    lib_remove_source_min: "At least one folder must remain",
    lib_remove_source_title: "Remove folder from the library",
    lib_source_remove_confirm: 'Remove "{label}" from the library? The files in the folder will not be deleted.',
    lib_source_add_failed: "Folder could not be added.",
    lib_source_remove_failed: "Folder could not be removed.",
    lib_sources_load_failed: "Could not load folder list.",
    lib_picking_folder: "Choosing folder …",
    lib_folder_name_prompt: "Name for this folder:",
    lib_edit_ext_placeholder: "Extension",
    lib_edit_label_placeholder: "Display name",
    lib_save_title: "Save",
    lib_cancel_title: "Cancel",
    lib_builtin: "Built-in",
    lib_custom_type: "Custom file type",
    lib_toggle_enable_title: "Enable",
    lib_toggle_disable_title: "Disable",
    lib_edit_type_title: "Edit file type",
    lib_remove_type_title: "Remove file type",
    lib_invalid_ext: "Please enter a valid file extension (letters/numbers only, max. 10 characters).",
    lib_type_save_failed: "File type could not be saved.",
    lib_type_add_failed: "File type could not be added.",
    lib_type_remove_failed: "File type could not be removed.",
    lib_type_toggle_failed: "File type could not be changed.",
    lib_type_remove_confirm: 'Remove file type "{label}"? Files of this type will disappear from the overview (not deleted).',
    lib_type_exists: "This file type already exists.",
    lib_type_not_editable: "This file type cannot be edited.",
    lib_type_duplicate_ext: "This file extension is already in use.",
    lib_type_not_removable: "This file type cannot be removed.",
    lib_source_not_found: "Folder not found.",
    lib_source_exists: "This folder is already in the library.",
    files_word: "files",
    file_word: "file",
    meta_files_size_date: "{count} {word} · {size} · {date}",
    folder_word_singular: "folder",
    folder_word_plural: "folders",
    folder_back: "⬅ Back",
    folder_root_label: "🏠 Home",
    sort_disabled_folder_title: "Folder view is always sorted alphabetically by name",
    nav_folder_view: "Folders",
    nav_flat_view: "Files",
    preset_default: "Default",
    preset_all: "All",
    preset_none: "None",
    lib_cat_models: "Model files",
    lib_cat_print_jobs: "Print jobs",
    lib_cat_cad_sources: "CAD source formats",
    lib_cat_images: "Images",
    lib_custom_types_heading: "Custom file types",
    lib_excludes_heading: "Exclusions",
    lib_excludes_sub: "Files matching these rules are never shown, even if their file type is enabled above.",
    lib_excludes_ext_label: "Exclude extensions (comma-separated, e.g. bak, tmp)",
    lib_excludes_pattern_label: "Exclude files or folders (one pattern per line, e.g. Drafts/*.obj)",
    lib_excludes_saving: "Saving …",
    lib_excludes_saved: "Saved.",
    lib_excludes_save_failed: "Save failed.",
    lib_excludes_ext_placeholder: "bak, tmp",
    lib_excludes_pattern_placeholder: "Drafts/*.obj\nbroken-model.stl",
    lib_cancel: "Cancel",
    lib_save: "Save",
    lib_modal_saved: "Saved.",
    lib_modal_cancel_failed: "Reset failed. Please try again.",
    open_with_title: "Open with default slicer",
    open_with_choose_title: "Choose a different program …",
    open_with_default_tag: "default",
    open_with_loading: "Loading …",
    open_with_not_found: "Not found – set the path in \"Manage library\"",
    open_with_failed: "Could not be opened.",
    lib_slicers_heading: "Slicer",
    lib_slicers_sub: "Click the circle to set the default slicer – on file tiles, clicking 🖨 then opens directly in that program. Use ▾ to pick a different one just once.",
    lib_slicer_auto_detected: "auto-detected",
    lib_slicer_not_found: "Not found",
    lib_slicer_pick_title: "Choose program",
    lib_slicer_set_failed: "Could not be saved.",
    lib_slicer_default_set_title: "Set as default slicer",
    lib_slicer_default_unset_title: "Remove default slicer",
    lib_slicer_default_tag: "Default",
    trash_btn: "Trash",
    trash_btn_title: "Open trash",
    trash_title: "Trash",
    trash_sub: "Deleted files land here and are permanently removed after 30 days.",
    trash_empty_state: "Trash is empty.",
    trash_empty_all: "Empty trash",
    trash_load_failed: "Could not load trash.",
    trash_restore_title: "Restore",
    trash_delete_forever_title: "Delete forever",
    trash_deleted_on: "Deleted on {date}",
    trash_days_left: "{n} days left",
    trash_days_left_one: "1 day left",
    trash_expires_today: "expires today",
    trash_confirm_delete_forever: "Permanently delete \"{name}\"? This cannot be undone.",
    trash_confirm_empty: "Really empty the entire trash? This cannot be undone.",
    trash_restore_failed: "Restore failed: ",
    trash_delete_failed: "Delete failed: ",
    trash_restored_hint: "Restored.",
    selection_mode_btn: "Select",
    selection_favorite: "Favorite",
    selection_unfavorite: "Remove favorite",
    selection_download: "Download",
    selection_delete: "Delete",
    selection_clear: "Cancel",
    selection_count: "{n} selected",
    selection_confirm_delete: "Really move {n} selected items to trash?",
    selection_delete_failed: "Delete failed: ",
    selection_favorite_failed: "Could not update favorites: ",
    selection_download_failed: "Download failed.",
    tag_filter_all: "All tags",
    tags_heading: "Tags",
    tags_placeholder: "Add tag … (Enter)",
    tags_remove_title: "Remove tag",
    auto_backup_label: "Automatic backup",
    auto_backup_sub: "Automatically writes a backup file once a day (the last 14 days are kept).",
    auto_backup_last: "Last backup: {date}",
    auto_backup_never: "No automatic backup yet.",
    update_heading: "Version",
    update_check_btn: "Check for updates",
    update_download_btn: "Download",
    update_checking: "Checking …",
    update_none_found: "No update found",
    update_check_failed: "Check failed",
    update_version_label: "Version {version}",
    update_available: "New version {version} available",
    update_pill_label: "Update {version} available",
  },
};

function t(key, vars) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.de;
  let s = dict[key] !== undefined ? dict[key] : TRANSLATIONS.de[key] !== undefined ? TRANSLATIONS.de[key] : key;
  if (vars) {
    for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
  }
  return s;
}

const gridEl = document.getElementById("grid");
const viewToggleEl = document.getElementById("view-toggle");
const alphaBarEl = document.getElementById("alpha-bar");
const folderBreadcrumbEl = document.getElementById("folder-breadcrumb");
const folderViewToggleEl = document.getElementById("folder-view-toggle");
const filesViewEl = document.getElementById("files-view");
const emptyEl = document.getElementById("empty");
const loadingEl = document.getElementById("loading");
const statsEl = document.getElementById("stats");
const rootPathEl = document.getElementById("root-path");
const sourceSwitchEl = document.getElementById("source-switch");
const standDateEl = document.getElementById("stand-date");
const searchEl = document.getElementById("search");
const sortEl = document.getElementById("sort");
const filterPillsEl = document.getElementById("filter-pills");
const refreshBtn = document.getElementById("refresh");
const modalBackdrop = document.getElementById("modal-backdrop");
const modalContent = document.getElementById("modal-content");
const modalClose = document.getElementById("modal-close");
const countFavoriteEl = document.getElementById("count-favorite");

const manageLibraryBtn = document.getElementById("manage-library-btn");
const libraryModalBackdrop = document.getElementById("library-modal-backdrop");
const libraryModalClose = document.getElementById("library-modal-close");
const libSourcesListEl = document.getElementById("lib-sources-list");
const libAddSourceBtn = document.getElementById("lib-add-source-btn");
const libFiletypesListEl = document.getElementById("lib-filetypes-list");
const libFiletypeCategoriesEl = document.getElementById("lib-filetype-categories");
const libPresetRowEl = document.getElementById("lib-preset-row");
const libAddFiletypeForm = document.getElementById("lib-add-filetype-form");
const libNewExtInput = document.getElementById("lib-new-ext");
const libNewExtLabelInput = document.getElementById("lib-new-ext-label");
const libRender3dToggle = document.getElementById("lib-render3d-toggle");
const libAutoBackupToggle = document.getElementById("lib-auto-backup-toggle");
const autoBackupStatusEl = document.getElementById("auto-backup-status");
const updateVersionTextEl = document.getElementById("update-version-text");
const updateCheckBtn = document.getElementById("update-check-btn");
const updateBannerEl = document.getElementById("update-banner");
const updateBannerTextEl = document.getElementById("update-banner-text");
const updateDownloadBtn = document.getElementById("update-download-btn");
const menuUpdateDotEl = document.getElementById("menu-update-dot");
const headerVersionTextEl = document.getElementById("header-version-text");
const headerUpdatePillEl = document.getElementById("header-update-pill");
const libExcludesExtensionsEl = document.getElementById("lib-excludes-extensions");
const libExcludesPatternsEl = document.getElementById("lib-excludes-patterns");
const libExcludesSaveHintEl = document.getElementById("lib-excludes-save-hint");
const libModalSaveHintEl = document.getElementById("lib-modal-save-hint");
const libSlicersListEl = document.getElementById("lib-slicers-list");
const libCancelBtn = document.getElementById("lib-cancel-btn");
const libSaveBtn = document.getElementById("lib-save-btn");

const trashBtn = document.getElementById("trash-btn");
const trashCountBadgeEl = document.getElementById("trash-count-badge");
const trashModalBackdrop = document.getElementById("trash-modal-backdrop");
const trashModalClose = document.getElementById("trash-modal-close");
const trashListEl = document.getElementById("trash-list");
const trashEmptyStateEl = document.getElementById("trash-empty-state");
const trashEmptyAllBtn = document.getElementById("trash-empty-all-btn");
const trashModalHintEl = document.getElementById("trash-modal-hint");

const selectionModeBtn = document.getElementById("selection-mode-btn");
const selectionBarEl = document.getElementById("selection-bar");
const selectionBarCountEl = document.getElementById("selection-bar-count");
const selectionFavoriteBtn = document.getElementById("selection-favorite-btn");
const selectionUnfavoriteBtn = document.getElementById("selection-unfavorite-btn");
const selectionDownloadBtn = document.getElementById("selection-download-btn");
const selectionDeleteBtn = document.getElementById("selection-delete-btn");
const selectionClearBtn = document.getElementById("selection-clear-btn");
const tagFilterEl = document.getElementById("tag-filter");

const menuBtn = document.getElementById("menu-btn");
const menuModalBackdrop = document.getElementById("menu-modal-backdrop");
const menuModalClose = document.getElementById("menu-modal-close");
const themeChoiceRow = document.getElementById("theme-choice-row");
const langChoiceRow = document.getElementById("lang-choice-row");

// Statische Textstellen im HTML, die applyTranslations() bei jedem
// Sprachwechsel neu befuellt. `attr` (Standard: "textContent") erlaubt auch
// Attribute wie "placeholder"/"title" zu setzen.
const I18N_STATIC = [
  { id: "page-title", key: "page_title", attr: "__title__" },
  { id: "menu-btn", key: "menu_btn_title", attr: "title" },
  { id: "txt-manage-library", key: "manage_library" },
  { id: "txt-menu-title", key: "menu_title" },
  { id: "txt-theme-heading", key: "theme_heading" },
  { id: "txt-theme-system", key: "theme_system" },
  { id: "txt-theme-light", key: "theme_light" },
  { id: "txt-theme-dark", key: "theme_dark" },
  { id: "lbl-render3d-toggle", key: "render3d_toggle_title", attr: "title" },
  { id: "txt-eyebrow", key: "eyebrow_text" },
  { id: "txt-stand", key: "stand_label" },
  { id: "txt-title-1", key: "app_title_1" },
  { id: "txt-title-2", key: "app_title_2" },
  { id: "search", key: "search_placeholder", attr: "placeholder" },
  { id: "opt-sort-name", key: "sort_name" },
  { id: "opt-sort-date", key: "sort_date" },
  { id: "opt-sort-size", key: "sort_size" },
  { id: "opt-sort-count", key: "sort_count" },
  { id: "opt-sort-favorite", key: "sort_favorite" },
  { id: "refresh", key: "refresh", attr: "title" },
  { id: "txt-pill-favorites", key: "pill_favorites" },
  { id: "txt-pill-duplicates", key: "pill_duplicates" },
  { id: "pill-duplicates", key: "pill_duplicates_title", attr: "title" },
  { id: "txt-view-grid", key: "view_grid", attr: "title" },
  { id: "txt-view-list", key: "view_list", attr: "title" },
  { id: "txt-folder-view-folders", key: "nav_folder_view" },
  { id: "txt-folder-view-flat", key: "nav_flat_view" },
  { id: "empty", key: "empty_state" },
  { id: "txt-lib-title", key: "lib_title" },
  { id: "txt-lib-sources-heading", key: "lib_sources_heading" },
  { id: "txt-lib-add-source", key: "lib_add_source" },
  { id: "txt-lib-filetypes-heading", key: "lib_filetypes_heading" },
  { id: "txt-preset-default", key: "preset_default" },
  { id: "txt-preset-all", key: "preset_all" },
  { id: "txt-preset-none", key: "preset_none" },
  { id: "txt-lib-custom-types-heading", key: "lib_custom_types_heading" },
  { id: "txt-lib-excludes-heading", key: "lib_excludes_heading" },
  { id: "txt-lib-excludes-sub", key: "lib_excludes_sub" },
  { id: "txt-lib-excludes-ext-label", key: "lib_excludes_ext_label" },
  { id: "txt-lib-excludes-pattern-label", key: "lib_excludes_pattern_label" },
  { id: "txt-lib-slicers-heading", key: "lib_slicers_heading" },
  { id: "txt-lib-slicers-sub", key: "lib_slicers_sub" },
  { id: "txt-lib-cancel", key: "lib_cancel" },
  { id: "txt-lib-save", key: "lib_save" },
  { id: "lib-excludes-extensions", key: "lib_excludes_ext_placeholder", attr: "placeholder" },
  { id: "lib-excludes-patterns", key: "lib_excludes_pattern_placeholder", attr: "placeholder" },
  { id: "lib-new-ext", key: "lib_new_ext_placeholder", attr: "placeholder" },
  { id: "lib-new-ext-label", key: "lib_new_ext_label_placeholder", attr: "placeholder" },
  { id: "txt-lib-add-filetype", key: "lib_add_filetype" },
  { id: "txt-lib-display-heading", key: "lib_display_heading" },
  { id: "txt-render3d-label", key: "render3d_label" },
  { id: "txt-render3d-sub", key: "render3d_sub" },
  { id: "txt-lib-backup-heading", key: "lib_backup_heading" },
  { id: "txt-lib-backup-sub", key: "lib_backup_sub" },
  { id: "txt-lib-backup-btn", key: "lib_backup_btn" },
  { id: "txt-auto-backup-label", key: "auto_backup_label" },
  { id: "txt-auto-backup-sub", key: "auto_backup_sub" },
  { id: "txt-update-heading", key: "update_heading" },
  { id: "txt-update-check-btn", key: "update_check_btn" },
  { id: "txt-update-download-btn", key: "update_download_btn" },
  { id: "txt-trash-btn", key: "trash_btn" },
  { id: "trash-btn", key: "trash_btn_title", attr: "title" },
  { id: "txt-trash-title", key: "trash_title" },
  { id: "txt-trash-sub", key: "trash_sub" },
  { id: "txt-trash-empty-state", key: "trash_empty_state" },
  { id: "txt-trash-empty-all", key: "trash_empty_all" },
  { id: "txt-selection-mode-btn", key: "selection_mode_btn" },
  { id: "txt-selection-favorite", key: "selection_favorite" },
  { id: "txt-selection-unfavorite", key: "selection_unfavorite" },
  { id: "txt-selection-download", key: "selection_download" },
  { id: "txt-selection-delete", key: "selection_delete" },
  { id: "txt-selection-clear", key: "selection_clear" },
  { id: "opt-tag-filter-all", key: "tag_filter_all" },
];

function applyTranslations() {
  document.documentElement.lang = currentLang === "en" ? "en" : "de";
  for (const entry of I18N_STATIC) {
    const el = document.getElementById(entry.id);
    if (!el) continue;
    const text = t(entry.key);
    if (entry.attr === "__title__") document.title = text;
    else if (entry.attr) el.setAttribute(entry.attr, text);
    else el.textContent = text;
  }
  // Anfangstext des Ladeindikators nur setzen, wenn er noch nicht durch
  // einen laufenden Scan-Fortschritt ueberschrieben wurde.
  if (loadingEl && loadingEl.style.display !== "none" && !allGroups.length) {
    loadingEl.textContent = t("loading_initial");
  }
  // Dynamisch erzeugte Bereiche (Kacheln, Stats, Bibliotheksmodal, ggf.
  // offenes Projekt-Popup) muessen ihre Texte ebenfalls neu aufbauen.
  if (typeof render === "function") render();
  if (typeof renderStatsFromCache === "function") renderStatsFromCache();
  if (libraryModalBackdrop && libraryModalBackdrop.style.display !== "none") {
    refreshLibraryModal();
  }
}

let allGroups = [];
let activeType = "all"; // all | <ext> | favorite | duplicate
let activeTagFilter = ""; // "" = kein Tag-Filter, sonst genauer Tag-Text
let projectTags = new Map(); // Projekt-Schluessel -> string[] (eigene Tags/Kategorien)
let activeTab = "projects"; // projects | files
let viewMode = "grid"; // grid (3D-Ansicht mit Kacheln) | list (kompakte Tabelle)
// Aktueller "Ordnerpfad" in der Dateien-Ansicht (Ordner-Browser statt einer
// flachen Liste - siehe renderFilesFolderView()). Leeres Array = oberste
// Ebene. Wird bei Tab-/Filter-/Quellenwechsel und bei Sucheingabe
// zurueckgesetzt, da sich der verfuegbare Ordnerinhalt dann aendert.
let filesFolderPath = [];
// Expliziter Umschalter (nur in der Dateien-Ansicht sichtbar): "folders" =
// Ordner-Browser, "flat" = klassische flache Dateiliste. Der Duplikate-
// Filter erzwingt weiterhin "flat"-Darstellung (siehe render()), ohne
// diesen gemerkten Wert zu veraendern.
let filesViewMode = "folders"; // folders | flat
let favoriteGroups = new Set();
let favoriteFiles = new Set();
// Mehrfachauswahl (Projekt- und Datei-Kacheln/Zeilen): "type::key" -> {type,
// key, name} - siehe toggleSelection()/renderSelectionBar() weiter unten.
let selectionMode = false;
let selectedItems = new Map();
let libraryFiletypes = []; // {ext, label, enabled, builtin}[]
let knownFiletypeCategories = {}; // Katalog bekannter Dateitypen fuer den Kategorien-Picker, siehe /api/known-filetypes
let libraryExcludes = { extensions: [], patterns: [] }; // siehe /api/excludes
let libModalCurrentSources = []; // zuletzt geladene Bibliothekordner-Liste (fuer Snapshot/Restore)
let libModalSlicers = []; // zuletzt geladene Slicer-Liste (fuer Anzeige + Snapshot/Restore)
let defaultSlicerId = ""; // "" = kein Standard-Slicer gewaehlt, sonst z.B. "bambustudio"
let libModalSnapshot = null; // Stand beim Oeffnen des "Bibliothek verwalten"-Popups, siehe captureLibModalSnapshot/cancelLibModalFlow
let lastSavedExcludesExt = "";
let lastSavedExcludesPatterns = "";
const IMAGE_EXTS_JS = ["png", "jpg", "jpeg", "webp", "gif", "svg"];
const SLICER_OPENABLE_EXTS_JS = ["stl", "3mf", "obj", "step", "stp", "amf", "ply"];
const MAX_TAG_LENGTH_JS = 30;
const MAX_TAGS_PER_ITEM_JS = 20;
let slicersListCache = null; // {id,label,path}[] - siehe loadSlicersList()
let render3dEnabled = true; // Live-3D-Rendering der Kachel-Vorschaubilder (Einstellungen-Popup)
let projectNotes = new Map(); // Projekt-Schluessel -> Notiztext
let currentTheme = "system"; // system | light | dark (Auswahl im Menü)
let currentLang = "de"; // de | en (Auswahl im Menü)
let lastStats = null; // letztes /api/scan-stats-Objekt, fuer Neuaufbau bei Sprachwechsel
let currentModalGroup = null; // aktuell im Popup geoeffnetes Projekt (fuer Pfeiltasten-Navigation)

// In der "Alle Ordner"-Ansicht (siehe ALL_SOURCE_ID) traegt jede Datei ein
// zusaetzliches "_src"-Feld (Quellen-ID), das das Backend anhaengt, ohne den
// eigentlichen (fuer den Ordnerbaum benoetigten) relativen Pfad zu aendern.
// Fuer jede Server-Anfrage zu einer einzelnen Datei (Vorschau, Reveal,
// Loeschen, Favorit) muss dieser Pfad mit der Quelle praefixiert werden -
// dafuer immer srcPath(file) statt file.path direkt verwenden.
function srcPath(file) {
  return file && file._src ? `${file._src}::${file.path}` : file.path;
}

// Grenzwerte fuers Live-Rendern von STL-/3MF-Dateien im Browser
const MAX_TOTAL_RENDER_BYTES = 160 * 1024 * 1024; // 160 MB pro Karte (Summe aller Teile)
const MAX_SINGLE_FILE_BYTES = 120 * 1024 * 1024; // 120 MB pro Einzeldatei
const MAX_PARTS_TO_RENDER = 8;

// STL enthaelt nie Farbinformationen - solche Objekte werden neutral
// hellgrau dargestellt statt in der Akzentfarbe. 3MF-Dateien bekommen ihre
// echte Farbe (siehe parse3MFGroup), nur wenn keine ermittelbar ist, greift
// ebenfalls dieses Grau.
const UNCOLORED_HEX = 0xc9cdd4;
function neutralMaterial() {
  return new THREE.MeshStandardMaterial({ color: UNCOLORED_HEX, metalness: 0.05, roughness: 0.7 });
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen, damit das Format-Badge oben links (.thumb-badges) beim
// Ersetzen des Thumbnail-Inhalts (Platzhalter <-> Live-Render) erhalten
// bleibt, statt versehentlich mit ueberschrieben zu werden.
// ---------------------------------------------------------------------------

function setThumbPlaceholder(targetEl, html) {
  const keep = targetEl.querySelectorAll(".thumb-badges, .fav-btn, .select-checkbox");
  targetEl.innerHTML = html;
  keep.forEach((el) => targetEl.prepend(el));
}

function replaceThumbContent(targetEl, node) {
  const keep = targetEl.querySelectorAll(".thumb-badges, .fav-btn, .select-checkbox");
  targetEl.innerHTML = "";
  keep.forEach((el) => targetEl.appendChild(el));
  targetEl.appendChild(node);
}

// Locale richtet sich nach der im Menü gewaehlten Sprache (siehe
// currentLang) - dynamisch aufgeloest statt fest "de-DE", damit Zahlen/
// Daten in der englischen Oberflaeche auch im englischen Format erscheinen.
function activeLocale() {
  return currentLang === "en" ? "en-US" : "de-DE";
}

function nf(n) {
  return new Intl.NumberFormat(activeLocale()).format(n);
}

function formatSizeDE(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  const decimalSep = currentLang === "en" ? "." : ",";
  const formatted = i === 0 ? String(size) : size.toFixed(1).replace(".", decimalSep);
  return `${formatted} ${units[i]}`;
}

function formatDateDE(epochSeconds) {
  const d = new Date(epochSeconds * 1000);
  return d.toLocaleDateString(activeLocale(), { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTimeDE(epochSeconds) {
  const d = new Date(epochSeconds * 1000);
  return d.toLocaleDateString(activeLocale(), { day: "2-digit", month: "2-digit", year: "numeric" }) + ", " + d.toLocaleTimeString(activeLocale(), { hour: "2-digit", minute: "2-digit" });
}

standDateEl.textContent = new Date().toLocaleDateString("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// ---------------------------------------------------------------------------
// Laden & Pollen
// ---------------------------------------------------------------------------

let pollTimer = null;

// ---------------------------------------------------------------------------
// Quellen-Umschalter (z.B. Downloads <-> 3D Druck Vorlagen)
// ---------------------------------------------------------------------------

async function loadSources() {
  try {
    const res = await fetch("/api/sources");
    const data = await res.json();
    renderSourceSwitch(data.sources || [], data.active);
  } catch (e) {
    // Umschalter ist optional - App funktioniert notfalls auch ohne ihn
  }
}

const ALL_SOURCE_ID = "__all__";

function renderSourceSwitch(sources, activeId) {
  if (!sourceSwitchEl || sources.length < 1) {
    if (sourceSwitchEl) sourceSwitchEl.innerHTML = "";
    return;
  }
  const folderPills = sources
    .map(
      (s) =>
        `<button class="source-pill${s.id === activeId ? " active" : ""}" data-id="${escapeAttr(s.id)}" title="${escapeAttr(s.path)}">📁 ${escapeHtml(s.label)}</button>`
    )
    .join("");
  sourceSwitchEl.innerHTML = folderPills;
  sourceSwitchEl.querySelectorAll(".source-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      switchSource(btn.dataset.id);
    });
  });
}

async function switchSource(id) {
  disposeActiveViewer();
  modalBackdrop.style.display = "none";
  currentModalGroup = null;
  filesFolderPath = [];
  if (typeof clearSelection === "function") clearSelection();

  sourceSwitchEl.querySelectorAll(".source-pill").forEach((b) => b.classList.toggle("active", b.dataset.id === id));

  try {
    await fetch(`/api/switch-source?id=${encodeURIComponent(id)}`);
  } catch (e) {
    // /api/scan meldet einen eventuellen Fehler ohnehin gleich unten
  }

  searchEl.value = "";
  activeType = "all";
  activeTab = "projects";
  filterPillsEl.querySelectorAll(".pill").forEach((p) => p.classList.toggle("active", p.dataset.filter === "all"));

  activeTagFilter = "";
  if (tagFilterEl) tagFilterEl.value = "";
  await Promise.all([loadFavorites(), loadNotes(), loadTags()]);
  loadAllTagsFilterOptions();
  loadData();
}

// ---------------------------------------------------------------------------
// Favoriten
// ---------------------------------------------------------------------------

async function loadFavorites() {
  try {
    const res = await fetch("/api/favorites");
    const data = await res.json();
    favoriteGroups = new Set(data.groups || []);
    favoriteFiles = new Set(data.files || []);
  } catch (e) {
    favoriteGroups = new Set();
    favoriteFiles = new Set();
  }
}

// ---------------------------------------------------------------------------
// Notizen
// ---------------------------------------------------------------------------

async function loadNotes() {
  try {
    const res = await fetch("/api/notes");
    const data = await res.json();
    projectNotes = new Map(Object.entries(data || {}));
  } catch (e) {
    projectNotes = new Map();
  }
}

async function loadTags() {
  try {
    const res = await fetch("/api/tags");
    const data = await res.json();
    projectTags = new Map(Object.entries(data || {}));
  } catch (e) {
    projectTags = new Map();
  }
}

async function saveTags(key, tagsArray) {
  try {
    const res = await fetch(`/api/set-tags?key=${encodeURIComponent(key)}&tags=${encodeURIComponent(tagsArray.join(","))}`);
    const data = await res.json();
    if (data.ok) {
      if (data.tags && data.tags.length) projectTags.set(key, data.tags);
      else projectTags.delete(key);
    }
    return data.ok ? data.tags : null;
  } catch (e) {
    return null;
  }
}

async function loadAllTagsFilterOptions() {
  if (!tagFilterEl) return;
  try {
    const res = await fetch("/api/all-tags");
    const data = await res.json();
    const tags = data.tags || [];
    const current = tagFilterEl.value;
    tagFilterEl.innerHTML = `<option value="" id="opt-tag-filter-all">${escapeHtml(t("tag_filter_all"))}</option>`;
    for (const tag of tags) {
      const opt = document.createElement("option");
      opt.value = tag;
      opt.textContent = tag;
      tagFilterEl.appendChild(opt);
    }
    if (tags.includes(current)) tagFilterEl.value = current;
    else activeTagFilter = "";
  } catch (e) {
    // Dropdown bleibt einfach bei "Alle Tags" - kein Blocker
  }
}

async function saveNote(key, text) {
  try {
    const res = await fetch(`/api/set-note?key=${encodeURIComponent(key)}&text=${encodeURIComponent(text)}`);
    const data = await res.json();
    if (data.ok) {
      if (data.text) projectNotes.set(key, data.text);
      else projectNotes.delete(key);
    }
    return !!data.ok;
  } catch (e) {
    return false;
  }
}

async function toggleFavorite(kind, key) {
  try {
    const res = await fetch(`/api/favorite-toggle?type=${kind}&key=${encodeURIComponent(key)}`);
    const data = await res.json();
    const set = kind === "group" ? favoriteGroups : favoriteFiles;
    if (data.active) set.add(key);
    else set.delete(key);
    return !!data.active;
  } catch (e) {
    return kind === "group" ? favoriteGroups.has(key) : favoriteFiles.has(key);
  }
}

// Exakt symmetrisches Herz (spiegelsymmetrisch um x=12), viewBox 0 0 24 24.
const HEART_SVG_PATH =
  "M12,21.35 L10.55,20.03 C5.4,15.36 2,12.28 2,8.5 C2,5.42 4.42,3 7.5,3 C9.24,3 10.91,3.81 12,5.09 C13.09,3.81 14.76,3 16.5,3 C19.58,3 22,5.42 22,8.5 C22,12.28 18.6,15.36 13.45,20.04 Z";

function buildFavoriteButton(kind, key, isFavorite) {
  const btn = document.createElement("button");
  btn.className = "fav-btn" + (isFavorite ? " active" : "");
  btn.type = "button";
  btn.title = isFavorite ? t("fav_remove") : t("fav_add");
  btn.innerHTML = `<svg class="heart-icon" viewBox="0 0 24 24" width="20" height="20"><path d="${HEART_SVG_PATH}"/></svg>`;
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    btn.disabled = true;
    const active = await toggleFavorite(kind, key);
    btn.disabled = false;
    btn.classList.toggle("active", active);
    btn.title = active ? t("fav_remove") : t("fav_add");
    if (countFavoriteEl) {
      countFavoriteEl.textContent = nf(activeTab === "projects" ? favoriteGroups.size : favoriteFiles.size);
    }
    if (activeType === "favorite") render();
  });
  return btn;
}

// Direkter "gedruckt"-Umschalter auf der Kachel/Zeile selbst (nicht nur im
// Popup) - gleiche Interaktion wie der Favoriten-Herz-Knopf, nur mit dem
// Haekchen-Icon. `key` ist immer der PROJEKT-Schluessel (g.key), auch wenn
// der Knopf auf einer Einzeldatei-Kachel sitzt, da "gedruckt" eine
// Markierung je Projekt ist.
async function loadData(forceRescan = false) {
  loadingEl.style.display = "flex";
  loadingEl.textContent = t("loading_initial");
  emptyEl.style.display = "none";
  gridEl.innerHTML = "";
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  if (forceRescan) {
    try {
      await fetch("/api/rescan");
    } catch (e) {
      // ignorieren, /api/scan unten meldet den Fehler ohnehin
    }
  }
  poll();
}

async function poll() {
  try {
    const res = await fetch("/api/scan");
    const data = await res.json();

    if (data.error) {
      loadingEl.textContent = t("error_prefix") + data.error;
      return;
    }

    if (data.status === "scanning") {
      const p = data.progress || {};
      const total = p.total || 0;
      const done = p.done || 0;
      const currentLabel = p.current ? ` (${p.current})` : "";
      loadingEl.textContent = total
        ? `${t("loading_initial")} ${done}/${total}${currentLabel}`
        : t("loading_initial");
      pollTimer = setTimeout(poll, 600);
      return;
    }

    allGroups = data.groups || [];
    // Der Server liefert fuer die "Alle Ordner"-Ansicht immer den deutschen
    // Sentinel-Wert "Alle Ordner" zurueck (siehe combined_scan_result in
    // app.py) - echte Ordnerpfade werden dagegen unveraendert angezeigt.
    rootPathEl.textContent = data.root === "Alle Ordner" ? t("all_folders_root") : data.root || "";
    if (data.generated_at) {
      standDateEl.textContent = formatDateDE(data.generated_at);
    }
    lastStats = data.stats || {};
    renderStats(lastStats);
    loadingEl.style.display = "none";
    render();
  } catch (e) {
    loadingEl.textContent = t("loading_error_prefix") + e.message;
    pollTimer = setTimeout(poll, 1500);
  }
}

function renderStatsFromCache() {
  if (lastStats) renderStats(lastStats);
}

function renderStats(s) {
  const extCounts = s.ext_counts || {};
  const typeBoxes = libraryFiletypes
    .filter((ft) => ft.enabled)
    .map((ft) => ({
      label: ft.label || ft.ext.toUpperCase(),
      value: nf(extCounts[ft.ext] || 0),
      sub: ft.builtin ? t("stat_type_sub_builtin") : t("stat_type_sub_custom"),
      filter: ft.ext,
    }));
  // Reihenfolge bewusst so gewaehlt, dass "Speicher" immer als letzte Kachel
  // der ERSTEN Reihe stehen bleibt (Projekte, Dateien + max. 2 Dateityp-
  // Kacheln = 4, plus Speicher = 5 - die Grid-Breite ist auf 5 Spalten
  // begrenzt, siehe .stats-grid in style.css). Weitere Dateitypen rutschen
  // dadurch automatisch NACH Speicher in die zweite Reihe statt sie zu
  // verdraengen.
  const storageBox = { label: t("stat_storage"), value: formatSizeDE(s.total_size || 0), sub: t("stat_storage_sub"), filter: null };
  const boxes = [
    { label: t("stat_projects"), value: nf(s.groups || 0), sub: t("stat_projects_sub"), filter: "projects" },
    { label: t("stat_files"), value: nf(s.files || 0), sub: t("stat_files_sub"), filter: "files" },
    ...typeBoxes.slice(0, 2),
    storageBox,
    ...typeBoxes.slice(2),
  ];
  statsEl.innerHTML = boxes
    .map(
      (b) => `
    <div class="stat-box${b.filter ? ` stat-box-clickable stat-${b.filter}` : ""}"${b.filter ? ` data-filter="${b.filter}"` : ""}>
      <div class="stat-label">${b.label}</div>
      <div class="stat-value">${b.value}</div>
      <div class="stat-sub">${b.sub}</div>
    </div>`
    )
    .join("");

  updateStatBoxesActive();
}

function updateStatBoxesActive() {
  statsEl.querySelectorAll(".stat-box[data-filter]").forEach((box) => {
    const f = box.dataset.filter;
    let active;
    if (f === "projects") active = activeTab === "projects" && activeType === "all";
    else if (f === "files") active = activeTab === "files" && activeType === "all";
    else active = activeType === f;
    box.classList.toggle("active", active);
  });
}

// ---------------------------------------------------------------------------
// Filtern & Sortieren
// ---------------------------------------------------------------------------

function groupMatchesType(g) {
  if (activeType === "all") return true;
  if (activeType === "favorite") return favoriteGroups.has(g.key);
  if (activeType === "duplicate") return g.files.some((f) => (f.dup_count || 0) > 1);
  return !!(g.ext_counts && g.ext_counts[activeType]);
}

function fileMatchesType(f, g) {
  if (activeType === "all") return true;
  if (activeType === "favorite") return favoriteFiles.has(srcPath(f));
  if (activeType === "duplicate") return (f.dup_count || 0) > 1;
  return f.ext === activeType;
}

function groupMatchesTagFilter(g) {
  if (!activeTagFilter) return true;
  const tags = projectTags.get(g.key) || [];
  return tags.some((tag) => tag.toLowerCase() === activeTagFilter.toLowerCase());
}

// Sucheingabe matcht Projektname ODER den Text einer evtl. hinterlegten
// Notiz (z.B. "0.2mm Duese" oder ein Kundenname in den Notizen) - so findet
// man Projekte auch wieder, wenn man sich nur an einen Notiz-Stichpunkt statt
// des genauen Dateinamens erinnert.
function groupMatchesSearch(g, q) {
  if (!q) return true;
  if (g.name.toLowerCase().includes(q)) return true;
  const note = projectNotes.get(g.key);
  return !!(note && note.toLowerCase().includes(q));
}

function applyGroupFilters() {
  const q = searchEl.value.trim().toLowerCase();
  let list = allGroups.filter((g) => {
    if (!groupMatchesSearch(g, q)) return false;
    if (!groupMatchesType(g)) return false;
    if (!groupMatchesTagFilter(g)) return false;
    return true;
  });
  const sortMode = sortEl.value;
  if (sortMode === "date") {
    list = list.slice().sort((a, b) => b.last_modified - a.last_modified);
  } else if (sortMode === "size") {
    list = list.slice().sort((a, b) => b.total_size - a.total_size);
  } else if (sortMode === "count") {
    list = list.slice().sort((a, b) => b.file_count - a.file_count);
  } else if (sortMode === "favorite") {
    list = list.slice().sort((a, b) => {
      const fa = favoriteGroups.has(a.key) ? 1 : 0;
      const fb = favoriteGroups.has(b.key) ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return a.name.localeCompare(b.name, "de");
    });
  } else {
    list = list.slice().sort((a, b) => a.name.localeCompare(b.name, "de"));
  }
  return list;
}

function flattenFiles() {
  const q = searchEl.value.trim().toLowerCase();
  const rows = [];
  for (const g of allGroups) {
    if (!groupMatchesTagFilter(g)) continue;
    for (const f of g.files) {
      if (!fileMatchesType(f, g)) continue;
      if (q && !f.name.toLowerCase().includes(q) && !groupMatchesSearch(g, q)) continue;
      rows.push({ file: f, group: g });
    }
  }
  const sortMode = sortEl.value;
  if (activeType === "duplicate") {
    // Bei aktivem Duplikate-Filter immer nach Duplikat-Signatur (Name +
    // Größe) gruppieren, statt nach dem gewählten Sortiermodus - so stehen
    // identische Dateien aus unterschiedlichen Projekten direkt
    // nebeneinander und lassen sich vergleichen (welche kann gelöscht
    // werden?), egal wie unterschiedlich die Projektnamen sind.
    rows.sort((a, b) => {
      const na = a.file.name.toLowerCase();
      const nb = b.file.name.toLowerCase();
      if (na !== nb) return na < nb ? -1 : 1;
      if (a.file.size !== b.file.size) return a.file.size - b.file.size;
      return a.group.name.localeCompare(b.group.name, "de");
    });
  } else if (sortMode === "date") {
    rows.sort((a, b) => b.file.mtime - a.file.mtime);
  } else if (sortMode === "size") {
    rows.sort((a, b) => b.file.size - a.file.size);
  } else if (sortMode === "favorite") {
    rows.sort((a, b) => {
      const fa = favoriteFiles.has(srcPath(a.file)) ? 1 : 0;
      const fb = favoriteFiles.has(srcPath(b.file)) ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return a.file.name.localeCompare(b.file.name, "de");
    });
  } else {
    rows.sort((a, b) => a.file.name.localeCompare(b.file.name, "de"));
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Ordner-Browser fuer die Dateien-Ansicht (statt einer flachen Liste aller
// Dateien aus allen Projekten): baut einen Ordnerbaum ueber ALLE
// gefilterten Dateien hinweg (nicht nur ein einzelnes Projekt wie
// buildFileTree oben) und zeigt jeweils nur die aktuelle Ebene an - Klick
// auf einen Ordner navigiert eine Ebene tiefer, der Zurueck-Knopf/Breadcrumb
// wieder nach oben (siehe filesFolderPath weiter oben).
//
// file.path ist bereits relativ zum Scan-Wurzelverzeichnis und enthaelt
// daher automatisch den echten Projekt-Ordnernamen als ersten Abschnitt -
// die oberste Ebene dieses Baums zeigt somit von selbst genau die
// Projektordner (identisch zur "Projekte"-Ansicht), ohne dass wir das
// gesondert nachbauen muessten. In der "Alle Ordner"-Ansicht traegt jede
// Gruppe zusaetzlich source_label (siehe combined_scan_result in app.py) -
// das wird als zusaetzliche oberste Ebene vorangestellt, damit klar ist,
// aus welchem Bibliothekordner eine Datei stammt.
function buildGlobalFileTree(rows) {
  const root = { name: "", type: "folder", children: new Map() };
  for (const row of rows) {
    const prefix = row.group.source_label ? [row.group.source_label] : [];
    const parts = prefix.concat(row.file.path.split("/").filter(Boolean));
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      if (isFile) {
        node.children.set(`f:${part}`, { name: part, type: "file", file: row.file, group: row.group });
      } else {
        const key = `d:${part}`;
        if (!node.children.has(key)) {
          node.children.set(key, { name: part, type: "folder", children: new Map() });
        }
        node = node.children.get(key);
      }
    }
  }
  return root;
}

// Zaehlt fuer die Untertitel-Zeile einer Ordner-Kachel: direkte
// Unterordner (nur diese Ebene) + Dateien insgesamt (rekursiv ueber alle
// Tiefen) - so sieht man auf einen Blick, wie viel in einem Ordner steckt,
// ohne erst hineinklicken zu muessen.
function summarizeFolder(node) {
  let folders = 0;
  let files = 0;
  (function walk(n, depth) {
    for (const child of n.children.values()) {
      if (child.type === "folder") {
        if (depth === 0) folders++;
        walk(child, depth + 1);
      } else {
        files++;
      }
    }
  })(node, 0);
  return { folders, files };
}

// Nur auf der obersten Ebene des Ordner-Browsers gebraucht: ein
// oberster Ordner entspricht dort 1:1 einem Projekt (siehe
// buildGlobalFileTree oben) - wenn ALLE Dateien darunter zur selben Gruppe
// gehoeren, geben wir diese Gruppe zurueck, damit die aufrufende Stelle statt
// einer schlichten Ordner-Kachel die gewohnte Projekt-Kachel mit echtem
// Vorschaubild anzeigen kann. In der "Alle Ordner"-Ansicht ist die oberste
// Ebene stattdessen der Bibliothekordner (mehrere Projekte darunter) - dort
// liefert diese Funktion konsequent null, sodass eine normale Ordner-Kachel
// gezeigt wird.
function getSingleGroupForFolder(node) {
  let group = null;
  let multiple = false;
  (function walk(n) {
    if (multiple) return;
    for (const child of n.children.values()) {
      if (multiple) return;
      if (child.type === "file") {
        if (group === null) group = child.group;
        else if (group.key !== child.group.key) {
          multiple = true;
          return;
        }
      } else {
        walk(child);
      }
    }
  })(node);
  return multiple ? null : group;
}

function render() {
  const groupList = applyGroupFilters();
  const fileRows = flattenFiles();

  if (countFavoriteEl) {
    countFavoriteEl.textContent = nf(activeTab === "projects" ? favoriteGroups.size : favoriteFiles.size);
  }

  const isList = viewMode === "list";

  // Der Ordner-Browser (renderFilesFolderView) ersetzt die flache
  // Dateiliste, wenn der "Ordner"-Knopf gewaehlt ist (siehe filesViewMode) -
  // ausser im Duplikate-Filter, der immer die flache, nach Duplikat-
  // Signatur gruppierte Ansicht zum direkten Vergleich erzwingt (ohne dabei
  // filesViewMode selbst zu veraendern - der gemerkte Knopf-Zustand bleibt
  // erhalten, sobald der Filter wieder ausgeschaltet wird).
  const folderModeActive = activeTab === "files" && activeType !== "duplicate" && filesViewMode === "folders";
  if (activeType !== "duplicate") {
    sortEl.disabled = folderModeActive;
    sortEl.title = folderModeActive ? t("sort_disabled_folder_title") : "";
  }
  updateFolderViewToggle();

  if (activeTab === "projects") {
    if (folderBreadcrumbEl) folderBreadcrumbEl.style.display = "none";
    gridEl.style.display = isList ? "flex" : "grid";
    gridEl.classList.toggle("list-view", isList);
    filesViewEl.style.display = "none";
    gridEl.innerHTML = "";
    emptyEl.style.display = groupList.length === 0 ? "block" : "none";
    const frag = document.createDocumentFragment();
    for (const g of groupList) frag.appendChild(isList ? buildGroupListRow(g) : buildCard(g));
    gridEl.appendChild(frag);
    updateAlphaBar(groupList, (g) => g.name);
  } else {
    gridEl.style.display = "none";
    filesViewEl.style.display = isList ? "flex" : "grid";
    filesViewEl.classList.toggle("list-view", isList);

    if (folderModeActive) {
      renderFilesFolderView(fileRows, isList);
    } else {
      if (folderBreadcrumbEl) folderBreadcrumbEl.style.display = "none";
      emptyEl.style.display = fileRows.length === 0 ? "block" : "none";
      filesViewEl.innerHTML = "";
      const frag = document.createDocumentFragment();
      // Im Duplikate-Filter sind die Zeilen bereits nach Duplikat-Signatur
      // gruppiert (siehe flattenFiles()) - vor jeder neuen Gruppe einen
      // sichtbaren Trenner ("Absatz") einfuegen, damit klar erkennbar ist, wo
      // ein Vergleichspaar endet und das naechste beginnt.
      let prevDupSig = null;
      for (const row of fileRows) {
        if (activeType === "duplicate") {
          const sig = `${row.file.name.toLowerCase()}::${row.file.size}`;
          if (prevDupSig !== null && sig !== prevDupSig) {
            const divider = document.createElement("div");
            divider.className = "dup-divider";
            frag.appendChild(divider);
          }
          prevDupSig = sig;
        }
        frag.appendChild(isList ? buildFileListRow(row.file, row.group) : buildFileCard(row.file, row.group));
      }
      filesViewEl.appendChild(frag);
      updateAlphaBar(fileRows, (row) => row.file.name);
    }
  }
  observeRenderTargets();
}

// ---------------------------------------------------------------------------
// Rendert die aktuelle Ebene des Ordner-Browsers (siehe buildGlobalFileTree
// oben) sowie den zugehoerigen Breadcrumb/Zurueck-Knopf.
// ---------------------------------------------------------------------------
function renderFilesFolderView(fileRows, isList) {
  const tree = buildGlobalFileTree(fileRows);

  // Entlang des gemerkten Pfads absteigen - bricht ein Abschnitt weg (z.B.
  // weil ein Filterwechsel den Ordner leer gemacht hat), wird der Pfad
  // stillschweigend auf die letzte noch gueltige Ebene gekuerzt, statt einen
  // Fehler zu zeigen.
  let node = tree;
  const validPath = [];
  for (const seg of filesFolderPath) {
    const child = node.children.get(`d:${seg}`);
    if (!child) break;
    node = child;
    validPath.push(seg);
  }
  if (validPath.length !== filesFolderPath.length) filesFolderPath = validPath;

  renderFolderBreadcrumb(filesFolderPath);

  const children = Array.from(node.children.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, "de", { numeric: true });
  });

  emptyEl.style.display = children.length === 0 ? "block" : "none";
  filesViewEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  const atRoot = validPath.length === 0;
  for (const child of children) {
    if (child.type === "folder") {
      // Auf der obersten Ebene entspricht ein Ordner meist genau einem
      // Projekt - dann lieber die gewohnte Projekt-Kachel mit echtem
      // Vorschaubild zeigen statt einer schlichten Ordner-Kachel (siehe
      // getSingleGroupForFolder oben). Tiefer verschachtelte Unterordner
      // bekommen bewusst immer die einfache Ordner-Kachel, sonst wuerde z.B.
      // "Iteration1" faelschlich mit Name/Bild des ganzen Projekts angezeigt.
      const soleGroup = atRoot ? getSingleGroupForFolder(child) : null;
      if (soleGroup) {
        const openFolder = () => {
          filesFolderPath = filesFolderPath.concat(child.name);
          render();
        };
        frag.appendChild(isList ? buildGroupListRow(soleGroup, openFolder) : buildCard(soleGroup, openFolder));
      } else {
        frag.appendChild(buildFolderTile(child, isList));
      }
    } else {
      frag.appendChild(isList ? buildFileListRow(child.file, child.group) : buildFileCard(child.file, child.group));
    }
  }
  filesViewEl.appendChild(frag);
  // Die ABC-Sprungleiste bezieht sich auf flache Namenslisten - in der
  // Ordneransicht (gemischt Ordner+Dateien je Ebene, unterschiedliche
  // Sortiertiefe) waere sie eher verwirrend, deshalb hier ausgeblendet.
  updateAlphaBar(null, null);
}

// Haengt ein Bild-Vorschaubild an eine Kachel an - versucht zuerst die
// serverseitig verkleinerte Miniatur (/api/file-thumbnail; wichtig bei sehr
// hochaufgeloesten Dateien, z.B. Druckvorlagen mit zehntausenden Pixeln
// Kantenlaenge, die den Browser sonst beim Laden des Originals ausbremsen
// oder die Kachel leer lassen koennen). Schlaegt das fehl (z.B. weil Pillow
// auf diesem Rechner nicht installiert ist), wird automatisch auf das
// Original zurueckgefallen; schlaegt selbst das fehl, zeigt ein
// Platzhalter-Symbol.
function appendImageThumb(thumb, file, altText, placeholderHtml) {
  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = altText;
  img.src = `/api/file-thumbnail?path=${encodeURIComponent(srcPath(file))}`;
  let triedOriginal = false;
  img.onerror = () => {
    if (!triedOriginal) {
      triedOriginal = true;
      img.src = `/api/file?path=${encodeURIComponent(srcPath(file))}`;
    } else {
      setThumbPlaceholder(thumb, placeholderHtml);
    }
  };
  thumb.appendChild(img);
}

// Sucht innerhalb eines Ordnerknotens (rekursiv, beliebige Tiefe) eine
// Datei, die sich als Vorschaubild fuer die Ordner-Kachel eignet - gleiche
// Prioritaet wie bei der Projekt-Vorschau (3MF vor STL vor F3D, siehe
// _scan_impl in app.py), damit Ordner-Kacheln optisch genauso funktionieren
// wie gewohnt. Liefert den Baum-Blattknoten (mit .file/.group) oder null,
// falls der Ordner (theoretisch) keine Datei enthaelt.
function pickRepresentativeFile(node) {
  let mf = null, stl = null, f3d = null, img = null;
  (function walk(n) {
    for (const child of n.children.values()) {
      if (child.type === "file") {
        if (!mf && child.file.ext === "3mf") mf = child;
        else if (!stl && child.file.ext === "stl") stl = child;
        else if (!f3d && child.file.ext === "f3d") f3d = child;
        // Bilder nur als letzter Ausweg, falls kein 3D-Modell im Ordner
        // liegt - sonst wuerde ein zufaelliges Foto ein echtes Modell-
        // Vorschaubild verdraengen.
        else if (!img && IMAGE_EXTS_JS.includes(child.file.ext)) img = child;
      } else {
        walk(child);
      }
    }
  })(node);
  return mf || stl || f3d || img || null;
}

function buildFolderTile(node, isList) {
  const { folders, files } = summarizeFolder(node);
  const metaParts = [];
  if (folders > 0) metaParts.push(`${nf(folders)} ${folders === 1 ? t("folder_word_singular") : t("folder_word_plural")}`);
  metaParts.push(`${nf(files)} ${files === 1 ? t("file_word") : t("files_word")}`);
  const meta = metaParts.join(" · ");

  const openFolder = () => {
    filesFolderPath = filesFolderPath.concat(node.name);
    render();
  };

  if (isList) {
    const row = document.createElement("div");
    row.className = "list-row folder-tile";
    row.innerHTML = `
      <div class="list-row-info">
        <div class="list-row-name">📁 ${escapeHtml(node.name)}</div>
        <div class="list-row-sub">${escapeHtml(meta)}</div>
      </div>`;
    row.addEventListener("click", openFolder);
    return row;
  }

  const card = document.createElement("div");
  card.className = "card folder-tile";

  const thumb = document.createElement("div");
  thumb.className = "card-thumb";

  const badges = document.createElement("div");
  badges.className = "thumb-badges";
  badges.innerHTML = `<span class="thumb-badge badge-folder">📁</span>`;
  thumb.appendChild(badges);

  // Vorschaubild wie bei einer einzelnen Datei-Kachel (buildFileCard) -
  // benutzt dieselben Endpunkte/Fallbacks: eingebettetes Vorschaubild bei
  // 3MF/F3D, ansonsten einmaliger statischer Render bei STL (lazy via
  // observeRenderTargets(), dafuer dieselben data-Attribute wie dort).
  const rep = pickRepresentativeFile(node);
  if (rep) {
    card.dataset.key = rep.group.key;
    card.dataset.filePath = rep.file.path;
    if (rep.file.ext === "3mf" || rep.file.ext === "f3d") {
      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = `/api/file-thumbnail?path=${encodeURIComponent(srcPath(rep.file))}`;
      img.alt = node.name;
      img.onerror = () => {
        if (rep.file.ext === "3mf") {
          setThumbPlaceholder(thumb, '<div class="placeholder">⏳</div>');
          render3mfThumbnail([rep.file], node.name, thumb, 260);
        } else {
          setThumbPlaceholder(thumb, '<div class="placeholder" style="font-size:44px;">📐</div>');
        }
      };
      thumb.appendChild(img);
    } else if (rep.file.ext === "stl") {
      if (rep.file.size <= MAX_SINGLE_FILE_BYTES) {
        thumb.dataset.pendingRender = "1";
        thumb.innerHTML += '<div class="placeholder">⏳</div>';
      } else {
        thumb.innerHTML += '<div class="placeholder" style="font-size:44px;">📦</div>';
      }
    } else if (IMAGE_EXTS_JS.includes(rep.file.ext)) {
      appendImageThumb(thumb, rep.file, node.name, '<div class="placeholder" style="font-size:52px;">📁</div>');
    }
  } else {
    thumb.innerHTML += '<div class="placeholder" style="font-size:52px;">📁</div>';
  }

  const body = document.createElement("div");
  body.className = "card-body";
  body.innerHTML = `
    <div class="card-name">📁 ${escapeHtml(node.name)}</div>
    <div class="card-meta">${escapeHtml(meta)}</div>`;

  card.appendChild(thumb);
  card.appendChild(body);
  card.addEventListener("click", openFolder);
  return card;
}

function renderFolderBreadcrumb(path) {
  if (!folderBreadcrumbEl) return;
  folderBreadcrumbEl.style.display = "flex";

  const backDisabled = path.length === 0;
  let html = `<button class="breadcrumb-back-btn" id="folder-back-btn" type="button"${backDisabled ? " disabled" : ""}>${escapeHtml(t("folder_back"))}</button>`;
  html += `<span class="breadcrumb-trail">`;
  html += `<button class="breadcrumb-seg${path.length === 0 ? " active" : ""}" type="button" data-depth="0">${escapeHtml(t("folder_root_label"))}</button>`;
  path.forEach((seg, i) => {
    html += `<span class="breadcrumb-sep">›</span><button class="breadcrumb-seg${i === path.length - 1 ? " active" : ""}" type="button" data-depth="${i + 1}">${escapeHtml(seg)}</button>`;
  });
  html += `</span>`;
  folderBreadcrumbEl.innerHTML = html;

  const backBtn = folderBreadcrumbEl.querySelector("#folder-back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (!filesFolderPath.length) return;
      filesFolderPath = filesFolderPath.slice(0, -1);
      render();
    });
  }
  folderBreadcrumbEl.querySelectorAll(".breadcrumb-seg").forEach((btn) => {
    btn.addEventListener("click", () => {
      const depth = parseInt(btn.dataset.depth, 10);
      if (depth === path.length) return;
      filesFolderPath = path.slice(0, depth);
      render();
    });
  });
}

// Der Ordner/Dateien-Umschalter ist jetzt dauerhaft sichtbar (Teil der
// zusammengefassten Werkzeugleiste) und dient gleichzeitig als Einstieg in
// die Dateien-Ansicht - ein Klick wechselt bei Bedarf automatisch dorthin
// (siehe Klick-Handler unten). "Ordner" gilt dabei auch dann als aktiv,
// wenn man noch auf der Projekte-Ansicht ist, da die oberste Ebene des
// Ordner-Browsers ohnehin genau die Projekt-Kacheln zeigt (siehe
// renderFilesFolderView/getSingleGroupForFolder).
function updateFolderViewToggle() {
  if (!folderViewToggleEl) return;
  const dupActive = activeType === "duplicate";
  const flatActive = dupActive || (activeTab === "files" && filesViewMode === "flat");
  folderViewToggleEl.querySelectorAll(".folder-view-btn").forEach((btn) => {
    const mode = btn.dataset.mode === "folders" ? "folders" : "flat";
    btn.classList.toggle("active", mode === "flat" ? flatActive : !flatActive);
    btn.disabled = dupActive;
    btn.title = dupActive ? t("sort_disabled_dup_title") : "";
  });
}

folderViewToggleEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".folder-view-btn");
  if (!btn || btn.disabled) return;
  const mode = btn.dataset.mode === "folders" ? "folders" : "flat";
  if (activeTab === "files" && mode === filesViewMode) return;
  filesViewMode = mode;
  activeTab = "files";
  filesFolderPath = [];
  updateStatBoxesActive();
  render();
});

// ---------------------------------------------------------------------------
// ABC-Sprungleiste ueber der Projekt-Miniaturansicht
// ---------------------------------------------------------------------------

const ALPHA_LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function letterFor(name) {
  const stripped = (name || "").normalize("NFD").replace(DIACRITICS_RE, "");
  const ch = stripped.charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

function buildAlphaBar() {
  if (!alphaBarEl) return;
  alphaBarEl.innerHTML = ALPHA_LETTERS.map((l) => `<button class="alpha-btn" data-letter="${l}" disabled>${l}</button>`).join("");
  alphaBarEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".alpha-btn");
    if (!btn || btn.disabled) return;
    jumpToLetter(btn.dataset.letter);
  });
}

function updateAlphaBar(items, nameOf) {
  if (!alphaBarEl) return;
  if (!items) {
    alphaBarEl.style.display = "none";
    return;
  }
  alphaBarEl.style.display = "flex";
  const available = new Set(items.map((it) => letterFor(nameOf(it))));
  alphaBarEl.querySelectorAll(".alpha-btn").forEach((btn) => {
    btn.disabled = !available.has(btn.dataset.letter);
  });
}

function jumpToLetter(letter) {
  if (sortEl.value !== "name") {
    sortEl.value = "name";
    render();
  }
  if (activeTab === "projects") {
    const groupList = applyGroupFilters();
    const idx = groupList.findIndex((g) => letterFor(g.name) === letter);
    if (idx === -1) return;
    const card = gridEl.querySelectorAll(".card, .list-row")[idx];
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    const fileRows = flattenFiles();
    const idx = fileRows.findIndex((row) => letterFor(row.file.name) === letter);
    if (idx === -1) return;
    const card = filesViewEl.querySelectorAll(".card, .list-row")[idx];
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ---------------------------------------------------------------------------
// Karten fuer die "Einzelne Dateien"-Ansicht (eine Karte pro Datei)
// ---------------------------------------------------------------------------

function buildFileCard(file, group) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.key = group.key;
  card.dataset.filePath = file.path;

  const thumb = document.createElement("div");
  thumb.className = "card-thumb";

  const badges = document.createElement("div");
  badges.className = "thumb-badges";
  badges.innerHTML = `<span class="thumb-badge badge-${file.ext}">${file.ext.toUpperCase()}</span>`;
  thumb.appendChild(badges);

  if (file.ext === "3mf" || file.ext === "f3d") {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = `/api/file-thumbnail?path=${encodeURIComponent(srcPath(file))}`;
    img.alt = file.name;
    img.onerror = () => {
      if (file.ext === "3mf") {
        // Kein eingebettetes Vorschaubild - stattdessen einmalig statisch
        // rendern (bleibt auch bei deaktivierter 3D-Live-Vorschau erlaubt).
        setThumbPlaceholder(thumb, '<div class="placeholder">⏳</div>');
        render3mfThumbnail([file], file.name, thumb, 260);
      } else {
        setThumbPlaceholder(thumb, `<div class="placeholder">${file.ext === "f3d" ? "📐" : "📦"}</div>`);
      }
    };
    thumb.appendChild(img);
  } else if (file.ext === "stl") {
    if (file.size <= MAX_SINGLE_FILE_BYTES) {
      thumb.dataset.pendingRender = "1";
      thumb.innerHTML += '<div class="placeholder">⏳</div>';
    } else {
      thumb.innerHTML += '<div class="placeholder">📦</div>';
    }
  } else if (IMAGE_EXTS_JS.includes(file.ext)) {
    appendImageThumb(thumb, file, file.name, '<div class="placeholder">🖼</div>');
  } else {
    thumb.innerHTML += '<div class="placeholder">📦</div>';
  }

  thumb.appendChild(buildFavoriteButton("file", srcPath(file), favoriteFiles.has(srcPath(file))));
  thumb.appendChild(buildSelectCheckbox("file", srcPath(file), file.name));

  const body = document.createElement("div");
  body.className = "card-body";

  const name = document.createElement("div");
  name.className = "card-name";
  name.textContent = file.name;

  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.textContent = `${group.name} · ${formatSizeDE(file.size)} · ${formatDateDE(file.mtime)}`;

  const tags = document.createElement("div");
  tags.className = "card-tags";
  if ((file.dup_count || 0) > 1) {
    tags.innerHTML += `<span class="card-tag dup-tag" title="${escapeHtml(t("dup_file_tooltip", { count: file.dup_count }))}">⧉ ${t("dup_tag_label")}</span>`;
  }
  const actionsSpan = document.createElement("span");
  actionsSpan.className = "card-tag card-tag-actions";
  if (SLICER_OPENABLE_EXTS_JS.includes(file.ext)) {
    actionsSpan.appendChild(buildOpenWithButton(srcPath(file)));
  }
  actionsSpan.appendChild(buildRevealButton(srcPath(file)));
  actionsSpan.appendChild(buildDownloadButton(srcPath(file), file.name));
  actionsSpan.appendChild(buildDeleteFileButton(srcPath(file), file.name));
  tags.appendChild(actionsSpan);

  body.appendChild(name);
  body.appendChild(meta);
  body.appendChild(tags);

  card.appendChild(thumb);
  card.appendChild(body);

  card.addEventListener("click", () => {
    if (selectionMode) {
      toggleSelection("file", srcPath(file), file.name);
      card.querySelector(".select-checkbox")?.classList.toggle("checked", isSelected("file", srcPath(file)));
      return;
    }
    openModal(group);
  });

  return card;
}

function buildFileListRow(file, group) {
  const row = document.createElement("div");
  row.className = "list-row";
  row.dataset.key = group.key;
  row.dataset.filePath = file.path;

  const info = document.createElement("div");
  info.className = "list-row-info";
  const name = document.createElement("div");
  name.className = "list-row-name";
  name.textContent = file.name;
  const sub = document.createElement("div");
  sub.className = "list-row-sub";
  sub.textContent = group.name;
  info.appendChild(name);
  info.appendChild(sub);

  const tags = document.createElement("div");
  tags.className = "list-row-tags";
  tags.innerHTML = `<span class="card-tag"><span class="dot dot-${file.ext}"></span>${file.ext.toUpperCase()}</span>`;
  if ((file.dup_count || 0) > 1) {
    tags.innerHTML += `<span class="card-tag dup-tag" title="${escapeHtml(t("dup_file_tooltip", { count: file.dup_count }))}">⧉</span>`;
  }

  const size = document.createElement("div");
  size.className = "list-row-meta";
  size.textContent = formatSizeDE(file.size);

  const date = document.createElement("div");
  date.className = "list-row-meta list-row-date";
  date.textContent = formatDateDE(file.mtime);

  const actions = document.createElement("div");
  actions.className = "list-row-actions";
  actions.appendChild(buildFavoriteButton("file", srcPath(file), favoriteFiles.has(srcPath(file))));
  if (SLICER_OPENABLE_EXTS_JS.includes(file.ext)) {
    actions.appendChild(buildOpenWithButton(srcPath(file)));
  }
  actions.appendChild(buildRevealButton(srcPath(file)));
  actions.appendChild(buildDownloadButton(srcPath(file), file.name));
  actions.appendChild(buildDeleteFileButton(srcPath(file), file.name));

  row.appendChild(buildSelectCheckbox("file", srcPath(file), file.name));
  row.appendChild(info);
  row.appendChild(tags);
  row.appendChild(size);
  row.appendChild(date);
  row.appendChild(actions);

  row.addEventListener("click", (e) => {
    if (e.target.closest(".fav-btn, .reveal-btn, .delete-btn, .download-btn, .openwith-wrap, .select-checkbox")) return;
    if (selectionMode) {
      toggleSelection("file", srcPath(file), file.name);
      row.querySelector(".select-checkbox")?.classList.toggle("checked", isSelected("file", srcPath(file)));
      return;
    }
    openModal(group);
  });

  return row;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s);
}

function revealFile(path) {
  fetch(`/api/reveal?path=${encodeURIComponent(path)}`).catch(() => {});
}

function buildViewerToggle(label, onClick) {
  const btn = document.createElement("button");
  btn.className = "viewer-toggle";
  btn.type = "button";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function buildRevealButton(path, title = t("reveal_title")) {
  const btn = document.createElement("button");
  btn.className = "reveal-btn";
  btn.type = "button";
  btn.title = title;
  btn.innerHTML = "📁";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    revealFile(path);
  });
  return btn;
}

// Datei herunterladen (z.B. wenn die Bibliothek auf einem Netzwerklaufwerk
// liegt und man eine lokale Kopie haben moechte) - der Server schickt die
// Antwort mit Content-Disposition: attachment, der Browser speichert die
// Datei also direkt statt sie zu oeffnen.
function buildDownloadButton(path, filename, title = t("download_file_title")) {
  const a = document.createElement("a");
  a.className = "download-btn";
  a.href = `/api/file?path=${encodeURIComponent(path)}&dl=1`;
  a.download = filename || "";
  a.title = title;
  a.innerHTML = DOWNLOAD_ICON_SVG;
  a.addEventListener("click", (e) => e.stopPropagation());
  return a;
}

// Ganzes Projekt als ZIP herunterladen (alle Dateien der Gruppe).
function buildDownloadGroupButton(key, title = t("download_project_title")) {
  const a = document.createElement("a");
  a.className = "download-btn";
  a.href = `/api/download-group?key=${encodeURIComponent(key)}`;
  a.title = title;
  a.innerHTML = DOWNLOAD_ICON_SVG;
  a.addEventListener("click", (e) => e.stopPropagation());
  return a;
}

// ---------------------------------------------------------------------------
// "Oeffnen mit" - Modell-/CAD-Dateien direkt in einem der vier grossen
// Slicer oeffnen (siehe /api/slicers, /api/open-with-slicer). Zeigt beim
// Klick ein kleines Dropdown mit den vier Slicern; nicht gefundene werden
// gedimmt angezeigt, aber lassen sich trotzdem anklicken (Fehlermeldung
// erklaert dann, wo man den Pfad manuell festlegen kann).
// ---------------------------------------------------------------------------

async function loadSlicersList(forceReload = false) {
  if (slicersListCache && !forceReload) return slicersListCache;
  try {
    const res = await fetch("/api/slicers");
    const data = await res.json();
    slicersListCache = data.slicers || [];
  } catch (e) {
    slicersListCache = [];
  }
  return slicersListCache;
}

let openSlicerMenuEl = null;
function closeSlicerMenu() {
  if (openSlicerMenuEl) {
    openSlicerMenuEl.remove();
    openSlicerMenuEl = null;
  }
  window.removeEventListener("scroll", closeSlicerMenu, true);
  window.removeEventListener("resize", closeSlicerMenu);
}
document.addEventListener("click", closeSlicerMenu);

// Kleines Drucker-Symbol als SVG statt Emoji - Emoji-Schriftarten rendern
// 🖨 je nach Windows-Version/Zoom oft winzig oder blass, ein eigenes Icon
// ist auf jedem Rechner gleich klar erkennbar.
const PRINTER_ICON_SVG = '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M6 9V4h12v5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="4" y="9" width="16" height="8" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="7" y="14" width="10" height="6" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>';

// Gleiches Prinzip fuer Herunterladen- und Papierkorb-Symbole: eigene SVGs
// statt Emojis (⬇/🗑), damit sie auf jedem System gleich deutlich und
// scharf dargestellt werden statt teils winzig/blass zu wirken.
const DOWNLOAD_ICON_SVG = '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M12 3.5v11.5m0 0l-4.2-4.2M12 15l4.2-4.2" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 17.5v1.8c0 1 .8 1.7 1.7 1.7h10.6c1 0 1.7-.8 1.7-1.7v-1.8" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const TRASH_ICON_SVG = '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M4.5 7h15M9.3 7V4.7c0-.6.5-1.1 1.1-1.1h3.2c.6 0 1.1.5 1.1 1.1V7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.3 7l.9 12.4c.06.9.83 1.6 1.73 1.6h6.14c.9 0 1.67-.7 1.73-1.6L17.7 7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.2 10.8v6.4M13.8 10.8v6.4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';

async function openFileWithSlicerId(slicerId, path) {
  try {
    const res = await fetch(`/api/open-with-slicer?id=${encodeURIComponent(slicerId)}&path=${encodeURIComponent(path)}`);
    const data = await res.json();
    if (!data.ok) window.alert(data.error || t("open_with_failed"));
    return !!data.ok;
  } catch (err) {
    window.alert(t("open_with_failed"));
    return false;
  }
}

// Haengt das Menue direkt an document.body statt an die Datei-Kachel (die
// per .card { overflow: hidden } abgerundete Ecken hat) und positioniert es
// "fixed" anhand der tatsaechlichen Bildschirmposition des Knopfes - so wird
// es nie vom rundenden Kachel-Rahmen abgeschnitten/unsichtbar gemacht, egal
// wo auf der Kachel der Knopf sitzt.
function positionSlicerMenu(menu, anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.left = "0px";
  menu.style.top = "0px";
  // Erst unsichtbar einhaengen, um die tatsaechliche Groesse zu messen,
  // dann anhand dessen final oberhalb/rechtsbuendig zum Knopf platzieren.
  menu.style.visibility = "hidden";
  document.body.appendChild(menu);
  const menuRect = menu.getBoundingClientRect();
  let left = rect.right - menuRect.width;
  let top = rect.top - menuRect.height - 6;
  if (top < 4) top = rect.bottom + 6; // zu wenig Platz oberhalb -> stattdessen unterhalb oeffnen
  if (left < 4) left = 4;
  const maxLeft = window.innerWidth - menuRect.width - 4;
  if (left > maxLeft) left = Math.max(4, maxLeft);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.style.visibility = "visible";
}

async function openSlicerPickerMenu(anchorEl, path) {
  const already = openSlicerMenuEl && openSlicerMenuEl.dataset.forPath === path;
  closeSlicerMenu();
  if (already) return;

  const menu = document.createElement("div");
  menu.className = "openwith-menu";
  menu.dataset.forPath = path;
  menu.addEventListener("click", (ev) => ev.stopPropagation());
  menu.innerHTML = `<div class="openwith-menu-loading">${escapeHtml(t("open_with_loading"))}</div>`;
  positionSlicerMenu(menu, anchorEl);
  openSlicerMenuEl = menu;
  window.addEventListener("scroll", closeSlicerMenu, true);
  window.addEventListener("resize", closeSlicerMenu);

  const slicers = await loadSlicersList();
  if (openSlicerMenuEl !== menu) return; // Menue wurde zwischenzeitlich geschlossen
  menu.innerHTML = "";
  for (const s of slicers) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "openwith-item" + (s.path ? "" : " openwith-item-missing") + (s.id === defaultSlicerId ? " openwith-item-default" : "");
    item.textContent = s.label + (s.id === defaultSlicerId ? ` (${t("open_with_default_tag")})` : "");
    item.title = s.path || t("open_with_not_found");
    item.addEventListener("click", async () => {
      closeSlicerMenu();
      await openFileWithSlicerId(s.id, path);
    });
    menu.appendChild(item);
  }
  // Nachtraeglich neu positionieren, da sich die Hoehe durch die geladenen
  // Eintraege veraendert hat (vorher stand nur "Laedt ...\" da).
  positionSlicerMenu(menu, anchorEl);
}

// Ein Klick auf das Drucker-Symbol oeffnet die Datei direkt im als Standard
// festgelegten Slicer (siehe "Bibliothek verwalten" -> Slicer-Abschnitt) -
// kein Aufklapp-Menue mehr noetig. Ist noch kein Standard gewaehlt, zeigt
// der Klick stattdessen die Auswahl (wie bisher). Der kleine Pfeil daneben
// oeffnet die volle Auswahl jederzeit, falls man einmalig einen anderen
// Slicer nutzen moechte.
function buildOpenWithButton(path) {
  const wrap = document.createElement("span");
  wrap.className = "openwith-wrap";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "openwith-btn";
  btn.title = t("open_with_title");
  btn.innerHTML = PRINTER_ICON_SVG;
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (defaultSlicerId) {
      closeSlicerMenu();
      btn.disabled = true;
      await openFileWithSlicerId(defaultSlicerId, path);
      btn.disabled = false;
      return;
    }
    await openSlicerPickerMenu(wrap, path);
  });
  wrap.appendChild(btn);

  const caret = document.createElement("button");
  caret.type = "button";
  caret.className = "openwith-caret";
  caret.title = t("open_with_choose_title");
  caret.innerHTML = "▾";
  caret.addEventListener("click", async (e) => {
    e.stopPropagation();
    await openSlicerPickerMenu(wrap, path);
  });
  wrap.appendChild(caret);

  return wrap;
}

// ---------------------------------------------------------------------------
// Loeschen (Datei / ganzes Projekt) - mit Bestaetigungsdialog
// ---------------------------------------------------------------------------

function deleteFileOnServer(path) {
  return fetch(`/api/delete-file?path=${encodeURIComponent(path)}`).then((r) => r.json());
}

function deleteGroupOnServer(key) {
  return fetch(`/api/delete-group?key=${encodeURIComponent(key)}`).then((r) => r.json());
}

function buildDeleteFileButton(path, name, onDeleted) {
  const btn = document.createElement("button");
  btn.className = "delete-btn";
  btn.type = "button";
  btn.title = t("delete_file_title");
  btn.innerHTML = TRASH_ICON_SVG;
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const ok = confirm(t("confirm_delete_file", { name }));
    if (!ok) return;
    btn.disabled = true;
    try {
      const data = await deleteFileOnServer(path);
      if (!data.ok) {
        alert(t("delete_failed") + (data.error || t("delete_failed_unknown")));
        btn.disabled = false;
        return;
      }
      favoriteFiles.delete(path);
      if (onDeleted) onDeleted();
      loadData();
      refreshTrashBadgeOnly();
    } catch (err) {
      alert(t("delete_failed") + err.message);
      btn.disabled = false;
    }
  });
  return btn;
}

function buildDeleteGroupButton(key, name, fileCount, onDeleted) {
  const btn = document.createElement("button");
  btn.className = "delete-btn";
  btn.type = "button";
  btn.title = t("delete_project_title");
  btn.innerHTML = TRASH_ICON_SVG;
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const word = fileCount === 1 ? t("word_file_singular") : t("word_file_plural");
    const ok = confirm(t("confirm_delete_project", { name, count: fileCount, word }));
    if (!ok) return;
    btn.disabled = true;
    try {
      const data = await deleteGroupOnServer(key);
      if (!data.ok) {
        alert(t("some_files_not_deleted") + (data.errors || []).join("\n"));
      }
      favoriteGroups.delete(key);
      if (onDeleted) onDeleted();
      loadData();
      refreshTrashBadgeOnly();
    } catch (err) {
      alert(t("delete_failed") + err.message);
      btn.disabled = false;
    }
  });
  return btn;
}

// ---------------------------------------------------------------------------
// Ordnerbaum fuer das Projekt-Detail-Modal
// ---------------------------------------------------------------------------

function extIcon(ext) {
  if (ext === "stl") return "🧊";
  if (ext === "3mf") return "📦";
  if (ext === "f3d") return "📐";
  if (IMAGE_EXTS_JS.includes(ext)) return "🖼";
  return "📄";
}

function buildFileTree(files) {
  const root = { name: "", type: "folder", children: new Map() };
  for (const f of files) {
    const parts = f.path.split("/").filter(Boolean);
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      if (isFile) {
        node.children.set(`f:${part}`, { name: part, type: "file", file: f });
      } else {
        const key = `d:${part}`;
        if (!node.children.has(key)) {
          node.children.set(key, { name: part, type: "folder", children: new Map() });
        }
        node = node.children.get(key);
      }
    }
  }
  return root;
}

function renderTreeNode(node, depth, onFileClick, onFileDeleted) {
  const children = Array.from(node.children.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, "de", { numeric: true });
  });

  const ul = document.createElement("ul");
  ul.className = "tree-list";

  for (const child of children) {
    const li = document.createElement("li");
    li.className = "tree-item";

    if (child.type === "folder") {
      const row = document.createElement("div");
      row.className = "tree-row tree-folder";
      row.style.paddingLeft = `${depth * 18}px`;
      row.innerHTML = `<span class="tree-toggle">▾</span><span class="tree-icon">📁</span><span class="tree-name">${escapeHtml(child.name)}</span>`;

      const childUl = renderTreeNode(child, depth + 1, onFileClick, onFileDeleted);
      row.addEventListener("click", () => {
        const willCollapse = childUl.style.display !== "none";
        childUl.style.display = willCollapse ? "none" : "";
        row.querySelector(".tree-toggle").textContent = willCollapse ? "▸" : "▾";
      });

      li.appendChild(row);
      li.appendChild(childUl);
    } else {
      const f = child.file;
      const row = document.createElement("div");
      row.className = "tree-row tree-file";
      row.dataset.path = f.path;
      row.style.paddingLeft = `${depth * 18 + 18}px`;
      const dupBadge = (f.dup_count || 0) > 1 ? `<span class="tree-dup" title="${escapeHtml(t("dup_file_tooltip", { count: f.dup_count }))}">⧉</span>` : "";
      row.innerHTML = `<span class="tree-icon">${extIcon(f.ext)}</span><span class="tree-name">${escapeHtml(child.name)}</span>${dupBadge}<span class="tree-ext-dot dot-${f.ext}" title="${f.ext.toUpperCase()}"></span><span class="tree-meta">${formatSizeDE(f.size)}</span>`;
      const revealWrap = document.createElement("span");
      revealWrap.className = "tree-reveal";
      if (SLICER_OPENABLE_EXTS_JS.includes(f.ext)) {
        revealWrap.appendChild(buildOpenWithButton(srcPath(f)));
      }
      revealWrap.appendChild(buildRevealButton(srcPath(f)));
      revealWrap.appendChild(buildDownloadButton(srcPath(f), f.name));
      revealWrap.appendChild(buildDeleteFileButton(srcPath(f), f.name, onFileDeleted));
      row.appendChild(revealWrap);
      if (onFileClick) {
        row.classList.add("tree-file-clickable");
        row.title = t("click_for_3d_preview");
        row.addEventListener("click", (e) => {
          if (e.target.closest(".reveal-btn") || e.target.closest(".delete-btn") || e.target.closest(".download-btn") || e.target.closest(".openwith-wrap")) return;
          onFileClick(f, row);
        });
      }
      li.appendChild(row);
    }
    ul.appendChild(li);
  }
  return ul;
}

function buildFileTreeView(files, onFileClick, onFileDeleted) {
  const wrap = document.createElement("div");
  wrap.className = "tree-wrap";
  const tree = buildFileTree(files);
  wrap.appendChild(renderTreeNode(tree, 0, onFileClick, onFileDeleted));
  return wrap;
}

// ---------------------------------------------------------------------------
// Projekt-Karten
// ---------------------------------------------------------------------------

function buildCard(g, onClick) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.key = g.key;

  const stlCount = g.files.filter((f) => f.ext === "stl").length;
  const mfCount = g.files.filter((f) => f.ext === "3mf").length;
  const f3dCount = g.files.filter((f) => f.ext === "f3d").length;

  const thumb = document.createElement("div");
  thumb.className = "card-thumb";

  const isDuplicate = g.files.some((f) => (f.dup_count || 0) > 1);

  const badges = document.createElement("div");
  badges.className = "thumb-badges";
  if (mfCount) badges.innerHTML += `<span class="thumb-badge badge-3mf">3MF</span>`;
  if (stlCount) badges.innerHTML += `<span class="thumb-badge badge-stl">STL</span>`;
  if (f3dCount) badges.innerHTML += `<span class="thumb-badge badge-f3d">F3D</span>`;
  if (isDuplicate) badges.innerHTML += `<span class="thumb-badge badge-dup" title="${escapeHtml(t("dup_group_tooltip"))}">⧉</span>`;
  if (badges.innerHTML) thumb.appendChild(badges);

  thumb.appendChild(buildFavoriteButton("group", g.key, favoriteGroups.has(g.key)));
  thumb.appendChild(buildSelectCheckbox("group", g.key, g.name));

  if (g.thumbnail_type === "3mf" || g.thumbnail_type === "image" || g.thumbnail_type === "f3d") {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = g.thumbnail_url;
    img.alt = g.name;
    img.onerror = () => {
      if (g.thumbnail_type === "3mf" && g.has_3mf) {
        // Kein eingebettetes Vorschaubild im 3MF (z.B. bei nicht in
        // Bambu/Prusa gesliceten Exporten) - stattdessen einmalig statisch
        // rendern (bleibt auch bei deaktivierter 3D-Live-Vorschau erlaubt).
        setThumbPlaceholder(thumb, '<div class="placeholder">⏳</div>');
        render3mfThumbnail(g.files, g.name, thumb, 300);
      } else {
        setThumbPlaceholder(thumb, `<div class="placeholder">${g.thumbnail_type === "f3d" ? "📐" : "📦"}</div>`);
      }
    };
    thumb.appendChild(img);
  } else if (g.thumbnail_type === "render") {
    thumb.dataset.pendingRender = "1";
    setThumbPlaceholder(thumb, '<div class="placeholder">⏳</div>');
  } else if (g.has_f3d) {
    setThumbPlaceholder(thumb, '<div class="placeholder">📐</div>');
  } else {
    setThumbPlaceholder(thumb, '<div class="placeholder">📦</div>');
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const name = document.createElement("div");
  name.className = "card-name";
  name.textContent = g.name;

  const meta = document.createElement("div");
  meta.className = "card-meta";
  const fileWord = g.file_count === 1 ? t("file_word") : t("files_word");
  meta.textContent = t("meta_files_size_date", {
    count: nf(g.file_count),
    word: fileWord,
    size: formatSizeDE(g.total_size),
    date: formatDateDE(g.last_modified),
  });

  const tags = document.createElement("div");
  tags.className = "card-tags";
  if (stlCount) {
    tags.innerHTML += `<span class="card-tag"><span class="dot dot-stl"></span>STL ${stlCount}</span>`;
  }
  if (mfCount) {
    tags.innerHTML += `<span class="card-tag"><span class="dot dot-3mf"></span>3MF ${mfCount}</span>`;
  }
  if (f3dCount) {
    tags.innerHTML += `<span class="card-tag"><span class="dot dot-f3d"></span>F3D ${f3dCount}</span>`;
  }
  if (g.print_time_h) {
    tags.innerHTML += `<span class="card-tag">⏱ ${escapeHtml(g.print_time_h)}</span>`;
  }
  if (g.filament_g) {
    tags.innerHTML += `<span class="card-tag">🧵 ${nf(g.filament_g)}g</span>`;
  }
  for (const tagText of (projectTags.get(g.key) || [])) {
    tags.innerHTML += `<span class="card-tag tag-chip-mini">${escapeHtml(tagText)}</span>`;
  }

  const actions = document.createElement("span");
  actions.className = "card-tag card-tag-actions";
  if (g.files.length) {
    actions.appendChild(buildRevealButton(srcPath(g.files[0]), t("reveal_project_title")));
  }
  actions.appendChild(buildDownloadGroupButton(g.key));
  actions.appendChild(buildDeleteGroupButton(g.key, g.name, g.file_count));
  tags.appendChild(actions);

  body.appendChild(name);
  body.appendChild(meta);
  body.appendChild(tags);

  card.appendChild(thumb);
  card.appendChild(body);

  card.addEventListener("click", () => {
    if (selectionMode) {
      toggleSelection("group", g.key, g.name);
      card.querySelector(".select-checkbox")?.classList.toggle("checked", isSelected("group", g.key));
      return;
    }
    onClick ? onClick(g) : openModal(g);
  });

  return card;
}

// ---------------------------------------------------------------------------
// Kompakte Listenansicht (Alternative zur Kachel-/3D-Ansicht, ohne Bilder)
// ---------------------------------------------------------------------------

function buildGroupListRow(g, onClick) {
  const row = document.createElement("div");
  row.className = "list-row";
  row.dataset.key = g.key;

  const stlCount = g.files.filter((f) => f.ext === "stl").length;
  const mfCount = g.files.filter((f) => f.ext === "3mf").length;
  const f3dCount = g.files.filter((f) => f.ext === "f3d").length;

  const info = document.createElement("div");
  info.className = "list-row-info";
  const name = document.createElement("div");
  name.className = "list-row-name";
  name.textContent = g.name;
  info.appendChild(name);

  const tags = document.createElement("div");
  tags.className = "list-row-tags";
  if (stlCount) tags.innerHTML += `<span class="card-tag"><span class="dot dot-stl"></span>STL ${stlCount}</span>`;
  if (mfCount) tags.innerHTML += `<span class="card-tag"><span class="dot dot-3mf"></span>3MF ${mfCount}</span>`;
  if (f3dCount) tags.innerHTML += `<span class="card-tag"><span class="dot dot-f3d"></span>F3D ${f3dCount}</span>`;
  if (g.print_time_h) tags.innerHTML += `<span class="card-tag" title="${escapeHtml(t("est_print_time_title"))}">⏱ ${escapeHtml(g.print_time_h)}</span>`;
  if (g.files.some((f) => (f.dup_count || 0) > 1)) {
    tags.innerHTML += `<span class="card-tag dup-tag" title="${escapeHtml(t("dup_group_tooltip"))}">⧉</span>`;
  }
  for (const tagText of (projectTags.get(g.key) || [])) {
    tags.innerHTML += `<span class="card-tag tag-chip-mini">${escapeHtml(tagText)}</span>`;
  }

  const fileWord = g.file_count === 1 ? t("file_word") : t("files_word");
  const count = document.createElement("div");
  count.className = "list-row-meta";
  count.textContent = `${nf(g.file_count)} ${fileWord}`;

  const size = document.createElement("div");
  size.className = "list-row-meta";
  size.textContent = formatSizeDE(g.total_size);

  const date = document.createElement("div");
  date.className = "list-row-meta list-row-date";
  date.textContent = formatDateDE(g.last_modified);

  const actions = document.createElement("div");
  actions.className = "list-row-actions";
  actions.appendChild(buildFavoriteButton("group", g.key, favoriteGroups.has(g.key)));
  if (g.files.length) {
    actions.appendChild(buildRevealButton(srcPath(g.files[0]), t("reveal_project_title")));
  }
  actions.appendChild(buildDownloadGroupButton(g.key));
  actions.appendChild(buildDeleteGroupButton(g.key, g.name, g.file_count));

  row.appendChild(buildSelectCheckbox("group", g.key, g.name));
  row.appendChild(info);
  row.appendChild(tags);
  row.appendChild(count);
  row.appendChild(size);
  row.appendChild(date);
  row.appendChild(actions);

  row.addEventListener("click", (e) => {
    if (e.target.closest(".fav-btn, .reveal-btn, .delete-btn, .download-btn, .select-checkbox")) return;
    if (selectionMode) {
      toggleSelection("group", g.key, g.name);
      row.querySelector(".select-checkbox")?.classList.toggle("checked", isSelected("group", g.key));
      return;
    }
    if (onClick) onClick(g);
    else openModal(g);
  });

  return row;
}

// ---------------------------------------------------------------------------
// Lazy STL-Rendering im Browser fuer Projekte ohne 3MF-/Bild-Thumbnail
// ---------------------------------------------------------------------------

let sharedRenderer = null;
function getRenderer() {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
    sharedRenderer.setSize(300, 300, false);
  }
  return sharedRenderer;
}

function pickPartsForRender(files) {
  const stlFiles = files.filter((f) => f.ext === "stl" && f.size <= MAX_SINGLE_FILE_BYTES);
  stlFiles.sort((a, b) => a.size - b.size);
  const chosen = [];
  let total = 0;
  for (const f of stlFiles) {
    if (chosen.length >= MAX_PARTS_TO_RENDER) break;
    if (total + f.size > MAX_TOTAL_RENDER_BYTES) continue;
    chosen.push(f);
    total += f.size;
  }
  return chosen;
}

async function renderStlThumbnail(group, targetEl, size = 300) {
  // Hinweis: Dies ist ein einmaliger statischer Render (ein Bild, kein
  // fortlaufender Loop) und bleibt daher auch bei deaktivierter
  // "3D-Live-Vorschau"-Einstellung erlaubt - diese schaltet nur den
  // interaktiven Popup-Viewer ab (siehe mountInteractiveViewer).
  const parts = pickPartsForRender(group.files);
  if (parts.length === 0) {
    const hasOversized = group.files.some((f) => f.ext === "stl" && f.size > MAX_SINGLE_FILE_BYTES);
    setThumbPlaceholder(
      targetEl,
      hasOversized ? `<div class="placeholder" style="font-size:26px;">📦 ${escapeHtml(t("too_large_short"))}</div>` : '<div class="placeholder">📦</div>'
    );
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(1, 1.5, 1);
  scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dir2.position.set(-1, -0.5, -1);
  scene.add(dir2);

  const loader = new STLLoader();
  const box = new THREE.Box3();
  let loadedAny = false;

  for (const part of parts) {
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(srcPath(part))}`);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const geometry = loader.parse(buf);
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, neutralMaterial());
      scene.add(mesh);
      geometry.computeBoundingBox();
      box.union(geometry.boundingBox);
      loadedAny = true;
    } catch (e) {
      // Einzelne defekte Datei ignorieren, Rest weiter versuchen
    }
  }

  if (!loadedAny) {
    setThumbPlaceholder(targetEl, '<div class="placeholder">📦</div>');
    return null;
  }

  const center = new THREE.Vector3();
  box.getCenter(center);
  const sizeVec = new THREE.Vector3();
  box.getSize(sizeVec);
  const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z) || 1;

  scene.children.forEach((obj) => {
    if (obj.isMesh) obj.position.sub(center);
  });

  const dist = maxDim * 1.8;
  camera.position.set(dist * 0.6, dist * 0.55, dist * 0.9);
  camera.lookAt(0, 0, 0);
  camera.near = maxDim / 100;
  camera.far = maxDim * 20;
  camera.updateProjectionMatrix();

  const renderer = getRenderer();
  renderer.setSize(size, size, false);
  renderer.setClearColor(0x000000, 0);
  renderer.render(scene, camera);

  const dataUrl = renderer.domElement.toDataURL("image/png");

  scene.traverse((obj) => {
    if (obj.isMesh) {
      obj.geometry.dispose();
      obj.material.dispose();
    }
  });

  const img = document.createElement("img");
  img.src = dataUrl;
  img.alt = group.name;
  replaceThumbContent(targetEl, img);
  return dataUrl;
}

// Fallback fuer 3MF-Dateien ohne eingebettetes Slicer-Vorschaubild (z.B.
// Exporte aus KI-Tools wie Meshy, die nicht in Bambu Studio/PrusaSlicer
// gesliced wurden) - rendert die Geometrie stattdessen live, genau wie bei
// STL. Nutzt den vorhandenen Bambu-faehigen 3MF-Parser (parse3MFGroup).
async function render3mfThumbnail(files, altName, targetEl, size = 300) {
  // Hinweis: einmaliger statischer Render, siehe renderStlThumbnail oben -
  // bleibt bei deaktivierter "3D-Live-Vorschau" erlaubt.
  const mfFile = files.find((f) => f.ext === "3mf");
  if (!mfFile) {
    setThumbPlaceholder(targetEl, '<div class="placeholder">📦</div>');
    return null;
  }
  if (mfFile.size > MAX_SINGLE_FILE_BYTES) {
    setThumbPlaceholder(targetEl, `<div class="placeholder" style="font-size:26px;">📦 ${escapeHtml(t("too_large_short"))}</div>`);
    return null;
  }

  try {
    const res = await fetch(`/api/file?path=${encodeURIComponent(srcPath(mfFile))}`);
    if (!res.ok) throw new Error("Datei nicht abrufbar");
    const buf = await res.arrayBuffer();
    const modelGroup = await parse3MFGroup(buf);
    if (!modelGroup.children.length) throw new Error("Keine Geometrie im 3MF gefunden");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100000);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(1, 1.5, 1);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dir2.position.set(-1, -0.5, -1);
    scene.add(dir2);
    scene.add(modelGroup);

    const box = new THREE.Box3().setFromObject(modelGroup);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const sizeVec = new THREE.Vector3();
    box.getSize(sizeVec);
    const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z) || 1;
    modelGroup.position.sub(center);

    const dist = maxDim * 1.8;
    camera.position.set(dist * 0.6, dist * 0.55, dist * 0.9);
    camera.lookAt(0, 0, 0);
    camera.near = maxDim / 100;
    camera.far = maxDim * 20;
    camera.updateProjectionMatrix();

    const renderer = getRenderer();
    renderer.setSize(size, size, false);
    renderer.setClearColor(0x000000, 0);
    renderer.render(scene, camera);

    const dataUrl = renderer.domElement.toDataURL("image/png");

    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else if (obj.material) obj.material.dispose();
      }
    });

    if (!targetEl.isConnected) return dataUrl;
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = altName;
    replaceThumbContent(targetEl, img);
    return dataUrl;
  } catch (e) {
    if (targetEl.isConnected) setThumbPlaceholder(targetEl, '<div class="placeholder">📦</div>');
    return null;
  }
}

let io = null;
function observeRenderTargets() {
  if (io) io.disconnect();
  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const thumb = entry.target;
        if (thumb.dataset.pendingRender === "1" && !thumb.dataset.rendered) {
          thumb.dataset.rendered = "1";
          const card = thumb.closest(".card");
          const g = allGroups.find((gr) => gr.key === card.dataset.key);
          if (g && card.dataset.filePath) {
            const f = g.files.find((fl) => fl.path === card.dataset.filePath);
            if (f) renderStlThumbnail({ name: f.name, files: [f] }, thumb, 260);
          } else if (g) {
            renderStlThumbnail(g, thumb, 300);
          }
        }
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "300px" }
  );
  document.querySelectorAll('.card-thumb[data-pending-render="1"]').forEach((el) => io.observe(el));
}

// ---------------------------------------------------------------------------
// Eigener, schlanker 3MF-Parser
// ---------------------------------------------------------------------------
// three.js liefert zwar einen 3MFLoader mit, der kommt aber mit der von
// Bambu Studio genutzten "Production Extension" nicht zurecht: dort liegt
// jedes Bauteil in einer eigenen Datei (3D/Objects/object_N.model) und wird
// nur ueber ein "p:path"-Attribut referenziert, das der mitgelieferte Loader
// komplett ignoriert - das fuehrt bei fast allen hier gescannten 3MF-Dateien
// zu einem Absturz beim Parsen. Der folgende Parser loest genau das auf:
// er liest Build-Items -> Objekte -> (falls vorhanden) verlinkte Bauteil-
// Dateien rekursiv auf und baut daraus eine reine Formvorschau (ohne
// Farb-/Material-Feinheiten, die braucht man zum Drehen/Ansehen nicht).

const xmlParser = new DOMParser();

function parse3mfTransform(str) {
  const m = new THREE.Matrix4();
  if (!str) return m;
  const t = str.trim().split(/\s+/).map(Number);
  if (t.length !== 12 || t.some((n) => Number.isNaN(n))) return m;
  m.set(
    t[0], t[3], t[6], t[9],
    t[1], t[4], t[7], t[10],
    t[2], t[5], t[8], t[11],
    0, 0, 0, 1
  );
  return m;
}

function geometryFromObjectNode(objNode) {
  const meshNode = objNode.querySelector("mesh");
  if (!meshNode) return null;
  const vertexNodes = meshNode.querySelectorAll("vertices > vertex");
  if (!vertexNodes.length) return null;
  const positions = new Float32Array(vertexNodes.length * 3);
  vertexNodes.forEach((v, i) => {
    positions[i * 3] = parseFloat(v.getAttribute("x")) || 0;
    positions[i * 3 + 1] = parseFloat(v.getAttribute("y")) || 0;
    positions[i * 3 + 2] = parseFloat(v.getAttribute("z")) || 0;
  });
  const triNodes = meshNode.querySelectorAll("triangles > triangle");
  const index = new Uint32Array(triNodes.length * 3);
  triNodes.forEach((tr, i) => {
    index[i * 3] = parseInt(tr.getAttribute("v1"), 10) || 0;
    index[i * 3 + 1] = parseInt(tr.getAttribute("v2"), 10) || 0;
    index[i * 3 + 2] = parseInt(tr.getAttribute("v3"), 10) || 0;
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  return geometry;
}

function hexToThreeColor(hex) {
  if (!hex || typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 8) h = h.slice(0, 6); // RRGGBBAA -> RRGGBB
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return new THREE.Color(parseInt(h, 16));
}

async function parse3MFGroup(buffer) {
  const zip = unzipSync(new Uint8Array(buffer));
  const decoder = new TextDecoder();
  const xmlCache = new Map();

  function getXml(path) {
    const clean = path.startsWith("/") ? path.slice(1) : path;
    if (xmlCache.has(clean)) return xmlCache.get(clean);
    const data = zip[clean];
    const xml = data ? xmlParser.parseFromString(decoder.decode(data), "application/xml") : null;
    xmlCache.set(clean, xml);
    return xml;
  }

  function getText(path) {
    const clean = path.startsWith("/") ? path.slice(1) : path;
    const data = zip[clean];
    return data ? decoder.decode(data) : null;
  }

  // Bambu-Studio-Farben: Metadata/model_settings.config verknuepft jede
  // Build-Item-Objekt-Id mit einer Extruder-Nummer, Metadata/project_settings
  // .config (JSON) listet die Filament-Farbe je Extruder. Beides ist
  // proprietaer und existiert nur bei Bambu-Studio-Exporten - wenn eine der
  // beiden Dateien fehlt oder unerwartet aussieht, bleibt es einfach beim
  // hellgrauen Standard (kein Fehler).
  const objectColors = new Map(); // objectId (string) -> THREE.Color
  try {
    const settingsXml = getXml("Metadata/model_settings.config");
    const projectText = getText("Metadata/project_settings.config");
    if (settingsXml && projectText) {
      const project = JSON.parse(projectText);
      const colours = project.filament_colour || project.filament_colours;
      if (Array.isArray(colours)) {
        settingsXml.querySelectorAll("object").forEach((objEl) => {
          const objId = objEl.getAttribute("id");
          const extruderMeta = objEl.querySelector('metadata[key="extruder"]');
          if (!objId || !extruderMeta) return;
          const idx = parseInt(extruderMeta.getAttribute("value"), 10) - 1;
          const color = hexToThreeColor(colours[idx]);
          if (color) objectColors.set(objId, color);
        });
      }
    }
  } catch (e) {
    // Kein Bambu-Projekt / unerwartetes Format - ohne Farbzuordnung weiter
  }

  function resolveObject(filePath, objectId, depth, material) {
    if (depth > 10 || !objectId) return null;
    const xml = getXml(filePath);
    if (!xml) return null;
    const objNode = xml.querySelector(`object[id="${objectId}"]`);
    if (!objNode) return null;

    const geometry = geometryFromObjectNode(objNode);
    if (geometry) {
      const group = new THREE.Group();
      group.add(new THREE.Mesh(geometry, material));
      return group;
    }

    const componentNodes = objNode.querySelectorAll("components > component");
    if (componentNodes.length) {
      const group = new THREE.Group();
      componentNodes.forEach((c) => {
        const path = c.getAttribute("p:path") || c.getAttribute("path") || filePath;
        const cid = c.getAttribute("objectid");
        const sub = resolveObject(path, cid, depth + 1, material);
        if (sub) {
          sub.applyMatrix4(parse3mfTransform(c.getAttribute("transform")));
          group.add(sub);
        }
      });
      return group.children.length ? group : null;
    }
    return null;
  }

  const rootPath = "3D/3dmodel.model";
  const rootXml = getXml(rootPath);
  if (!rootXml) throw new Error("Kein 3D/3dmodel.model im 3MF gefunden");

  const sceneGroup = new THREE.Group();
  const items = rootXml.querySelectorAll("build > item");
  items.forEach((item) => {
    const objId = item.getAttribute("objectid");
    const color = objectColors.get(objId);
    const material = new THREE.MeshStandardMaterial({
      color: color || UNCOLORED_HEX,
      metalness: 0.05,
      roughness: 0.7,
    });
    const obj = resolveObject(rootPath, objId, 0, material);
    if (obj) {
      obj.applyMatrix4(parse3mfTransform(item.getAttribute("transform")));
      sceneGroup.add(obj);
    }
  });

  return sceneGroup;
}

// ---------------------------------------------------------------------------
// Interaktiver 3D-Viewer (Modal) - frei drehbar per Maus, ueber OrbitControls
// ---------------------------------------------------------------------------

let activeViewer = null;

function disposeActiveViewer() {
  if (activeViewer && activeViewer.cleanup) {
    activeViewer.cleanup();
  }
  activeViewer = null;
}

async function mountInteractiveViewer(container, group, source, specificFile = null) {
  // Zentrale Absicherung: egal von wo aus mountInteractiveViewer aufgerufen
  // wird, bei deaktivierter "3D-Live-Vorschau"-Einstellung startet niemals
  // der interaktive Live-Viewer, sondern nur ein statischer Hinweis.
  if (!render3dEnabled) {
    disposeActiveViewer();
    container.innerHTML = `
      <div class="placeholder-note">
        <div class="placeholder" style="font-size:56px;">📦</div>
        <div class="placeholder-text">3D-Live-Vorschau ist in den Einstellungen deaktiviert.</div>
      </div>`;
    return;
  }
  disposeActiveViewer();
  container.innerHTML = '<div class="placeholder">⏳</div>';

  const width = container.clientWidth || 900;
  const height = container.clientHeight || 500;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100000);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(1, 1.5, 1);
  scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
  dir2.position.set(-1, -0.6, -1);
  scene.add(dir2);

  const modelGroup = new THREE.Group();
  scene.add(modelGroup);
  let loadedAny = false;

  let tooLarge = false;

  if (source === "3mf") {
    const mf = specificFile || group.files.find((f) => f.ext === "3mf");
    if (mf) {
      try {
        const res = await fetch(`/api/file?path=${encodeURIComponent(srcPath(mf))}`);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const obj = await parse3MFGroup(buf);
          modelGroup.add(obj);
          loadedAny = obj.children.length > 0;
        }
      } catch (e) {
        console.error("3MF-Parsing fehlgeschlagen:", e);
        // Fehler -> unten Hinweis anzeigen
      }
    }
  } else {
    let parts;
    if (specificFile) {
      if (specificFile.size <= MAX_SINGLE_FILE_BYTES) {
        parts = [specificFile];
      } else {
        parts = [];
        tooLarge = true;
      }
    } else {
      parts = pickPartsForRender(group.files);
    }
    const loader = new STLLoader();
    for (const part of parts) {
      try {
        const res = await fetch(`/api/file?path=${encodeURIComponent(srcPath(part))}`);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        const geometry = loader.parse(buf);
        geometry.computeVertexNormals();
        modelGroup.add(new THREE.Mesh(geometry, neutralMaterial()));
        loadedAny = true;
      } catch (e) {
        // einzelne defekte Datei ignorieren, Rest weiter versuchen
      }
    }
  }

  // Falls das Modal inzwischen geschlossen / ein anderes Projekt geoeffnet wurde
  if (!container.isConnected) return;

  if (!loadedAny) {
    container.innerHTML = tooLarge
      ? `<div class="placeholder">📦 ${escapeHtml(t("file_too_large"))}</div>`
      : `<div class="placeholder">📦 ${escapeHtml(t("no_3d_view_possible"))}</div>`;
    return;
  }

  const box = new THREE.Box3().setFromObject(modelGroup);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const sizeVec = new THREE.Vector3();
  box.getSize(sizeVec);
  const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z) || 1;
  modelGroup.position.sub(center);

  const dist = maxDim * 1.9;
  camera.position.set(dist * 0.6, dist * 0.55, dist * 0.9);
  camera.near = maxDim / 200;
  camera.far = maxDim * 30;
  camera.updateProjectionMatrix();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  const hint = document.createElement("div");
  hint.className = "viewer-hint";
  hint.textContent = t("viewer_hint");
  container.appendChild(hint);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = maxDim * 0.3;
  controls.maxDistance = maxDim * 6;
  controls.update();

  let raf = null;
  function animate() {
    raf = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    const w = container.clientWidth || width;
    const h = container.clientHeight || height;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", onResize);

  activeViewer = {
    cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else if (obj.material) obj.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
}

// ---------------------------------------------------------------------------
// Detail-Modal
// ---------------------------------------------------------------------------

function openModal(g) {
  disposeActiveViewer();
  currentModalGroup = g;
  modalContent.innerHTML = "";

  const header = document.createElement("div");
  header.className = "modal-header";
  const h2 = document.createElement("h2");
  h2.textContent = g.name;
  header.appendChild(h2);
  const headerActions = document.createElement("div");
  headerActions.className = "modal-header-actions";
  headerActions.appendChild(buildFavoriteButton("group", g.key, favoriteGroups.has(g.key)));
  headerActions.appendChild(buildDownloadGroupButton(g.key, t("download_project_title")));
  headerActions.appendChild(
    buildDeleteGroupButton(g.key, g.name, g.file_count, closeProjectModal)
  );
  header.appendChild(headerActions);
  modalContent.appendChild(header);

  if (g.print_time_h || g.filament_g) {
    const stats = document.createElement("div");
    stats.className = "modal-print-stats";
    if (g.print_time_h) stats.innerHTML += `<span>⏱ ${escapeHtml(g.print_time_h)} ${escapeHtml(t("est_print_time_title"))}</span>`;
    if (g.filament_g) stats.innerHTML += `<span>🧵 ${nf(g.filament_g)}g ${escapeHtml(t("filament_label"))}</span>`;
    modalContent.appendChild(stats);
  }

  if (g.sources.length > 1 || g.sources[0] !== g.name) {
    const src = document.createElement("div");
    src.className = "sources";
    src.textContent = t("contains_label") + g.sources.join("  •  ");
    modalContent.appendChild(src);
  }

  const thumbWrap = document.createElement("div");
  thumbWrap.className = "modal-thumb";
  modalContent.appendChild(thumbWrap);

  // Der interaktive Popup-Viewer (mountInteractiveViewer) respektiert die
  // "3D-Live-Vorschau"-Einstellung und startet bei Deaktivierung nie. Die
  // einmaligen statischen Renderer (renderStlThumbnail/render3mfThumbnail)
  // sind davon unberuehrt und dienen bei Deaktivierung als Ersatzbild, damit
  // weiterhin ein Bild des Objekts zu sehen ist - nur eben nicht drehbar.
  const canInteract3D = render3dEnabled && (g.has_stl || g.has_3mf);
  const hasStaticThumb = g.thumbnail_type === "3mf" || g.thumbnail_type === "image" || g.thumbnail_type === "f3d";
  const canStaticRender3D = g.has_stl || g.has_3mf;

  let activeTreeRow = null;
  function clearTreeActiveRow() {
    if (activeTreeRow) {
      activeTreeRow.classList.remove("tree-file-active");
      activeTreeRow = null;
    }
  }

  function showF3dFallback() {
    clearTreeActiveRow();
    thumbWrap.innerHTML = `
      <div class="placeholder-note">
        <div class="placeholder" style="font-size:56px;">📐</div>
        <div class="placeholder-text">${t("f3d_no_preview")}</div>
      </div>`;
  }

  // Einmaliger statischer Render der Projekt-Geometrie - Ersatzbild, wenn
  // "3D-Live-Vorschau" deaktiviert ist (oder wenn kein eingebettetes
  // Slicer-Vorschaubild existiert).
  function showStaticRender3D() {
    clearTreeActiveRow();
    disposeActiveViewer();
    thumbWrap.innerHTML = '<div class="placeholder">⏳</div>';
    const renderPromise = g.has_3mf
      ? render3mfThumbnail(g.files, g.name, thumbWrap, 480)
      : renderStlThumbnail(g, thumbWrap, 480);
    renderPromise.then(() => {
      if (thumbWrap.isConnected && canInteract3D) {
        thumbWrap.appendChild(buildViewerToggle(t("view_in_3d"), showViewer));
      }
    });
  }

  function showStaticThumb() {
    clearTreeActiveRow();
    disposeActiveViewer();
    thumbWrap.innerHTML = "";
    const img = document.createElement("img");
    img.src = g.thumbnail_url;
    img.onerror = () => {
      if (g.thumbnail_type === "f3d") showF3dFallback();
      else if (canStaticRender3D) showStaticRender3D();
      else thumbWrap.innerHTML = '<div class="placeholder" style="font-size:64px;">📦</div>';
    };
    thumbWrap.appendChild(img);
    if (canInteract3D) thumbWrap.appendChild(buildViewerToggle(t("view_in_3d"), showViewer));
  }

  function showViewer() {
    clearTreeActiveRow();
    mountInteractiveViewer(thumbWrap, g, g.has_stl ? "stl" : "3mf").then(() => {
      if (hasStaticThumb && thumbWrap.isConnected) {
        thumbWrap.appendChild(buildViewerToggle(t("view_static_image"), showStaticThumb));
      }
    });
  }

  function backToOverview() {
    if (canInteract3D) showViewer();
    else if (hasStaticThumb) showStaticThumb();
    else if (canStaticRender3D) showStaticRender3D();
    else if (g.has_f3d) showF3dFallback();
    else {
      clearTreeActiveRow();
      thumbWrap.innerHTML = '<div class="placeholder" style="font-size:64px;">📦</div>';
    }
  }

  function showFileViewer(file, rowEl) {
    if (activeTreeRow && activeTreeRow !== rowEl) activeTreeRow.classList.remove("tree-file-active");
    if (rowEl) {
      rowEl.classList.add("tree-file-active");
      activeTreeRow = rowEl;
    }

    if (file.ext === "f3d") {
      disposeActiveViewer();
      thumbWrap.innerHTML = "";
      const img = document.createElement("img");
      img.src = `/api/file-thumbnail?path=${encodeURIComponent(srcPath(file))}`;
      img.alt = file.name;
      img.onerror = () => {
        thumbWrap.innerHTML = `
          <div class="placeholder-note">
            <div class="placeholder" style="font-size:56px;">📐</div>
            <div class="placeholder-text">${escapeHtml(file.name)}<br>${t("f3d_no_preview_short")}</div>
          </div>`;
        thumbWrap.appendChild(buildViewerToggle(t("back_to_project"), backToOverview));
      };
      thumbWrap.appendChild(img);
      thumbWrap.appendChild(buildViewerToggle(t("back_to_project"), backToOverview));
      return;
    }

    if (!render3dEnabled) {
      // Interaktiver Viewer ist deaktiviert - stattdessen einmaligen
      // statischen Render nur dieser angeklickten Datei anzeigen.
      disposeActiveViewer();
      thumbWrap.innerHTML = '<div class="placeholder">⏳</div>';
      const renderPromise =
        file.ext === "3mf"
          ? render3mfThumbnail([file], file.name, thumbWrap, 480)
          : renderStlThumbnail({ name: file.name, files: [file] }, thumbWrap, 480);
      renderPromise.then(() => {
        if (thumbWrap.isConnected) {
          thumbWrap.appendChild(buildViewerToggle(t("back_to_project"), backToOverview));
        }
      });
      return;
    }

    mountInteractiveViewer(thumbWrap, g, file.ext, file).then(() => {
      if (thumbWrap.isConnected) {
        thumbWrap.appendChild(buildViewerToggle(t("back_to_project"), backToOverview));
      }
    });
  }

  backToOverview();

  const treeHeading = document.createElement("div");
  treeHeading.className = "tree-heading";
  treeHeading.textContent = t("tree_heading");
  modalContent.appendChild(treeHeading);
  modalContent.appendChild(buildFileTreeView(g.files, showFileViewer, closeProjectModal));

  modalContent.appendChild(buildTagsSection(g.key));
  modalContent.appendChild(buildNotesSection(g.key));

  modalBackdrop.style.display = "flex";
}

// Eigene Tags/Kategorien je Projekt - Chip-Editor mit Texteingabe (Enter
// oder Komma fuegt einen Tag hinzu, Klick auf ein Chip entfernt es wieder).
// Speichert nach jeder Aenderung sofort auf dem Server.
function buildTagsSection(key) {
  const wrap = document.createElement("div");
  wrap.className = "tags-section";

  const heading = document.createElement("div");
  heading.className = "tree-heading";
  heading.textContent = t("tags_heading");
  wrap.appendChild(heading);

  const chipsRow = document.createElement("div");
  chipsRow.className = "tags-chips-row";
  wrap.appendChild(chipsRow);

  const input = document.createElement("input");
  input.type = "text";
  input.className = "tags-input";
  input.placeholder = t("tags_placeholder");
  input.maxLength = MAX_TAG_LENGTH_JS;
  input.autocomplete = "off";
  wrap.appendChild(input);

  let currentTags = (projectTags.get(key) || []).slice();

  async function persist() {
    const saved = await saveTags(key, currentTags);
    if (saved !== null) {
      currentTags = saved;
      loadAllTagsFilterOptions();
    }
    renderChips();
  }

  function renderChips() {
    chipsRow.innerHTML = "";
    for (const tag of currentTags) {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.textContent = tag;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "tag-chip-remove";
      remove.title = t("tags_remove_title");
      remove.textContent = "✕";
      remove.addEventListener("click", () => {
        currentTags = currentTags.filter((tg) => tg !== tag);
        persist();
      });
      chip.appendChild(remove);
      chipsRow.appendChild(chip);
    }
  }
  renderChips();

  function addFromInput() {
    const raw = input.value.split(",");
    let changed = false;
    for (let part of raw) {
      part = part.trim();
      if (!part) continue;
      if (currentTags.some((tg) => tg.toLowerCase() === part.toLowerCase())) continue;
      if (currentTags.length >= MAX_TAGS_PER_ITEM_JS) break;
      currentTags.push(part);
      changed = true;
    }
    input.value = "";
    if (changed) persist();
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addFromInput();
    }
  });
  input.addEventListener("blur", () => {
    if (input.value.trim()) addFromInput();
  });

  return wrap;
}

// Notizfeld je Projekt (z.B. Druckeinstellungen, die beim letzten Mal
// geklappt haben) - speichert automatisch beim Verlassen des Feldes.
function buildNotesSection(key) {
  const wrap = document.createElement("div");
  wrap.className = "notes-section";

  const heading = document.createElement("div");
  heading.className = "tree-heading";
  heading.textContent = t("notes_heading");
  wrap.appendChild(heading);

  const textarea = document.createElement("textarea");
  textarea.className = "notes-textarea";
  textarea.placeholder = t("notes_placeholder");
  textarea.maxLength = 4000;
  textarea.value = projectNotes.get(key) || "";
  wrap.appendChild(textarea);

  const status = document.createElement("div");
  status.className = "notes-status";
  wrap.appendChild(status);

  let lastSaved = textarea.value;
  textarea.addEventListener("blur", async () => {
    if (textarea.value === lastSaved) return;
    status.textContent = t("notes_saving");
    const ok = await saveNote(key, textarea.value);
    lastSaved = textarea.value;
    status.textContent = ok ? t("notes_saved") : t("notes_save_failed");
    if (ok) setTimeout(() => { if (status.textContent === t("notes_saved")) status.textContent = ""; }, 2000);
  });

  return wrap;
}

function closeProjectModal() {
  disposeActiveViewer();
  modalBackdrop.style.display = "none";
  currentModalGroup = null;
}
modalClose.addEventListener("click", closeProjectModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeProjectModal();
});

// ---------------------------------------------------------------------------
// Tastatur-Shortcuts: Esc schließt Popups, "/" fokussiert die Suche, die
// Pfeiltasten blättern im geöffneten Projekt-Popup zum vorherigen/nächsten
// Projekt (bezogen auf die aktuell gefilterte/sortierte Liste).
// ---------------------------------------------------------------------------
document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);

  if (e.key === "Escape") {
    if (menuModalBackdrop.style.display !== "none") {
      closeMenuModal();
      return;
    }
    if (libraryModalBackdrop.style.display !== "none") {
      closeLibraryModal();
      return;
    }
    if (trashModalBackdrop && trashModalBackdrop.style.display !== "none") {
      closeTrashModal();
      return;
    }
    if (modalBackdrop.style.display !== "none") {
      closeProjectModal();
      return;
    }
    if (selectionMode) {
      setSelectionMode(false);
      return;
    }
    if (typing) e.target.blur();
    return;
  }

  if (typing) return;

  if (e.key === "/") {
    e.preventDefault();
    searchEl.focus();
    return;
  }

  if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && modalBackdrop.style.display !== "none" && currentModalGroup) {
    const list = applyGroupFilters();
    const idx = list.findIndex((x) => x.key === currentModalGroup.key);
    if (idx === -1) return;
    const nextIdx = e.key === "ArrowRight" ? idx + 1 : idx - 1;
    if (nextIdx >= 0 && nextIdx < list.length) {
      e.preventDefault();
      openModal(list[nextIdx]);
    }
  }
});

searchEl.addEventListener("input", () => {
  // Aenderung der Suche kann den Ordner-Browser aktivieren/deaktivieren
  // (siehe folderModeActive in render()) - ein zuvor gemerkter Ordnerpfad
  // waere dann u.U. nicht mehr aussagekraeftig, deshalb zuruecksetzen.
  filesFolderPath = [];
  render();
});
sortEl.addEventListener("change", () => {
  syncSortPillActive();
  render();
});
refreshBtn.addEventListener("click", () => loadData(true));

// Hebt den "Zuletzt gedruckt"-Pill hervor, wenn genau dieser Sortiermodus im
// Dropdown aktiv ist - egal ob er ueber den Pill selbst oder direkt ueber
// das Dropdown ausgewaehlt wurde.
function syncSortPillActive() {
  filterPillsEl.querySelectorAll(".pill[data-sort]").forEach((p) => {
    p.classList.toggle("active", p.dataset.sort === sortEl.value);
  });
}

function setFilterType(type, opts = {}) {
  if (type !== activeType) filesFolderPath = [];
  activeType = type;
  filterPillsEl.querySelectorAll(".pill").forEach((p) => p.classList.toggle("active", p.dataset.filter === type));
  updateStatBoxesActive();
  // Im Duplikate-Filter wird die Sortierung immer nach Duplikat-Gruppen
  // erzwungen (siehe flattenFiles()) - das Sortier-Dropdown waere dann
  // wirkungslos, deshalb waehrenddessen deaktivieren statt es wirkungslos
  // anklickbar zu lassen.
  sortEl.disabled = type === "duplicate";
  sortEl.title = type === "duplicate" ? t("sort_disabled_dup_title") : "";
  if (!opts.skipRender) render();
}

filterPillsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".pill");
  if (!btn) return;

  // Der "Zuletzt gedruckt"-Pill ist ein Sortier-Shortcut (kein Filter wie
  // Favoriten/Duplikate) - er blendet nichts aus, sondern ordnet die
  // vorhandenen Kacheln nur neu an.
  if (btn.dataset.sort) {
    const mode = btn.dataset.sort;
    const turningOn = sortEl.value !== mode;
    if (turningOn && activeType === "duplicate") setFilterType("all", { skipRender: true });
    sortEl.value = turningOn ? mode : "name";
    syncSortPillActive();
    render();
    return;
  }

  const type = btn.dataset.filter;
  const turningOn = activeType !== type;
  // Duplikate sind ein Datei-Konzept (zwei Projekte mit unterschiedlichem
  // Namen koennen dieselbe Datei enthalten) - beim Aktivieren des Filters
  // deshalb automatisch in die Dateien-Ansicht wechseln, wo die Duplikate
  // direkt nebeneinander sortiert werden (siehe flattenFiles()). Die
  // erzwungene Duplikat-Sortierung wuerde einen aktiven "Zuletzt gedruckt"-
  // Sortiermodus ueberdecken - deshalb dessen Hervorhebung dabei zuruecksetzen.
  if (turningOn && type === "duplicate") {
    if (activeTab !== "files") switchTab("files", { skipRender: true });
    sortEl.value = "name";
    syncSortPillActive();
  }
  setFilterType(turningOn ? type : "all");
});

function switchTab(tab, opts = {}) {
  if (tab !== activeTab) filesFolderPath = [];
  activeTab = tab;
  updateStatBoxesActive();
  if (!opts.skipRender) render();
}

// viewMode (3D-Kachel-Ansicht <-> kompakte Listenansicht) ist bewusst
// unabhaengig von Quelle/Ordner - bleibt beim Wechsel zwischen Ordnern bzw.
// "Alle" erhalten, damit die Auswahl "wieder bei jedem Ordner funktioniert".
function setViewMode(mode) {
  if (mode === viewMode) return;
  viewMode = mode;
  viewToggleEl.querySelectorAll(".view-toggle-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === mode));
  render();
}
viewToggleEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".view-toggle-btn");
  if (!btn) return;
  setViewMode(btn.dataset.view);
});

statsEl.addEventListener("click", (e) => {
  const box = e.target.closest(".stat-box[data-filter]");
  if (!box) return;
  const f = box.dataset.filter;
  if (f === "projects") {
    switchTab("projects", { skipRender: true });
    setFilterType("all");
  } else if (f === "files") {
    switchTab("files", { skipRender: true });
    setFilterType("all");
  } else {
    setFilterType(f);
  }
});

// ---------------------------------------------------------------------------
// "Bibliothek verwalten"-Popup (Ordner + Dateitypen)
// ---------------------------------------------------------------------------

async function loadKnownFiletypes() {
  try {
    const res = await fetch("/api/known-filetypes");
    const data = await res.json();
    knownFiletypeCategories = data.categories || {};
  } catch (e) {
    knownFiletypeCategories = {};
  }
}

async function loadExcludes() {
  try {
    const res = await fetch("/api/excludes");
    const data = await res.json();
    libraryExcludes = { extensions: data.extensions || [], patterns: data.patterns || [] };
  } catch (e) {
    libraryExcludes = { extensions: [], patterns: [] };
  }
}

async function loadFiletypes() {
  try {
    const res = await fetch("/api/filetypes");
    const data = await res.json();
    libraryFiletypes = data.filetypes || [];
  } catch (e) {
    libraryFiletypes = [];
  }
}

// ---------------------------------------------------------------------------
// Farbschema (System/Hell/Dunkel) - siehe Menü-Popup oben links
// ---------------------------------------------------------------------------

const lightMediaQuery = window.matchMedia("(prefers-color-scheme: light)");

function resolveTheme(mode) {
  if (mode === "light" || mode === "dark") return mode;
  // "system": live anhand der Betriebssystem-Einstellung aufloesen, statt
  // die CSS-Variablen im Stylesheet zu duplizieren (siehe :root[data-theme]
  // in style.css) - reagiert dadurch auch auf einen OS-Themenwechsel,
  // waehrend die App bereits geoeffnet ist.
  return lightMediaQuery.matches ? "light" : "dark";
}

function applyTheme(mode) {
  currentTheme = mode;
  document.documentElement.setAttribute("data-theme", resolveTheme(mode));
  if (themeChoiceRow) {
    themeChoiceRow.querySelectorAll(".choice-btn").forEach((b) => b.classList.toggle("active", b.dataset.theme === mode));
  }
}

lightMediaQuery.addEventListener("change", () => {
  if (currentTheme === "system") applyTheme("system");
});

async function setThemeFlow(mode) {
  applyTheme(mode); // sofort anwenden, nicht auf die Server-Antwort warten
  try {
    await fetch(`/api/set-setting?key=theme&value=${encodeURIComponent(mode)}`);
  } catch (e) {
    // Darstellung bleibt trotzdem wie gewaehlt - kein Blocker fuers Umschalten
  }
}
if (themeChoiceRow) {
  themeChoiceRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".choice-btn");
    if (!btn) return;
    setThemeFlow(btn.dataset.theme);
  });
}

async function setLanguageFlow(lang) {
  currentLang = lang;
  if (langChoiceRow) {
    langChoiceRow.querySelectorAll(".choice-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
  }
  try {
    await fetch(`/api/set-setting?key=language&value=${encodeURIComponent(lang)}`);
  } catch (e) {
    // Sprache bleibt trotzdem umgeschaltet - kein Blocker
  }
  if (typeof applyTranslations === "function") applyTranslations();
}
if (langChoiceRow) {
  langChoiceRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".choice-btn");
    if (!btn) return;
    setLanguageFlow(btn.dataset.lang);
  });
}

function openMenuModal() {
  menuModalBackdrop.style.display = "flex";
}
function closeMenuModal() {
  menuModalBackdrop.style.display = "none";
}
if (menuBtn) {
  menuBtn.addEventListener("click", openMenuModal);
  menuModalClose.addEventListener("click", closeMenuModal);
  menuModalBackdrop.addEventListener("click", (e) => {
    if (e.target === menuModalBackdrop) closeMenuModal();
  });
}

async function loadSettings() {
  try {
    const res = await fetch("/api/settings");
    const data = await res.json();
    render3dEnabled = data.render3d !== false;
    currentTheme = data.theme || "system";
    currentLang = data.language || "de";
    defaultSlicerId = data.default_slicer || "";
  } catch (e) {
    render3dEnabled = true;
    currentTheme = "system";
    currentLang = "de";
    defaultSlicerId = "";
  }
  applyTheme(currentTheme);
  if (langChoiceRow) {
    langChoiceRow.querySelectorAll(".choice-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === currentLang));
  }
  if (typeof applyTranslations === "function") applyTranslations();
}

async function toggleRender3dFlow() {
  const previous = render3dEnabled;
  libRender3dToggle.disabled = true;
  try {
    const res = await fetch("/api/toggle-setting?key=render3d");
    const data = await res.json();
    if (!data.ok) throw new Error("toggle fehlgeschlagen");
    render3dEnabled = !!data.value;
  } catch (e) {
    render3dEnabled = previous;
  } finally {
    libRender3dToggle.checked = render3dEnabled;
    libRender3dToggle.disabled = false;
  }
  render();
}
if (libRender3dToggle) {
  libRender3dToggle.addEventListener("change", toggleRender3dFlow);
}

// Zeigt den Status der automatischen Sicherung im "Bibliothek verwalten"-
// Popup an (Knopf-Zustand + "Letzte Sicherung: ..."-Zeile) - laedt bei jedem
// Oeffnen des Popups neu, da die Sicherung im Hintergrund laufen kann.
async function loadAndRenderAutoBackupStatus() {
  if (!libAutoBackupToggle) return;
  try {
    const res = await fetch("/api/backup-status");
    const data = await res.json();
    libAutoBackupToggle.checked = !!data.enabled;
    if (autoBackupStatusEl) {
      autoBackupStatusEl.textContent = data.last_backup
        ? t("auto_backup_last", { date: formatDateTimeDE(data.last_backup) })
        : t("auto_backup_never");
    }
  } catch (e) {
    if (autoBackupStatusEl) autoBackupStatusEl.textContent = "";
  }
}

async function toggleAutoBackupFlow() {
  libAutoBackupToggle.disabled = true;
  try {
    await fetch("/api/toggle-setting?key=auto_backup");
  } catch (e) {
    // Status wird unten ohnehin frisch vom Server geladen
  }
  await loadAndRenderAutoBackupStatus();
  libAutoBackupToggle.disabled = false;
}
if (libAutoBackupToggle) {
  libAutoBackupToggle.addEventListener("change", toggleAutoBackupFlow);
}

// ---------------------------------------------------------------------------
// Update-Pruefung (siehe check_for_update() in app.py / /api/check-update).
// Oeffnet einen Download-Link im normalen System-Browser statt im
// App-Fenster selbst - dafuer nutzt sie window.pywebview.api.open_external
// (siehe WebviewAPI in app.py), falls die App als natives Fenster (.exe)
// laeuft. Ausserhalb davon (normaler Browser-Tab, z.B. beim Entwickeln)
// faellt sie einfach auf window.open() zurueck.
// ---------------------------------------------------------------------------

function openExternal(url) {
  if (window.pywebview && window.pywebview.api && window.pywebview.api.open_external) {
    window.pywebview.api.open_external(url);
  } else {
    window.open(url, "_blank");
  }
}

let lastUpdateCheckResult = null;

async function checkForUpdate(manual = false) {
  if (manual && updateCheckBtn) {
    updateCheckBtn.disabled = true;
    updateCheckBtn.textContent = t("update_checking");
  }
  try {
    const res = await fetch("/api/check-update");
    const data = await res.json();
    lastUpdateCheckResult = data;
    if (updateVersionTextEl) {
      updateVersionTextEl.textContent = t("update_version_label", { version: data.current_version || "?" });
    }
    if (headerVersionTextEl) {
      headerVersionTextEl.textContent = t("update_version_label", { version: data.current_version || "?" });
    }
    if (data.available && updateBannerEl && updateBannerTextEl) {
      updateBannerEl.style.display = "flex";
      updateBannerTextEl.textContent = t("update_available", { version: data.latest_version });
      updateDownloadBtn.onclick = () => openExternal(data.download_url);
    } else if (updateBannerEl) {
      updateBannerEl.style.display = "none";
    }
    // Zwei zusaetzliche, immer sichtbare Hinweise (kein Menue-Klick noetig):
    // ein kleiner Punkt am Menue-Knopf und ein Pill direkt im Kopfbereich.
    if (menuUpdateDotEl) menuUpdateDotEl.style.display = data.available ? "block" : "none";
    if (headerUpdatePillEl) {
      headerUpdatePillEl.style.display = data.available ? "inline-flex" : "none";
      headerUpdatePillEl.textContent = data.available ? t("update_pill_label", { version: data.latest_version }) : "";
    }
    if (manual && updateCheckBtn) {
      updateCheckBtn.textContent = data.available ? t("update_check_btn") : t("update_none_found");
    }
  } catch (e) {
    if (manual && updateCheckBtn) updateCheckBtn.textContent = t("update_check_failed");
  } finally {
    if (manual && updateCheckBtn) {
      updateCheckBtn.disabled = false;
      setTimeout(() => {
        if (updateCheckBtn) updateCheckBtn.textContent = t("update_check_btn");
      }, 2500);
    }
  }
}
if (updateCheckBtn) {
  updateCheckBtn.addEventListener("click", () => checkForUpdate(true));
}
if (headerUpdatePillEl) {
  headerUpdatePillEl.addEventListener("click", () => openMenuModal());
}

async function openLibraryModal() {
  libEditingExt = null;
  libraryModalBackdrop.style.display = "flex";
  if (libModalSaveHintEl) libModalSaveHintEl.textContent = "";
  await refreshLibraryModal();
  captureLibModalSnapshot();
}

function closeLibraryModal() {
  libraryModalBackdrop.style.display = "none";
}

// ---------------------------------------------------------------------------
// Papierkorb: gelöschte Dateien werden nicht sofort endgültig entfernt,
// sondern nach .trash/ verschoben und hier aufgelistet - mit der Möglichkeit,
// sie wiederherzustellen oder endgültig zu löschen. Wird nach 30 Tagen
// automatisch geleert (siehe TRASH_MAX_AGE_DAYS in app.py).
// ---------------------------------------------------------------------------

async function openTrashModal() {
  if (!trashModalBackdrop) return;
  trashModalBackdrop.style.display = "flex";
  if (trashModalHintEl) trashModalHintEl.textContent = "";
  await loadAndRenderTrash();
}

function closeTrashModal() {
  if (trashModalBackdrop) trashModalBackdrop.style.display = "none";
}

function formatTrashDate(ts) {
  try {
    return new Date(ts * 1000).toLocaleString(currentLang === "en" ? "en-US" : "de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
}

function trashDaysLeftText(deletedAt, maxAgeDays) {
  const expiresAt = deletedAt + maxAgeDays * 86400;
  const daysLeft = Math.ceil((expiresAt - Date.now() / 1000) / 86400);
  if (daysLeft <= 0) return t("trash_expires_today");
  if (daysLeft === 1) return t("trash_days_left_one");
  return t("trash_days_left", { n: daysLeft });
}

let trashItemsCache = [];

async function loadAndRenderTrash() {
  if (!trashListEl) return;
  trashListEl.innerHTML = `<div class="lib-row-sub">${escapeHtml(t("loading_initial"))}</div>`;
  try {
    const res = await fetch("/api/trash-list");
    const data = await res.json();
    trashItemsCache = data.items || [];
    renderTrashList(trashItemsCache, data.max_age_days || 30);
    updateTrashBadge(trashItemsCache.length);
  } catch (e) {
    trashListEl.innerHTML = `<div class="lib-row-sub">${escapeHtml(t("trash_load_failed"))}</div>`;
  }
}

function updateTrashBadge(count) {
  if (!trashCountBadgeEl) return;
  if (count > 0) {
    trashCountBadgeEl.textContent = String(count);
    trashCountBadgeEl.style.display = "";
  } else {
    trashCountBadgeEl.style.display = "none";
  }
}

function renderTrashList(items, maxAgeDays) {
  trashListEl.innerHTML = "";
  if (!items.length) {
    trashEmptyStateEl.style.display = "";
    return;
  }
  trashEmptyStateEl.style.display = "none";

  for (const it of items) {
    const row = document.createElement("div");
    row.className = "lib-row trash-row";

    const info = document.createElement("div");
    info.className = "lib-row-info";
    const sub = `${escapeHtml(it.source_label || "")} · ${escapeHtml(t("trash_deleted_on", { date: formatTrashDate(it.deleted_at) }))} · ${escapeHtml(trashDaysLeftText(it.deleted_at, maxAgeDays))} · ${escapeHtml(formatSizeDE(it.size))}`;
    info.innerHTML = `<div class="lib-row-label">${escapeHtml(it.name)}</div><div class="lib-row-sub">${sub}</div>`;
    row.appendChild(info);

    const actions = document.createElement("div");
    actions.className = "trash-row-actions";

    const restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "trash-action-btn trash-restore-btn";
    restoreBtn.title = t("trash_restore_title");
    restoreBtn.innerHTML = "↩︎";
    restoreBtn.addEventListener("click", () => restoreTrashItemFlow(it.id, restoreBtn));
    actions.appendChild(restoreBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "trash-action-btn trash-delete-forever-btn";
    deleteBtn.title = t("trash_delete_forever_title");
    deleteBtn.innerHTML = TRASH_ICON_SVG;
    deleteBtn.addEventListener("click", () => deleteForeverFlow(it.id, it.name, deleteBtn));
    actions.appendChild(deleteBtn);

    row.appendChild(actions);
    trashListEl.appendChild(row);
  }
}

async function restoreTrashItemFlow(id, btn) {
  if (btn) btn.disabled = true;
  try {
    const res = await fetch(`/api/trash-restore?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!data.ok) {
      window.alert(t("trash_restore_failed") + (data.error || ""));
      if (btn) btn.disabled = false;
      return;
    }
    if (trashModalHintEl) trashModalHintEl.textContent = t("trash_restored_hint");
    await loadAndRenderTrash();
    loadData(true);
  } catch (e) {
    window.alert(t("trash_restore_failed") + e.message);
    if (btn) btn.disabled = false;
  }
}

async function deleteForeverFlow(id, name, btn) {
  const ok = confirm(t("trash_confirm_delete_forever", { name }));
  if (!ok) return;
  if (btn) btn.disabled = true;
  try {
    const res = await fetch(`/api/trash-delete-forever?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!data.ok) {
      window.alert(t("trash_delete_failed") + (data.error || ""));
      if (btn) btn.disabled = false;
      return;
    }
    await loadAndRenderTrash();
  } catch (e) {
    window.alert(t("trash_delete_failed") + e.message);
    if (btn) btn.disabled = false;
  }
}

async function emptyTrashFlow() {
  if (!trashItemsCache.length) return;
  const ok = confirm(t("trash_confirm_empty"));
  if (!ok) return;
  trashEmptyAllBtn.disabled = true;
  try {
    const res = await fetch("/api/trash-empty");
    const data = await res.json();
    if (!data.ok && data.errors && data.errors.length) {
      window.alert(t("trash_delete_failed") + data.errors.join("\n"));
    }
    await loadAndRenderTrash();
  } catch (e) {
    window.alert(t("trash_delete_failed") + e.message);
  } finally {
    trashEmptyAllBtn.disabled = false;
  }
}

async function refreshTrashBadgeOnly() {
  try {
    const res = await fetch("/api/trash-list");
    const data = await res.json();
    updateTrashBadge((data.items || []).length);
  } catch (e) {
    // Badge bleibt einfach unveraendert, kein Blocker
  }
}

if (trashBtn) {
  trashBtn.addEventListener("click", openTrashModal);
  trashModalClose.addEventListener("click", closeTrashModal);
  trashModalBackdrop.addEventListener("click", (e) => {
    if (e.target === trashModalBackdrop) closeTrashModal();
  });
  trashEmptyAllBtn.addEventListener("click", emptyTrashFlow);
}

// ---------------------------------------------------------------------------
// Mehrfachauswahl: Auswahlmodus mit Checkboxen auf Projekt-/Datei-Kacheln
// und -Zeilen, plus schwebende Aktionsleiste zum gleichzeitigen
// Favorisieren/Herunterladen/Löschen mehrerer ausgewählter Elemente.
// ---------------------------------------------------------------------------

function selectionItemKey(type, key) {
  return `${type}::${key}`;
}

function isSelected(type, key) {
  return selectedItems.has(selectionItemKey(type, key));
}

function toggleSelection(type, key, name) {
  const k = selectionItemKey(type, key);
  if (selectedItems.has(k)) {
    selectedItems.delete(k);
  } else {
    selectedItems.set(k, { type, key, name });
  }
  updateSelectionBar();
}

function clearSelection() {
  selectedItems.clear();
  updateSelectionBar();
  document.querySelectorAll(".select-checkbox.checked").forEach((el) => el.classList.remove("checked"));
}

function setSelectionMode(active) {
  selectionMode = active;
  document.body.classList.toggle("selection-mode", active);
  if (selectionModeBtn) selectionModeBtn.classList.toggle("active", active);
  if (!active) clearSelection();
  updateSelectionBar();
}

function updateSelectionBar() {
  if (!selectionBarEl) return;
  const n = selectedItems.size;
  if (selectionMode && n > 0) {
    selectionBarEl.style.display = "flex";
    selectionBarCountEl.textContent = t("selection_count", { n });
  } else {
    selectionBarEl.style.display = "none";
  }
}

function buildSelectCheckbox(type, key, name) {
  const box = document.createElement("div");
  box.className = "select-checkbox";
  if (isSelected(type, key)) box.classList.add("checked");
  box.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  box.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSelection(type, key, name);
    box.classList.toggle("checked", isSelected(type, key));
  });
  return box;
}

function selectionBulkPayload() {
  return JSON.stringify(Array.from(selectedItems.values()).map((it) => ({ type: it.type, key: it.key })));
}

async function selectionDeleteFlow() {
  const n = selectedItems.size;
  if (!n) return;
  const ok = confirm(t("selection_confirm_delete", { n }));
  if (!ok) return;
  selectionDeleteBtn.disabled = true;
  try {
    const res = await fetch(`/api/bulk-delete?items=${encodeURIComponent(selectionBulkPayload())}`);
    const data = await res.json();
    if (!data.ok && data.errors && data.errors.length) {
      alert(t("selection_delete_failed") + data.errors.join("\n"));
    }
    clearSelection();
    loadData();
    refreshTrashBadgeOnly();
  } catch (e) {
    alert(t("selection_delete_failed") + e.message);
  } finally {
    selectionDeleteBtn.disabled = false;
  }
}

async function selectionFavoriteFlow(value) {
  if (!selectedItems.size) return;
  const btn = value ? selectionFavoriteBtn : selectionUnfavoriteBtn;
  btn.disabled = true;
  try {
    const res = await fetch(`/api/bulk-favorite?items=${encodeURIComponent(selectionBulkPayload())}&value=${value ? 1 : 0}`);
    const data = await res.json();
    if (!data.ok && data.errors && data.errors.length) {
      alert(t("selection_favorite_failed") + data.errors.join("\n"));
    }
    await loadFavorites();
    render();
    updateSelectionBar();
  } catch (e) {
    alert(t("selection_favorite_failed") + e.message);
  } finally {
    btn.disabled = false;
  }
}

function selectionDownloadFlow() {
  if (!selectedItems.size) return;
  window.location.href = `/api/download-zip?items=${encodeURIComponent(selectionBulkPayload())}`;
}

if (selectionModeBtn) {
  selectionModeBtn.addEventListener("click", () => setSelectionMode(!selectionMode));
  selectionClearBtn.addEventListener("click", () => setSelectionMode(false));
  selectionDeleteBtn.addEventListener("click", selectionDeleteFlow);
  selectionFavoriteBtn.addEventListener("click", () => selectionFavoriteFlow(true));
  selectionUnfavoriteBtn.addEventListener("click", () => selectionFavoriteFlow(false));
  selectionDownloadBtn.addEventListener("click", selectionDownloadFlow);
}

// Merkt sich den Stand aller Bibliothekseinstellungen genau in dem Moment,
// in dem das Popup geoeffnet wird - Grundlage fuer den "Abbrechen"-Knopf
// (cancelLibModalFlow), der bei Klick alle seither vorgenommenen Aenderungen
// wieder rueckgaengig macht. "Speichern" braucht dagegen nichts weiter zu
// tun, da jede Aenderung (Toggle, Ausschluss, Ordner hinzufuegen, ...)
// ohnehin sofort auf dem Server gespeichert wird - der Snapshot dient rein
// dem moeglichen Zuruecksetzen.
function captureLibModalSnapshot() {
  const slicerPaths = {};
  for (const s of libModalSlicers) {
    if (s.configured_path) slicerPaths[s.id] = s.configured_path;
  }
  libModalSnapshot = {
    sources: libModalCurrentSources.map((s) => ({ ...s })),
    filetypes: libraryFiletypes.map((f) => ({ ...f })),
    excludes: { extensions: [...(libraryExcludes.extensions || [])], patterns: [...(libraryExcludes.patterns || [])] },
    render3d: render3dEnabled,
    slicers: slicerPaths,
  };
}

async function refreshLibraryModal() {
  try {
    const res = await fetch("/api/sources");
    const data = await res.json();
    libModalCurrentSources = data.sources || [];
    renderLibSources(libModalCurrentSources, data.active);
  } catch (e) {
    libSourcesListEl.innerHTML = `<div class="lib-row-sub">${escapeHtml(t("lib_sources_load_failed"))}</div>`;
  }
  refreshFiletypeUI();
  if (libRender3dToggle) libRender3dToggle.checked = render3dEnabled;
  await loadExcludes();
  loadExcludesIntoForm();
  await loadAndRenderLibSlicers();
  await loadAndRenderAutoBackupStatus();
}

// Laedt die Slicer-Liste (mit aufgeloesten Pfaden) neu und rendert die
// Zeilen im "Bibliothek verwalten"-Popup - genutzt beim Oeffnen/Aktualisieren
// des Popups und nach jeder manuellen Pfad-Auswahl.
async function loadAndRenderLibSlicers() {
  libModalSlicers = await loadSlicersList(true);
  renderLibSlicers(libModalSlicers);
}

function renderLibSlicers(slicers) {
  if (!libSlicersListEl) return;
  libSlicersListEl.innerHTML = "";
  for (const s of slicers) {
    const row = document.createElement("div");
    row.className = "lib-row";
    const isDefault = s.id === defaultSlicerId;

    const defaultBtn = document.createElement("button");
    defaultBtn.type = "button";
    defaultBtn.className = "lib-default-slicer-btn" + (isDefault ? " active" : "");
    defaultBtn.title = isDefault ? t("lib_slicer_default_unset_title") : t("lib_slicer_default_set_title");
    defaultBtn.innerHTML = isDefault
      ? '<svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M8 12.5l2.5 2.5L16 9.5" stroke="#051019" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
    defaultBtn.addEventListener("click", () => setDefaultSlicerFlow(isDefault ? "" : s.id));
    row.appendChild(defaultBtn);

    const info = document.createElement("div");
    info.className = "lib-row-info";
    const sub = s.path
      ? `${escapeHtml(s.path)}${s.detected ? " · " + escapeHtml(t("lib_slicer_auto_detected")) : ""}`
      : escapeHtml(t("lib_slicer_not_found"));
    info.innerHTML = `<div class="lib-row-label">${escapeHtml(s.label)}${isDefault ? ` <span class="lib-default-tag">${escapeHtml(t("lib_slicer_default_tag"))}</span>` : ""}</div><div class="lib-row-sub">${sub}</div>`;
    row.appendChild(info);

    const pickBtn = document.createElement("button");
    pickBtn.type = "button";
    pickBtn.className = "lib-edit-btn";
    pickBtn.title = t("lib_slicer_pick_title");
    pickBtn.textContent = "…";
    pickBtn.addEventListener("click", () => pickSlicerPathFlow(s.id));
    row.appendChild(pickBtn);

    libSlicersListEl.appendChild(row);
  }
}

async function setDefaultSlicerFlow(slicerId) {
  try {
    await fetch(`/api/set-setting?key=default_slicer&value=${encodeURIComponent(slicerId)}`);
    defaultSlicerId = slicerId;
  } catch (e) {
    // defaultSlicerId bleibt beim alten Wert - kein Blocker
  }
  renderLibSlicers(libModalSlicers);
}

async function pickSlicerPathFlow(slicerId) {
  try {
    const res = await fetch(`/api/pick-slicer-file?id=${encodeURIComponent(slicerId)}`);
    const data = await res.json();
    if (!data.path) return; // abgebrochen
    const setRes = await fetch(`/api/set-slicer-path?id=${encodeURIComponent(slicerId)}&path=${encodeURIComponent(data.path)}`);
    const setData = await setRes.json();
    if (!setData.ok) {
      window.alert(setData.error || t("lib_slicer_set_failed"));
      return;
    }
    await loadAndRenderLibSlicers();
  } catch (e) {
    window.alert(t("lib_slicer_set_failed"));
  }
}

// "Speichern": jede Aenderung im Popup wurde bereits beim Klicken/Verlassen
// des Feldes sofort auf dem Server gespeichert - hier also nur kurzes
// Feedback zeigen und schliessen, nichts weiter zu tun.
function saveLibModalFlow() {
  if (libModalSaveHintEl) libModalSaveHintEl.textContent = t("lib_modal_saved");
  setTimeout(closeLibraryModal, 400);
}

// "Abbrechen": verwirft alle seit dem Oeffnen des Popups vorgenommenen
// Aenderungen (Ordner, Dateitypen, Ausschluesse, 3D-Live-Vorschau), indem
// der beim Oeffnen erfasste Snapshot auf dem Server wiederhergestellt wird -
// und laedt anschliessend sowohl das Popup als auch die Hauptansicht
// (Quellen-Umschalter, Galerie) mit dem wiederhergestellten Stand neu.
async function cancelLibModalFlow() {
  if (!libModalSnapshot) {
    closeLibraryModal();
    return;
  }
  if (libCancelBtn) libCancelBtn.disabled = true;
  if (libSaveBtn) libSaveBtn.disabled = true;
  try {
    const url = `/api/restore-config?data=${encodeURIComponent(JSON.stringify(libModalSnapshot))}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.ok) {
      libModalCurrentSources = data.sources || [];
      libraryFiletypes = data.filetypes || [];
      libraryExcludes = data.excludes || { extensions: [], patterns: [] };
      render3dEnabled = data.render3d !== false;
      libEditingExt = null;
      renderLibSources(libModalCurrentSources, data.active);
      refreshFiletypeUI();
      if (libRender3dToggle) libRender3dToggle.checked = render3dEnabled;
      loadExcludesIntoForm();
      await loadAndRenderLibSlicers();
      await loadFavorites();
      await loadSources();
      loadData();
      closeLibraryModal();
    } else {
      window.alert(t("lib_modal_cancel_failed"));
    }
  } catch (e) {
    window.alert(t("lib_modal_cancel_failed"));
  } finally {
    if (libCancelBtn) libCancelBtn.disabled = false;
    if (libSaveBtn) libSaveBtn.disabled = false;
  }
}

// Alle bekannten Endungen aus dem Katalog (kategorisierter Picker), unabhaengig
// von der Kategorie - dient dazu, die "Eigene Dateitypen"-Liste darunter auf
// wirklich manuell hinzugefuegte Typen zu beschraenken (keine Dopplung).
function catalogExtSet() {
  const set = new Set();
  for (const cat of Object.values(knownFiletypeCategories)) {
    for (const item of cat) set.add(item.ext);
  }
  return set;
}

// Rendert sowohl den Kategorien-Picker als auch die "Eigene Dateitypen"-Liste
// neu, ausgehend vom aktuellen libraryFiletypes-Stand.
function refreshFiletypeUI() {
  renderLibFiletypeCategories(libraryFiletypes, knownFiletypeCategories);
  const catalogExts = catalogExtSet();
  const customOnly = libraryFiletypes.filter((ft) => !ft.builtin && !catalogExts.has(ft.ext));
  renderLibFiletypes(customOnly);
}

const FILETYPE_CATEGORY_ORDER = ["models", "print_jobs", "cad_sources", "images"];
const FILETYPE_CATEGORY_LABEL_KEYS = {
  models: "lib_cat_models",
  print_jobs: "lib_cat_print_jobs",
  cad_sources: "lib_cat_cad_sources",
  images: "lib_cat_images",
};

function renderLibFiletypeCategories(filetypes, categories) {
  if (!libFiletypeCategoriesEl) return;
  libFiletypeCategoriesEl.innerHTML = "";
  const byExt = new Map(filetypes.map((ft) => [ft.ext, ft]));

  for (const catKey of FILETYPE_CATEGORY_ORDER) {
    const known = categories[catKey] || [];
    let items = known.map((k) => ({ ext: k.ext, label: k.label }));
    if (catKey === "models") {
      // STL/3MF/F3D sind immer vorhanden (builtin) - im Katalog nicht
      // nochmal aufgefuehrt, aber hier als feste Chips vorangestellt.
      const builtins = filetypes
        .filter((ft) => ft.builtin)
        .map((ft) => ({ ext: ft.ext, label: ft.label || ft.ext.toUpperCase() }));
      items = [...builtins, ...items];
    }
    if (!items.length) continue;

    const catWrap = document.createElement("div");
    catWrap.className = "lib-filetype-category";

    const catLabel = document.createElement("div");
    catLabel.className = "lib-filetype-cat-label";
    catLabel.textContent = t(FILETYPE_CATEGORY_LABEL_KEYS[catKey] || catKey);
    catWrap.appendChild(catLabel);

    const chipRow = document.createElement("div");
    chipRow.className = "lib-filetype-chips";
    for (const item of items) {
      const existing = byExt.get(item.ext);
      const enabled = !!(existing && existing.enabled);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "filetype-chip" + (enabled ? " active" : "");
      chip.innerHTML = `${enabled ? "✓ " : ""}${escapeHtml(item.label)} <span class="chip-ext">.${escapeHtml(item.ext)}</span>`;
      chip.addEventListener("click", () => filetypeChipClick(item.ext, item.label));
      chipRow.appendChild(chip);
    }
    catWrap.appendChild(chipRow);
    libFiletypeCategoriesEl.appendChild(catWrap);
  }
}

function filetypeChipClick(ext, label) {
  const existing = libraryFiletypes.find((ft) => ft.ext === ext);
  if (existing) {
    toggleFiletypeFlow(ext);
  } else {
    addFiletypeFlow(ext, label);
  }
}

async function applyFiletypePresetFlow(preset) {
  try {
    const res = await fetch(`/api/apply-filetype-preset?preset=${encodeURIComponent(preset)}`);
    const data = await res.json();
    if (!data.ok) {
      window.alert(t("lib_type_toggle_failed"));
      return;
    }
    libraryFiletypes = data.filetypes || libraryFiletypes;
    refreshFiletypeUI();
    loadData();
  } catch (e) {
    window.alert(t("lib_type_toggle_failed"));
  }
}

if (libPresetRowEl) {
  libPresetRowEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".lib-preset-btn");
    if (!btn) return;
    applyFiletypePresetFlow(btn.dataset.preset);
  });
}

// Ausschlüsse-Textfelder: laden bei Popup-Oeffnen, speichern beim Verlassen
// des Feldes (gleiches Muster wie buildNotesSection - nur speichern, wenn
// sich der Wert seit dem letzten Speichern geaendert hat).
function loadExcludesIntoForm() {
  const extStr = (libraryExcludes.extensions || []).join(", ");
  const patStr = (libraryExcludes.patterns || []).join("\n");
  if (libExcludesExtensionsEl) libExcludesExtensionsEl.value = extStr;
  if (libExcludesPatternsEl) libExcludesPatternsEl.value = patStr;
  lastSavedExcludesExt = extStr;
  lastSavedExcludesPatterns = patStr;
  if (libExcludesSaveHintEl) libExcludesSaveHintEl.textContent = "";
}

async function saveExcludes() {
  const extensions = libExcludesExtensionsEl.value;
  const patterns = libExcludesPatternsEl.value;
  try {
    const url = `/api/set-excludes?extensions=${encodeURIComponent(extensions)}&patterns=${encodeURIComponent(patterns)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.ok) {
      libraryExcludes = { extensions: data.extensions || [], patterns: data.patterns || [] };
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

async function trySaveExcludes() {
  if (!libExcludesExtensionsEl || !libExcludesPatternsEl) return;
  const extVal = libExcludesExtensionsEl.value;
  const patVal = libExcludesPatternsEl.value;
  if (extVal === lastSavedExcludesExt && patVal === lastSavedExcludesPatterns) return;
  libExcludesSaveHintEl.textContent = t("lib_excludes_saving");
  const ok = await saveExcludes();
  lastSavedExcludesExt = extVal;
  lastSavedExcludesPatterns = patVal;
  libExcludesSaveHintEl.textContent = ok ? t("lib_excludes_saved") : t("lib_excludes_save_failed");
  if (ok) {
    loadData();
    setTimeout(() => {
      if (libExcludesSaveHintEl.textContent === t("lib_excludes_saved")) libExcludesSaveHintEl.textContent = "";
    }, 2000);
  }
}

if (libExcludesExtensionsEl) libExcludesExtensionsEl.addEventListener("blur", trySaveExcludes);
if (libExcludesPatternsEl) libExcludesPatternsEl.addEventListener("blur", trySaveExcludes);

function renderLibSources(sources, activeId) {
  libSourcesListEl.innerHTML = "";
  const canRemove = sources.length > 1;
  for (const s of sources) {
    const row = document.createElement("div");
    row.className = "lib-row";
    row.innerHTML = `
      <div class="lib-row-info">
        <div class="lib-row-label">📁 ${escapeHtml(s.label)}</div>
        <div class="lib-row-sub">${escapeHtml(s.path)}</div>
      </div>
    `;
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "lib-remove-btn";
    removeBtn.title = canRemove ? t("lib_remove_source_title") : t("lib_remove_source_min");
    removeBtn.textContent = "✕";
    removeBtn.disabled = !canRemove;
    removeBtn.addEventListener("click", () => removeSourceFlow(s.id, s.label));
    row.appendChild(removeBtn);
    libSourcesListEl.appendChild(row);
  }
}

let libEditingExt = null;

function renderLibFiletypes(filetypes) {
  libFiletypesListEl.innerHTML = "";
  for (const ft of filetypes) {
    const row = document.createElement("div");
    row.className = "lib-row";

    if (libEditingExt === ft.ext) {
      row.classList.add("lib-row-editing");
      const form = document.createElement("form");
      form.className = "lib-edit-form";

      const extInput = document.createElement("input");
      extInput.type = "text";
      extInput.className = "lib-edit-ext";
      extInput.maxLength = 10;
      extInput.value = ft.ext;
      extInput.placeholder = t("lib_edit_ext_placeholder");
      extInput.autocomplete = "off";

      const labelInput = document.createElement("input");
      labelInput.type = "text";
      labelInput.className = "lib-edit-label";
      labelInput.maxLength = 20;
      labelInput.value = ft.label || "";
      labelInput.placeholder = t("lib_edit_label_placeholder");
      labelInput.autocomplete = "off";

      const saveBtn = document.createElement("button");
      saveBtn.type = "submit";
      saveBtn.className = "lib-edit-save";
      saveBtn.title = t("lib_save_title");
      saveBtn.textContent = "✓";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "lib-edit-cancel";
      cancelBtn.title = t("lib_cancel_title");
      cancelBtn.textContent = "✕";
      cancelBtn.addEventListener("click", () => {
        libEditingExt = null;
        refreshFiletypeUI();
      });

      form.appendChild(extInput);
      form.appendChild(labelInput);
      form.appendChild(saveBtn);
      form.appendChild(cancelBtn);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        editFiletypeFlow(ft.ext, extInput.value, labelInput.value);
      });

      row.appendChild(form);
      libFiletypesListEl.appendChild(row);
      extInput.focus();
      extInput.select();
      continue;
    }

    const info = document.createElement("div");
    info.className = "lib-row-info";
    info.innerHTML = `<div class="lib-row-label">${escapeHtml(ft.label || ft.ext.toUpperCase())} <span class="lib-row-ext-label">.${escapeHtml(ft.ext)}</span></div><div class="lib-row-sub">${ft.builtin ? escapeHtml(t("lib_builtin")) : escapeHtml(t("lib_custom_type"))}</div>`;
    row.appendChild(info);

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "lib-toggle";
    toggleLabel.title = ft.enabled ? t("lib_toggle_disable_title") : t("lib_toggle_enable_title");
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = !!ft.enabled;
    toggleInput.addEventListener("change", () => toggleFiletypeFlow(ft.ext));
    const slider = document.createElement("span");
    slider.className = "lib-toggle-slider";
    toggleLabel.appendChild(toggleInput);
    toggleLabel.appendChild(slider);
    row.appendChild(toggleLabel);

    if (!ft.builtin) {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "lib-edit-btn";
      editBtn.title = t("lib_edit_type_title");
      editBtn.textContent = "✎";
      editBtn.addEventListener("click", () => {
        libEditingExt = ft.ext;
        refreshFiletypeUI();
      });
      row.appendChild(editBtn);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "lib-remove-btn";
      removeBtn.title = t("lib_remove_type_title");
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => removeFiletypeFlow(ft.ext, ft.label));
      row.appendChild(removeBtn);
    }

    libFiletypesListEl.appendChild(row);
  }
}

async function editFiletypeFlow(oldExt, newExtRaw, labelRaw) {
  const newExt = newExtRaw.trim().toLowerCase().replace(/^\./, "");
  const label = labelRaw.trim() || newExt.toUpperCase();
  if (!/^[a-z0-9]{1,10}$/.test(newExt)) {
    window.alert(t("lib_invalid_ext"));
    return;
  }
  try {
    const url = `/api/edit-filetype?ext=${encodeURIComponent(oldExt)}&new_ext=${encodeURIComponent(newExt)}&label=${encodeURIComponent(label)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) {
      window.alert(data.error || t("lib_type_save_failed"));
      return;
    }
    libraryFiletypes = data.filetypes || libraryFiletypes;
    libEditingExt = null;
    refreshFiletypeUI();
    loadData();
  } catch (e) {
    window.alert(t("lib_type_save_failed"));
  }
}

async function addSourceFlow() {
  libAddSourceBtn.disabled = true;
  libAddSourceBtn.textContent = t("lib_picking_folder");
  try {
    const res = await fetch("/api/pick-folder");
    const data = await res.json();
    if (!data.path) return; // abgebrochen
    const suggested = data.path.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || data.path;
    const label = window.prompt(t("lib_folder_name_prompt"), suggested);
    if (label === null) return; // abgebrochen
    const url = `/api/add-source?path=${encodeURIComponent(data.path)}&label=${encodeURIComponent(label.trim() || suggested)}`;
    const addRes = await fetch(url);
    const addData = await addRes.json();
    if (!addData.ok) {
      window.alert(addData.error || t("lib_source_add_failed"));
      return;
    }
    await refreshLibraryModal();
    await loadSources();
  } catch (e) {
    window.alert(t("lib_source_add_failed"));
  } finally {
    libAddSourceBtn.disabled = false;
    libAddSourceBtn.textContent = "+ " + t("lib_add_source");
  }
}

async function removeSourceFlow(id, label) {
  if (!window.confirm(t("lib_source_remove_confirm", { label }))) return;
  try {
    const res = await fetch(`/api/remove-source?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!data.ok) {
      window.alert(data.error || t("lib_source_remove_failed"));
      return;
    }
    await refreshLibraryModal();
    await loadSources();
    // Falls die aktive Quelle entfernt wurde, hat der Server automatisch auf
    // eine andere umgeschaltet - Favoriten & Daten dafuer neu laden.
    await loadFavorites();
    loadData();
  } catch (e) {
    window.alert(t("lib_source_remove_failed"));
  }
}

async function toggleFiletypeFlow(ext) {
  try {
    const res = await fetch(`/api/toggle-filetype?ext=${encodeURIComponent(ext)}`);
    const data = await res.json();
    if (!data.ok) {
      window.alert(t("lib_type_toggle_failed"));
      return;
    }
    libraryFiletypes = data.filetypes || libraryFiletypes;
    refreshFiletypeUI();
    loadData();
  } catch (e) {
    window.alert(t("lib_type_toggle_failed"));
  }
}

async function addFiletypeFlow(ext, label) {
  const cleanExt = ext.trim().toLowerCase().replace(/^\./, "");
  if (!/^[a-z0-9]{1,10}$/.test(cleanExt)) {
    window.alert(t("lib_invalid_ext"));
    return;
  }
  try {
    const url = `/api/add-filetype?ext=${encodeURIComponent(cleanExt)}&label=${encodeURIComponent(label.trim())}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) {
      window.alert(data.error || t("lib_type_add_failed"));
      return;
    }
    libraryFiletypes = data.filetypes || libraryFiletypes;
    refreshFiletypeUI();
    loadData();
  } catch (e) {
    window.alert(t("lib_type_add_failed"));
  }
}

async function removeFiletypeFlow(ext, label) {
  if (!window.confirm(t("lib_type_remove_confirm", { label: label || ext }))) return;
  try {
    const res = await fetch(`/api/remove-filetype?ext=${encodeURIComponent(ext)}`);
    const data = await res.json();
    if (!data.ok) {
      window.alert(data.error || t("lib_type_remove_failed"));
      return;
    }
    libraryFiletypes = data.filetypes || libraryFiletypes;
    refreshFiletypeUI();
    loadData();
  } catch (e) {
    window.alert(t("lib_type_remove_failed"));
  }
}

manageLibraryBtn.addEventListener("click", openLibraryModal);
libraryModalClose.addEventListener("click", closeLibraryModal);
libraryModalBackdrop.addEventListener("click", (e) => {
  if (e.target === libraryModalBackdrop) closeLibraryModal();
});
if (libSaveBtn) libSaveBtn.addEventListener("click", saveLibModalFlow);
if (libCancelBtn) libCancelBtn.addEventListener("click", cancelLibModalFlow);
libAddSourceBtn.addEventListener("click", addSourceFlow);
libAddFiletypeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const ext = libNewExtInput.value;
  const label = libNewExtLabelInput.value || ext.toUpperCase();
  if (!ext.trim()) return;
  addFiletypeFlow(ext, label).then(() => {
    libNewExtInput.value = "";
    libNewExtLabelInput.value = "";
  });
});

buildAlphaBar();
loadSources();
Promise.all([loadFavorites(), loadFiletypes(), loadKnownFiletypes(), loadSettings(), loadNotes(), loadTags()]).then(() => loadData());
// Leise im Hintergrund pruefen, ob eine neue Version verfuegbar ist - zeigt
// bei Bedarf die Version im Menue an und ggf. den Update-Banner, blockiert
// aber nichts und stoert nicht, falls kein Internet verfuegbar ist.
checkForUpdate(false);
refreshTrashBadgeOnly();
loadAllTagsFilterOptions();
if (tagFilterEl) {
  tagFilterEl.addEventListener("change", () => {
    activeTagFilter = tagFilterEl.value || "";
    render();
  });
}
