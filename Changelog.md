
Version 1.0.2 21.7.2025

✅ Bug-Fix Zusammenfassung:

Problem behoben:
Aktive Datei hat IMMER Priorität: Wenn du eine Datei offen hast, wird diese verwendet - keine anderen Fallbacks mehr

Klare Fehlermeldung: Wenn die aktive Datei KEINE Assembly-Datei ist, bekommst du: "filename.txt" is not a Z-80 assembly language source file. Please open a .z, .a80, .asm, or .s file.

Kein unerwartetes Verhalten: Keine automatischen Fallbacks zu alten Dateien oder Projekt-Konfiguration, wenn eine Nicht-Assembly-Datei aktiv ist

Neues Verhalten:
Assembly-Datei aktiv → wird verwendet ✅

Andere Datei aktiv → Fehlermeldung ❌

Keine Datei aktiv → Fallback zur Projekt-Konfiguration oder Workspace-Suche

Unterstützte Extensions:
.z (traditionell)
.a80 (TRS-80 spezifisch)
.asm (allgemein)
.s (kurz für assembly)
