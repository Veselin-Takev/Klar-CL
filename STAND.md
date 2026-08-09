# Klar — Stand 09.08.2026 nach P0, P1 und P2

**Grundlage:** Ihr Upload `klar_09.08.2026` · **5 Commits** · 212 Dateien

---

## 1. Was behoben ist

### P0 — sperrend

| | Vorher | Jetzt |
|:--|:--|:--|
| **1** | `Dashboard.tsx`: 48 Syntaxfehler, App nicht baubar | 7 fehlende Klammern ergänzt, Baum parsebar |
| **2** | `firestore.rules`: literales `\n` — Datei nicht parsebar | entfernt, Klammerbilanz 0 |
| **3** | 55 von 60 Endpunkten ohne Auth | `app.use("/api", …)` auf dem Präfix |
| **4** | `isVerified()` prüfte nur die Anmeldung | `signedIn()` + echte `isVerified(uid)` + `keepsServerFields()` |
| **5** | Melden-Knopf setzte nur `setReportSubmitted(true)` | `POST /api/report`, erst speichern, dann bestätigen, mit Aktenzeichen |
| **6** | `handleDeleteAccount` aufgerufen, **nirgends definiert** | `POST /api/account/delete` mit Kaskade |

### P1 — Kernmechanik

| | |
|:--|:--|
| **Kontingent** | Lag im `localStorage`. Jetzt `/api/quota` + `/api/contact`: 8 **Kontakte**/Tag in einer Transaktion, Wechsel 4 Uhr, Rücknahme 5 s samt Zähler |
| **Verifizierung** | challenge → submit → decide. Geste vom Server (5 Min., einmalig). `isVerified` an **genau einer** Stelle geschrieben |
| **Icebreaker-Gate** | zwei Fragen **beidseitig**, Zähler serverseitig |
| **§ 312k / § 356a** | getrennte Endpunkte, getrennte Rechtsfolgen, kein Rückhaltebildschirm |

**Zwei Endpunkte entfernt, die alles aushebelten:**
`/api/verify-photo` setzte `isVerified: true` **bedingungslos** — ein POST genügte
zur Selbstverifizierung. `/api/subscribe-klar-plus` setzte `klarPlus: true` **ohne
Zahlung**. Beide antworten jetzt mit 410 bzw. 501 und sind nicht ersetzt.

### P2 — vor Store

| | |
|:--|:--|
| **Designtokens** | `src/index.css` 35 → 164 Zeilen. `stone-400` (2,36 : 1) und `stone-500` (4,49 : 1) korrigiert — der **Wert**, nicht die Klasse an hunderten Stellen |
| **Kontrastprüfung** | `scripts/check-kontrast.mjs` rechnet 26 Paare nach, läuft in `verify` und in der CI |
| **Stille Fehler** | 58 × `console.warn(e)` → `melde()` mit Stelle und Sentry. Im Code jetzt **0** |
| **Zustände** | `States.tsx` (Laden/Leer/Fehler/Offline) + `useOnline`, Offline-Leiste in der Hülle |
| **Barrierefreiheit** | Sprungmarke, `aria-current` auf allen Navigationslinks, Fokus sichtbar, `prefers-reduced-motion` |
| **Erfundener Fortschritt** | 4 fest auf „erreicht" stehende Meilensteine → 0 |
| **Einrichtung** | `.devcontainer` (Node 22 + Java 17), `.nvmrc`, `engines`, `.npmrc` mit `engine-strict` |
| **CI** | `verify.yml` (Typprüfung, Kontraste, Logiktests) und `kennzahlen.yml` (zählt Rückfälle, **nicht sperrend**) |

**Zusatzbefunde, die `@ts-nocheck` in 8 Dateien verdeckt hatte:**
`ChevronRight`, `AnimatePresence`, `PhotoVerificationModal`, `MessageBubble` —
benutzt, nie importiert. Jeder hätte beim Rendern einen `ReferenceError`
geworfen. Behoben.

---

## 2. Prüfstand

### Ausgeführt

```
Syntaxprüfung über den Quellbaum   → 212 Dateien · 0 Fehler · 0 Nullbytes
tsx --test tests/pure.spec.ts      → 32 Tests · 32 bestanden
node scripts/check-kontrast.mjs    → 26 Farbpaare · alle über der Schwelle
Maschinelle Gegenproben P0/P1/P2   → 24 + 26 + 18 = 68 von 68
```

**Bei Ihnen, im Codespace, am 09.08.2026:** `npm run verify` lief zum ersten
Mal vollständig durch — `typecheck` über beide tsconfigs, `check:kontrast`,
`test:pure`. Damit ist der Baum nicht mehr nur parsebar, sondern typgeprüft.

> **Drei Gegenproben meldeten zuerst Fehler, die keine waren** — sie fanden die
> gesuchten Zeichenketten in den Kommentaren, die die Behebung beschreiben. Eine
> vierte meldete „2 Schreibstellen auf `isVerified`", und **das war echt**:
> `/api/verify-photo`. Deshalb wird jede Meldung nachgerechnet statt geglaubt.

### Nicht ausgeführt

| | Grund |
|---|---|
| `npm install`, Build, Serverstart | Paketregistry gesperrt (HTTP 403) |
| **`tests/rules.spec.ts` — 35 Fälle, geschrieben, nie gelaufen** | Emulator hier nicht startbar (kein Java, keine Registry). **Der erste Lauf ist Ihrer.** |
| Storage-Regeln | keine Tests. `storage.rules` ist weiterhin ungeprüft. |
| Darstellung, Dunkelmodus, Bildrate | keine laufende App |

**„Behoben" heißt hier: statisch geprüft und maschinell gegengeprüft.** Es heißt
nicht, dass ich die App laufen gesehen habe.

---

## 3. Was offen bleibt — und warum ich es nicht entschieden habe

| | |
|:--|:--|
| **Wischgeste** | `Dashboard.tsx:1157` — `drag="x"` → `handleContact(profile, "pass"\|"nachricht")`. Das ist Bewerten per Wischen; §12 verbietet es, und das Versprechen lautet „Weniger Swipes". Ich habe nur die Klammern repariert. |
| **7 Widgets mit erfundenen Daten** | `generateMockData`, `mockHistory`, `mockDates`. Angezeigte Verläufe sind erfunden und für die bedienende Person nicht von echten zu unterscheiden. Jede Datei trägt jetzt einen Befundkopf. Entweder Daten anbinden oder Widget streichen — ein drittes „Demodaten mit Hinweis" gibt es nicht. |
| **362 Treffer Gamification** | Serien, Abzeichen, Meilensteine. Nach unserer Fun-Feature-Grenze: Meilenstein für ein eingetretenes Ereignis ja, Serie, die tägliche Rückkehr belohnt, nein — sie wirkt dem Kontaktlimit entgegen. |
| **`<ChatQualityChart />`** | existiert nirgends. Auskommentiert und markiert. |
| **`@ts-nocheck` in 8 Dateien** | Jede verdeckt genau die Fehler, die diese Sitzung gefunden hat. Entfernen bringt zunächst viele Typfehler — das ist Arbeit, aber sie ist der Grund, warum die vier `ReferenceError` überhaupt entstehen konnten. |
| **§ 312k Abs. 4** | Die Bestätigung in Textform wird in `mail_queue` eingereiht. **Solange kein Versender daranhängt, ist die Pflicht nicht erfüllt.** Steht so im Code. |
| **Klar Plus** | Kein Zugang ohne Zahlungsanbindung (Store-Beleg bzw. RevenueCat-Webhook). |
| **Moderator-Claim** | Kein Konto hat ihn. Ohne ihn kann niemand verifizieren — die Verifizierung ist gebaut, aber noch nicht bedienbar. |
| **Gemini-Schlüssel** | weiterhin nicht rotiert. Das kann kein Code. |

---

## 4. Erste Schritte

```bash
npm install
npm run verify      # Typprüfung + Kontraste + Logiktests + Firestore-Regeln
npm run dev
```

`verify` enthält jetzt `test:rules`. Der Schritt startet den Firestore-Emulator
(Java 17 — im Devcontainer vorhanden) und führt 35 Fälle gegen
`firestore.rules` aus. Nur dieser Schritt kann rot werden; die anderen drei
sind bei Ihnen bereits grün gelaufen.

Node 22.22.2+ ist Pflicht. Der erste Push löst `verify.yml` aus.
