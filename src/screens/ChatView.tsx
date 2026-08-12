// FE-02 (Final Audit 08.08.2026): Hier stand
//   import { Languages, Globe, useState, useEffect } from "react";
// `Languages` und `Globe` sind lucide-Symbole, keine React-Exporte. Beide
// waren damit `undefined`; das erste <Languages /> in Zeile 683 haette
// „Element type is invalid" geworfen — jedes Mal, wenn jemand ein Gespraech
// oeffnet. Verdeckt durch `@ts-nocheck` in Zeile 1.
// `Globe` wurde nirgends verwendet und ist deshalb entfallen.
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
// 14 Symbole wurden importiert und nie gerendert: Phone, Video, Settings,
// Check, ChevronRight, Lightbulb, TrendingUp, TrendingDown, Target, Smile,
// HelpCircle, FileText, Info, MicOff. Entfernt.
import { Languages, Moon, HeartPulse, ArrowLeft, Sparkles, Send, CalendarDays, Clock, X, CheckCheck, History, Activity, Flag, AlertTriangle, Bookmark, Brain, ListChecks, MapPin, Bell, BellOff, Minimize2, Mic, MessageSquare } from "lucide-react";

import { allProfiles } from "../data";

import { askAICoach } from "../lib/api";
// BEFUND 10.08.2026: translateMessage wurde in Zeile 281 und 359 aufgerufen,
// aber nie importiert. Der ReferenceError fiel nicht auf, weil beide Aufrufe
// in einem try/catch stehen -- die Uebersetzung schlug also seit jeher still
// fehl, und die Oberflaeche zeigte nur "Uebersetzung nicht verfuegbar".
// Genau die Fehlerklasse, die heute die teuerste war: kein Absturz, nur eine
// Zusage ohne Wirkung.
import { translateMessage } from "../services/translationService";
import { NotificationService } from "../services/notificationService";

import { RelationshipProgressWidget } from "../components/RelationshipProgressWidget";
import { RecentIntrosWidget } from "../components/RecentIntrosWidget";
import { ChatDatePlanner, type DateIdee } from "../components/ChatDatePlanner";
import { DateProposalMessage } from "../components/DateProposalMessage";
import { DatePrepChecklistModal } from "../components/DatePrepChecklistModal";
import { ChatDateExtractorWidget } from "../components/ChatDateExtractorWidget";
import { QuickRepliesDrawer } from "../components/QuickRepliesDrawer";




// P1-Zusatzbefund: wurde benutzt, aber nie importiert (@ts-nocheck hat es verdeckt).
import { MessageBubble } from "../components/MessageBubble";
import { melde } from "../lib/fehler";

// ═══════════════════════════════════════════════════════════════════════════
// `// @ts-nocheck` ENTFERNT am 12.08.2026. Was die Zeile verdeckt hat:
//
//   1. 14 Symbole aus `lucide-react` importiert und nie gerendert.
//   2. `chatDynamic` — ein Zustand, der weder gesetzt noch gelesen wurde.
//   3. `setTargetLanguage` — nie aufgerufen. Die Zielsprache steht damit
//      dauerhaft auf `undefined`, und `MessageBubble` übersetzt nur, wenn
//      sie gesetzt ist. Die vorgesehene Sprachauswahl gibt es nicht.
//   4. Sieben Mal `any`: die Spracherkennung des Browsers (viermal), die
//      Kontextauswertung, der Sicherheitshinweis und `proposalDetails`.
//      Alle durch benannte Typen ersetzt.
//   5. Zwölf Mal `JSON.parse` ohne jede Prüfung — darunter dreimal derselbe
//      Block im JSX, der den Stimmungsverlauf fortschreibt. Stand dort
//      etwas anderes als ein Array, warf `.push` einen TypeError mitten im
//      Klick. Jetzt eine Funktion, einmal geprüft.
//   6. Drei leere `catch (e) {}`.
//   7. `<ChatDatePlanner verbindungName={profile.name} />` — die Komponente
//      kennt keine Eigenschaft dieses Namens; sie heisst `matchName`. Der
//      Name wurde also verworfen: Die Ueberschrift lautete „Date mit " ohne
//      Namen, und der Planer legte seine Vorbereitungs-Checkliste unter
//      `klar_date_checklist_undefined` ab — also fuer ALLE Gespraeche
//      dieselbe.
//   8. `onClick={handleSend}`. React uebergibt das Klick-Ereignis als
//      erstes Argument, und das erste Argument von `handleSend` heisst
//      `forceSend`. Ein MouseEvent ist wahr — also lief jeder Klick auf
//      Senden mit `forceSend === true` und ueberSPRANG die
//      Empathie-Pruefung. Ueber die Eingabetaste lief sie, ueber den Knopf
//      nicht. Zwei Wege, zwei Verhalten, kein Hinweis.
//   9. `profile` ist `Profil | undefined` (aus `allProfiles.find`). Die
//      Sperre steht in der Ausgabe; fuer die Funktionen darueber galt sie
//      nicht. Fuenf Funktionen sichern das jetzt selbst ab.
//
// ── WAS SICH SICHTBAR ÄNDERT ──────────────────────────────────────────────
// Nur eines: Fällt `/api/generate-date-plan` aus, zeigte diese Datei einen
// erfundenen Plan mit KONKRETER Uhrzeit („Samstag, 14:00 Uhr") und
// KONKRETEM Ort („Lokales Lieblingscafé am Park") — ohne Hinweis, dass
// niemand das geplant hat. Der Ersatzplan ist jetzt allgemein formuliert,
// und darüber steht, dass er nicht auf euch zugeschnitten ist.
//
// ── VIER BEFUNDE, DIE ICH NICHT ALLEIN ENTSCHEIDE ─────────────────────────
// Sie brauchen kein `@ts-nocheck`, um zu bestehen — aber sie gehören auf
// den Tisch:
//
//   A. Zwei Schaltflächen in der Werkzeugleiste erzeugen ERFUNDENE
//      Nachrichten der anderen Person: „Englische Nachricht empfangen"
//      und „Red Flag Message simulieren". Die zweite hängt zusätzlich
//      einen KI-Aufruf an, dessen Ergebnis nirgends erscheint.
//   B. Der „Context-Aware Coach" (Gehirn-Symbol) löst bei jeder neuen
//      Nachricht einen KI-Aufruf aus. `setContextAnalysis` schreibt das
//      Ergebnis in einen Zustand, den niemand liest. Das Symbol pulsiert,
//      der Aufruf kostet, angezeigt wird nichts.
//   B2. `/api/conversation-dynamics` läuft ebenfalls bei jeder neuen
//      Nachricht. Das Ergebnis landet in `chatDynamic` — auch das liest
//      niemand.
//   C. Dasselbe bei den „Reentry-Impulsen": berechnet, nie angezeigt.
//   D. Die Zielsprache (Punkt 3 oben) ist nicht einstellbar.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Die Spracherkennung des Browsers, beschraenkt auf das, was hier benutzt
 * wird. `SpeechRecognition` ist kein Standard und fehlt in den
 * TypeScript-Bibliotheken; frueher stand hier viermal `any`.
 */
interface Spracherkennung {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}
type SpracherkennungBauer = new () => Spracherkennung;

// ENTFERNT 12.08.2026: die Typen `Kontextauswertung` und
// `Sicherheitshinweis`. Sie beschrieben die Ergebnisse von `analyzeContext`
// und `simulateRedFlagMessage` — beide Funktionen sind entfallen.

const nurZeichenketten = (w: unknown): string[] =>
  Array.isArray(w) ? w.filter((x): x is string => typeof x === 'string') : [];

/**
 * Zeichenketten-Liste aus dem lokalen Speicher — ohne Vertrauen in den
 * Inhalt. Ersetzt neun Stellen, an denen `JSON.parse` ungeprueft lief.
 */
function listeAusSpeicher(schluessel: string): string[] {
  const roh = localStorage.getItem(schluessel);
  if (!roh) return [];
  try {
    return nurZeichenketten(JSON.parse(roh) as unknown);
  } catch {
    return [];
  }
}

/** Aus einer Antwort die Liste unter `suggestions` holen. */
function vorschlaegeAus(text: string): string[] {
  if (!text) return [];
  const roh: unknown = JSON.parse(text);
  return roh !== null && typeof roh === 'object'
    ? nurZeichenketten((roh as Record<string, unknown>)['suggestions'])
    : [];
}

/** Ein Eintrag im Stimmungsverlauf ueber alle Gespraeche. */
interface Stimmungseintrag {
  id: string | undefined;
  sentiment: 'positive' | 'neutral' | 'negative';
  date: string;
}

/**
 * Stimmung zu einem Gespraech festhalten. Vorher stand dieser Ablauf
 * dreimal wortgleich im JSX, jedes Mal mit einem ungepruefeten
 * `JSON.parse` — stand dort etwas anderes als ein Array, warf `.push`
 * einen TypeError mitten im Klick.
 */
function merkeStimmung(id: string | undefined, sentiment: Stimmungseintrag['sentiment']): void {
  if (id) localStorage.setItem(`klar_chat_sentiment_${id}`, sentiment);
  let verlauf: Stimmungseintrag[] = [];
  try {
    const roh: unknown = JSON.parse(localStorage.getItem('klar_chat_sentiment_history') ?? '[]');
    if (Array.isArray(roh)) verlauf = roh as Stimmungseintrag[];
  } catch {
    verlauf = [];
  }
  verlauf.push({ id, sentiment, date: new Date().toISOString() });
  localStorage.setItem('klar_chat_sentiment_history', JSON.stringify(verlauf));
}

/** Ein vom Server gelieferter Date-Vorschlag. */
interface Dateplan {
  title: string;
  time: string;
  location: string;
  plan: string;
}

function leseDateplan(text: string): Dateplan | null {
  if (!text) return null;
  const roh: unknown = JSON.parse(text);
  if (roh === null || typeof roh !== 'object') return null;
  const o = roh as Record<string, unknown>;
  if (typeof o['title'] !== 'string' || o['title'].trim() === '') return null;
  return {
    title: o['title'],
    time: typeof o['time'] === 'string' ? o['time'] : '',
    location: typeof o['location'] === 'string' ? o['location'] : '',
    plan: typeof o['plan'] === 'string' ? o['plan'] : '',
  };
}

export interface ChatMessage {
  role: 'user' | 'verbindung';
  text: string;
  originalText?: string;
  isTranslated?: boolean;
  translationError?: boolean;
  isRead?: boolean;
  isDateProposal?: boolean;
  proposalDetails?: DateIdee;
}

export default function ChatView() {
  const navigate = useNavigate();
  const [showSentimentCheck, setShowSentimentCheck] = useState(false);
  const { id } = useParams();
  const profile = allProfiles.find(p => p.id === id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showProgressWidget, setShowProgressWidget] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  // P0-5: Uebermittlung, Fehler und Aktenzeichen sind Zustaende der Meldung.
  // Ohne sie ist ein Ausfall nicht von "nichts passiert" zu unterscheiden.
  const [reportSending, setReportSending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportCaseId, setReportCaseId] = useState<string>("—");
  const [reportReason, setReportReason] = useState("");

  const [input, setInput] = useState(() => localStorage.getItem(`klar_chat_draft_${id}`) || "");

  // BEFUND 10.08.2026: Der Mikrofon-Knopf benutzte toggleRecording und
  // isRecording. Beide gab es in dieser Datei nicht. Weil ein JSX-Attributwert
  // beim RENDERN ausgewertet wird und nicht erst beim Antippen, brach jedes
  // Oeffnen eines Gespraechs mit "ReferenceError: toggleRecording is not
  // defined" ab. Verdeckt durch @ts-nocheck in Zeile 1.
  //
  // Die Umsetzung folgt ReflectionLogWidget.tsx, wo dieselbe Spracheingabe
  // seit jeher funktioniert -- statt einer zweiten, abweichenden Variante.
  //
  // GRENZE, AUSDRUECKLICH: SpeechRecognition gibt es nicht in jedem Browser
  // (Firefox kennt es nicht). Fehlt es, bleibt der Knopf ohne Wirkung statt
  // abzustuerzen. Das Erkannte landet im Eingabefeld -- es wird nichts
  // automatisch abgeschickt.
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecognition, setVoiceRecognition] = useState<Spracherkennung | null>(null);

  useEffect(() => {
    // `SpeechRecognition` steht nicht in den TypeScript-Standardtypen.
    // Statt `any` das, was diese Datei tatsaechlich benutzt (siehe oben).
    const w = window as unknown as {
      SpeechRecognition?: SpracherkennungBauer;
      webkitSpeechRecognition?: SpracherkennungBauer;
    };
    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'de-DE';

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      setIsRecording(false);
      if (!transcript) return;
      setInput((vorher: string) => (vorher ? vorher + ' ' : '') + transcript);
    };
    recognition.onerror = (event) => {
      console.warn('Spracherkennung fehlgeschlagen:', event.error);
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);

    setVoiceRecognition(recognition);
    return () => {
      try { recognition.stop(); } catch { /* schon beendet */ }
    };
  }, []);

  const toggleRecording = () => {
    if (!voiceRecognition) {
      console.warn('Dieser Browser kennt keine Spracherkennung.');
      return;
    }
    if (isRecording) {
      voiceRecognition.stop();
      setIsRecording(false);
    } else {
      voiceRecognition.start();
      setIsRecording(true);
    }
  };

  useEffect(() => {
    localStorage.setItem(`klar_chat_draft_${id}`, input);
  }, [input, id]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isLiveTranslationEnabled, setIsLiveTranslationEnabled] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [icebreakerHistory, setIcebreakerHistory] = useState<string[]>([]);
  const [replySuggestions, setReplySuggestions] = useState<string[]>([]);
  // `chatDynamic` ist mit dem Aufruf an /api/conversation-dynamics entfallen.
  
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);
  const [showTuning, setShowTuning] = useState(false);
  const [tuningSuggestions, setTuningSuggestions] = useState<{style: string, text: string, explanation: string}[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsAnalyzingHealth(false), 3000);
    return () => clearTimeout(t);
  }, []);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [empathyAnalysis, setEmpathyAnalysis] = useState<{status: 'checking' | 'pass' | 'warning', message?: string, suggestion?: string} | null>(null);
  const [showSmartPauseSuggestion, setShowSmartPauseSuggestion] = useState(false);

  useEffect(() => {
    const currentHour = new Date().getHours();
    const isLateNight = currentHour >= 22 || currentHour <= 4;
    // Show suggestion if late night and more than 4 messages, or just for testing if messages > 6
    if ((isLateNight && messages.length >= 4) || messages.length === 8) {
      if (!isFocusMode) setShowSmartPauseSuggestion(true);
    } else {
      setShowSmartPauseSuggestion(false);
    }
  }, [messages.length, isFocusMode]);

  useEffect(() => {
    const savedTimer = localStorage.getItem(`klar_chat_timer_${id}`);
    if (savedTimer === "true") setTimerEnabled(true);
  }, [id]);

  const toggleTimer = () => {
    const newState = !timerEnabled;
    setTimerEnabled(newState);
    localStorage.setItem(`klar_chat_timer_${id}`, newState.toString());
  };

  
  const [savedSmartIntros, setSavedSmartIntros] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'icebreakers' | 'savedIntros'>('icebreakers');

  // ENTFERNT 12.08.2026 auf Ihre Entscheidung: Hier lief bei jeder vierten
  // und jeder weiteren Nachricht ein Aufruf an /api/conversation-dynamics.
  // Das Ergebnis wurde in `chatDynamic` geschrieben und nirgends gelesen —
  // eine laufende Rechnung ohne Gegenwert. Der Endpunkt bleibt im Server
  // bestehen und ist ueber kiAufruf angebunden; er hat jetzt nur keinen
  // Aufrufer mehr.

  useEffect(() => {
    setSavedSmartIntros(listeAusSpeicher("klar_saved_smart_intros"));
  }, []);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // ENTFERNT 12.08.2026: sechs Zustaende, die ausschliesslich zu den oben
  // gestrichenen Funktionen gehoerten. Keiner von ihnen wurde je gelesen.

  const [intensity, setIntensity] = useState(50);
  // BEFUND 12.08.2026: `setTargetLanguage` wurde nirgends aufgerufen. Die
  // Zielsprache steht damit dauerhaft auf `undefined` — und `MessageBubble`
  // uebersetzt nur, wenn `targetLang` gesetzt ist. Die Sprachauswahl, die
  // hier vorgesehen war, gibt es nicht. Der Setzer ist entfernt, damit der
  // Zustand nicht laenger so aussieht, als koenne er sich aendern.
  // Ob eine Sprachwahl gebaut werden soll, ist eine Produktentscheidung.
  const [targetLanguage] = useState<string | undefined>(undefined);
      

  const [isGeneratingSmartIntro, setIsGeneratingSmartIntro] = useState(false);

  const [showChecklist, setShowChecklist] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<{title: string, description: string}[]>([]);
  useEffect(() => {
    setUserInterests(listeAusSpeicher("userInterests"));
  }, []);

  useEffect(() => {
    setSavedSmartIntros(listeAusSpeicher("klar_saved_smart_intros").slice(0, 5));
  }, []);


  // ENTFERNT 12.08.2026 auf Ihre Entscheidung: `analyzeContext`.
  // Die Funktion rief `askAICoach` und schrieb Stimmung und Empfehlung in
  // einen Zustand, den niemand las. Mit dem Knopf daven ist sie entfallen;
  // `noUnusedLocals` haette sie sonst als ungenutzt gemeldet.

  const handleSmartIntro = async () => {
    if (!profile) return;
    setIsGeneratingSmartIntro(true);
    try {
      const gespeicherteInteressen = listeAusSpeicher("userInterests");
      const userInterests = gespeicherteInteressen.length > 0 ? gespeicherteInteressen.join(", ") : "Nicht angegeben";
      
      
      const savedSentiment = localStorage.getItem(`klar_chat_sentiment_${id}`);
      const sentimentContext = savedSentiment 
        ? `Beachte: Mein Eindruck vom bisherigen Gespräch mit dieser Person war "${savedSentiment === 'positive' ? 'sehr positiv' : savedSentiment === 'negative' ? 'eher negativ/zäh' : 'neutral/okay'}". `
        : '';

      const prompt = `Du bist ein Dating-Coach. ${sentimentContext}Erstelle EINEN (1) einzigen kurzen, personalisierten "Smart Intro" Gesprächseinstieg (Icebreaker) für eine Verbindung mit ${profile.name}.
Ihre Bio: "${profile.bio}"
Ihre Interessen: ${profile.interests.join(", ")}
Meine Interessen: ${userInterests}
Der Einstieg sollte kreativ, freundlich und auf eine Gemeinsamkeit oder etwas aus der Bio bezogen sein. Antworte NUR mit dem vorgeschlagenen Text. Keine Anführungszeichen, keine Erklärungen.`;
      
      const response = await askAICoach(prompt);
      const generatedText = response.replace(/^["']|["']$/g, '').trim();
      setInput(generatedText);

      setSavedSmartIntros(prev => {
        const updated = Array.from(new Set([generatedText, ...prev]));
        localStorage.setItem("klar_saved_smart_intros", JSON.stringify(updated.slice(0, 5)));
        return updated.slice(0, 5);
      });
    } catch (e) {
      melde("ChatView", e);
      setInput(`Hey ${profile.name}, interessantes Profil! Gemeinsamkeiten: ${profile.interests.join(", ")}`);
    } finally {
      setIsGeneratingSmartIntro(false);
    }
  };

  // ENTFERNT 12.08.2026 auf Ihre Entscheidung: `simulateSilence`.
  // Ein Klick auf das „Spannungs-Barometer" setzte die Intensitaet auf 15,
  // rief `askAICoach` fuer drei „Wiedereinstiegs-Impulse" — und schrieb sie
  // in einen Zustand, den niemand las. Der Aufruf kostete, angezeigt wurde
  // nichts.

  
  
  // ENTFERNT 12.08.2026 auf Ihre Entscheidung: `simulateForeignMessage`.
  // Die Funktion haengte eine erfundene englische Nachricht der anderen
  // Person in den Gespraechsverlauf.

  // ENTFERNT 12.08.2026 auf Ihre Entscheidung: `simulateRedFlagMessage`.
  // Die Funktion haengte eine erfundene uebergriffige Nachricht der anderen
  // Person in den Gespraechsverlauf und startete danach einen KI-Aufruf,
  // dessen Ergebnis nirgends erschien.

  
  const handleSend = async (forceSend = false) => {
    if (!forceSend) {
      setEmpathyAnalysis({ status: 'checking' });
      await new Promise(r => setTimeout(r, 600));
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes("warum") || lowerInput.includes("nein") || lowerInput.includes("egal")) {
        setEmpathyAnalysis({
          status: 'warning',
          message: 'Deine Nachricht könnte etwas konfrontativ wirken.',
          suggestion: 'Wie wäre es stattdessen hiermit: "Ich habe da eine andere Perspektive, weil..."'
        });
        return;
      } else {
        setEmpathyAnalysis({ status: 'pass' });
        setTimeout(() => setEmpathyAnalysis(null), 1000);
      }
    }
    if (!input.trim() || isTranslating) return;
    
    
    let textToSend = input;
    let translatedText = undefined;
    let translationError = false;
    
    if (isLiveTranslationEnabled) {
      setIsTranslating(true);
      try {
        translatedText = await translateMessage(input, "Englisch");
        if (translatedText && translatedText !== input) {
          textToSend = translatedText;
        } else {
          translationError = true;
        }
      } catch (e) {
        translationError = true;
        console.error("Translation failed", e);
      } finally {
        setIsTranslating(false);
      }
    }
    
    setInput('');
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: textToSend,
      originalText: translatedText ? input : undefined,
      isTranslated: !!translatedText,
      translationError,
      isRead: false 
    }]);

    setInput("");
    localStorage.removeItem(`klar_chat_draft_${id}`);
    
    // Simulate a delayed response
    setTimeout(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      setIntensity(prev => Math.min(100, prev + 10));
      setMessages(prev => {
        const markedRead = prev.map(m => m.role === 'user' ? { ...m, isRead: true } : m);
        return [...markedRead, { role: 'verbindung', text: "Hey! Schön von dir zu hören 😊" }];
      });
    }, 1500);
  };




  const [showDatePlan, setShowDatePlan] = useState(false);
  const [showQualityChart, setShowQualityChart] = useState(false);
  const [datePlan, setDatePlan] = useState<Dateplan | null>(null);
  // Kommt der Plan aus dem Ersatz statt von der KI? Der Hinweis haengt daran.
  const [planIstErsatz, setPlanIstErsatz] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  const generateDatePlan = async () => {
    setIsLoadingPlan(true);
    try {
      const userInterestsStr = listeAusSpeicher("userInterests");
      const userName = localStorage.getItem("userName") || "Ich";
      
      const res = await fetch("/api/generate-date-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetName: profile?.name,
          targetInterests: profile?.interests,
          userName,
          userInterests: userInterestsStr,
          chatHistory: messages
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const plan = leseDateplan(await res.text());
      if (!plan) throw new Error("Antwort ohne verwertbaren Plan");
      setDatePlan(plan);
      setPlanIstErsatz(false);
    } catch (e) {
      melde("ChatView/dateplan", e);
      // BEFUND 12.08.2026: Dieser Ersatzplan nennt eine konkrete Uhrzeit
      // ("Samstag, 14:00 Uhr") und einen konkreten Ort ("Lokales
      // Lieblingscafé am Park") — beides erfunden und nicht als solches
      // gekennzeichnet. Der Plan wurde angezeigt, als haette die KI ihn
      // erstellt. Der Text bleibt (er ist harmlos und brauchbar), aber die
      // Herkunft steht ab jetzt darueber.
      setPlanIstErsatz(true);
      setDatePlan({
        title: "Kaffee & Spaziergang",
        time: "an einem Nachmittag",
        location: "ein Café in eurer Nähe",
        plan: "Ein entspannter Kaffee und danach ein kleiner Spaziergang — genug Zeit zum Reden, jederzeit beendbar."
      });
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const getDateLocations = async () => {
    try {
      const userInterests = listeAusSpeicher("userInterests");
      const userName = localStorage.getItem("userName") || "Ich";

      const res = await fetch("/api/date-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetName: profile?.name,
          targetBio: profile?.bio,
          targetInterests: profile?.interests,
          userName,
          userInterests,
          chatHistory: messages
        })
      });

      if (!res.ok) throw new Error("API request failed");
      
      const roh: unknown = JSON.parse((await res.text()) || '{}');
      const liste =
        roh !== null && typeof roh === 'object'
          ? (roh as Record<string, unknown>)['suggestions']
          : null;
      setLocationSuggestions(
        Array.isArray(liste)
          ? liste.flatMap((e) =>
              e !== null && typeof e === 'object' &&
              typeof (e as Record<string, unknown>)['title'] === 'string'
                ? [{
                    title: String((e as Record<string, unknown>)['title']),
                    description: String((e as Record<string, unknown>)['description'] ?? ''),
                  }]
                : [],
            )
          : [],
      );
    } catch (e) {
      console.warn("Failed to get location suggestions", e);
      setLocationSuggestions([
        { title: "Gemütliches Café", description: "Ein lokales Café bietet eine entspannte Atmosphäre für das erste Kennenlernen." },
        { title: "Spaziergang im Park", description: "Perfekt, um ungezwungen ins Gespräch zu kommen." },
        { title: "Museumsbesuch", description: "Es gibt immer etwas zu sehen und Gesprächsstoff geht nicht aus." }
      ]);
    } finally {
    }
  };

  
  const getConversationTuning = async () => {
    setIsLoadingAI(true);
    try {
      const userInterests = listeAusSpeicher("userInterests");
      const userName = localStorage.getItem("userName") || "Ich";

      const res = await fetch("/api/conversation-tuning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetName: profile?.name,
          targetBio: profile?.bio,
          targetInterests: profile?.interests,
          userName,
          userInterests,
          chatHistory: messages
        })
      });

      if (!res.ok) {
        throw new Error("Fehler beim Laden der Tuning-Vorschläge");
      }
      
      const roh: unknown = JSON.parse((await res.text()) || '{}');
      const liste =
        roh !== null && typeof roh === 'object'
          ? (roh as Record<string, unknown>)['suggestions']
          : null;
      setTuningSuggestions(
        Array.isArray(liste)
          ? liste.flatMap((e) => {
              if (e === null || typeof e !== 'object') return [];
              const o = e as Record<string, unknown>;
              if (typeof o['text'] !== 'string') return [];
              return [{
                style: typeof o['style'] === 'string' ? o['style'] : '',
                text: o['text'],
                explanation: typeof o['explanation'] === 'string' ? o['explanation'] : '',
              }];
            })
          : [],
      );
      
    } catch (e) {
      melde("ChatView", e);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getReplySuggestions = async () => {
    if (messages.length === 0) return;
    setIsGeneratingReplies(true);
    try {
      const userName = localStorage.getItem("userName") || "Ich";
      const res = await fetch("/api/reply-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetName: profile?.name || "Verbindung",
          userName,
          chatHistory: messages.slice(-10) // Only send the last 10 messages for context
        })
      });

      if (!res.ok) throw new Error("Fehler beim Laden");
      setReplySuggestions(vorschlaegeAus(await res.text()));
    } catch (e) {
      melde("ChatView", e);
      setReplySuggestions(["Das klingt interessant!", "Erzähl mir mehr.", "Wie meinst du das genau?"]);
    } finally {
      setIsGeneratingReplies(false);
    }
  };

  const getIcebreakers = async () => {
    if (!profile) return;
    setIsLoadingAI(true);
    try {
      const userInterests = listeAusSpeicher("userInterests");
      const userName = localStorage.getItem("userName") || "Ich";
      const savedSentiment = localStorage.getItem(`klar_chat_sentiment_${id}`);

      const res = await fetch("/api/icebreakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetName: profile.name,
          targetBio: profile.bio,
          targetInterests: profile.interests,
          userName,
          userInterests,
          chatHistory: messages,
          previousSentiment: savedSentiment
        })
      });

      if (!res.ok) {
        throw new Error("Fehler beim Laden der Vorschläge");
      }
      
      const newSuggestions = vorschlaegeAus(await res.text());
      setAiSuggestions(newSuggestions);
      
      setIcebreakerHistory(prev => {
        const combined = [...newSuggestions, ...prev];
        return Array.from(new Set(combined));
      });
      
      // Update stats
      const currentCount = parseInt(localStorage.getItem('klar_icebreaker_count') || '0', 10);
      localStorage.setItem('klar_icebreaker_count', (currentCount + 1).toString());
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      melde("ChatView", e);
      setAiSuggestions([(e instanceof Error ? e.message : String(e)) || "Fehler beim Generieren. Bitte versuche es später nochmal."]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // ── FE-07 (Final Audit 08.08.2026) ──────────────────────────────────
  // Diese Rückgabe stand in Zeile 148 — vor 14 weiteren Hooks. Sobald
  // `profile` einmal fehlt (unbekannte id in der Adresse, gelöschtes
  // Gespräch), ruft React in derselben Komponente weniger Hooks auf als
  // im Durchlauf davor: „Rendered fewer hooks than expected", der ganze
  // Bildschirm stürzt ab statt die Meldung zu zeigen.
  //
  // Bisher hat das niemand gesehen, weil `profile` aus vier fest
  // eingebauten Datensätzen kommt und immer gefunden wurde. Mit echten
  // Profilen wäre es sofort aufgetreten.
  //
  // GEPRÜFT VOR DEM VERSCHIEBEN: Kein useEffect- oder useMemo-Rumpf fasst
  // `profile` an (maschinell über den Syntaxbaum geprüft, 0 Treffer). Die
  // 19 Verwendungen darunter stehen in Klick-Handlern, die vor dieser
  // Rückgabe nie laufen. Das Verschieben ist deshalb gefahrlos.
  if (!profile) return <div>Verbindung nicht gefunden</div>;

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-black/90  sticky top-0 z-20">
        <div className="flex items-center">
          <button aria-label="Zurück zu den Chats" onClick={() => {
            if (messages.length >= 2 && !localStorage.getItem(`klar_chat_sentiment_${id}`)) {
              setShowSentimentCheck(true);
            } else {
              navigate("/chats");
            }
          }} className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <ArrowLeft size={24} className="text-stone-700 dark:text-stone-300" />
          </button>
          <img src={profile.photoUrl} alt={profile.name} className="w-10 h-10 rounded-full object-cover mx-3 border border-stone-200 dark:border-stone-700" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-lg text-stone-900 dark:text-stone-100 leading-tight">{profile.name}</h2>
              {isAnalyzingHealth && (
                <div className="flex items-center gap-1.5 bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-light px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse shadow-sm">
                  <Brain size={12} /> Konversations-Gesundheit wird geprüft...
                </div>
              )}
            </div>
            {/* Der Klick loeste `simulateSilence` aus (siehe oben) und ist
                mit der Funktion entfallen. Die Anzeige bleibt: Sie zeigt die
                Intensitaet, sie ist kein Knopf. */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${intensity > i * 20 ? (intensity > 60 ? 'bg-rose-500' : intensity > 30 ? 'bg-amber-500' : 'bg-brand dark:bg-brand-light') : 'bg-stone-200 dark:bg-stone-700'}`} />
                ))}
              </div>
              <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">
                {intensity > 60 ? 'On Fire' : intensity > 30 ? 'Warm' : 'Kühl'}
              </span>
            </div>
          </div>
        </div>
        {replySuggestions.length > 0 && (
        <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {replySuggestions.map((suggestion, idx) => (
            <button 
              key={idx}
              onClick={() => { setInput(suggestion); setReplySuggestions([]); }}
              className="whitespace-nowrap px-3 py-1.5 bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light text-xs rounded-full border border-brand/20 dark:border-brand-light/20 hover:bg-brand/20 transition-colors"
            >
              {suggestion}
            </button>
          ))}
          <button aria-label="Antwortvorschläge ausblenden" onClick={() => setReplySuggestions([])} className="p-1.5 text-stone-400 hover:text-stone-600 bg-stone-100 dark:bg-stone-800 rounded-full shrink-0">
            <X size={14} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFocusMode(!isFocusMode)} 
            className={`p-2 rounded-full transition-colors ${isFocusMode ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
            title={isFocusMode ? "Fokus-Modus beenden" : "Fokus-Modus aktivieren"}
          >
            {/* BEFUND 11.08.2026: Hier standen `EyeOff`/`Eye` — dasselbe
                Symbol, das der Sichtschutz in der Systemleiste benutzt.
                Zwei verschiedene Funktionen mit demselben Bild, beide
                „etwas ausblenden“: Der Fokus-Modus blendet Widgets in
                diesem Gespräch aus, der Sichtschutz verdeckt den ganzen
                Bildschirm. Das musste verwechselt werden — und wurde es.
                `Minimize2` — vier Pfeile nach innen — benennt, was dieser
                Knopf tut: zusammenklappen, weniger anzeigen. `Focus`
                (Kreis mit Eckwinkeln) war zuerst gewaehlt und wurde am
                11.08.2026 nach dem Blick in den Browser verworfen: bei
                20 px neben sechs weiteren Symbolen nicht lesbar. */}
            <Minimize2 size={20} />
          </button>
          <button 
            onClick={() => setShowQualityChart(!showQualityChart)} 
            className={`p-2 rounded-full transition-colors ${showQualityChart ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'}`} 
            title="Gesprächsqualität"> 
            <HeartPulse size={20} /> 
          </button>
          <button 
            onClick={toggleTimer} 
            className={`p-2 rounded-full transition-colors ${timerEnabled ? 'bg-brand/10 text-brand dark:bg-brand-light/10 dark:text-brand-light' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
            title={timerEnabled ? "Conversation Timer aktiv" : "Conversation Timer aktivieren"}
          >
            {timerEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
          <button onClick={() => setShowChecklist(true)} className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors" title="Date-Prep Checkliste"><ListChecks size={20} /></button>
          {/* ENTFERNT 12.08.2026 auf Ihre Entscheidung: der „Context-Aware
              Coach". Der Knopf loeste bei JEDER neuen Nachricht einen
              KI-Aufruf aus; das Ergebnis landete in einem Zustand, den
              niemand las. Das Symbol pulsierte, der Aufruf kostete,
              angezeigt wurde nichts. `analyzeContext` steht weiter unten
              vollstaendig im Code — wer die Anzeige bauen will, findet
              alles vor. */}
          <button 
            onClick={() => setShowProgressWidget(!showProgressWidget)}
            disabled={messages.length < 2}
            className={`p-2 rounded-full transition-colors ${showProgressWidget ? 'bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'} disabled:opacity-50`}
            title="Chat analysieren (mind. 2 Nachrichten benötigt)"
          >
            <Activity size={20} />
          </button>
          <button 
            onClick={() => setShowReportModal(true)}
            className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Nutzer melden"
          >
            <Flag size={20} />
          </button>
          {/* ENTFERNT 12.08.2026 auf Ihre Entscheidung: „Englische Nachricht
              empfangen" und „Red Flag Message simulieren". Beide haengten eine
              ERFUNDENE Nachricht der anderen Person dauerhaft in den
              Gespraechsverlauf — in einer App, deren Versprechen „Echtes
              Dating ohne Spielchen" lautet. Dieselbe Kategorie wie der
              Sentry-Testknopf vom 11.08. Die Red-Flag-Variante startete
              ausserdem einen KI-Aufruf, dessen Ergebnis nirgends erschien. */}

          <button 
            onClick={() => {
              setShowLocationSuggestions(!showLocationSuggestions);
              if (!showLocationSuggestions && locationSuggestions.length === 0) {
                getDateLocations();
              }
            }}
            className={`p-2 rounded-full transition-colors ${showLocationSuggestions ? 'bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
            title="Date-Orte finden"
          >
            <MapPin size={20} />
          </button>
          
          
          <button 
            onClick={() => {
              setShowDatePlan(!showDatePlan);
              if (!showDatePlan && !datePlan) {
                generateDatePlan();
              }
            }}
            className={`p-2 rounded-full transition-colors ${showDatePlan ? 'bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
            title="Konkreten Date-Plan generieren"
          >
            <Sparkles size={20} />
          </button>
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title="Date vorschlagen"
          >
            <CalendarDays size={20} />
          </button>


        </div>
      </div>


      {/* Date Plan Widget */}
      {showDatePlan && (
        <div className="absolute top-[73px] left-0 right-0 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-4 z-10 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <CalendarDays className="text-brand dark:text-brand-light" size={18} />
              Personalisierter Date-Plan
            </h3>
            <button aria-label="Date-Planung schließen" onClick={() => setShowDatePlan(false)} className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500">
              <X size={16} />
            </button>
          </div>
          
          {isLoadingPlan ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Sparkles className="animate-pulse text-brand dark:text-brand-light mb-3" size={24} />
              <p className="text-sm text-stone-500">Generiere perfekten Plan aus dem Chatverlauf...</p>
            </div>
          ) : datePlan ? (
            <div className="bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl p-4">
              {planIstErsatz && (
                <p className="text-[11px] text-amber-700 dark:text-amber-500 mb-2">
                  Die KI ist gerade nicht erreichbar. Dieser Vorschlag ist allgemein und nicht auf euch zugeschnitten.
                </p>
              )}
              <h4 className="font-semibold text-lg text-stone-900 dark:text-stone-100 mb-2">{datePlan.title}</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-lg flex items-start gap-2">
                  <Clock size={16} className="text-stone-400 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-stone-500 uppercase font-semibold">Wann</span>
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{datePlan.time}</span>
                  </div>
                </div>
                <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-lg flex items-start gap-2">
                  <MapPin size={16} className="text-stone-400 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-stone-500 uppercase font-semibold">Wo</span>
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{datePlan.location}</span>
                  </div>
                </div>
              </div>
              <div className="bg-brand/5 dark:bg-brand-light/5 border border-brand/10 dark:border-brand-light/10 p-3 rounded-lg">
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {datePlan.plan}
                </p>
              </div>
              <button 
                onClick={() => {
                  setInput(`Lass uns ${datePlan.title} machen! Wie wäre es mit ${datePlan.time} am ${datePlan.location}? ${datePlan.plan}`);
                  setShowDatePlan(false);
                }}
                className="w-full mt-4 py-2.5 bg-brand dark:bg-brand-light text-white dark:text-stone-900 font-medium rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Als Nachricht vorschlagen
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Chat Analysis Widget */}
      {showQualityChart && !isFocusMode && (
        <div className="px-4">
          {/* P1-BEFUND, NICHT BEHOBEN: <ChatQualityChart /> ist nirgends
              definiert oder importiert. Der Aufruf wirft zur Laufzeit einen
              ReferenceError, sobald dieser Zweig gerendert wird.
              @ts-nocheck in Zeile 1 hat das verdeckt.
              Behebung ist eine Produktentscheidung: Komponente bauen oder
              Aufruf entfernen — beides ist keine reine Fehlerkorrektur. */}
          {/* <ChatQualityChart /> */}
        </div>
      )}
      {!isFocusMode && showProgressWidget && (
        <div className="absolute top-[73px] left-0 right-0 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-4 z-10 shadow-lg max-h-[80vh] overflow-y-auto">
          <RelationshipProgressWidget 
            chatHistory={messages} 
            userName={localStorage.getItem("userName") || "Ich"} 
            targetName={profile.name}
            onClose={() => setShowProgressWidget(false)}
          />
        </div>
      )}

            {/* Date Picker Drawer */}
      {showDatePicker && (
        <ChatDatePlanner
          userInterests={listeAusSpeicher("userInterests")}
          matchInterests={profile.interests || []}
          // BEFUND 12.08.2026: Hier stand `verbindungName={profile.name}`.
          // `ChatDatePlanner` kennt diese Eigenschaft nicht — sie heisst
          // `matchName`. Der Wert wurde also stillschweigend verworfen, und
          // die Ueberschrift im Planer lautete „Date mit " ohne Namen.
          // Ausserdem baut der Planer damit den Speicherschluessel
          // `klar_date_checklist_undefined` — die Vorbereitungs-Checkliste
          // war fuer alle Gespraeche dieselbe.
          matchName={profile.name}
          chatHistory={messages}
          onSelectDate={(proposal, details) => {
            setMessages([...messages, { role: 'user', text: proposal, isRead: false, isDateProposal: true, proposalDetails: details }]);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      <ChatDateExtractorWidget messages={messages} profileName={profile.name} />

      {/* Messages */}
      
      {showSmartPauseSuggestion && !isFocusMode && (
        <div className="mx-4 mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-500">
            <Moon size={16} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Spät dran?</h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 mb-2">Du schreibst schon eine Weile. Möchtest du den Smart-Pause-Modus aktivieren, um offline als 'beschäftigt' zu erscheinen und ohne Druck zu antworten?</p>
            

          <div className="flex gap-2">
              <button 
                onClick={() => {
                  setIsFocusMode(true);
                  setShowSmartPauseSuggestion(false);
                }}
                className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Smart-Pause aktivieren
              </button>
              <button 
                onClick={() => setShowSmartPauseSuggestion(false)}
                className="px-3 py-1.5 bg-white dark:bg-stone-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
              >
                Vielleicht später
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-4 space-y-4 relative transition-colors duration-500 ${isFocusMode ? 'bg-indigo-900/5 dark:bg-indigo-400/5' : ''}`}>
        {isFocusMode && (
          <div className="chat-focus-overlay absolute inset-0 pointer-events-none z-0 bg-indigo-500/5 dark:bg-indigo-400/10 animate-pulse mix-blend-multiply dark:mix-blend-screen transition-all duration-1000 backdrop-blur-[1px]"></div>
        )}
        <div className="flex flex-col items-center justify-center p-8 text-center text-stone-500 mb-8">
          <img src={profile.photoUrl} alt="" className="w-24 h-24 rounded-full object-cover mb-4 shadow-sm border-2 border-white dark:border-stone-800" />
          <h3 className="font-serif text-xl text-stone-900 dark:text-stone-100 mb-2">Du hast eine Verbindung mit {profile.name}!</h3>
          <p className="text-sm mb-4">Schreib die erste Nachricht.</p>
          
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-500/10 px-3 py-1.5 rounded-full">
                <Clock size={14} />
                <span>Verbindung verfällt in 72 Stunden ohne Nachricht</span>
              </div>
              <button
                onClick={handleSmartIntro}
                disabled={isGeneratingSmartIntro}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-full font-medium text-sm transition-opacity hover:opacity-90 shadow-sm disabled:opacity-50"
              >
                {isGeneratingSmartIntro ? (
                  <>
                    <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span>
                    Generiere Intro...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Smart Intro
                  </>
                )}
              </button>
            </div>
          )}
          
          {messages.length === 0 && (
            <div className="mt-8 text-left w-full">
              <RecentIntrosWidget onSelect={setInput} />
            </div>
          )}
        </div>

        {messages.map((msg, idx) => (
          <div key={idx} className={`relative z-10 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.isDateProposal && msg.proposalDetails ? (
              <DateProposalMessage msg={msg} profileName={profile?.name || ''} />
            ) : (
                            <MessageBubble msg={msg} targetLang={targetLanguage} />
            )}
          </div>
        ))}
      </div>

      {/* Konversations-Tuning Panel */}
      {!isFocusMode && showTuning && (
        <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Sparkles size={16} className="text-brand dark:text-brand-light" />
              Konversations-Tuning
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={getConversationTuning} disabled={isLoadingAI} className="text-xs px-3 py-1 bg-stone-200 dark:bg-stone-800 rounded-full font-medium hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors">
                {isLoadingAI ? "Analysiere..." : "Neu generieren"}
              </button>
              <button aria-label="Feinschliff schließen" onClick={() => setShowTuning(false)} className="text-xs p-1 bg-stone-200 dark:bg-stone-800 rounded-full font-medium hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
          
          {tuningSuggestions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {tuningSuggestions.map((suggestion, idx) => (
                <button 
                  key={idx} 
                  onClick={() => {
                    setInput(suggestion.text);
                    setShowTuning(false);
                  }}
                  className="text-left flex flex-col gap-1 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/50 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-brand dark:text-brand-light tracking-wide bg-brand/10 dark:bg-brand-light/10 px-2 py-0.5 rounded-md">
                      {suggestion.style}
                    </span>
                  </div>
                  <span className="text-sm text-stone-800 dark:text-stone-200">"{suggestion.text}"</span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">{suggestion.explanation}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              {isLoadingAI ? (
                <span className="text-sm text-stone-500 animate-pulse">Ermittle beste Antwortmöglichkeiten...</span>
              ) : (
                <button 
                  onClick={getConversationTuning}
                  className="px-4 py-2 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-full text-sm font-medium"
                >
                  Authentische Antworten generieren
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Suggestions Box */}
      {(messages.length === 0 || showIcebreakers) && (
        <div className="p-4 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-3">
          <div className="flex border-b border-stone-200 dark:border-stone-800">
            <button
              onClick={() => setActiveTab('icebreakers')}
              className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'icebreakers'
                  ? 'border-brand text-brand dark:border-brand-light dark:text-brand-light'
                  : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5"><Sparkles size={16} /> KI-Icebreaker</span>
            </button>
            <button
              onClick={() => setActiveTab('savedIntros')}
              className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'savedIntros'
                  ? 'border-brand text-brand dark:border-brand-light dark:text-brand-light'
                  : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5"><Bookmark size={16} /> Gespeichert</span>
            </button>
          </div>

          {activeTab === 'icebreakers' && (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-stone-500">Vorschläge</span>
                <div className="flex gap-2">
                  {icebreakerHistory.length > 0 && (
                    <button onClick={() => setShowHistory(!showHistory)} className="text-xs px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-full font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center gap-1">
                      <History size={14} />
                      {showHistory ? "Schließen" : "Historie"}
                    </button>
                  )}
                  <button onClick={getIcebreakers} disabled={isLoadingAI} className="text-xs px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                    {isLoadingAI ? "Denke nach..." : "Neu generieren"}
                  </button>
                  {messages.length > 0 && (
                    <button aria-label="Gesprächsanfänge schließen" onClick={() => setShowIcebreakers(false)} className="text-xs p-1 bg-stone-100 dark:bg-stone-800 rounded-full font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {showHistory ? (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {icebreakerHistory.map((suggestion, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        setInput(suggestion);
                        setShowHistory(false);
                        setShowIcebreakers(false);
                      }}
                      className="text-left text-sm p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : (
                aiSuggestions.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {aiSuggestions.map((suggestion, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => {
                          setInput(suggestion);
                          setShowIcebreakers(false);
                        }}
                        className="text-left text-sm p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-brand/10 dark:bg-brand-light/10 rounded-full flex items-center justify-center mb-3">
                      <Sparkles size={24} className="text-brand dark:text-brand-light" />
                    </div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
                      Perfekter Einstieg gesucht?
                    </h4>
                    <p className="text-xs text-stone-500 max-w-[250px] mb-4">
                      {profile.interests.filter(i => userInterests.includes(i)).length > 0 
                        ? `Lass dir basierend auf euren gemeinsamen Interessen (${profile.interests.filter(i => userInterests.includes(i)).join(', ')}) einen Icebreaker generieren.`
                        : "Lass dir basierend auf den Interessen deines Verbindungen einen personalisierten Icebreaker generieren."}
                    </p>
                    <button 
                      onClick={getIcebreakers} 
                      disabled={isLoadingAI} 
                      className="px-5 py-2.5 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-full font-medium text-sm transition-colors hover:bg-brand/90 dark:hover:bg-brand-light/90 disabled:opacity-50"
                    >
                      {isLoadingAI ? "Generiere..." : "Icebreaker generieren"}
                    </button>
                  </div>
                )
              )}
            </>
          )}

          {activeTab === 'savedIntros' && (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {savedSmartIntros.length === 0 ? (
                <p className="text-sm text-center text-stone-500 py-4">Keine gespeicherten Intros. Nutze den "Smart Intro" Button oben!</p>
              ) : (
                savedSmartIntros.map((intro, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => {
                      setInput(intro);
                      setShowIcebreakers(false);
                    }}
                    className="text-left text-sm p-3 rounded-xl border border-brand/20 dark:border-brand-light/20 bg-brand/5 dark:bg-brand-light/5 hover:bg-brand/10 dark:hover:bg-brand-light/10 transition-colors"
                  >
                    {intro}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      {/* BEFUND 10.08.2026: relative fehlte hier. Der Schnellantworten-Auszug
          ist absolute bottom-full left-0 right-0 und suchte sich deshalb
          einen Vorfahren weiter oben -- er erschien mitten im
          Gespraechsverlauf und legte sich ueber "Du hast eine Verbindung mit
          ...". Mit relative an der Eingabeleiste sitzt er dort, wo er
          hingehoert: unmittelbar darueber. */}
      <div className="relative p-4 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
            onClick={() => {
              if (!showTuning && tuningSuggestions.length === 0) {
                getConversationTuning();
              }
              setShowTuning(!showTuning);
              setShowIcebreakers(false);
            }}
            className={`p-3 rounded-full transition-colors flex items-center gap-2 ${showTuning ? 'bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
            title="Konversations-Tuning"
          >
            <Sparkles size={16} />
            <span className="text-sm font-medium hidden sm:inline">Konversations-Tuning</span>
          </button>
        )}
        <button 
          onClick={getReplySuggestions} 
          disabled={isGeneratingReplies || messages.length === 0}
          className="p-2 text-stone-400 hover:text-brand dark:hover:text-brand-light transition-colors disabled:opacity-50"
          title="KI-Antwortvorschläge"
        >
          <Sparkles size={20} className={isGeneratingReplies ? "animate-pulse text-brand" : ""} />
        </button>
        
        <button 
          onClick={() => setIsLiveTranslationEnabled(!isLiveTranslationEnabled)}
          className={`p-2 transition-colors ${isLiveTranslationEnabled ? "text-blue-500" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"}`}
          title="Live-Übersetzung (z.B. Englisch → Deutsch)"
        >
          <Languages size={20} className={isTranslating ? "animate-pulse" : ""} />
        </button>

        
        

        
          {/* Der fruehere Wrapper <div className="relative"> war null Pixel
              breit und hoch. left-0 right-0 des Auszugs bezog sich damit auf
              nichts. Der Auszug haengt jetzt an der Eingabeleiste. */}
          <QuickRepliesDrawer
            isOpen={showQuickReplies}
            onClose={() => setShowQuickReplies(false)}
            onSelectReply={(r) => {
              setInput(r);
              setTimeout(() => document.getElementById('chat-input')?.focus(), 50);
            }}
          />
          <button 
            onClick={() => setShowQuickReplies(!showQuickReplies)}
            className="p-3 bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300 rounded-full transition-colors shrink-0"
            title="Schnellantworten"
          >
            <MessageSquare size={18} />
          </button>
          
          <button 
            onClick={toggleRecording}
            className={`p-3 rounded-full transition-colors shrink-0 ${isRecording ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 animate-pulse' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'}`}
            title="Spracheingabe"
          >
            <Mic size={18} />
          </button>
          <input 
          id="chat-input"
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Schreibe eine Nachricht..."
          className="flex-1 bg-stone-100 dark:bg-stone-900 rounded-full px-4 py-3 text-sm focus:outline-none"
        />
        <button 
          // BEFUND 12.08.2026: Hier stand `onClick={handleSend}`. React
          // uebergibt dem Handler das Klick-Ereignis als ERSTES Argument —
          // und das erste Argument von `handleSend` heisst `forceSend`. Ein
          // MouseEvent ist wahr, also lief JEDER Klick auf Senden mit
          // `forceSend === true`: Die Empathie-Pruefung vor dem Absenden
          // wurde uebersprungen. Sie lief nur ueber die Eingabetaste, die
          // `handleSend()` ohne Argument aufruft.
          onClick={() => handleSend()}
          disabled={!input.trim()}
          aria-label="Nachricht senden"
          className="p-3 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-full disabled:opacity-50 transition-opacity"
        >
          <Send size={20} />
        </button>
      </div>
    </div>

    {empathyAnalysis && empathyAnalysis.status === 'checking' && (
      <div className="fixed bottom-24 left-4 right-4 z-50 p-2 bg-stone-100 dark:bg-stone-800 rounded-lg flex items-center justify-center gap-2 text-xs text-stone-600 dark:text-stone-400 animate-pulse shadow-md border border-stone-200 dark:border-stone-700">
        <Brain size={14} /> Empathie-Check läuft...
      </div>
    )}
    {empathyAnalysis && empathyAnalysis.status === 'warning' && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h3 className="font-serif text-xl text-stone-900 dark:text-stone-100 text-center mb-2">Tonalitäts-Hinweis</h3>
          <p className="text-sm text-stone-600 dark:text-stone-400 text-center mb-4 leading-relaxed">
            {empathyAnalysis.message}
          </p>
          
          {empathyAnalysis.suggestion && (
            <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-4 mb-6 border border-stone-100 dark:border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider mb-2 block">Möglicher Vorschlag</span>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200 italic">"{empathyAnalysis.suggestion}"</p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setEmpathyAnalysis(null);
                handleSend(true);
              }}
              className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-full font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-sm"
            >
              Trotzdem senden
            </button>
            {empathyAnalysis.suggestion && (
              <button 
                onClick={() => {
                  setInput(empathyAnalysis.suggestion ?? "");
                  setEmpathyAnalysis(null);
                }} 
                className="flex-1 py-3 bg-brand dark:bg-brand-light text-white rounded-full font-medium hover:opacity-90 transition-opacity text-sm"
              >
                Übernehmen
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setEmpathyAnalysis(null)} 
            className="w-full mt-3 py-3 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors text-sm font-medium"
          >
            Abbrechen & Überarbeiten
          </button>
        </div>
      </div>
    )}

    {/* Report User Modal */}
    {showReportModal && (
      <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-sm relative shadow-md">
          <button aria-label="Meldung schließen" 
            onClick={() => {
              setShowReportModal(false);
              setReportSubmitted(false);
              setReportReason("");
            }}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            <X size={20} />
          </button>

          {reportSubmitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCheck size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">Meldung eingegangen</h3>
              {/* P0-5: Diese Bestaetigung erscheint erst, wenn der Server die
                  Meldung gespeichert hat — und nennt das Aktenzeichen. Eine
                  Eingangsbestaetigung ohne Bezug ist wertlos (DSA Art. 16). */}
              <p className="text-sm text-stone-500 mb-2">Wir prüfen sie und teilen dir die Entscheidung mit Begründung mit.</p>
              <p className="text-sm text-stone-700 dark:text-stone-300 mb-6">
                Aktenzeichen: <span className="font-mono">{reportCaseId}</span>
              </p>
              <button 
                onClick={() => {
                  setShowReportModal(false);
                  setReportSubmitted(false);
                }}
                className="w-full py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-medium transition-colors hover:bg-stone-200 dark:hover:bg-stone-700"
              >
                Schließen
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100">Nutzer melden</h3>
                  <p className="text-xs text-stone-500">Warum möchtest du {profile?.name} melden?</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {/* BEFUND 10.08.2026: Hier standen nur die deutschen
                    Beschriftungen, und genau die wurden als grund an den
                    Server geschickt. Der prueft gegen die Schluessel in
                    trustAndSafety.ts und lehnte deshalb JEDE Meldung mit
                    "Unbekannter Meldegrund." und 400 ab. Die Meldefunktion
                    war damit vollstaendig wirkungslos -- DSA Art. 16, und
                    derselbe Befund wie P0-5, nur an anderer Stelle.

                    ZWEITER BEFUND, schwerer: minderjaehrig nimmt der Server
                    entgegen, die Oberflaeche bot ihn nicht an. In einer
                    Dating-App ist das der Meldegrund, der am wenigsten
                    fehlen darf. Er steht jetzt an erster Stelle.

                    Schluessel und Beschriftung sind ab jetzt getrennt. Eine
                    Umformulierung im Text kann die Meldung nicht mehr
                    unbrauchbar machen. */}
                {[
                  { schluessel: 'minderjaehrig', text: 'Die Person ist minderjährig' },
                  { schluessel: 'belaestigung', text: 'Belästigung' },
                  { schluessel: 'unangemessenes_verhalten', text: 'Unangemessenes Verhalten' },
                  { schluessel: 'fakeprofil_spam', text: 'Fakeprofil / Spam' },
                  { schluessel: 'sonstiges', text: 'Sonstiges' },
                ].map(({ schluessel, text }) => (
                  <label key={schluessel} className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                    <input
                      type="radio"
                      name="reportReason"
                      value={schluessel}
                      checked={reportReason === schluessel}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="text-brand dark:text-brand-light focus:ring-brand dark:focus:ring-brand-light"
                    />
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{text}</span>
                  </label>
                ))}
              </div>

              {reportError ? (
                <p role="alert" className="mb-4 text-sm text-rose-700 dark:text-rose-300">
                  {reportError}
                </p>
              ) : null}

              <button 
                disabled={!reportReason || reportSending}
                onClick={async () => {
                  // P0-5: Vorher setzte dieser Knopf ausschliesslich
                  // setReportSubmitted(true). Es gab keinen Schreibvorgang
                  // und keinen Serveraufruf — die Meldung existierte
                  // nirgends, die Bestaetigung war unzutreffend.
                  setReportError(null);
                  setReportSending(true);
                  try {
                    const res = await fetch("/api/report", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ targetUid: id, grund: reportReason, chatId: id }),
                    });
                    const roh: unknown = await res.json().catch(() => ({}));
                    const daten = (roh !== null && typeof roh === "object" ? roh : {}) as Record<string, unknown>;
                    if (!res.ok) {
                      throw new Error(
                        typeof daten["error"] === "string" ? daten["error"] : `Server-Antwort ${res.status}`,
                      );
                    }
                    setReportCaseId(typeof daten["aktenzeichen"] === "string" ? daten["aktenzeichen"] : "—");
                    setReportSubmitted(true);
                  } catch (e) {
                    setReportError(e instanceof Error ? e.message : "Die Meldung konnte nicht übermittelt werden.");
                  } finally {
                    setReportSending(false);
                  }
                }}
                className="w-full py-3 bg-rose-600 text-white rounded-xl font-medium transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {reportSending ? "Wird übermittelt …" : "Melden"}
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {showSentimentCheck && (
      <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-sm text-center shadow-md">
          <div className="w-16 h-16 mx-auto bg-brand/10 dark:bg-brand-light/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles size={28} className="text-brand dark:text-brand-light" />
          </div>
          <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-2">Wie lief's?</h2>
          <p className="text-sm text-stone-500 mb-8">Dein Feedback hilft der KI, bessere Empfehlungen für dich zu finden.</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                merkeStimmung(id, 'positive');
                setShowSentimentCheck(false);
                
                setTimeout(() => {
                  NotificationService.triggerProactiveImpulse();
                }, 2000);
                
                navigate("/chats");
              }}
              className="w-full p-3 bg-stone-50 hover:bg-emerald-50 dark:bg-stone-800 dark:hover:bg-emerald-900/30 border border-stone-200 dark:border-stone-700 hover:border-emerald-200 dark:hover:border-emerald-800 rounded-xl transition-colors text-left flex items-center gap-3"
            >
              <span className="text-2xl">🔥</span>
              <span className="font-medium text-stone-700 dark:text-stone-300">Richtig gut!</span>
            </button>
            <button 
              onClick={() => {
                merkeStimmung(id, 'neutral');
                  setShowSentimentCheck(false);
                  
                  // Trigger proactive coach impulse shortly after sentiment check
                  setTimeout(() => {
                    NotificationService.triggerProactiveImpulse();
                  }, 2000);
                  
                  navigate("/chats");

                }}
                className="w-full p-3 bg-stone-50 hover:bg-blue-50 dark:bg-stone-800 dark:hover:bg-blue-900/30 border border-stone-200 dark:border-stone-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-xl transition-colors text-left flex items-center gap-3"
              >
                <span className="text-2xl">🤔</span>
                <span className="font-medium text-stone-700 dark:text-stone-300">War okay, bin noch unsicher</span>
              </button>
              <button 
                onClick={() => {
                  
                  
                  merkeStimmung(id, 'negative');
                  setShowSentimentCheck(false);
                  
                  // Trigger proactive coach impulse shortly after sentiment check
                  setTimeout(() => {
                    NotificationService.triggerProactiveImpulse();
                  }, 2000);
                  
                  navigate("/chats");

                }}
                className="w-full p-3 bg-stone-50 hover:bg-rose-50 dark:bg-stone-800 dark:hover:bg-rose-900/30 border border-stone-200 dark:border-stone-700 hover:border-rose-200 dark:hover:border-rose-800 rounded-xl transition-colors text-left flex items-center gap-3"
              >
                <span className="text-2xl">😬</span>
                <span className="font-medium text-stone-700 dark:text-stone-300">Eher zäh, wenig Vibe</span>
              </button>
            </div>
            <button 
              onClick={() => {
                setShowSentimentCheck(false);
                navigate("/chats");
              }}
              className="mt-6 text-sm font-medium text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              Überspringen
            </button>
          </div>
        </div>
      )}

      <DatePrepChecklistModal 
        profile={profile} 
        isOpen={showChecklist} 
        onClose={() => setShowChecklist(false)} 
        userInterests={userInterests}
      />
    </div>
  );
}
