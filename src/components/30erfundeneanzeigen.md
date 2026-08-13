# 30 · Erfundene Anzeigen — Diagramme, Stimmung, und die Frage nach der Skala

Stand 14.08.2026. Fortsetzung von `klar/28` und `klar/29`. Alle Zahlen
stammen aus `scripts/erfundene-diagrammdaten.mjs` oder aus benannten
Quellzeilen.

---

## 1. Fünf Diagramme mit festen Zahlen

Neue Prüfung **`npm run check:erfundene-diagramme`** (Nulltoleranz). Sie
sucht recharts-Diagramme, deren `data={…}` auf ein festes Array-Literal auf
Modulebene zeigt, das Zahlen enthält.

| Datei | Zahlen | war sichtbar |
|:--|--:|:--|
| `DatingActivityDashboardWidget.tsx` | 16 | nein — nirgends eingebunden |
| `CoachInsightsWidget.tsx` | 14 | **ja**, KI-Coach → Reiter „Analytics" |
| `InsightsChart.tsx` | 14 | **ja**, Profilseite → „Entwicklung" |
| `DatingSuccessChartWidget.tsx` | 12 | nein |
| `ReflectionRadarWidget.tsx` | 10 | nein |

Drei davon waren verwaiste Dateien. Das ist kein Grund, sie zu behalten: Ein
fertig aussehender Baustein mit erfundenen Zahlen wird beim nächsten Umbau
eingebunden, weil er fertig aussieht.

### 1a · `InsightsChart` — die glaubwürdigste Form von Erfindung

```
const data = [
  { name: 'Mo', initiated: 2, replies: 1 },
  { name: 'Di', initiated: 3, replies: 2 },
  …
  { name: 'Sa', initiated: 8, replies: 7 },
];
```

Darüber die Überschrift **„Deine Aktivität der letzten 7 Tage"**, darunter
zwei Kurven, „Gestartet" und „Antworten".

Jeder Mensch sah dieselbe steigende Kurve — am ersten Tag wie im dritten
Monat, mit oder ohne ein einziges Gespräch. **Eine steigende Kurve ist die
glaubwürdigste Form von Erfindung: Sie sagt „es läuft", und eine gute
Nachricht prüft niemand nach.**

Ersatzlos gestrichen statt nachgebaut. Die Zahlen „gestartete Gespräche" und
„Antworten" gibt es heute nirgends; sie zu erheben ist eine Aufgabe im
Datenmodell (Zähler je Tag in Firestore), keine Anzeigefrage. Ein
`WIEDERVORLAGE`-Vermerk steht an der Stelle.

**Nebenbei gefunden:** im Kopf derselben Karte ein Knopf „Test Push", der
`NotificationService.simulateInactivity()` aufrief — eine Entwicklerhilfe in
der ausgelieferten Oberfläche. Wer ihn antippte, bekam eine Meldung über
48 Stunden Untätigkeit, die nicht stattgefunden hatte.

### 1b · `CoachInsightsWidget` — die Karte, die es selbst wusste

Sie trug seit dem 10.08.2026 diesen Kopfkommentar:

> „P2-BEFUND, NICHT BEHOBEN: Dieses Widget erzeugt Daten, die es nicht gibt.
> Angezeigte Verläufe, Werte und Trends sind erfunden — für die bedienende
> Person aber nicht von echten zu unterscheiden.
>
> Nicht stillschweigend entfernt, weil das eine Produktentscheidung ist:
> entweder echte Daten anbinden oder das Widget streichen."

Inhalt: eine Flächengrafik aus `mockData`, dazu „Gesprächstiefe: **Hoch**,
+24 % vs letzte Woche" und „Antwortzeit: **2.4h**, −45 m vs letzte Woche".
Alles fest im Quelltext.

Die Produktentscheidung ist am 14.08.2026 gefallen (`klar/29`, Abschnitt 1).
Damit ist die Karte entfernt. Gesprächstiefe und Antwortzeit bleiben
sinnvolle Kennzahlen — sie brauchen aber erhobene Daten. `WIEDERVORLAGE`
steht an der Stelle.

---

## 2. Der Stimmungsverlauf — zwei Fehler, einer verdeckte den anderen

### 2a · Erfundene Tage

`DatingVibeChartWidget.tsx` baute eine Reihe über 14 Tage und füllte
anschliessend auf:

```
// Fill nulls with previous values or 3 (neutral) if no previous
let lastVal = 3;
for (…) {
  if (chartData[i].value !== null) lastVal = chartData[i].value;
  else chartData[i].value = lastVal;          // ← erfundener Wert
}
```

Wer nie eine Stimmung eingetragen hatte, sah eine **durchgehende Linie auf
„Neutral" über zwei Wochen** — als hätte er jeden Tag etwas gesagt.

### 2b · Die Absicherung, die nie greifen konnte

Darunter stand:

```
// ── LEER HEISST UNSICHTBAR (14.08.2026) ─────────────────────────
if (data.length === 0) return null;
```

`chartData` hatte **immer** 14 Einträge, gefüllt oder nicht. Die Bedingung
konnte nie zutreffen. Sie sah aus wie eine Absicherung und war keine.

Das Bemerkenswerte daran: Genau diese Stelle ist in
`MoodCalendarGridWidget.tsx` schon einmal aufgefallen und dort **richtig**
gelöst worden, mit einem eigenen Kommentar:

> „Nicht aus `newGrid` ableitbar: Das Raster hat IMMER 30 Einträge, auch
> wenn keiner davon eine Stimmung trägt. Die Frage „gibt es überhaupt etwas"
> beantwortet nur die Quelle."

Die Einsicht war da. Sie ist nur nicht auf die Schwesterdatei übertragen
worden. Das ist der übliche Weg, auf dem ein behobener Fehler zurückkommt.

### 2c · Was jetzt gilt

- **`src/lib/stimmung.ts`** — Zeitraum und Reihe, ohne Importe, geprüft
  (11 Prüfungen). Die erste heisst *„leer bleibt leer — kein Tag bekommt
  einen erfundenen Wert"*.
- **Zeitraumwahl 7 · 14 · 28 · 60 Tage.** Warum diese vier: 7 ist die Woche,
  14 der bisherige Stand, 28 sind vier volle Wochen (nicht 30 — ein Monat
  hat keine feste Länge), 60 ist der längste Zeitraum, bei dem ein Tagespunkt
  auf einem Telefon noch unterscheidbar bleibt. Die Wahl bleibt erhalten.
- **Lücken bleiben Lücken** (`connectNulls={false}`), mit einem Satz darunter,
  der das erklärt.
- **Die Kopfzeile nennt die Grundlage:** *„Im Mittel „Entspannt" — aus
  2 Tagen von 60."* Ein Mittelwert aus zwei Einträgen über 60 Tage ist etwas
  anderes als einer aus 55, und der Unterschied gehört dorthin, wo die Zahl
  steht.
- **Tagebucheinträge ohne Zeitmarke** wurden vorher per
  `new Date(j.createdAt || Date.now())` auf **heute** gelegt — eine erfundene
  Zuordnung. Sie bleiben jetzt unberücksichtigt.

---

## 3. Was ich NICHT zusammengelegt habe — und warum

`klar/27`, Abschnitt 7, Punkt 2 lautete: *„Vier Stimmungsdiagramme zu
einem."* Die Prüfung der vier ergab, dass die Voraussetzung nicht stimmt.

| Baustein | liest | Skala |
|:--|:--|:--|
| `DatingMoodTrackerWidget` | `klar_dating_moods` (liest **und schreibt** — die Eingabe) | 5 Stufen |
| `DatingVibeChartWidget` | `klar_dating_moods` + `klar_journal_entries` | 5 Stufen |
| `MoodCalendarGridWidget` | `klar_reflection_logs` | **3 Stufen** (`good`/`neutral`/`bad`) |
| `InsightsChart` | `userGoal`, `klar_completed_milestones` | **gar keine Stimmung** |

Es gibt **zwei Stimmungsspeicher mit unterschiedlichen Skalen.** Und
`klar_reflection_logs` wird nicht von einem, sondern von **sechs** weiteren
Bausteinen gelesen: `DateSuccessRadarWidget`, `SuccessRadarWidget`,
`DashboardDateBanner`, `MoodHeatmapWidget`, `WeeklyMoodSummaryWidget`,
`ReflectionLogWidget`.

Die vier zu einem zusammenzurechnen hiesse, zwei Skalen zu mitteln, die
nicht dasselbe bedeuten — eine Dreier-Bewertung eines **Dates** und eine
Fünfer-Bewertung eines **Tages**. Das Ergebnis sähe aus wie eine Auswertung
und wäre keine.

**Deshalb umgesetzt:** die Zeitraumwahl und die Ehrlichkeit des einen
Diagramms, das eine saubere Quelle hat.
**Deshalb offen:** die Zusammenlegung selbst. Sie braucht vorher eine
Entscheidung, siehe Abschnitt 5.

---

## 4. Ein vierter Meilensteinzähler

`InsightsChart` schreibt `klar_completed_milestones` — hochgezählt durch
einen Knopf „Nächsten Meilenstein abschliessen", mit Konfetti. Die drei
Meilensteine hängen am gewählten Ziel (`userGoal`) und sind **selbst
erklärt**, nicht abgeleitet.

Das ist nicht falsch — Selbsteinschätzung ist eine ehrliche Quelle, solange
sie als solche erkennbar ist. Es ist aber ein **vierter** Meilensteinbegriff
neben dem, der in `klar/28` gerade auf einen zusammengeführt wurde. Ich habe
ihn stehen lassen und nicht angefasst: Ob eine zielbezogene Selbstcheckliste
neben den abgeleiteten Meilensteinen bestehen soll, ist eine
Produktentscheidung.

---

## 5. Offene Fragen — an Sie

Kurz gefasst, damit sie sich vom Telefon aus beantworten lassen.

| # | Frage | Meine Empfehlung |
|:--|:--|:--|
| **1** | **Zwei Stimmungsskalen** — `klar_dating_moods` (5 Stufen, Tagesstimmung) und `klar_reflection_logs` (3 Stufen, Bewertung eines Dates). Eine Skala oder zwei? | **Zwei behalten.** Sie messen verschiedene Dinge. Statt zusammenzulegen: klare Benennung — „Wie ging es dir?" gegen „Wie war das Date?". Zusammenlegen wäre der bequeme, aber falsche Weg |
| **2** | **Sechs Bausteine lesen `klar_reflection_logs`** und zeigen es je anders (Radar, Heatmap, Kalenderraster, Wochenzusammenfassung, Banner, Liste). Wie viele davon sollen bleiben? | **Zwei:** die Liste (Eingabe) und **eine** Auswertung. Welche, sollten Sie am Bildschirm entscheiden — dazu brauche ich Ihre Augen, nicht meine Vermutung |
| **3** | **Zielbezogene Selbstcheckliste** in `InsightsChart` neben den abgeleiteten Meilensteinen — behalten? | **Behalten, aber umbenennen.** „Meilensteine" heisst jetzt etwas anderes; „Dein Ziel" oder „Deine nächsten Schritte" trennt es sauber |
| **4** | **Bestehende Klar+-Konten** (`plan: 'plus'` in Firestore): Sie sehen ab dem Einspielen „x von 8" statt „unbegrenzt". Muss das kommuniziert werden? | **Ja, wenn es welche gibt** — ein Satz genügt. Wenn es sie noch nicht gibt (Testbetrieb), erübrigt es sich; das können nur Sie sagen |
| **5** | **Incognito-Modus** steht als „Zurückhaltender Modus" in der Klar+-Liste. `klar/27` empfiehlt, ihn zunächst wegzulassen. | **Drin lassen bis zur Preisfindung.** Ohne ihn hat Klar+ fünf Zeilen, davon zwei ohne Unterschied. Das ist zu dünn für ein Abo — die Frage ist dann nicht der Incognito-Modus, sondern ob Klar+ genug enthält |

---

## 6. Prüfstand

| | |
|:--|:--|
| Prüfskripte | **14**, alle grün (`check:erfundene-diagramme` neu) |
| Reine Tests | **198 von 198** (`tests/zwischenspeicher.spec.ts` läuft in meiner Umgebung nicht — fehlendes `firebase-admin`, keine Folge einer Änderung) |
| `tsc` | keine neuen Meldungen in einer geänderten Datei |
| Gegenproben | 2 neue, beide ausgeführt und zurückgenommen; Dateien danach byte-gleich |

**Was ich nicht geprüft habe:** kein Browser. Ob die Zeitraumwahl auf einem
schmalen Gerät nebeneinander passt (vier Knöpfe, je „60 Tage"), ob die
Lücken im Diagramm bei 60 Tagen noch als Lücken lesbar sind, und ob die
Profilseite ohne `InsightsChart`-Diagramm nicht plötzlich leer wirkt — das
muss jemand ansehen.
