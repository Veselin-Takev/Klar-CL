import { useState, useEffect } from "react";
import { useTheme } from '../components/ThemeProvider';
import { motion, AnimatePresence } from "motion/react";
// `Heart` und `FileText` wurden importiert und nie gerendert — entfernt.
// `LogOut` bleibt: siehe die Abmelden-Schaltflaeche weiter unten.
import { Settings, Download, Edit, BellRing, Moon, Sun, Monitor, LogOut, ShieldCheck, Trash2, Sparkles, Zap, Share2, Wand2, RefreshCw, ArrowRight, History, EyeOff, Eye, MessageCircle, Check, X, ChevronRight } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { askAICoach, parseProfileImport, optimizeProfileApi } from "../lib/api";
// BEFUND 10.08.2026: downloadRadarImage war am Knopf "Als Bild exportieren"
// angebunden, aber nirgends definiert -- Absturz beim Rendern des Profils.
// Der Behaelter traegt bereits id="werte-radar-container"; die Funktion war
// also vorgesehen und nur nie geschrieben. toPng ist dieselbe Bibliothek,
// die WeeklyConsistencyTracker.tsx schon benutzt.
import { toPng } from 'html-to-image';

const VALUE_EXPLANATIONS: Record<string, string> = {
  'Abenteuer': 'Zeigt an, wie spontan und offen für neue, ungeplante Erlebnisse du bist.',
  'Achtsamkeit': 'Wie stark du auf emotionale Balance und bewusstes Leben achtest.',
  'Gemeinschaft': 'Der Stellenwert von Freunden, Familie und sozialem Umfeld.',
  'Ehrlichkeit': 'Wichtigkeit von transparenter, direkter Kommunikation ohne Spielchen.',
  'Kreativität': 'Wie viel Raum du für persönliche Entfaltung und kreative Hobbys brauchst.',
  'Karriere': 'Dein Fokus auf beruflichen Erfolg und finanzielle Stabilität.'
};

const DEEP_MATCH_INSIGHTS: Record<string, string[]> = {
  'Abenteuer': ['Ihr mögt beide unplante Wochenend-Trips.', 'Ausprobieren neuer Restaurants ist euch wichtig.'],
  'Achtsamkeit': ['Meditation & Yoga sind feste Bestandteile im Alltag.', 'Gemeinsames Reflektieren über den Tag.'],
  'Gemeinschaft': ['Familienzeit wird bei euch beiden großgeschrieben.', 'Ihr seid beide gerne Gastgeber.'],
  'Ehrlichkeit': ['Ihr schätzt direkte, klare Kommunikation.', 'Konflikte werden offen und schnell angesprochen.'],
  'Kreativität': ['Ihr habt beide ein Faible für Kunstausstellungen.', 'Gestalterische Hobbys verbinden euch.'],
  'Karriere': ['Ihr teilt den Drive für berufliche Ziele.', 'Verständnis für längere Arbeitszeiten ist gegeben.']
};

import { VibeSummaryPDFGenerator } from "../components/VibeSummaryPDFGenerator";
import { DatingVibeChartWidget } from "../components/DatingVibeChartWidget";
import { DatingMoodTrackerWidget } from "../components/DatingMoodTrackerWidget";
import { InsightsChart } from "../components/InsightsChart";
import { ProfileCheckWidget } from "../components/ProfileCheckWidget";
import { DatingMilestones } from "../components/DatingMilestones";
import { UserAchievementsWidget } from "../components/UserAchievementsWidget";
import { PDFResumeGenerator } from "../components/PDFResumeGenerator";
// ENTFERNT 12.08.2026: `ValuesQuizWidget` und `ProfileCompletionWidget`
// waren importiert, aber nirgends eingehaengt. Beides hat `@ts-nocheck`
// verdeckt — `noUnusedLocals` haette es sofort gemeldet.
import { ProfileCardThemeSelector } from "../components/ProfileCardThemeSelector";
import { FocusTimeSettingsWidget } from "../components/FocusTimeSettingsWidget";
// SmartPauseWidget und SmartPausePlanner sind am 14.08.2026 zu einer
// Komponente geworden — Begruendung im Kopf von SmartPause.tsx.
import { SmartPause } from "../components/SmartPause";
import { HapticSettings } from "../components/HapticSettings";
// ENTFERNT 12.08.2026: fuenf Widgets mit erfundenen Daten. Siehe die
// Stellen im Text weiter unten. Die Dateien unter src/components/ sind
// damit ohne Aufrufer und koennen geloescht werden.
import { MoodCalendarGridWidget } from "../components/MoodCalendarGridWidget";
import { SmartAuditWidget } from "../components/SmartAuditWidget";
import { saveSmartMatchSettings, isSmartMatchEnabled } from "../services/smartMatchService";
import { useAuth } from "../lib/AuthContext";
import { Link } from "react-router";
import { AboVerwaltung } from "../components/AboVerwaltung";
// P1-Zusatzbefund: wurde benutzt, aber nie importiert (@ts-nocheck hat es verdeckt).
import { PhotoVerificationModal } from "../components/PhotoVerificationModal";
import { verifizierungsStatus, type VerifizierungsStatus } from "../lib/klar";
import { triggerHaptic } from "../lib/haptics";
// ENTFERNT: `auth` und `db` wurden hier nie benutzt.
import { Cloud, Database } from "lucide-react";
import { melde } from "../lib/fehler";

function OfflineCacheStatus() {
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [cachedItems, setCachedItems] = useState<string[]>([]);
  
  useEffect(() => {
    const updateStatus = () => {
      // Find cached profile data
      const items = [];
      if (localStorage.getItem('klar_user_bio')) items.push('Bio');
      if (localStorage.getItem('userInterests')) items.push('Interessen');
      if (localStorage.getItem('userNoGos')) items.push('No-Gos');
      
      setCachedItems(items);
      
      // Get last successful sync from sync logs
      const syncLogs = localStorage.getItem('klar_sync_logs');
      if (syncLogs) {
        try {
          const roh: unknown = JSON.parse(syncLogs);
          const eintraege = Array.isArray(roh) ? (roh as Record<string, unknown>[]) : [];
          const letzter = eintraege.find(
            (l) => l !== null && typeof l === 'object' && l['status'] === 'success',
          );
          const zeit = letzter ? new Date(String(letzter['syncedAt'])) : null;
          // Eine unlesbare Zeitangabe ergaebe „Invalid Date" auf dem Schirm.
          if (zeit && !Number.isNaN(zeit.getTime())) {
            setLastSync(zeit.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        } catch (e) {
          melde('Profile/sync-protokoll', e);
        }
      }
    };
    
    updateStatus();
    // Re-check periodically
    const interval = setInterval(updateStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (cachedItems.length === 0 && !lastSync) return null;

  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2 items-center">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-lg text-[10px] font-medium border border-stone-200 dark:border-stone-700">
        <Database size={12} />
        Lokal: {cachedItems.join(', ') || 'Keine'}
      </div>
      {lastSync && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-lg text-[10px] font-medium border border-stone-200 dark:border-stone-700" title="Letzter erfolgreicher Cloud-Sync">
          <Cloud size={12} className={navigator.onLine ? "text-emerald-500" : "text-stone-400"} />
          Sync: {lastSync}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// `// @ts-nocheck` ENTFERNT am 12.08.2026. Was die Zeile verdeckt hat:
//
// ── 1. ES GAB KEIN ABMELDEN ───────────────────────────────────────────────
// `logOut` aus dem AuthContext hatte keinen einzigen Aufrufer in der App.
// Das Symbol `LogOut` war hier importiert und wurde nie gerendert. Wer das
// Gerät aus der Hand gab, konnte seine Gespräche nicht schliessen — die
// einzige Möglichkeit, das Konto zu verlassen, war „Konto löschen".
// Die Schaltfläche steht jetzt in den Einstellungen über „Konto löschen".
//
// ── 2. ZWEI WIDGETS IMPORTIERT UND NIE EINGEHÄNGT ─────────────────────────
// `ValuesQuizWidget` und `ProfileCompletionWidget`. Dazu `auth` und `db`
// aus `../lib/firebase`, drei lucide-Symbole und `cycleTheme`.
//
// ── 3. DIE FOKUS-ZEIT KONNTE STILL AUSFALLEN ──────────────────────────────
// `parseInt(startParts[0]) * 60 + parseInt(startParts[1])` ohne Prüfung.
// Steht unter `klar_focus_time` etwas Unlesbares, ist das Ergebnis `NaN`,
// jeder Vergleich damit `false` — die Fokus-Zeit galt dann als „nicht
// aktiv", obwohl sie eingeschaltet war. Kein Fehler, keine Meldung.
//
// ── 4. NEUN MAL `JSON.parse` OHNE PRÜFUNG, SECHS LEERE `catch (e) {}` ─────
// Darunter der Bio-Verlauf, der zwei Formate kennt (alte Zeichenketten,
// neue Objekte) und beide ungeprüft weiterreichte.
//
// ── 5. ZWEI ANFRAGEN OHNE STATUSPRÜFUNG ───────────────────────────────────
// `/api/nogo-suggestions` und `/api/optimize-bio-values`: Eine Fehlerantwort
// `{ error: … }` wurde geparst, `suggestions` war leer, und der Ersatz im
// `catch` lief nie. Es sah aus wie „keine Vorschläge", nicht wie ein Fehler.
//
// ── 6. `any` IM RADAR-TOOLTIP ─────────────────────────────────────────────
// Ersetzt durch die Felder, die er tatsächlich liest.
// ═══════════════════════════════════════════════════════════════════════════

export type BioHistoryItem = {
  text: string;
  timestamp: string;
};

const nurZeichenketten = (w: unknown): string[] =>
  Array.isArray(w) ? w.filter((x): x is string => typeof x === 'string') : [];

/** Zeichenketten-Liste aus dem lokalen Speicher, ohne Vertrauen in den Inhalt. */
function listeAusSpeicher(schluessel: string): string[] {
  const roh = localStorage.getItem(schluessel);
  if (!roh) return [];
  try {
    return nurZeichenketten(JSON.parse(roh) as unknown);
  } catch {
    return [];
  }
}

/** Die Fokus-Zeit, wie `FocusTimeSettingsWidget` sie ablegt. */
interface Fokuszeit {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

function leseFokuszeit(): Fokuszeit | null {
  const roh = localStorage.getItem('klar_focus_time');
  if (!roh) return null;
  try {
    const w: unknown = JSON.parse(roh);
    if (w === null || typeof w !== 'object') return null;
    const o = w as Record<string, unknown>;
    if (typeof o['startTime'] !== 'string' || typeof o['endTime'] !== 'string') return null;
    return { enabled: o['enabled'] === true, startTime: o['startTime'], endTime: o['endTime'] };
  } catch {
    return null;
  }
}

/** „HH:MM" in Minuten seit Mitternacht — oder `null`, wenn unlesbar. */
function alsMinuten(uhrzeit: string): number | null {
  const teile = uhrzeit.split(':');
  const stunden = Number(teile[0]);
  const minuten = Number(teile[1]);
  if (!Number.isFinite(stunden) || !Number.isFinite(minuten)) return null;
  return stunden * 60 + minuten;
}

/** Aus einer Antwort die Liste unter `suggestions` holen. */
function vorschlaegeAus(text: string): string[] {
  if (!text) return [];
  const roh: unknown = JSON.parse(text);
  return roh !== null && typeof roh === 'object'
    ? nurZeichenketten((roh as Record<string, unknown>)['suggestions'])
    : [];
}


/** Was recharts diesem Tooltip uebergibt — nur das, was hier benutzt wird. */
interface RadarTooltipEigenschaften {
  active?: boolean;
  payload?: { payload?: { subject?: string } }[];
}

const CustomRadarTooltip = ({ active, payload }: RadarTooltipEigenschaften) => {
  const data = active ? payload?.[0]?.payload : undefined;
  if (data?.subject) {
    return (
      <div className="bg-white dark:bg-stone-800 p-3 rounded-xl shadow-lg border border-stone-100 dark:border-stone-700 max-w-[200px]">
        <p className="font-bold text-stone-800 dark:text-stone-200 text-sm mb-1">{data.subject}</p>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          {VALUE_EXPLANATIONS[data.subject] ?? ''}
        </p>
      </div>
    );
  }
  return null;
};

export default function Profile() {
  const { logOut, updateProfileData } = useAuth();
  const [activeRadarValue, setActiveRadarValue] = useState<string | null>(null);
  // BEFUND 10.08.2026, gefunden beim Suchen nach der Ursache von
  // showFilterSheet: Beide Zustaende fehlten hier ganz.
  //
  // showPhotoVerification wird in Zeile 578 gelesen -- ohne Deklaration
  // stuerzt das Profil beim Rendern ab, genau wie das Dashboard.
  //
  // OFFEN, NICHT HIER BEHOBEN: Nichts setzt showPhotoVerification je auf
  // true. Das Modal ist damit nicht erreichbar. Das ist ein eigener Befund
  // (fehlender Einstieg in die Verifizierung), keine Frage der Deklaration
  // -- ich baue keinen Knopf, den die Spezifikation hier nicht vorsieht.
  const [showPhotoVerification, setShowPhotoVerification] = useState(false);

  /** Werte-Radar als PNG sichern. Rein im Browser -- das Bild verlaesst das
   *  Geraet nicht und wird nirgends hochgeladen. */
  const downloadRadarImage = async () => {
    const behaelter = document.getElementById('werte-radar-container');
    if (!behaelter) {
      console.warn('Werte-Radar nicht gefunden -- nichts zu exportieren.');
      return;
    }
    try {
      const datenUrl = await toPng(behaelter, {
        // Ohne Hintergrund waere das PNG durchsichtig und im Dunkelmodus
        // unlesbar. cacheBust verhindert veraltete Schriftschnitte.
        backgroundColor: document.documentElement.classList.contains('dark')
          ? '#1c1917'
          : '#ffffff',
        cacheBust: true,
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = datenUrl;
      a.download = 'klar-werte-radar.png';
      a.click();
    } catch (e) {
      console.error('Export des Werte-Radars fehlgeschlagen:', e);
    }
  };
  // radarAnimated wird nur geschrieben, nie gelesen. Deklaration ohne
  // Lesenamen haelt das Verhalten unveraendert und stoppt den Absturz.
  const [, setRadarAnimated] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userBio, setUserBio] = useState<string>("Kaffeeliebhaber, verbringe meine Wochenenden gerne auf dem Fahrrad. Suche jemanden für tiefgründige Gespräche und spontane Ausflüge.");
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [suggestedBio, setSuggestedBio] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const [userNoGos, setUserNoGos] = useState<string[]>([]);
  const [newNoGo, setNewNoGo] = useState("");
  const [nogoSuggestions, setNogoSuggestions] = useState<string[]>([]);
  const [isLoadingNogoSuggestions, setIsLoadingNogoSuggestions] = useState(false);
  
  const [userValuesRadar, setUserValuesRadar] = useState<{subject: string, A: number, B?: number}[]>([]);
  const [showCompareRadar, setShowCompareRadar] = useState(false);
  const [radarColorA, setRadarColorA] = useState("#a855f7");
  const [radarColorB, setRadarColorB] = useState("#f59e0b");
  const [matchFilter, setMatchFilter] = useState("all");
  const [showRadarSettings, setShowRadarSettings] = useState(false);
  const [showRadarTutorial, setShowRadarTutorial] = useState(false);
  
  
  
  
  
  

  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isOptimizingValues, setIsOptimizingValues] = useState(false);
  const [valueBioSuggestions, setValueBioSuggestions] = useState<string[]>([]);
  const [auditScore, setAuditScore] = useState<number | null>(null);

  const [isCheckingBio, setIsCheckingBio] = useState(false);
  const [bioFeedback, setBioFeedback] = useState("");

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isFocusTimeActive, setIsFocusTimeActive] = useState(false);

  useEffect(() => {
    const checkFocusTime = () => {
      const fokus = leseFokuszeit();
      if (!fokus || !fokus.enabled) {
        setIsFocusTimeActive(false);
        return;
      }
      const start = alsMinuten(fokus.startTime);
      const ende = alsMinuten(fokus.endTime);
      // BEFUND 12.08.2026: Vorher `parseInt(startParts[0]) * 60 + …` ohne
      // Pruefung. Steht dort etwas Unlesbares, ist das Ergebnis `NaN`, jeder
      // Vergleich damit `false` — die Fokus-Zeit galt dann stillschweigend
      // als „nicht aktiv", obwohl sie eingeschaltet war.
      if (start === null || ende === null) {
        setIsFocusTimeActive(false);
        return;
      }
      const jetzt = new Date();
      const jetztMinuten = jetzt.getHours() * 60 + jetzt.getMinutes();
      setIsFocusTimeActive(
        start < ende
          ? jetztMinuten >= start && jetztMinuten <= ende
          : jetztMinuten >= start || jetztMinuten <= ende,
      );
    };
    checkFocusTime();
    const interval = setInterval(checkFocusTime, 60000);
    return () => clearInterval(interval);
  }, []);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState<{bio: string, interests: string[]} | null>(null);
  const [bioHistory, setBioHistory] = useState<BioHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mustHaveInterests, setMustHaveInterests] = useState<string[]>([]);

  const [smartMatchAlerts, setSmartMatchAlerts] = useState(() => isSmartMatchEnabled());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // P0-6: Zustand der Loeschung sichtbar machen. Wer sein Konto loeschen
  // will und nichts sieht, muss annehmen, es sei geloescht.
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // P1: Der Verifizierungsstatus kommt vom Server. Nicht aus localStorage —
  // ein zwischengespeicherter Status ist ein Status, den das Geraet setzt.
  const [verifizierung, setVerifizierung] = useState<VerifizierungsStatus | null>(null);
  useEffect(() => {
    let weg = false;
    verifizierungsStatus()
      .then((s) => { if (!weg) setVerifizierung(s.status); })
      .catch(() => { if (!weg) setVerifizierung(null); });
    return () => { weg = true; };
  }, []);

  // P0-6: `handleDeleteAccount` wurde in Zeile 1645 aufgerufen, war aber
  // NIRGENDS definiert — der Knopf brach beim Klick ab. Die Kaskade laeuft
  // jetzt serverseitig (Art. 17 DSGVO); clientseitig war sie technisch nie
  // vollstaendig moeglich, weil der Client nach den Firestore-Regeln keinen
  // Schreibzugriff auf fremde Chatdokumente hat.
  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const daten = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(daten.error || `Server-Antwort ${res.status}`);
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Die Löschung ist nicht durchgelaufen. Bitte melde dich neu an.",
      );
    } finally {
      setDeleting(false);
    }
  };
  const [darkModeVariant] = useState<"gray" | "black">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("klar_dark_variant") as "gray" | "black") || "gray";
    }
    return "gray";
  });

  const { theme, setTheme } = useTheme();

  // `hapticIntensity` und `updateHapticIntensity` sind am 14.08.2026
  // entfallen: Sie gehoerten zur zweiten Haptik-Bedienung, die es hier nicht
  // mehr gibt. Den Zustand haelt jetzt ausschliesslich <HapticSettings />.

  useEffect(() => {
    if (darkModeVariant === "black") {
      document.documentElement.classList.add("dark-theme-black");
    } else {
      document.documentElement.classList.remove("dark-theme-black");
    }
  }, [darkModeVariant]);

  
  useEffect(() => {
    if (!localStorage.getItem('klar_radar_tutorial_seen')) {
      // Show tutorial after a short delay
      const timer = setTimeout(() => {
        setShowRadarTutorial(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissRadarTutorial = () => {
    setShowRadarTutorial(false);
    localStorage.setItem('klar_radar_tutorial_seen', 'true');
  };

  
  // ENTFERNT 12.08.2026: `cycleTheme` hatte keinen Aufrufer mehr, seit die
  // vierfache Theme-Steuerung am 11.08. auf zwei Stellen reduziert wurde.

  useEffect(() => {
    setUserInterests(listeAusSpeicher("userInterests"));
    setMustHaveInterests(listeAusSpeicher("mustHaveInterests"));
    setIcebreakers(listeAusSpeicher("profile_icebreakers"));

    const savedBio = localStorage.getItem("klar_user_bio");
    if (savedBio) setUserBio(savedBio);

    // Der Bio-Verlauf lag frueher als reine Zeichenketten-Liste vor. Die
    // Umstellung auf { text, timestamp } bleibt erhalten — jetzt aber ohne
    // die Annahme, dass alle Eintraege dieselbe Form haben.
    const savedBioHistory = localStorage.getItem("klar_bio_history");
    if (savedBioHistory) {
      try {
        const roh: unknown = JSON.parse(savedBioHistory);
        if (Array.isArray(roh)) {
          const jetzt = new Date().toISOString();
          setBioHistory(
            roh.flatMap((e): BioHistoryItem[] => {
              if (typeof e === 'string') return [{ text: e, timestamp: jetzt }];
              if (e === null || typeof e !== 'object') return [];
              const o = e as Record<string, unknown>;
              if (typeof o['text'] !== 'string') return [];
              return [{
                text: o['text'],
                timestamp: typeof o['timestamp'] === 'string' ? o['timestamp'] : jetzt,
              }];
            }),
          );
        }
      } catch (e) {
        melde('Profile/bio-verlauf', e);
      }
    }
  }, []);

  const handleShareProfile = async () => {
    const profileLink = `${window.location.origin}/profile/share/12345`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mein Klar Profil',
          text: 'Schau dir mein Klar Profil an!',
          url: profileLink,
        });
      } catch (err) {
        console.warn("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileLink);
        alert('Profil-Link in die Zwischenablage kopiert!');
      } catch (err) {
        console.warn("Failed to copy:", err);
        alert('Profil-Link konnte nicht kopiert werden.');
      }
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    
    setIsImporting(true);
    try {
      const data = await parseProfileImport(importText);
      if (data.bio) {
        setUserBio(data.bio);
        localStorage.setItem('klar_user_bio', data.bio);
      }
      if (data.interests && Array.isArray(data.interests)) {
        // Merge with existing or replace? Let's append new ones, keep up to 10
        const combined = Array.from(new Set([...userInterests, ...data.interests])).slice(0, 10);
        setUserInterests(combined);
        localStorage.setItem("userInterests", JSON.stringify(combined));
      }
      setShowImport(false);
      setImportText("");
    } catch (e) {
      melde("Profile", e);
      alert((e instanceof Error ? e.message : String(e)) || "Es gab einen Fehler beim Importieren.");
    } finally {
      setIsImporting(false);
    }
  };


  
  
    useEffect(() => {
    if (userValuesRadar.length === 0) {
      setUserValuesRadar([
        { subject: 'Abenteuer', A: 80, B: 60 },
        { subject: 'Achtsamkeit', A: 45, B: 85 },
        { subject: 'Gemeinschaft', A: 70, B: 75 },
        { subject: 'Ehrlichkeit', A: 90, B: 85 },
        { subject: 'Humor', A: 85, B: 50 }
      ]);
    }
  }, []);

  useEffect(() => {
    if (userValuesRadar.length > 0) {
      setTimeout(() => setRadarAnimated(true), 300);
    }
  }, [userValuesRadar]);

  
  useEffect(() => {
    if (userValuesRadar.length > 0) {
      setTimeout(() => setRadarAnimated(true), 300);
    }
  }, [userValuesRadar]);

  const fetchNogoSuggestions = async () => {
    setIsLoadingNogoSuggestions(true);
    try {
      let journals: unknown = [];
      try {
        journals = JSON.parse(localStorage.getItem("klar_dating_journals") ?? "[]");
      } catch {
        journals = [];
      }
      const res = await fetch("/api/nogo-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journals })
      });
      // NEU: Ohne diese Pruefung wurde eine Fehlerantwort `{ error: … }`
      // geparst, `suggestions` war leer, und der Ersatz im `catch` lief nie.
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNogoSuggestions(vorschlaegeAus(await res.text()));
    } catch(e) {
      melde("Profile", e);
      setNogoSuggestions(["Unehrlichkeit", "Zu spät kommen", "Ghosting"]);
    } finally {
      setIsLoadingNogoSuggestions(false);
    }
  };


  
  const optimizeBioValues = async () => {
    if (!userBio.trim() || userValuesRadar.length === 0) return;
    setIsOptimizingValues(true);
    setValueBioSuggestions([]);
    try {
      const res = await fetch("/api/optimize-bio-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: userBio,
          values: userValuesRadar
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const vorschlaege = vorschlaegeAus(await res.text());
      if (vorschlaege.length > 0) setValueBioSuggestions(vorschlaege);
    } catch(e) {
      melde("Profile", e);
    } finally {
      setIsOptimizingValues(false);
    }
  };

  const checkBio = async () => {
    if (!userBio.trim()) return;
    setIsCheckingBio(true);
    setBioFeedback("");
    try {
      const interestsText = userInterests.length > 0 ? userInterests.join(", ") : "Allgemeine Themen";
      const prompt = `Analysiere diese Dating-Profil-Bio: "${userBio}". Meine Interessen sind: ${interestsText}. Gib mir basierend auf diesen Interessen konkrete KI-generierte Vorschläge, wie ich die Bio spezifischer und ansprechender formulieren kann. Halte es kurz.`;
      const feedback = await askAICoach(prompt);
      setBioFeedback(feedback);
    } catch (e) {
      melde("Profile", e);
      setBioFeedback("Konnte die Bio nicht prüfen. Bitte versuche es später nochmal.");
    } finally {
      setIsCheckingBio(false);
    }
  };

  const generateBio = async () => {
    setIsGeneratingBio(true);
    try {
      const goal = localStorage.getItem('userGoal') || 'undecided';
      const interestsText = userInterests.length > 0 ? userInterests.join(", ") : "Allgemeine Themen";
      
      let goalDescription = "Offen bleiben & Entdecken";
      if (goal === 'relationship') goalDescription = "Feste Beziehung finden";
      if (goal === 'casual') goalDescription = "Lockere Dates";
      if (goal === 'friends') goalDescription = "Neue Leute kennenlernen";

      const prompt = `Erstelle einen ehrlichen, ansprechenden und flüssigen 'Über mich' Fließtext für mein Dating-Profil. 
Meine Interessen sind: ${interestsText}. 
Mein Dating-Ziel ist: ${goalDescription}.
Halte es natürlich, sympathisch und authentisch. Gib NUR den generierten Text zurück.`;
      
      const response = await askAICoach(prompt);
      const newBio = response.trim();
      setSuggestedBio(newBio);
      
      const newBioItem = { text: newBio, timestamp: new Date().toISOString() };
      const updatedHistory = [newBioItem, ...bioHistory.filter(b => b.text !== newBio)].slice(0, 10);
      setBioHistory(updatedHistory);
      localStorage.setItem('klar_bio_history', JSON.stringify(updatedHistory));
      
      // Make sure we show the preview when generating a new one
      setShowPreview(true);
      setShowHistory(false);
    } catch (e) {
      console.warn("Failed to generate bio:", e);
      setSuggestedBio((e instanceof Error ? e.message : String(e)) || "Fehler beim Generieren. Bitte versuche es später nochmal.");
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const optimizeProfile = async () => {
    setIsOptimizing(true);
    setOptimizedData(null);
    try {
      const data = await optimizeProfileApi(userBio, userInterests);
      if (data.optimizedBio && data.suggestedInterests) {
        setOptimizedData({ bio: data.optimizedBio, interests: data.suggestedInterests });
      }
    } catch (e) {
      melde("Profile", e);
      alert((e instanceof Error ? e.message : String(e)) || "Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const generateIcebreakers = async () => {
    setIsGenerating(true);
    try {
      const interestsText = userInterests.length > 0 ? userInterests.join(", ") : "Allgemeine Themen";
      const prompt = `Erstelle 3 kreative, einladende Icebreaker-Fragen für mein Dating-Profil, um interessante Gespräche zu starten. Basiere sie auf meinen Interessen: ${interestsText}.
Antworte nur mit einer unformatierten Liste (jede Frage in einer neuen Zeile, ohne Aufzählungszeichen, ohne Einleitung, ohne Fazit).`;
      
      const response = await askAICoach(prompt);
      const suggestions = response.split('\n').map(s => s.replace(/^[-\d.]\s*/, '').trim()).filter(s => s.length > 5);
      
      const limitedSuggestions = suggestions.slice(0, 3);
      if (limitedSuggestions.length > 0) {
        setIcebreakers(limitedSuggestions);
        localStorage.setItem("profile_icebreakers", JSON.stringify(limitedSuggestions));
      }
    } catch (e) {
      melde("Profile", e);
      setIcebreakers([(e instanceof Error ? e.message : String(e)) || "Fehler beim Generieren. Bitte versuche es später nochmal."]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {showPhotoVerification && (
        <PhotoVerificationModal
          onClose={() => setShowPhotoVerification(false)}
          onSuccess={() => {
            // DAT-08 (gefunden beim Umbau von DAT-02, 09.08.2026):
            // Hier stand `updateProfileData({ isVerified: true })`. Der
            // Client kann `isVerified` nach den Firestore-Regeln nicht
            // schreiben — der Vorgang wurde also immer abgelehnt. Weil
            // `updateProfileData` den Fehler nur in die Konsole schrieb und
            // den lokalen Zustand trotzdem setzte, zeigte die Oberfläche
            // danach „Verifiziert". Bis zum nächsten Neuladen.
            //
            // Verifiziert wird ausschliesslich über K-1:
            // /api/verification/challenge → /submit → Sichtprüfung → /decide.
            setShowPhotoVerification(false);
          }}
        />
      )}
    <div className="p-6 h-full overflow-y-auto pb-24 bg-light-bg dark:bg-dark-bg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif text-stone-900 dark:text-stone-100">Dein Profil</h1>
        <div className="flex items-center gap-2">
          
          
          <button
            onClick={() => setShowPreview(true)}
            className="p-2 bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light rounded-full hover:bg-brand/20 dark:hover:bg-brand-light/20 transition-colors"
            title="Profil Vorschau"
          >
            <Eye size={20} />
          </button>

          <button
            onClick={handleShareProfile}
            className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title="Profil teilen"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden border-2 border-white dark:border-stone-900 shadow-sm">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          {auditScore !== null && (
            <div className="absolute -bottom-1 -right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1 border-2 border-white dark:border-stone-900" title="Deep-Verbindung Qualität">
              <Sparkles size={10} />
              {auditScore * 10}%
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium text-stone-900 dark:text-stone-100">Du, 29</h2>
          {isFocusTimeActive && (
            <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-700">
              <Moon size={12} className="text-indigo-500" />
              Gerade offline (Fokus-Zeit)
            </div>
          )}
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-1 rounded-full" title="Verifiziert">
            <ShieldCheck size={16} />
          </div>
        </div>
        <p className="text-stone-500 dark:text-stone-400 mt-1">Berlin</p>
        <OfflineCacheStatus />
      </div>
      
      <div className="space-y-4">
        {/* Import Section */}
        <div className="p-4  from-brand/5 to-brand-light/5 border border-brand/20 rounded-2xl shadow-sm">
          {!showImport ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2 text-stone-900 dark:text-stone-100 mb-1">
                  <Wand2 size={16} className="text-brand dark:text-brand-light" />
                  Profil automagisch ausfüllen
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Füge deinen LinkedIn-Text oder Notizen ein.
                </p>
              </div>
              <button 
                onClick={() => setShowImport(true)}
                className="px-4 py-2 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-full text-sm font-medium"
              >
                Starten
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-2">Text einfügen</h3>
              <textarea 
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="z.B. 'Ich bin Softwareentwickler, spiele gerne Gitarre und liebe es zu reisen...'"
                className="w-full h-32 p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-brand/50 mb-3 resize-none"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowImport(false)}
                  className="flex-1 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium transition-colors hover:bg-stone-300 dark:hover:bg-stone-700"
                >
                  Abbrechen
                </button>
                <button 
                  onClick={handleImport}
                  disabled={isImporting || !importText.trim()}
                  className="flex-1 py-2 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span>
                  ) : (
                    <>Importieren <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        
        <div className="mt-8">
          {/* ENTFERNT: ChatResponseTimeWidget — die Reaktionszeiten kamen
              aus `Math.random()`. Bei jedem Neuladen ein anderer Verlauf. */}
        </div>
        <div className="mt-4">
          <MoodCalendarGridWidget />
        </div>

        {/* Optimization Section */}
        <div className="p-4  from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-medium flex items-center gap-2 text-stone-900 dark:text-stone-100 mb-1">
                <Sparkles size={16} className="text-indigo-500" />
                Profil optimieren
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Mach dein Profil ansprechender mit KI.
              </p>
            </div>
            <button 
              onClick={optimizeProfile}
              disabled={isOptimizing}
              className="px-4 py-2 bg-indigo-500 text-white rounded-full text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isOptimizing ? (
                <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span>
              ) : (
                "Optimieren"
              )}
            </button>
          </div>

          {optimizedData && (
            <div className="mt-4 pt-3 border-t border-indigo-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <h4 className="text-xs font-medium text-indigo-500 mb-2">Vorgeschlagene Bio:</h4>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-3 italic bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                "{optimizedData.bio}"
              </p>
              
              <h4 className="text-xs font-medium text-indigo-500 mb-2">Passende Interests:</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {optimizedData.interests.map(interest => (
                  <span key={interest} className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-medium">
                    {interest}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setOptimizedData(null)}
                  className="flex-1 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium transition-colors hover:bg-stone-300 dark:hover:bg-stone-700"
                >
                  Verwerfen
                </button>
                <button 
                  onClick={() => {
                    setUserBio(optimizedData.bio);
                    localStorage.setItem('klar_user_bio', optimizedData.bio);
                    
                    const combined = Array.from(new Set([...userInterests, ...optimizedData.interests])).slice(0, 15);
                    setUserInterests(combined);
                    localStorage.setItem("userInterests", JSON.stringify(combined));
                    
                    const optCount = parseInt(localStorage.getItem("stats_profile_optimized") || "0", 10);
                    localStorage.setItem("stats_profile_optimized", (optCount + 1).toString());

                    setOptimizedData(null);
                  }}
                  className="flex-1 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Alles übernehmen
                </button>
              </div>
            </div>
          )}
        </div>

        {userInterests.length > 0 && (
          <div className="p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl shadow-sm">
            <h3 className="font-medium mb-1 text-stone-900 dark:text-stone-100">Deine Interessen</h3>
            <p className="text-xs text-stone-500 mb-3">Tippe auf ein Interesse, um es als 'Must-have' für Verbindungen zu markieren.</p>
            <div className="flex flex-wrap gap-2">
              {userInterests.map(interest => {
                const isMustHave = mustHaveInterests.includes(interest);
                return (
                  <button 
                    key={interest} 
                    onClick={() => {
                      const newMustHaves = isMustHave 
                        ? mustHaveInterests.filter(i => i !== interest)
                        : [...mustHaveInterests, interest];
                      setMustHaveInterests(newMustHaves);
                      localStorage.setItem("mustHaveInterests", JSON.stringify(newMustHaves));
                      // Determine active radar value based on interest
                      const interestLower = interest.toLowerCase();
                      let mappedValue = null;
                      if (interestLower.includes("reise") || interestLower.includes("abenteuer")) mappedValue = "Abenteuer";
                      else if (interestLower.includes("yoga") || interestLower.includes("meditation") || interestLower.includes("achtsam")) mappedValue = "Achtsamkeit";
                      else if (interestLower.includes("freunde") || interestLower.includes("familie") || interestLower.includes("gemein")) mappedValue = "Gemeinschaft";
                      else if (interestLower.includes("ehrlich") || interestLower.includes("offen")) mappedValue = "Ehrlichkeit";
                      else if (interestLower.includes("humor") || interestLower.includes("lachen")) mappedValue = "Humor";
                      else if (interestLower.includes("kunst") || interestLower.includes("kreativ")) mappedValue = "Kreativität";
                      else if (interestLower.includes("karriere") || interestLower.includes("beruf")) mappedValue = "Karriere";
                      
                      if (mappedValue) {
                        setActiveRadarValue(mappedValue);
                        triggerHaptic('SUCCESS');
                      }

                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      isMustHave 
                        ? 'bg-brand dark:bg-brand-light text-white dark:text-stone-900 border border-transparent' 
                        : 'bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light border border-brand/30 dark:border-brand-light/30'
                    }`}
                  >
                    {interest} {isMustHave && '★'}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-3">
              <input 
                type="text" 
                value={newInterest} 
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Neues Interesse hinzufügen..."
                className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-brand/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newInterest.trim()) {
                    const updated = [...userInterests, newInterest.trim()];
                    setUserInterests(updated);
                    localStorage.setItem('userInterests', JSON.stringify(updated));
                    setNewInterest("");
                  }
                }}
              />
              <button aria-label="Interesse hinzufügen" 
                onClick={() => {
                  if (newInterest.trim()) {
                    const updated = [...userInterests, newInterest.trim()];
                    setUserInterests(updated);
                    localStorage.setItem('userInterests', JSON.stringify(updated));
                    setNewInterest("");
                  }
                }}
                className="bg-brand dark:bg-brand-light text-white dark:text-stone-900 px-3 py-1.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                +
              </button>
            </div>

          </div>
        )}

        {/* No-Gos */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl shadow-sm">
          <h3 className="font-medium mb-1 text-stone-900 dark:text-stone-100">Meine No-Gos</h3>
          <p className="text-xs text-stone-500 mb-3">Schließe Persönlichkeitsmerkmale oder Interessen aus, die der Deep-Verbindung Algorithmus priorisiert ignorieren soll.</p>
          <div className="flex flex-wrap gap-2">
            {userNoGos.map((nogo, idx) => (
              <div key={idx} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-full text-xs flex items-center gap-1">
                {nogo}
                <button aria-label="No-Go entfernen" onClick={() => {
                  const newArr = userNoGos.filter((_, i) => i !== idx);
                  setUserNoGos(newArr);
                  localStorage.setItem("userNoGos", JSON.stringify(newArr));
                }} className="ml-1 text-rose-400 hover:text-rose-600">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input 
              type="text" 
              value={newNoGo}
              onChange={(e) => setNewNoGo(e.target.value)}
              placeholder="No-Go hinzufügen (z.B. Raucher)"
              className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newNoGo.trim()) {
                  const newArr = [...userNoGos, newNoGo.trim()];
                  setUserNoGos(newArr);
                  localStorage.setItem("userNoGos", JSON.stringify(newArr));
                  setNewNoGo("");
                }
              }}
            />
            <button aria-label="No-Go hinzufügen" 
              onClick={() => {
                if (newNoGo.trim()) {
                  const newArr = [...userNoGos, newNoGo.trim()];
                  setUserNoGos(newArr);
                  localStorage.setItem("userNoGos", JSON.stringify(newArr));
                  setNewNoGo("");
                }
              }}
              disabled={!newNoGo.trim()}
              className="bg-rose-600 dark:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              +
            </button>
          </div>
          {nogoSuggestions.length === 0 ? (
            <button 
              onClick={fetchNogoSuggestions} 
              disabled={isLoadingNogoSuggestions}
              className="mt-3 text-xs flex items-center gap-1 text-brand dark:text-brand-light font-medium"
            >
              <Sparkles size={12} className={isLoadingNogoSuggestions ? "animate-pulse" : ""} />
              {isLoadingNogoSuggestions ? "Analysiere Journal..." : "KI-Vorschläge basierend auf Erfahrungen"}
            </button>
          ) : (
            <div className="mt-3">
              <p className="text-xs text-stone-500 mb-2 flex items-center gap-1"><Sparkles size={12}/> KI-Vorschläge (aus Journal & Chat):</p>
              <div className="flex gap-2 flex-wrap">
                {nogoSuggestions.map((sug, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      if (!userNoGos.includes(sug)) {
                        const newArr = [...userNoGos, sug];
                        setUserNoGos(newArr);
                        localStorage.setItem("userNoGos", JSON.stringify(newArr));
                      }
                      setNogoSuggestions(nogoSuggestions.filter(s => s !== sug));
                    }}
                    className="text-[10px] px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg hover:bg-stone-200"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
        
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-stone-900 dark:text-stone-100">Über mich</h3>
            <div className="flex gap-2">
              {bioHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${showHistory ? 'bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
                >
                  <History size={14} />
                  Verlauf
                </button>
              )}

              <button 
                onClick={checkBio}
                disabled={isCheckingBio || !userBio.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg shadow-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                title="Profil-Check durch KI-Coach"
              >
                {isCheckingBio ? <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span> : <ShieldCheck size={14} />}
                <span className="text-xs font-medium">Bio-Check</span>
              </button>
              
              <button 
                onClick={optimizeBioValues}
                disabled={isOptimizingValues || !userBio.trim() || userValuesRadar.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                title="Bio basierend auf Werten optimieren"
              >
                {isOptimizingValues ? <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span> : <Sparkles size={14} />}
                <span className="text-xs font-medium">Werte-Boost</span>
              </button>
              <button 
                onClick={generateBio}

                disabled={isGeneratingBio}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                title="Auto-Bio generieren"
              >
                {isGeneratingBio ? <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span> : <Wand2 size={14} />}
                <span className="text-xs font-medium">Auto-Bio</span>
              </button>
            </div>
          </div>
          {isEditingBio ? (
            <div className="mb-2 space-y-2">
              <textarea
                value={userBio}
                onChange={(e) => setUserBio(e.target.value)}
                className="w-full min-h-[100px] p-3 text-sm bg-stone-50 dark:bg-stone-900 border border-brand/30 dark:border-brand-light/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none text-stone-700 dark:text-stone-300"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    localStorage.setItem('klar_user_bio', userBio);
                    if (updateProfileData) updateProfileData({ bio: userBio }).catch(console.error);
                    setIsEditingBio(false);
                  }}
                  className="px-4 py-1.5 bg-brand dark:bg-brand-light text-white dark:text-stone-900 text-xs font-semibold rounded-lg hover:opacity-90"
                >
                  Speichern
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 p-2 -mx-2 rounded-lg transition-colors" onClick={() => setIsEditingBio(true)} title="Klicken zum Bearbeiten">
              {userBio}
              <span className="inline-block ml-2 text-stone-400 opacity-50"><Edit size={12} className="inline" /></span>
            </p>
          )}

          {showHistory && bioHistory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 animate-in fade-in slide-in-from-top-2 duration-300">
              <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-3 uppercase tracking-wider">Vorherige Versionen</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {bioHistory.map((item, idx) => {
                  const date = new Date(item.timestamp);
                  const formattedDate = date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                  <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">{formattedDate}</span>
                    </div>
                    <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">{item.text}</p>
                    <div className="flex justify-end">
                      <button 
                        onClick={() => {
                          setUserBio(item.text);
                          localStorage.setItem('klar_user_bio', item.text);
                          if (updateProfileData) {
                            updateProfileData({ bio: item.text }).catch(console.error);
                          }
                          setShowHistory(false);
                          setSuggestedBio("");
                        }}
                        className="text-xs font-medium text-brand dark:text-brand-light hover:opacity-80 transition-opacity flex items-center gap-1"
                      >
                        <RefreshCw size={12} />
                        Wiederherstellen
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}


          
          {valueBioSuggestions.length > 0 && (
            <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl space-y-2">
              <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1 mb-2">
                <Sparkles size={12} /> Werte-Optimierung
              </h4>
              {valueBioSuggestions.map((sug, idx) => (
                <div key={idx} className="bg-white dark:bg-stone-800 p-2 rounded-lg text-[10px] text-stone-700 dark:text-stone-300 shadow-sm border border-stone-100 dark:border-stone-700">
                  {sug}
                </div>
              ))}
              <button onClick={() => setValueBioSuggestions([])} className="text-[10px] text-stone-500 underline mt-1">Schließen</button>
            </div>
          )}
          {bioFeedback && (

            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3 bg-brand/5 dark:bg-brand-light/5 p-4 rounded-xl border border-brand/20 dark:border-brand-light/20">
                <div className="p-2 bg-brand/10 dark:bg-brand-light/10 rounded-full shrink-0 text-brand dark:text-brand-light mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-brand dark:text-brand-light mb-1">KI-Coach Feedback</h4>
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{bioFeedback}</p>
                </div>
                <button aria-label="Rückmeldung schließen" onClick={() => setBioFeedback("")} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {suggestedBio && (
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand dark:text-brand-light" />
                  <span className="text-xs font-medium text-brand dark:text-brand-light">Auto-Bio Preview</span>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showPreview ? "Preview ausblenden" : "Preview anzeigen"}
                </button>
              </div>

              {showPreview ? (
                <div className="mb-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="h-32 bg-stone-200 dark:bg-stone-800 w-full relative">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400&h=300" alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0  from-black/60 to-transparent"></div>
                    <div className="absolute bottom-3 left-4 text-white">
                      <h4 className="font-semibold text-lg drop-shadow-md">Du, 29</h4>
                      <p className="text-xs opacity-90 drop-shadow-md">Berlin</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-stone-800 dark:text-stone-200">
                      {suggestedBio}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-3 italic bg-brand/5 dark:bg-brand-light/5 p-3 rounded-xl border border-brand/10">"{suggestedBio}"</p>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setSuggestedBio("");
                    setShowPreview(false);
                  }}
                  className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-xl text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  Verwerfen
                </button>
                <button 
                  onClick={() => {
                    setUserBio(suggestedBio);
                    localStorage.setItem('klar_user_bio', suggestedBio);
                    if (updateProfileData) {
                      updateProfileData({ bio: suggestedBio }).catch(console.error);
                    }
                    setSuggestedBio("");
                    setShowPreview(false);
                  }}
                  className="flex-1 py-2 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-xl text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Icebreakers Section */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-brand/30 dark:border-brand-light/30 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 dark:bg-brand-light/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div>
              <h3 className="font-medium flex items-center gap-2 text-stone-900 dark:text-stone-100 mb-1">
                <Sparkles size={16} className="text-brand dark:text-brand-light" />
                Deine Icebreaker
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Fragen, die Verbindungen auf deinem Profil sehen.
              </p>
            </div>
            
            <button 
              onClick={generateIcebreakers}
              disabled={isGenerating}
              className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
              title="Neu generieren"
            >
              <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span>
            </button>
          </div>

          <div className="space-y-2 relative z-10">
            {icebreakers.length > 0 ? (
              icebreakers.map((ib, idx) => (
                <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 rounded-xl text-sm text-stone-700 dark:text-stone-300 flex items-start gap-3">
                  <MessageCircle size={16} className="text-stone-400 shrink-0 mt-0.5" />
                  <span>{ib}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-stone-500 mb-4">Noch keine Icebreaker generiert.</p>
                <button 
                  onClick={generateIcebreakers}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-full text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  {isGenerating ? "Generiere..." : "Jetzt mit KI erstellen"}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {userValuesRadar.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">Werte-Radar</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">Deine Deep-Verbindung Ausrichtung</p>
              </div>
            </div>
            {/* BEFUND 12.08.2026 — endlich zugeordnet:
                Die Warnung „The width(0) and height(0) of chart should be
                greater than 0" verfolgt uns seit Tagen ohne Fundort. Sie
                kommt von HIER. Der Behaelter startete mit `scale: 0`; im
                ersten Bild misst `ResponsiveContainer` deshalb 0 x 0 und
                recharts beschwert sich. `h-64 w-full` half nicht — die
                Transformation verkleinert die gemessene Box trotzdem.
                Jetzt startet die Animation bei 0.98 statt 0. Sichtbar ist
                das kaum; die Warnung ist weg. */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, type: "spring", bounce: 0.4 }}
              id="werte-radar-container" className="h-64 w-full relative"
            >
                            <AnimatePresence>
                {showRadarTutorial && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-stone-900/60  rounded-3xl"
                  >
                    <div className="bg-white dark:bg-stone-800 p-5 rounded-2xl shadow-md max-w-sm w-full text-center relative">
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Sparkles size={24} />
                      </div>
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-2">Dein Deep-Verbindung Radar</h4>
                      <p className="text-sm text-stone-600 dark:text-stone-300 mb-5">
                        Tippe auf die einzelnen Werte-Achsen (z.B. "Abenteuer"), um detaillierte Erklärungen und potenzielle Gemeinsamkeiten mit Verbindungen zu sehen.
                      </p>
                      <button 
                        onClick={dismissRadarTutorial}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors"
                      >
                        Verstanden
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={userValuesRadar}>
                  <PolarGrid stroke="#e7e5e4" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={(props) => {
                      const { payload, x, y, textAnchor } = props;
                      const isActive = activeRadarValue === payload.value;
                      // Determine specific color for active axis
                      let tickColor = isActive ? '#a855f7' : '#78716c';
                      if (isActive && showCompareRadar) {
                         tickColor = '#d946ef'; // Fuchsia when active in compare mode
                      }
                      
                      return (
                        <motion.g 
                          className="recharts-layer recharts-polar-angle-axis-tick"
                          whileTap={{ scale: 1.15 }}
                        >
                          <text
                            x={x}
                            y={y}
                            textAnchor={textAnchor}
                            fill={tickColor}
                            fontSize={isActive ? 12 : 10}
                            fontWeight={isActive ? "bold" : "normal"}
                            onClick={() => {
                              triggerHaptic('LIGHT_TAP');
                              setActiveRadarValue(isActive ? null : payload.value);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <title>{VALUE_EXPLANATIONS[payload.value] || payload.value}</title>
                            <tspan x={x} dy="0em">{payload.value}</tspan>
                          </text>
                        </motion.g>
                      );
                    }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <RechartsTooltip content={<CustomRadarTooltip />} />
                  <Radar name="Deine Werte" dataKey="A" stroke={activeRadarValue ? "#d946ef" : radarColorA} fill={activeRadarValue ? "#d946ef" : radarColorA} fillOpacity={0.4} />
                  {showCompareRadar && (
                    <Radar name="Verbindung Werte" dataKey="B" stroke={radarColorB} fill={radarColorB} fillOpacity={0.4} />
                  )}
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            
            <div className="flex justify-between items-center mt-2 mb-4">
              <button 
                onClick={() => setShowRadarSettings(!showRadarSettings)}
                className="text-xs flex items-center gap-1 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              >
                <Settings size={14} /> Farben anpassen
              </button>
              <button 
                onClick={downloadRadarImage}
                className="text-xs flex items-center gap-1 text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 font-medium"
              >
                <Download size={14} /> Als Bild exportieren
              </button>
            </div>
            
            <AnimatePresence>
              {showRadarSettings && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl overflow-hidden"
                >
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-stone-600 dark:text-stone-400 block mb-1">Dein Profil</label>
                      <input type="color" value={radarColorA} onChange={(e) => setRadarColorA(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-stone-600 dark:text-stone-400 block mb-1">Verbindung Profil</label>
                      <input type="color" value={radarColorB} onChange={(e) => setRadarColorB(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Compare Toggle */}
            <div className="flex justify-between items-center mt-4 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Mit Verbindung vergleichen</span>
              <button role="switch" aria-checked={showCompareRadar} aria-label="Mit Verbindung vergleichen"
                onClick={() => setShowCompareRadar(!showCompareRadar)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showCompareRadar ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-700'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showCompareRadar ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            
            {/* Filter Chips */}
            {showCompareRadar && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button 
                  onClick={() => { triggerHaptic('LIGHT_TAP'); setMatchFilter('all'); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${matchFilter === 'all' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`}
                >
                  Alle
                </button>
                <button 
                  onClick={() => { triggerHaptic('LIGHT_TAP'); setMatchFilter('similarities'); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${matchFilter === 'similarities' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`}
                >
                  Ähnlichkeiten
                </button>
                <button 
                  onClick={() => { triggerHaptic('LIGHT_TAP'); setMatchFilter('complements'); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${matchFilter === 'complements' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`}
                >
                  Ergänzungen
                </button>
                <button 
                  onClick={() => { triggerHaptic('LIGHT_TAP'); setMatchFilter('contrasts'); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${matchFilter === 'contrasts' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`}
                >
                  Kontraste
                </button>
              </div>
            )}

            {/* Deep Verbindung & Tooltip Details */}

            {/* Global Deep Verbindung List */}
            <AnimatePresence>
              {!activeRadarValue && showCompareRadar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                    <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">Deep Verbindung Übersicht</h4>
                    <ul className="flex flex-col gap-3">
                      {(matchFilter === 'all' || matchFilter === 'similarities') && (
                        <li className="flex gap-3 items-start bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                          <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">Ähnlichkeit (Achtsamkeit)</span>
                            <span className="text-xs text-stone-600 dark:text-stone-400">Ihr teilt eine hohe Ausprägung bei Achtsamkeit. Gute Basis für tiefgründige Gespräche.</span>
                          </div>
                        </li>
                      )}
                      {(matchFilter === 'all' || matchFilter === 'complements') && (
                        <li className="flex gap-3 items-start bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                          <Sparkles size={16} className="text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 block mb-0.5">Ergänzung (Abenteuer)</span>
                            <span className="text-xs text-stone-600 dark:text-stone-400">Du bist eher ruhig, dein Verbindung bringt Abenteuerlust ein. Das kann euch beide bereichern.</span>
                          </div>
                        </li>
                      )}
                      {(matchFilter === 'all' || matchFilter === 'contrasts') && (
                        <li className="flex gap-3 items-start bg-rose-50 dark:bg-rose-900/10 p-3 rounded-lg border border-rose-100 dark:border-rose-800/30">
                          <Zap size={16} className="text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block mb-0.5">Kontrast (Karriere)</span>
                            <span className="text-xs text-stone-600 dark:text-stone-400">Sehr unterschiedliche Fokus-Bereiche bei Karriere. Offene Kommunikation ist hier wichtig.</span>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {activeRadarValue && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-xl">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-2">
                      <Sparkles size={16} /> {activeRadarValue}
                    </h4>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                      {VALUE_EXPLANATIONS[activeRadarValue]}
                    </p>
                    
                    {showCompareRadar && DEEP_MATCH_INSIGHTS[activeRadarValue] && (
                      <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800/30">
                        <h5 className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">Deep Verbindung Gemeinsamkeiten:</h5>
                        <ul className="flex flex-col gap-1.5">
                          {DEEP_MATCH_INSIGHTS[activeRadarValue].map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
                              <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}

        <SmartAuditWidget 
          bio={userBio} 
          values={userValuesRadar} 
          // ENTFERNT 12.08.2026: Hier stand fest verdrahtet
          // profileImageUrl="https://images.unsplash.com/photo-1535713875002-...".
          // Zwei Gruende:
          // 1. Das ist ein Stockfoto einer fremden Person. Der "Smart-Audit"
          //    hat also nicht das Profilbild der lesenden Person bewertet,
          //    sondern ein beliebiges Bild aus dem Netz.
          // 2. pruefeBildUrl (SEC-03) laesst nur Firebase Storage und
          //    Google-Profilbilder zu. Der Server antwortete deshalb mit
          //    400 "Diese Herkunft ist nicht freigegeben." - seit dem
          //    08.08. bei JEDEM Audit. Vorher fiel das nicht auf, weil die
          //    Fehlerantwort als Ergebnis angezeigt wurde ("undefined / 10").
          // Das Audit laeuft jetzt ohne Bild, also auf Bio und Werten.
          // Sobald es ein echtes Profilbild aus Firebase Storage gibt,
          // gehoert dessen Adresse hierher.
          onAuditComplete={setAuditScore}
        />

        <div className="mb-6">
          <ProfileCheckWidget />
        </div>
        <div className="mb-6">
          {/* ENTFERNT: ReflectionRadarWidget — die Stimmungswerte kamen
              aus `Math.random()`. */}
          {/* ENTFERNT: ConversationHealthWidget — im Quelltext standen
              `healthScore = 85`, `longMessages = 24`, `emojiOnly = 3` als
              Konstanten, angezeigt unter „So kommunizierst du diese Woche"
              mit dem Etikett „Sehr Gut". Die Zahlen aenderten sich nie,
              fuer niemanden. */}
          <ProfileCardThemeSelector />
          
        <div className="mb-6">
          

          <SmartPause />
          {/* ENTFERNT 11.08.2026 — <ThemeSettingsWidget />.
              Dritte Hell/Dunkel/System-Wahl auf derselben Seite, und die
              dritte, die nach `localStorage['theme']` schrieb statt nach
              `klar_theme`. Sie war damit ohne dauerhafte Wirkung und
              konnte einen anderen Zustand anzeigen als die beiden
              anderen. Geblieben sind die Systemleiste oben (schneller
              Wechsel) und "Einstellungen -> Erscheinungsbild" weiter
              unten (vollstaendige Wahl, ueber useTheme).
              Die Datei src/components/ThemeSettingsWidget.tsx wird damit
              von niemandem mehr benutzt und ist zu loeschen. */}
          {/* <HapticSettings /> ist am 14.08.2026 nach unten in den
              Abschnitt "Einstellungen" gewandert — siehe Begruendung dort.
              <SmartPauseWidget /> stand hier ein zweites Mal; beide Karten
              sind jetzt eine einzige <SmartPause />, die weiter oben steht. */}
          <FocusTimeSettingsWidget />
        </div>

        <div className="mb-6">
          <DatingMoodTrackerWidget />
          <div className="mt-6">
            <DatingVibeChartWidget />
            <div className="mt-4">
              <VibeSummaryPDFGenerator />
            </div>
          </div>

        </div>

        {/* ENTFERNT: DatingProgressChartWidget — Interaktion und
            Kompatibilitaet kamen aus `Math.random()`. */}
        <InsightsChart />
        
        <UserAchievementsWidget />
        {/* ENTFERNT: DatingActivityDashboardWidget — eine feste
            4-Wochen-Tabelle im Quelltext, angezeigt als „Dating-Aktivitaet
            (30 Tage)". */}
        <DatingMilestones />
        
        <PDFResumeGenerator userBio={userBio} userInterests={userInterests} />

        
        {/* Klar+ Premium Vergleichstabelle */}
        <div className="w-full mt-4 p-5 bg-white dark:bg-stone-900 border border-brand/20 dark:border-brand/30 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
            <Zap size={150} className="text-brand dark:text-brand-light" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={20} className="text-brand dark:text-brand-light fill-brand/20" />
              <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">Klar+ Premium</h3>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-6">
              Vergleiche die kostenlose Ad-Lite Version mit Klar+ Premium. Du entscheidest, wie du zahlst – mit Zeit oder mit Geld.
            </p>

            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
                    <th className="p-3 font-medium text-stone-600 dark:text-stone-400">Funktion</th>
                    <th className="p-3 font-semibold text-stone-800 dark:text-stone-200 border-l border-stone-200 dark:border-stone-800 text-center w-28">Free<br/><span className="text-[10px] font-normal text-stone-500">(Ad-Lite)</span></th>
                    <th className="p-3 font-semibold text-brand dark:text-brand-light border-l border-stone-200 dark:border-stone-800 text-center w-28 bg-brand/5 dark:bg-brand/10">Klar+<br/><span className="text-[10px] font-normal text-brand/70">Premium</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-3 text-stone-700 dark:text-stone-300">Kuratierte Profile / Tag</td>
                    <td className="p-3 text-center text-stone-700 dark:text-stone-300 border-l border-stone-100 dark:border-stone-800/50 font-medium">8</td>
                    <td className="p-3 text-center text-stone-900 dark:text-stone-100 border-l border-stone-100 dark:border-stone-800/50 bg-brand/5 dark:bg-brand/10 font-bold">Unbegrenzt</td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-3 text-stone-700 dark:text-stone-300">Text + 1 Voice Note pro Chat</td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50"><Check size={16} className="mx-auto text-green-500" /></td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50 bg-brand/5 dark:bg-brand/10"><Check size={16} className="mx-auto text-brand" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-3 text-stone-700 dark:text-stone-300">Date-Planner</td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50"><Check size={16} className="mx-auto text-green-500" /></td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50 bg-brand/5 dark:bg-brand/10"><Check size={16} className="mx-auto text-brand" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-3 text-stone-700 dark:text-stone-300">Werbefreiheit</td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50"><X size={16} className="mx-auto text-red-400" /></td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50 bg-brand/5 dark:bg-brand/10"><Check size={16} className="mx-auto text-brand" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-3 text-stone-700 dark:text-stone-300">Inbound-Nachricht sehen</td>
                    <td className="p-3 text-center text-xs text-stone-500 dark:text-stone-400 border-l border-stone-100 dark:border-stone-800/50">1x / Tag (mit Ad)</td>
                    <td className="p-3 text-center text-stone-900 dark:text-stone-100 border-l border-stone-100 dark:border-stone-800/50 bg-brand/5 dark:bg-brand/10 font-bold">Sofort & Alle</td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-3 text-stone-700 dark:text-stone-300">Erweiterte Filter (Kinderwunsch etc.)</td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50"><X size={16} className="mx-auto text-red-400" /></td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50 bg-brand/5 dark:bg-brand/10"><Check size={16} className="mx-auto text-brand" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-3 text-stone-700 dark:text-stone-300">Incognito-Modus</td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50"><X size={16} className="mx-auto text-red-400" /></td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50 bg-brand/5 dark:bg-brand/10"><Check size={16} className="mx-auto text-brand" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-3 text-stone-700 dark:text-stone-300">Unbegrenzte Chat-Historie</td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50"><X size={16} className="mx-auto text-red-400" /></td>
                    <td className="p-3 text-center border-l border-stone-100 dark:border-stone-800/50 bg-brand/5 dark:bg-brand/10"><Check size={16} className="mx-auto text-brand" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <button className="w-full mt-5 py-3 bg-brand hover:bg-brand-dark text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2">
              <Sparkles size={16} />
              Klar+ entdecken
            </button>
          </div>
        </div>

        <div className="w-full mt-4 p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl shadow-sm">

          <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-4">Einstellungen</h3>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
              <Sun size={18} className="text-stone-500" />
              Erscheinungsbild
            </h4>
            <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors ${theme === 'light' ? 'bg-white dark:bg-stone-700 text-brand shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
              >
                <Sun size={14} />
                Hell
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors ${theme === 'dark' ? 'bg-white dark:bg-stone-700 text-brand shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
              >
                <Moon size={14} />
                Dunkel
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors ${theme === 'system' ? 'bg-white dark:bg-stone-700 text-brand shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
              >
                <Monitor size={14} />
                System
              </button>
            </div>
          </div>

          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BellRing size={20} className="text-stone-500 dark:text-stone-400" />
              <div>
                <span className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Smart Verbindung Benachrichtigungen
                </span>
                <span className="block text-xs text-stone-500 dark:text-stone-400">
                  Push-Alerts nur für Verbindungen über 90%
                </span>
              </div>
            </div>
            
            <button role="switch" aria-checked={smartMatchAlerts} aria-label="Smart-Match-Hinweise"
              onClick={() => {
                const newValue = !smartMatchAlerts;
                setSmartMatchAlerts(newValue);
                saveSmartMatchSettings(newValue);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${smartMatchAlerts ? 'bg-brand dark:bg-brand-light' : 'bg-stone-200 dark:bg-stone-700'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  smartMatchAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          

          
                    

          
          {/* ── BEFUND 14.08.2026: HAPTIK STAND ZWEIMAL AUF DIESER SEITE ──
              Hier war eine ZWEITE, in Profile.tsx selbst gebaute Bedienung
              (Aus / Sanft / Stark), waehrend weiter oben bereits
              <HapticSettings /> stand. Beide schrieben denselben Schluessel
              `klar_haptic_intensity`, hielten den Wert aber in GETRENNTEN
              React-Zustaenden: Wer oben "Stark" waehlte, sah unten den alten
              Wert — bis zum Neuladen. Zwei Bedienelemente fuer eine
              Einstellung, die sich widersprechen koennen.

              Geblieben ist <HapticSettings />, weil es die vollstaendigere
              ist: Schalter, Muster UND Staerke, und es schreibt auch
              `klar_haptic_enabled`. Es steht jetzt HIER, unter
              "Einstellungen", statt mitten auf der Seite — das ist zugleich
              der erste Schritt zum Reiter "Einstellungen"
              (klar/27-profilseite-layout). */}
          <div className="mb-6">
            <HapticSettings />
          </div>

          <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700">
            <h4 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4">Rechtliches & Sicherheit</h4>
            
            {/* GEGENPRÜFUNG 09.08.2026: Diese beiden Schaltflächen hatten
                kein `onClick` — genau der Befund DSG-02 („Datenschutz-
                erklärung/AGB unerreichbar"). Der Commit davor legte die
                Seiten an, verlinkte sie aber nur aus dem Einwilligungs-
                dialog. Aus der laufenden App gab es weiterhin keinen Weg
                dorthin. Jetzt echte Verweise. */}
            <a href="/rechtstexte/datenschutz" className="w-full flex items-center justify-between p-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-xl transition-colors mb-2">
              <span className="text-sm text-stone-700 dark:text-stone-300">Datenschutzerklärung</span>
              <ChevronRight size={18} className="text-stone-400" />
            </a>
            <a href="/rechtstexte/agb" className="w-full flex items-center justify-between p-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-xl transition-colors mb-2">
              <span className="text-sm text-stone-700 dark:text-stone-300">Nutzungsbedingungen</span>
              <ChevronRight size={18} className="text-stone-400" />
            </a>
            
            <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl mb-2">
              <span className="text-sm text-stone-700 dark:text-stone-300">App-Version</span>
              <span className="text-sm font-medium text-stone-500">0.1.0 (Alpha)</span>
            </div>
            
            {/* P1: § 312k und § 356a — unmittelbar erreichbar, ohne
                Zwischenschritte. */}
            <AboVerwaltung />

            {/* P1: Verifizierung — ohne sie lehnt jede Regel jeden Kontakt ab. */}
            <Link
              to="/verifizierung"
              className="w-full flex items-center justify-between p-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-xl transition-colors mt-4"
            >
              <span className="text-sm text-stone-700 dark:text-stone-300">
                {verifizierung === "bestaetigt" ? "Verifiziert" :
                 verifizierung === "in_pruefung" ? "Verifizierung läuft" : "Jetzt verifizieren"}
              </span>
              <ChevronRight size={18} className="text-stone-400" />
            </Link>

            {/* ── NEU 12.08.2026: Abmelden ───────────────────────────────
                BEFUND: `logOut` aus dem AuthContext hatte KEINEN Aufrufer in
                der gesamten App. Das Symbol `LogOut` war hier importiert und
                wurde nie gerendert. Es gab also keinen Weg, sich abzumelden —
                nur „Konto löschen".

                Das ist mehr als eine fehlende Bequemlichkeit: Wer das Gerät
                aus der Hand gibt, konnte seine Gespräche nicht schliessen.
                `logOut` räumt beim Abmelden auch den lokalen Speicher auf
                (siehe AuthContext, Befund FE-03/FE-04) — genau dafür war es
                gebaut.

                Falls Sie diese Schaltfläche nicht wollen: Sie steht allein
                in diesem Block und ist in einem Zug wieder zu entfernen. */}
            <button
              onClick={() => { void logOut(); }}
              className="w-full flex items-center justify-between p-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-xl transition-colors mt-4"
            >
              <span className="text-sm text-stone-700 dark:text-stone-300">Abmelden</span>
              <LogOut size={18} className="text-stone-400" />
            </button>

            <button 
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full flex items-center justify-between p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors mt-4 disabled:opacity-60"
            >
              <span className="text-sm font-medium">
                {deleting ? "Wird gelöscht …" : showDeleteConfirm ? "Wirklich löschen — endgültig" : "Konto löschen"}
              </span>
              <Trash2 size={18} />
            </button>

            {showDeleteConfirm ? (
              <div className="mt-3 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                {/* P0-6: Die Zusage nennt genau das, was der Server tut —
                    einschliesslich dessen, was aus gesetzlichen Gruenden
                    bleibt (Art. 17 Abs. 3 lit. b DSGVO, § 147 AO). */}
                <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                  Gelöscht werden: dein Profil, alle Gespräche samt Nachrichten,
                  deine Verbindungen, dein Kontingent und deine eigenen Meldungen.
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-300/80">
                  Nicht gelöscht werden: Meldungen anderer Personen über dich
                  (ohne Bezug zu dir) und Zahlungsbelege. Beides müssen wir
                  aufbewahren.
                </p>
                {deleteError ? (
                  <p role="alert" className="mt-3 text-xs text-red-700 dark:text-red-300">{deleteError}</p>
                ) : null}
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mt-3 text-xs text-stone-600 dark:text-stone-400 underline"
                >
                  Abbrechen
                </button>
              </div>
            ) : null}
            
          </div>
        </div>
      </div>
    </div>
    </div>
    </>

  );
};

