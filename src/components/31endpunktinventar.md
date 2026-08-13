# 31 · Das Endpunkt-Inventar — 81 Wege, null Aufrufe

Stand 14.08.2026. Schritt 2 der Teststrategie, offen seit dem 12.08.2026.
Alle Zahlen stammen aus `npm run routen` (`scripts/routen-inventar.mjs`).

---

## 1. Die Lage in einer Zeile

> **81 Endpunkte. 43 werden in irgendeinem Test erwähnt. Null werden von
> einem Test tatsächlich aufgerufen.**

Die Unterscheidung ist der Kern dieses Berichts. „Erwähnt" heisst: Der Pfad
kommt in einer Testdatei vor — `gastrechte.spec.ts` etwa listet 26 Pfade, um
zu prüfen, *welche* für Gäste gesperrt sein müssen. Das ist eine echte und
nützliche Prüfung, aber sie schickt nie eine Anfrage.

Hätte ich nur „43 von 81" berichtet, sähe das nach 53 % Abdeckung aus. Die
belastbare Zahl ist **0 %**. Das Skript weist beide Zahlen getrennt aus,
damit die schwächere nie für die stärkere gehalten wird.

---

## 2. Was das Inventar erhebt

| Merkmal | Stand |
|:--|--:|
| Endpunkte in `server.ts` | **81** |
| in Tests erwähnt | 43 |
| **durch einen Aufruf geprüft** | **0** |
| öffentlich (ohne Anmeldung) | 1 (`/api/health`) |
| für Gäste gesperrt | 8 |
| als KI-Endpunkt geführt | 54 |
| ruft die KI im Rumpf auf | 53 |
| hinter der Oberflächen-Auslieferung | 0 |
| mehrfach registriert | 0 |

Die vollständige Liste mit Zeilennummern: `npm run routen`.

---

## 3. Drei Fehlerklassen, die jetzt hart geprüft werden

`npm run check:routen` bricht ab — keine Obergrenze, kein Altbestand —, wenn
eine davon auftritt:

### 3a · Ein Endpunkt hinter der Auslieferung der Oberfläche

Der Befund vom 10.08.2026: **23 Endpunkte** waren nicht erreichbar, weil sie
unterhalb von `app.use(vite.middlewares)` registriert waren. Im
Entwicklungsbetrieb antwortete jede mit 404; in der Produktion fing
`app.get('*')` nur GET ab, POST lief durch — also unterschiedliches
Verhalten in Entwicklung und Produktion.

Das Skript kennt die Grenzzeile (heute 3527) und meldet jede Registrierung
darunter.

### 3b · Derselbe Endpunkt zweimal registriert

Express nimmt die erste. Die zweite ist wirkungslos — und sieht im Quelltext
aus wie die geltende.

### 3c · Ein KI-Aufruf ohne Einstufung

`KI_ENDPUNKTE` in `server.ts` entscheidet, welche Endpunkte die Kontogrenze
(60 Aufrufe/Stunde) und die Gastgrenze (15) bekommen. Ein Endpunkt, der
Gemini aufruft und dort **nicht** steht, hat **keine von beiden** — und jeder
Aufruf geht auf Ihre Rechnung.

---

## 4. Der Fund: `/api/reply-suggestions` hatte keine Grenze

Das Inventar hat genau diesen Fall gefunden — auf einem Umweg, der die
Grenze der Prüfung mit zeigt:

```
server.ts:1962   app.post("/api/reply-suggestions", …)
                   chatSuggestionQueue.push({ context, res });   ← nur einreihen
server.ts:1912   … beim Abarbeiten der Warteschlange:
                   const response = await ai.models.generateContent({ … })
```

Die Route ruft die KI **nicht selbst** auf, sondern legt die Anfrage in eine
Warteschlange. Sie stand deshalb nicht in `KI_ENDPUNKTE` und hatte **weder
die Kontogrenze noch die Gastgrenze**. Eine Textsuche findet so etwas nicht —
und genau darum ist es so lange stehen geblieben.

**Behoben:** Pfad in `KI_ENDPUNKTE` nachgetragen (54 statt 53).
**Ehrlich dazu:** Meine Prüfung hätte diesen Fall von sich aus nicht
gefunden. Sie steht jetzt mit dieser Grenze im eigenen Kopfkommentar: *„Wer
künftig über eine Warteschlange arbeitet, muss den Pfad von Hand
eintragen."* Ein Hinweis, der aufgeschrieben ist, ist nicht so gut wie eine
Prüfung — aber besser als eine Prüfung, die man für vollständig hält.

---

## 5. Ein Fehler in meinem eigenen Skript — und was er lehrt

Die erste Fassung meldete **79 Endpunkte** und **0 öffentliche**. Beides war
falsch. Ursache: die übliche Kurzform zum Entfernen von Blockkommentaren,

```
s.replace(/\/\*[\s\S]*?\*\//g, …)
```

In `server.ts` steht irgendwo ein `/*` **innerhalb einer Zeichenkette**. Der
nicht-gierige Ausdruck lief von dort bis zum nächsten `*/` — quer über
hunderte echter Zeilen, die damit unsichtbar wurden. Darunter die Liste der
öffentlichen Pfade und zwei Endpunkte.

**Aufgefallen ist es nur an einer Zahl, die zu glatt aussah:**
„0 öffentliche Endpunkte", obwohl `/api/health` sichtbar in der Liste steht.

Das ist dieselbe Falle wie am 12.08.2026 bei `check-beschriftung` (dort
verdeckte eine naive Suche 57 von 90 Fällen) — und sie folgt derselben
Regel, die in diesem Projekt inzwischen dreimal aufgeschrieben wurde:

> **Eine Prüfung, die einen Bereich nicht ansieht, meldet dort nichts — und
> das sieht aus wie „alles grün".**

Behoben mit einem echten kleinen Leser, der Zeichenketten überspringt statt
sie mitzulesen. Der Fehler steht mit Begründung im Skript.

---

## 6. Auffälligkeiten aus der Liste — nicht behoben, gemeldet

### 6a · Zwei Wege, ein Konto zu löschen

```
POST   /api/account/delete   (Zeile 562)  → handleDeleteAccount  (DSG-04)
DELETE /api/account          (Zeile 2585) → eigener „Cascading delete"
```

Zwei verschiedene Umsetzungen derselben Sache, mit unterschiedlichem Code.
Welche löscht wirklich alles? Bei Art. 17 DSGVO ist das keine Stilfrage.

**Nicht angerührt.** Kontolöschung ist der folgenschwerste Vorgang der App;
sie zusammenzulegen, ohne beide Wege ausführen zu können, wäre leichtsinnig.
Das gehört mit laufender Firestore-Emulation gemacht — und es ist der beste
erste Kandidat für einen echten Aufruftest.

### 6b · `/api/translate` ohne eigenes Kontingent

Steht seit `klar/25` offen. Der Endpunkt fällt unter die allgemeine
KI-Grenze, hat aber keine eigene — bei einer Live-Übersetzung im Chat ist
das die Stelle mit dem höchsten Aufkommen.

### 6c · Das freie KI-Kontingent hängt an der Stunde, nicht am Tag

60/Stunde sind 1.440/Tag. Der Zähler liegt im Arbeitsspeicher und ist nach
einem Neustart weg (steht so im Code, `server.ts` ff.). Offen seit
`klar/27`, 9c.

---

## 7. Warum ich keine Aufruftests geschrieben habe

Ehrlich und ohne Beschönigung: **Ich kann sie hier nicht ausführen.**
`npm install` ist in meiner Umgebung gesperrt (Registry antwortet mit
HTTP 403 — heute erneut geprüft), und ein Aufruftest braucht `express`,
`firebase-admin` und `@google/genai` zur Laufzeit.

Ich hätte Testdateien schreiben können, die bei Ihnen laufen. Ich habe es
nicht getan, weil ungeprüfter Testcode das Schlechteste von beidem ist: Er
sieht nach Abdeckung aus, und wenn er fehlschlägt, bricht er Ihnen
`npm run verify` — an einer Stelle, an der Sie nicht wissen, ob der Test
oder der Code schuld ist.

**Was stattdessen vorliegt:** die Liste, drei harte Prüfungen auf die
Fehlerklassen, die Tests nicht ersetzen können (Reihenfolge, Doppelung,
Einstufung), und ein Fund, der ohne die Liste nicht gemacht worden wäre.

### Der Bauplan für die Aufruftests

Wenn Sie (oder eine Sitzung mit Paketzugriff) weitermachen:

1. **`tests/api/hilfe.ts`** — `baueApp()` importieren, `firebase-admin` mit
   `vi.mock` ersetzen, einen angemeldeten und einen Gast-Nachweis bauen.
   `baueApp()` ist am 12.08.2026 genau dafür aus `startServer()` gelöst
   worden.
2. **Erste fünf Endpunkte, in dieser Reihenfolge** — nach Folgen sortiert,
   nicht nach Bequemlichkeit:
   `DELETE /api/account` und `POST /api/account/delete` (6a) ·
   `POST /api/contact` (das Kontingent, jetzt acht für alle) ·
   `GET /api/quota` (meldet seit dem 14.08. auch Zahlenden „x von 8") ·
   `POST /api/verification/submit` (Voraussetzung für jeden Kontakt).
3. **Danach der Reihe nach die 38 unerwähnten.** Sobald die erste Testdatei
   `baueApp(` enthält, zählt das Inventar die Spalte „durch einen Aufruf
   geprüft" von selbst hoch — die Zahl im Bericht kommt dann aus dem Skript,
   nicht aus einer Behauptung.

---

## 8. Prüfstand

| | |
|:--|:--|
| Prüfskripte | **15**, alle grün (`check:routen` neu) |
| Reine Tests | 198 von 198 |
| `tsc` auf `server.ts` | unverändert 267 vorbestehende Meldungen, keine neue Art |
| Gegenproben | 3, alle ausgeführt und zurückgenommen; `server.ts` danach byte-gleich |

**Die drei Gegenproben zu `check:routen`:**

| eingebauter Fehler | Reaktion |
|:--|:--|
| `POST /api/block` ein zweites Mal registriert | „MEHRFACH REGISTRIERT: 2× POST /api/block", Ausstieg 1 |
| `GET /api/zu-spaet` hinter `app.use(vite.middlewares)` | „HINTER DER AUSLIEFERUNG … Zeile 3519", Ausstieg 1 |
| `POST /api/neuer-ki-weg` mit `ai.models`, nicht in `KI_ENDPUNKTE` | „RUFT DIE KI AUF, STEHT ABER NICHT IN KI_ENDPUNKTE", Ausstieg 1 |

Nach der Rücknahme jeweils Ausstieg 0 und `server.ts` byte-gleich zum
Ausgangsstand.
