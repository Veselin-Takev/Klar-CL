# 32 · Was der Browser zeigte, was `verify` nicht sieht

Stand 14.08.2026. Grundlage: die laufende App unter `localhost:3000`,
Konsole und Netzwerkleiste. **Keiner dieser vier Befunde wäre durch
`npm run verify` aufgefallen** — und das ist die eigentliche Erkenntnis
dieses Blocks.

---

## 1. Die Fehlermeldung, die im Gespräch landete

**Beobachtet** (`/chat/p3`): Zwei abgeschickte Nachrichten, dunkel
hinterlegt, mit Häkchen:

> „Fehler beim Laden der Vorschläge" ✓✓
> „Fehler beim Laden der Vorschläge" ✓✓

**Ursache**, `ChatView.tsx`, im `catch` von `getIcebreakers`:

```
setAiSuggestions([(e instanceof Error ? e.message : String(e)) || …]);
```

Vorschläge sind antippbare Knöpfe; ein Tipp setzt den Text ins Eingabefeld.
Die Fehlermeldung war damit ein Vorschlag wie jeder andere.

**Warum das der schwerste der vier Befunde ist:** Klars Versprechen lautet
*„niemals mit deiner Würde"*. Eine technische Fehlermeldung, die im Namen
des Nutzers an sein Gegenüber geht, ist das Gegenteil davon — und sie
passiert genau dann, wenn er Hilfe wollte.

**Jetzt:** eigener Zustand `vorschlagFehler`, eigene Darstellung als
`role="note"` mit „Erneut versuchen". Ein Hinweis, kein Knopf — er lässt
sich nicht abschicken.

**Ohne automatische Absicherung.** Ich habe für diese Klasse keine Prüfung
gebaut. Eine, die „Fehlermeldung als Inhalt" zuverlässig erkennt, hätte ich
nur raten können, und eine Prüfung, die rät, ist schlimmer als keine
(Begründung in Abschnitt 2). Der Fall steht deshalb hier — und die
Bauform ist entfernt, nicht nur die eine Stelle.

---

## 2. Vier Anfragenstürme, eine Ursache

**Beobachtet:** 1.883 Anfragen, 23,9 MB für **einen** Seitenaufruf. Dazu
wiederholt `POST /api/daily-icebreakers → 429 Too Many Requests`.

**Ursache** — `DailyIcebreakerWidget`:

```
}, [userInterests, matchesInterests]);
```

und `Dashboard.tsx`:

```
const uniqueVerbindungenInterests = Array.from(new Set(…)).slice(0, 10);
<DailyIcebreakerWidget … matchesInterests={uniqueVerbindungenInterests} />
```

Bei jedem Rendern ein **neues Feld**. React vergleicht mit `Object.is`; zwei
Felder mit gleichem Inhalt sind verschiedene Werte. Der Effekt lief also bei
jedem Rendern — mit einem KI-Aufruf darin.

**Warum es niemandem auffiel:** Die Karte blendet sich bei Fehler aus. Die
Anfragen liefen weiter, die Karte war weg. Sichtbar wurde es erst durch die
Gastgrenze (15 KI-Aufrufe/Stunde), die mit 429 dazwischenging — bei einem
angemeldeten Konto sind es 60, und der Sturm wäre gar nicht aufgefallen.

### 2a · Die Prüfung — und der verworfene erste Versuch

`npm run check:effekte` (Nulltoleranz) sucht die Bauform: **Feld-Eigenschaft
+ Effekt + Netzaufruf im Rumpf.** Alle drei zusammen sind der Fehler;
einzeln ist keines davon einer.

**Befund beim Anlegen: vier Bausteine, nicht einer.**

| Datei | Abhängigkeit |
|:--|:--|
| `ChatDatePlanner.tsx:346` | `userInterests`, `matchInterests` |
| `DailyIcebreakerWidget.tsx:38` | `userInterests`, `matchesInterests` |
| `KlarCompassWidget.tsx:18` | `userInterests` |
| `RelationshipProgressWidget.tsx:30` | `chatHistory` |

Alle vier hängen jetzt am **Inhalt** (`feld.join('|')` bzw. `.length`).

**Der verworfene erste Versuch gehört in diesen Bericht.** Die erste Fassung
suchte nach `const x = …map(…)` in derselben Datei. Ergebnis:

| Treffer | Urteil |
|:--|:--|
| `ConversationStatsWidget:40` — `data` | **falsch**: stammt aus `useState`, ist stabil; der Treffer kam von einem `const` innerhalb einer Hilfsfunktion |
| `DatePreparationChecklist:69` — `progress` | **falsch**: ist eine Zahl. Zwei gleiche Zahlen sind für `Object.is` derselbe Wert |

Und den echten Fall fand sie nicht, weil der neue Wert im **Elternteil**
entsteht. Zwei Fehltreffer, null Treffer — eine solche Prüfung erzeugt
Arbeit und Vertrauen zugleich, beides unverdient. Sie ist ersetzt, die
Begründung steht im Kopf des Skripts.

---

## 3. Gäste erfuhren nicht, warum nichts passiert

**Beobachtet**, zweimal beim Start:

```
Profil konnte nicht gespeichert werden
FirebaseError: PERMISSION_DENIED: false for 'update' @ L181
```

`firestore.rules:181` ist die `allow update`-Regel für `users/{userId}`; sie
verlangt `!istGast()`. **Die Regel hat genau das getan, was sie soll**
(GAST-01: anlegen ja, ändern nein). Falsch war die andere Seite.

**Die Lücke:** Gastrechte werden auf drei Ebenen durchgesetzt — Server-API,
`firestore.rules`, `storage.rules` (klar/28). In der Oberfläche kam nur die
**erste** an: `authFetch` erkennt HTTP 403 mit Code `konto_erforderlich`.
Eine Regelablehnung nimmt diesen Weg nicht; sie läuft nicht über `/api`.

**Neu:** `src/lib/gastGrenze.ts`, ohne Importe, geprüft (5 Prüfungen).
`sollGateZeigen(fehler, nutzer)` verlangt **beides**: anonymes Konto **und**
Regelablehnung.

> Der zweite Teil ist der wichtige. Eine Ablehnung bei einem **angemeldeten**
> Konto ist etwas anderes — dort ist entweder die Regel oder der Aufruf
> falsch, und „Konto anlegen" wäre darauf eine irreführende Antwort auf
> einen echten Fehler.

Der Ereignisname steht jetzt als Konstante an einer Stelle und wird im Test
gegen `RegistrierungsGate.tsx` gehalten. Er hat seit heute zwei Absender;
ein Name an zwei Stellen ist ein Tippfehler, der niemandem auffällt — der
Dialog bliebe einfach stumm.

**`ThemeProvider` bekommt bewusst KEIN Gate.** Er versucht den
Schreibvorgang als Gast gar nicht erst. Die Helligkeit ist keine Handlung,
die an einem Konto hängen muss; ein Dialog dafür wäre eine Zumutung. Die
lokale Wahl greift weiterhin, geräteübergreifend gespeichert wird sie nicht
— und das ist die richtige Aussage, denn ein Gast hat kein Konto, an dem
etwas hängen könnte.

---

## 4. Zwei Karten, ein Widerspruch

**Beobachtet**, direkt untereinander auf der Profilseite:

| Karte | Aussage |
|:--|:--|
| Dein Ziel: Feste Beziehung finden | „Profil optimiert" ✓ |
| Meilensteine **0 von 6** | „Profil geprüft **0 von 1**" |

Der Unterschied ist echt und wichtig:

- **Meilensteine sind abgeleitet.** Sie ergeben sich aus Daten
  (`src/lib/meilensteine.ts`) und lassen sich nicht von Hand setzen.
- **Die andere Liste ist selbst erklärt.** Man hakt sie ab. Das ist eine
  ehrliche Quelle — solange erkennbar ist, dass sie es ist.

**Jetzt:** „Deine nächsten Schritte" statt „Dein Ziel", „Abhaken" statt
„Erreichen", und ein Satz darunter, der sagt, wer hier abhakt und wer nicht.

---

## 5. Offen — ein Regelfehler, kein Gast-Thema

In der Konsole stand ausserdem:

```
Could not save theme to Firestore FirebaseError: PERMISSION_DENIED:
evaluation error at L169:24 for 'create' @ L169,
false for 'update' @ L181, false for 'update' @ L181
```

**`evaluation error` ist nicht dasselbe wie `false`.** Die Regel ist beim
Auswerten **abgestürzt**, sie hat nicht abgelehnt. Zeile 169 ist die
`allow create`-Regel für `users/{userId}`.

**Ich habe nicht geraten.** In meiner Umgebung läuft kein Emulator; ich kann
den Fall nicht nachstellen, und eine Vermutung in einer Sicherheitsregel ist
das Letzte, was dieses Projekt braucht. Was ich sagen kann:

- Der Fall trat bei einem `setDoc(…, { merge: true })` auf ein **noch nicht
  vorhandenes** Dokument auf — Firestore wertet das als `create`.
- Er kann damit auch **angemeldete Konten beim allerersten Schreibvorgang**
  treffen, nicht nur Gäste.
- Durch die Änderung in Abschnitt 3 tritt er über den Theme-Weg nicht mehr
  auf. Die Ursache ist damit **verdeckt, nicht behoben**.

**Reproduktion für den nächsten Durchgang:**

```
npm run dev:lokal
# neues Konto anlegen, dann VOR dem ersten Profil-Speichern die Helligkeit
# umstellen; Regel-Auswertung im Emulator-Protokoll (Port 4401) ansehen
```

Verdacht, ausdrücklich als Verdacht: `isValidUser(request.resource.data)`
(Zeile 92 ff.) trifft bei einem Teil-Schreibvorgang auf ein Dokument ohne
`uid`/`createdAt`/`updatedAt`. Ob `hasAll` dort sauber kurzschliesst, muss
gemessen werden, nicht angenommen.

---

## 6. Was dieser Block über das Verfahren sagt

Sechzehn Prüfskripte, 203 Tests, vier grüne `verify`-Läufe — und die vier
Befunde dieses Blocks lagen trotzdem alle offen. Keiner davon ist ein
Tippfehler oder ein Typfehler; alle vier sind **Verhalten**:

| Befund | Warum kein Skript ihn sah |
|:--|:--|
| Fehlermeldung im Chat | Der Code ist syntaktisch einwandfrei. Falsch ist, wo der Text landet |
| Anfragensturm | Zeigt sich erst zur Laufzeit, über viele Renderdurchläufe |
| Gast ohne Rückmeldung | Beide Seiten für sich sind richtig; die Lücke liegt dazwischen |
| Widersprüchliche Karten | Zwei richtige Karten, falsch nebeneinander |

Das ist kein Argument gegen die Skripte — sie haben heute vier Bausteine
mit derselben Sturm-Bauform gefunden, nachdem der Browser einen davon
gezeigt hatte. Es ist ein Argument dafür, **regelmässig hineinzusehen**.
Der Browser hat in zwanzig Minuten mehr gefunden als `verify` in einem Tag.

**Empfehlung:** Nach jedem Block einmal durchklicken, mit offener Konsole,
und die Netzwerkleiste ansehen. Das ist keine Kür.

---

## 7. Prüfstand

| | |
|:--|:--|
| Prüfskripte | **16**, alle grün (`check:effekte` neu) |
| Reine Tests | **203 von 203** |
| `tsc` | keine neue Meldungsart in einer geänderten Datei |

**Gegenproben:**

| Prüfung | eingebauter Fehler | Reaktion | nach Rücknahme |
|:--|:--|:--|:--|
| `check:effekte` | in `KlarCompassWidget` wieder `[userInterests]` | 1 statt 0, Ausstieg 1 | 0, Ausstieg 0, byte-gleich |
| `gastGrenze.spec` | — | hält den Ereignisnamen gegen `RegistrierungsGate.tsx`; eine einseitige Umbenennung schlägt fehl statt stumm zu bleiben | — |
