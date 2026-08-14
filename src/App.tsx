import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router";
// ShieldCheck entfaellt mit CookieConsent — noUnusedLocals bricht sonst den Build.
import { MessageCircle, User, Compass, Sparkles, BookOpen, Bell, X, Scale, Flower2 } from "lucide-react";
// DSG-02: Altersangabe, Einwilligung, erreichbare Rechtstexte.
import { EinwilligungUndAlter } from "./components/EinwilligungUndAlter";
import { Sichtschutz, SichtschutzKnopf } from "./components/Sichtschutz";
import { RegistrierungsGate } from "./components/RegistrierungsGate";
import { QuickThemeToggle } from "./components/QuickThemeToggle";
// Die geltende Fassung der Rechtstexte. Aus pure.ts, damit Client und Server
// dieselbe Zahl benutzen — zwei Konstanten wären zwei Wahrheiten.
import { EINWILLIGUNG_VERSION } from "./server/pure";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalApiOverlay } from "./components/GlobalApiOverlay";
import { GlobalErrorOverlay } from "./components/GlobalErrorOverlay";
import { NotificationService } from "./services/notificationService";
import { motion, AnimatePresence } from "motion/react";
import { hapticFeedback } from "./lib/haptics";
import { LegalUpdatesModal, type LegalUpdate } from "./components/LegalUpdatesModal";

import { KontingentAnzeige } from "./components/KontingentAnzeige";
import Verifizierung from "./screens/Verifizierung";
import { useOnline } from "./lib/useOnline";

// GEGENPRÜFUNG 09.08.2026: Hier stand die Komponente `CookieConsent`.
// Sie war ein zweiter Einwilligungsdialog neben dem neuen aus DSG-02 —
// mit hervorgehobenem „Alle Akzeptieren" (bg-brand-light) und blassem
// „Nur Notwendige" (bg-stone-800). Genau das Muster, das der EuGH in
// Planet49 beanstandet hat und das der neue Dialog ausdrücklich vermeidet.
//
// Ihr Ergebnis landete in `klar_cookie_consent` und wurde NIRGENDS
// ausgewertet — ausser um das Banner wieder auszublenden. Zwei
// widersprüchliche Abfragen, von denen keine eine Wirkung hat, sind
// schlechter als eine, die wirkt. Entfernt statt repariert.

function Layout({ children }: { children: React.ReactNode }) {

  const [hasPendingRituals, setHasPendingRituals] = useState(false);
  useEffect(() => {
    const checkRituals = () => {
      const lastRitual = localStorage.getItem('klar_last_ritual_date');
      const today = new Date().toLocaleDateString('de-DE');
      setHasPendingRituals(lastRitual !== today);
    };
    checkRituals();
    window.addEventListener('storage', checkRituals);
    return () => window.removeEventListener('storage', checkRituals);
  }, []);

  const location = useLocation();
  const isChatView = location.pathname.startsWith('/chat/');
  const online = useOnline();
  const [inAppNotification, setInAppNotification] = useState<{title: string, body?: string} | null>(null);

  const [legalUpdates, setLegalUpdates] = useState<LegalUpdate[]>([]);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [acknowledgedLegalIds, setAcknowledgedLegalIds] = useState<string[]>([]);
  const [unseenLegalCount, setUnseenLegalCount] = useState(0);

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      setInAppNotification(customEvent.detail);
      hapticFeedback('medium'); // Add subtle haptic feedback
      setTimeout(() => setInAppNotification(null), 6000);
    };

    const handleOpenLegal = () => setIsLegalModalOpen(true);

    window.addEventListener('klar-in-app-notification', handleNotification);
    window.addEventListener('open-legal-modal', handleOpenLegal);
    return () => {
      window.removeEventListener('klar-in-app-notification', handleNotification);
      window.removeEventListener('open-legal-modal', handleOpenLegal);
    };
  }, []);

  // Fetch legal updates from the automated scanner backend
  useEffect(() => {
    const fetchLegalUpdates = async () => {
      try {
        const storedAck = JSON.parse(localStorage.getItem('klar_ack_legal_ids') || '[]');
        setAcknowledgedLegalIds(storedAck);

        const res = await fetch('/api/legal-updates');
        if (res.ok) {
          const data: LegalUpdate[] = await res.text().then(text => text ? JSON.parse(text) : {});
          setLegalUpdates(data);
          
          const unseen = data.filter(d => !storedAck.includes(d.id));
          setUnseenLegalCount(unseen.length);

          if (unseen.some(d => d.actionRequired)) {
            setInAppNotification({
              title: "Wichtige rechtliche Updates",
              body: "Es gibt neue DSGVO/rechtliche Änderungen, die deine Zustimmung erfordern."
            });
          }
        }
      } catch (e) {
        console.warn("Could not fetch legal updates", e);
      }
    };
    
    fetchLegalUpdates();
    const interval = setInterval(fetchLegalUpdates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeLegal = (id: string) => {
    const newAck = [...acknowledgedLegalIds, id];
    setAcknowledgedLegalIds(newAck);
    localStorage.setItem('klar_ack_legal_ids', JSON.stringify(newAck));
    setUnseenLegalCount(prev => Math.max(0, prev - 1));
  };
  
  return (
    <div className="mx-auto w-full max-w-md h-[100dvh] flex flex-col bg-light-bg dark:bg-dark-bg relative overflow-hidden shadow-md">
      <AnimatePresence>
        {inAppNotification && (
          <motion.div 
            initial={{ y: -100, opacity: 0, x: "-50%" }}
            animate={{ y: 16, opacity: 1, x: "-50%" }}
            exit={{ y: -100, opacity: 0, x: "-50%" }}
            className="absolute top-0 left-1/2 z-50 w-[90%] bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-700 flex items-start gap-3"
          >
            <div className="bg-brand/10 dark:bg-brand-light/10 p-2 rounded-full shrink-0">
              <Bell size={20} className="text-brand dark:text-brand-light" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{inAppNotification.title}</h4>
              {inAppNotification.body && <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{inAppNotification.body}</p>}
            </div>
            <button aria-label="Benachrichtigung schließen" onClick={() => setInAppNotification(null)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <GlobalApiOverlay />
          <GlobalErrorOverlay />
          {/* P2: Offline ist ein Zustand, kein Sonderfall
              (Design-Richtlinie §6). Die Leiste steht ueber dem Inhalt,
              damit klar ist, dass alles darunter veraltet sein kann. */}
          {!online && (
            <div role="status" className="bg-accent-quiet text-ink text-sm px-4 py-2 text-center">
              Keine Verbindung. Angezeigte Inhalte können veraltet sein.
            </div>
          )}

          {/* ── Systemleiste ────────────────────────────────────────────────
              BEFUND 11.08.2026: Diese Zeile gab es nur ausserhalb des Chats
              (`!isChatView`) und sie enthielt allein das Kontingent. Der
              Hell-/Dunkel-Knopf hing im Dashboard (`Dashboard.tsx:2025`) und
              existierte auf Profil, Chats, Coach, Tipps und im Chat gar
              nicht; der Sichtschutz schwebte frei und lag zeitweise
              unsichtbar unter dem Theme-Knopf.

              Beide gehören zur Bedienung der App selbst, nicht zu einem
              Bildschirm. Sie stehen deshalb hier — in `Layout`, oberhalb der
              Routen — und sind damit überall an derselben Stelle, auch im
              Chat. Als gewöhnliche Kinder einer Leiste, ohne `fixed`: So
              kann keiner von beiden je wieder etwas überdecken.

              Die Leiste wird immer gerendert, das Kontingent darin nur
              ausserhalb des Chats (P1, Design-Richtlinie §1 und §8). Der
              leere Platz links im Chat ist beabsichtigt: Die Knöpfe
              springen sonst beim Wechsel zwischen den Bildschirmen. */}
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 px-2 py-1">
            <div className="flex-1 flex justify-center">
              {!isChatView && <KontingentAnzeige kompakt />}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <SichtschutzKnopf />
              <QuickThemeToggle />
            </div>
          </div>
          {/* P2: Sprungmarke — mit Tastatur muss man an der Navigation
              vorbeikommen (WCAG 2.4.1). Sichtbar nur bei Fokus. */}
          <a href="#inhalt" className="skip-link">Zum Inhalt springen</a>
          <main id="inhalt" className="flex-1 overflow-y-auto hide-scrollbar relative">
        {children}
      </main>
      
      {!isChatView && (
        <nav className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 pb-safe relative" aria-label="Hauptnavigation">
          {unseenLegalCount > 0 && (
            <button 
              onClick={() => setIsLegalModalOpen(true)}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-4 py-2 rounded-full shadow-lg text-xs font-medium flex items-center gap-2  transition-transform"
            >
              <Scale size={14} />
              {unseenLegalCount} {unseenLegalCount === 1 ? 'neues Update' : 'neue Updates'}
            </button>
          )}
          <div className="flex items-center justify-around p-3">
            <Link to="/" onClick={() => hapticFeedback('light')} className={`p-2 flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-brand dark:text-brand-light' : 'text-stone-700 dark:text-stone-400'}`} aria-label="Entdecken: Neue Vorschläge ansehen" aria-current={location.pathname === '/' ? 'page' : undefined}>
              <Compass size={24} />
              <span className="text-xs font-medium">Entdecken</span>
            </Link>
            <Link to="/chats" onClick={() => hapticFeedback('light')} className={`p-2 flex flex-col items-center gap-1 ${location.pathname.startsWith('/chats') ? 'text-brand dark:text-brand-light' : 'text-stone-700 dark:text-stone-400'}`} aria-label="Gespräche: Deine Kontakte und Nachrichten" aria-current={location.pathname.startsWith('/chats') ? 'page' : undefined}>
              <MessageCircle size={24} />
              <span className="text-xs font-medium">Gespräche</span>
            </Link>
            <Link to="/ai-coach" onClick={() => hapticFeedback('light')} className={`p-2 flex flex-col items-center gap-1 ${location.pathname === '/ai-coach' ? 'text-brand dark:text-brand-light' : 'text-stone-700 dark:text-stone-400'}`} aria-label="Coach: KI-Unterstützung und Dating-Tipps" aria-current={location.pathname === '/ai-coach' ? 'page' : undefined}>
              <Sparkles size={24} />
              <span className="text-xs font-medium">Coach</span>
            </Link>
            <Link to="/rituals" onClick={() => hapticFeedback('light')} className={`p-2 flex flex-col items-center gap-1 relative ${location.pathname === '/rituals' ? 'text-brand dark:text-brand-light' : 'text-stone-700 dark:text-stone-400'}`} aria-label="Rituale: Dating-Rituale und Reflexion" aria-current={location.pathname === '/rituals' ? 'page' : undefined}>
              <div className="relative">
                <Flower2 size={24} />
                {hasPendingRituals && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-dark-bg"></span>
                )}
              </div>
              <span className="text-xs font-medium">Rituale</span>
            </Link>
            <Link to="/tips" onClick={() => hapticFeedback('light')} className={`p-2 flex flex-col items-center gap-1 ${location.pathname === '/tips' ? 'text-brand dark:text-brand-light' : 'text-stone-700 dark:text-stone-400'}`} aria-label="Tipps: Hilfe und Anleitungen" aria-current={location.pathname === '/tips' ? 'page' : undefined}>
              <BookOpen size={24} />
              <span className="text-xs font-medium">Tipps</span>
            </Link>
            <Link to="/profile" onClick={() => hapticFeedback('light')} className={`p-2 flex flex-col items-center gap-1 ${location.pathname === '/profile' ? 'text-brand dark:text-brand-light' : 'text-stone-700 dark:text-stone-400'}`} aria-label="Profil: Deine Einstellungen und Verifizierung" aria-current={location.pathname === '/profile' ? 'page' : undefined}>
              <User size={24} />
              <span className="text-xs font-medium">Profil</span>
            </Link>
          </div>
        </nav>
      )}
      
      <AnimatePresence>
        {isLegalModalOpen && (
          <LegalUpdatesModal
            updates={legalUpdates}
            onClose={() => setIsLegalModalOpen(false)}
            onAcknowledge={handleAcknowledgeLegal}
            acknowledgedIds={acknowledgedLegalIds}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { SyncBanner } from "./components/SyncBanner";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./lib/firebase";
import { SUSFeedbackModal } from "./components/SUSFeedbackModal";
import Login from "./screens/Login";

// ═══════════════════════════════════════════════════════════════════════════
// BILDSCHIRME WERDEN ERST GELADEN, WENN JEMAND SIE SIEHT (14.08.2026)
//
// Vorher stand hier fuer jeden Bildschirm ein FESTER Import. Ein fester
// Import wird geladen, bevor die erste Zeile dieser Komponente laeuft — die
// Weiche `if (!user) return <Login />` weiter unten kommt dafuer zu spaet.
//
// Gemessen im Netzwerk-Reiter, auf dem ANMELDEBILDSCHIRM, vor jeder
// Anmeldung: recharts (1.246 kB), jspdf (697 kB), d3 (381 kB),
// html2canvas-pro (364 kB) und rund hundert eigene Bausteine, darunter
// `PDFResumeGenerator` und `Confetti`.
//
// `Login` bleibt bewusst FEST importiert: Er ist das Erste, was gebraucht
// wird. Ihn nachzuladen hiesse, den Anmeldebildschirm hinter einem
// Ladezustand zu verstecken.
//
// `DatingRituals` ist ein benannter Export, deshalb die Umformung auf
// `default` — `React.lazy` erwartet ein Modul mit `default`.
// ═══════════════════════════════════════════════════════════════════════════
const Dashboard = lazy(() => import("./screens/Dashboard"));
const Chats = lazy(() => import("./screens/Chats"));
const ChatView = lazy(() => import("./screens/ChatView"));
const Profile = lazy(() => import("./screens/Profile"));
const KlarPlus = lazy(() => import("./screens/KlarPlus"));
const MeilensteineAlle = lazy(() => import("./screens/MeilensteineAlle"));
const DatingRituals = lazy(() =>
  import("./screens/DatingRituals").then((m) => ({ default: m.DatingRituals })),
);
const SafetyCenter = lazy(() => import("./screens/SafetyCenter"));
const AICoach = lazy(() => import("./screens/AICoach"));
const Tips = lazy(() => import("./screens/Tips"));
const Onboarding = lazy(() => import("./screens/Onboarding"));
const Rechtstexte = lazy(() => import("./screens/Rechtstexte"));
const AdminDashboard = lazy(() => import("./screens/AdminDashboard"));

/** Derselbe Ladezustand, den `App` beim Anmelden zeigt — damit ein Wechsel
 *  nicht anders aussieht als ein Start. */
function Ladepunkt() {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-light-bg dark:bg-dark-bg">
      <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse"></div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    // `Suspense` ist die Kehrseite von `lazy`: Waehrend ein Bildschirm
    // nachgeladen wird, muss etwas dastehen. Ohne diese Klammer wirft React.
    <Suspense fallback={<Ladepunkt />}>
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/chats" element={<PageWrapper><Chats /></PageWrapper>} />
        <Route path="/chat/:id" element={<PageWrapper><ChatView /></PageWrapper>} />
        <Route path="/ai-coach" element={<PageWrapper><AICoach /></PageWrapper>} />
        <Route path="/tips" element={<PageWrapper><Tips /></PageWrapper>} />
        <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
        {/* Klar+ hat seit 14.08.2026 eine eigene Seite. Vorher stand die
            Vergleichstabelle mitten in den Einstellungen — siehe klar/27,
            Abschnitt 9b. */}
        <Route path="/klar-plus" element={<PageWrapper><KlarPlus /></PageWrapper>} />
        {/* Die vollstaendige Meilensteinliste. Die kompakte Anzeige auf
            Profilseite und Dashboard zeigt drei; alles Weitere hier. */}
        <Route path="/meilensteine" element={<PageWrapper><MeilensteineAlle /></PageWrapper>} />
        <Route path="/rituals" element={<PageWrapper><DatingRituals /></PageWrapper>} />
        <Route path="/safety" element={<PageWrapper><SafetyCenter /></PageWrapper>} />
        {/* P1: Ohne Verifizierung lehnen die Firestore-Regeln jeden Kontakt ab. */}
        <Route path="/verifizierung" element={<PageWrapper><Verifizierung /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
        {/* DSG-02: Vorher waren Datenschutzerklaerung und AGB aus der App
            nicht erreichbar — Schaltflaechen ohne onClick, Text ohne Verweis.
            Art. 13 DSGVO verlangt die Information bei der Erhebung. */}
        <Route path="/rechtstexte/:art" element={<PageWrapper><Rechtstexte /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
    </Suspense>
  );
}

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
};

function AppContent() {

  const { user, loading, profileData, updateProfileData, refreshProfile } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);



  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('theme') || 'system';
      if (
        savedTheme === 'dark' || 
        (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    applyTheme();
    
    // Listen for OS theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (localStorage.getItem('theme') === 'system' || !localStorage.getItem('theme')) {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleThemeChange);

    // Listen for custom event from Profile settings
    const handleSettingsChange = () => applyTheme();
    
    window.addEventListener('themechange', handleSettingsChange);

    // Global haptic feedback for buttons and links
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && typeof target.closest === 'function') {
        const isClickable = target.closest('button, a, [role="button"]');
        if (isClickable) {
          hapticFeedback('light');
        }
      }
    };
    document.addEventListener('click', handleGlobalClick, { capture: true });

    const completed = localStorage.getItem("hasCompletedOnboarding") === "true";
    setHasCompletedOnboarding(completed);

    if (completed) {
      NotificationService.requestPermission();
      NotificationService.checkMilestoneInactivity();
      NotificationService.checkRitualInactivity();
      NotificationService.checkDiaryInactivity();
      NotificationService.checkUpcomingDates();
      NotificationService.checkCoachImpulse();
      
      // Periodically check for upcoming dates (every minute)
      const interval = setInterval(() => {
        NotificationService.checkUpcomingDates();
      NotificationService.checkCoachImpulse();
      }, 60000);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('click', handleGlobalClick, { capture: true });
        mediaQuery.removeEventListener('change', handleThemeChange);
        window.removeEventListener('themechange', handleSettingsChange);
        
      
        
      };
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
      mediaQuery.removeEventListener('change', handleThemeChange);
      window.removeEventListener('themechange', handleSettingsChange);
    };
  }, []);

  
  // Background Sync
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const localBio = localStorage.getItem("klar_user_bio");
          
          let updated = false;
          
          if (data.bio && localBio && data.bio !== localBio) {
            localStorage.setItem("klar_user_bio", data.bio);
            updated = true;
          }
          
          if (data.interests) {
            const localInterests = localStorage.getItem("userInterests");
            if (localInterests && JSON.stringify(data.interests) !== localInterests) {
               localStorage.setItem("userInterests", JSON.stringify(data.interests));
               updated = true;
            }
          }
          
          if (updated) {
            const event = new CustomEvent('klar-in-app-notification', {
              detail: {
                title: "Daten synchronisiert",
                message: "Dein Profil wurde im Hintergrund aktualisiert.",
                type: "info"
              }
            });
            window.dispatchEvent(event);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user && profileData) {
      if (profileData.interests && profileData.interests.length > 0 && !hasCompletedOnboarding) {
        setHasCompletedOnboarding(true);
        localStorage.setItem("hasCompletedOnboarding", "true");
        if (profileData.bio) localStorage.setItem("klar_user_bio", profileData.bio);
        if (profileData.interests) localStorage.setItem("userInterests", JSON.stringify(profileData.interests));
        if (profileData.goal) localStorage.setItem("userGoal", profileData.goal);
      }
    }
  }, [user, profileData]);

  // FE-01 (Final Audit 08.08.2026): Dieser Block stand vor drei weiteren
  // useEffect-Aufrufen. Beim Wechsel auf offline rief React in derselben
  // Komponente weniger Hooks auf als im Durchlauf davor — „Rendered fewer
  // hooks than expected", die App stuerzte ab. Statt der Offline-Ansicht
  // sah man den Fehlerbildschirm. Jetzt steht die Rueckgabe hinter allen
  // Hooks; die Reihenfolge ist damit in jedem Durchlauf dieselbe.
  if (isOffline) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-stone-50 text-stone-900 p-6 text-center">
        <div>
          <h2 className="text-xl font-bold mb-2">Keine Internetverbindung</h2>
          <p className="text-stone-600 mb-4">Bitte überprüfe deine Verbindung und versuche es erneut.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-stone-900 text-white rounded-full font-medium">Neu laden</button>
        </div>
      </div>
    );
  }

  if (loading || hasCompletedOnboarding === null) return (
    <div className="h-[100dvh] flex items-center justify-center bg-light-bg dark:bg-dark-bg">
       <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse"></div>
    </div>
  );

  if (!user) {
    return <Login />;
  }

  // ── DSG-02 ──────────────────────────────────────────────────────────────
  // Vor allem anderen: Ist das Alter geprüft und liegt eine Entscheidung zur
  // Einwilligung vor? `isAdult` wird ausschließlich vom Server gesetzt; ein
  // Profil ohne das Feld bedeutet „unbekannt", nicht „ja".
  //
  // FOLGE, DIE ICH BENENNE: Auch bestehende Konten laufen hier hinein, weil
  // bei ihnen nie ein Alter erhoben wurde. Das ist gewollt — die Alternative
  // wäre, die alte Behauptung `isAdult: true` weitergelten zu lassen.
  //
  // `profileData === null` heißt: Profil nicht ladbar (offline). Dann wird
  // nicht gesperrt, sonst wäre die App bei jedem Netzaussetzer unbenutzbar.
  //
  // GEGENPRÜFUNG 09.08.2026 — zwei Fehler in der ersten Fassung dieses Gates:
  //
  //   1. Es stand VOR dem <BrowserRouter>. EinwilligungUndAlter benutzt
  //      <Link> auf die Rechtstexte; react-router wirft dort
  //      „useHref() may be used only in the context of a <Router>".
  //      Der Dialog wäre bei jedem neuen Konto abgestürzt — und weil das
  //      Alter da schon gespeichert war, wäre die Person nach dem Neuladen
  //      OHNE Einwilligung in der App gelandet.
  //      Jetzt steht das Gate innerhalb des Routers, mit eigenen Routen,
  //      damit die Rechtstexte auch aus dem Dialog erreichbar sind.
  //
  //   2. Es prüfte nur `isAdult`, obwohl der Kommentar behauptete, auch die
  //      Einwilligung sei erfasst. Wer den Dialog nach Schritt 1 schloss,
  //      kam an der Einwilligung vorbei. Jetzt wird beides geprüft.
  //
  //   3. `profileData === null` galt als „offline, nicht sperren". Das trifft
  //      aber JEDEN Ladefehler — mit blockierter Firestore-Anfrage liess sich
  //      das Gate umgehen. Deshalb wird jetzt der Grund unterschieden, und
  //      die eigentliche Durchsetzung liegt ohnehin auf dem Server
  //      (nurVolljaehrig in server.ts): Ohne Altersprüfung antwortet die API
  //      mit 403, egal was der Browser rendert.
  //   4. Die Fassung wurde nicht geprüft. `EINWILLIGUNG_VERSION` zu erhöhen
  //      hätte für niemanden etwas geändert — der Sinn der Versionierung
  //      ist aber genau, bei neuem Text erneut zu fragen (Art. 7 Abs. 1).
  // BEFUND 10.08.2026 -- KORREKTUR MEINER EIGENEN ENTSCHEIDUNG
  // Hier stand !!profileData && (...), begruendet mit: "profileData === null
  // heisst: Profil nicht ladbar (offline). Dann wird nicht gesperrt, sonst
  // waere die App bei jedem Netzaussetzer unbenutzbar."
  //
  // Die Praemisse war falsch. null heisst nicht nur "nicht ladbar", es
  // heisst auch "wird gerade geladen" -- und in genau diesem Fenster fiel
  // das Gate weg, das Dashboard hing sich ein und feuerte 22 Anfragen ab,
  // die der Server samt und sonders mit 403 alter_fehlt beantwortete. Die
  // eigentliche Ursache ist in AuthContext behoben (setLoading(true));
  // diese Zeile ist die zweite, unabhaengige Sperre.
  //
  // Echtes Offline faengt der isOffline-Zweig weiter oben ab. Bleibt das
  // Profil danach null, ist der Ladebildschirm oder das Gate die richtige
  // Antwort -- nicht ein Dashboard, in dem jede einzelne Anfrage scheitert.
  // Wer im Gate das Alter angibt, laesst den Server das Profil per
  // set({merge:true}) anlegen; der Weg heraus ist also vorhanden.
  const brauchtGate =
    !profileData
    || profileData.isAdult !== true
    || profileData.einwilligung?.version !== EINWILLIGUNG_VERSION;

  if (!hasCompletedOnboarding) {
    return <Suspense fallback={<Ladepunkt />}><Onboarding onComplete={() => {
      setHasCompletedOnboarding(true);
      NotificationService.requestPermission();
      localStorage.setItem('klar_last_milestone_engagement', Date.now().toString());
      
      const savedInterests = localStorage.getItem("userInterests");
      const savedGoal = localStorage.getItem("userGoal");
      
      if (updateProfileData && (savedInterests || savedGoal)) {
        updateProfileData({
          interests: savedInterests ? JSON.parse(savedInterests) : [],
          goal: savedGoal || "undecided"
        }).catch(console.error);
      }
    }} />
    </Suspense>;
  }

  return (
    <ErrorBoundary>
      {/* GEGENPRÜFUNG: <CookieConsent /> stand hier. Es war ein zweiter
          Einwilligungsdialog mit hervorgehobenem „Alle Akzeptieren" und
          blassem „Nur Notwendige" — genau das Muster, das der neue Dialog
          als unzulässig beschreibt (EuGH, Planet49). Sein Ergebnis
          (`klar_cookie_consent`) wurde nirgends ausgewertet ausser zum
          Ausblenden des Banners. Zwei widersprüchliche Abfragen, von denen
          keine wirkt, sind schlechter als eine, die wirkt. Entfernt. */}
      <SyncBanner />
      <SUSFeedbackModal />
      <BrowserRouter>
        {brauchtGate ? (
          <Suspense fallback={<Ladepunkt />}>
          <Routes>
            {/* Aus dem Dialog erreichbar — sonst wäre die Einwilligung
                nicht informiert im Sinne des Art. 13 DSGVO. */}
            <Route path="/rechtstexte/:art" element={<Rechtstexte />} />
            <Route
              path="*"
              element={<EinwilligungUndAlter
                onFertig={() => { void refreshProfile?.(); }}
                alterBereitsGeprueft={profileData?.isAdult === true}
              />}
            />
          </Routes>
          </Suspense>
        ) : (
        <Layout>
          {/* WIEDERHERGESTELLT 11.08.2026 — Sichtschutz.
              Die Sperre lag bisher in Dashboard.tsx und hatte keinen
              Einstieg: `setIsLocked(true)` kam im ganzen Projekt nicht vor.
              Sie deckte ausserdem nur das Dashboard ab — die
              schutzbedürftigen Inhalte stehen aber in den Gesprächen.
              Deshalb steht sie jetzt hier, eine Ebene über den Routen, und
              verdeckt alles. */}
          <Sichtschutz />
          {/* GAST-01: Haengt an einem Ereignis aus `authFetch`, nicht an
              einem Bildschirm — deshalb steht es hier, einmal fuer alles. */}
          <RegistrierungsGate />

          <AnimatedRoutes />

        </Layout>
        )}
      </BrowserRouter>
      {/* ENTFERNT 11.08.2026 — Sentry-Testknopf.
          Hier stand ein roter runder Knopf unten rechts (`fixed bottom-24
          right-4 z-[100]`), sichtbar nur im Entwicklungsmodus, der beim
          Antippen absichtlich `new Error("Sentry Test Error…")` warf.

          Er hat seinen Zweck erfüllt: Die Sentry-Anbindung ist verifiziert.
          Beim Testen des Sichtschutzes wurde er dagegen mehrfach für dessen
          Auslöser gehalten — mit dem Ergebnis, dass drei Fehlermeldungen in
          der Konsole standen, die wie Befunde aussahen und keine waren.

          Ein Werkzeug, das beim Prüfen falsche Befunde erzeugt, kostet mehr
          als es einbringt. Braucht jemand den Fall erneut, genügt in der
          Browserkonsole:  setTimeout(() => { throw new Error('Test') }) */}
    </ErrorBoundary>
  );
}

export default function App() {

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
