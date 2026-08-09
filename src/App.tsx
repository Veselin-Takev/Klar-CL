import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router";
import { MessageCircle, User, Compass, Sparkles, BookOpen, Bell, X, Scale, ShieldCheck, Flower2 } from "lucide-react";
import Dashboard from "./screens/Dashboard";
import Chats from "./screens/Chats";
import ChatView from "./screens/ChatView";
import Profile from "./screens/Profile";
import { DatingRituals } from "./screens/DatingRituals";
import SafetyCenter from "./screens/SafetyCenter";
import AICoach from "./screens/AICoach";
import Tips from "./screens/Tips";
import Onboarding from "./screens/Onboarding";
import AdminDashboard from "./screens/AdminDashboard";
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

function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("klar_cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="max-w-md mx-auto bg-stone-900 text-stone-100 p-4 rounded-2xl shadow-md border border-stone-700">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-stone-800 p-2 rounded-full shrink-0">
            <ShieldCheck size={20} className="text-brand-light" />
          </div>
          <div>
            <h3 className="font-medium text-sm mb-1">Wir respektieren deine Privatsphäre</h3>
            <p className="text-xs text-stone-400">
              Klar nutzt wesentliche Cookies für die Sicherheit und Funktionalität (z.B. Logins). 
              Optional nutzen wir anonymisierte Daten, um unseren Matching-Algorithmus zu verbessern.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              localStorage.setItem("klar_cookie_consent", "essential");
              setShow(false);
            }}
            className="flex-1 py-2 text-xs font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
          >
            Nur Notwendige
          </button>
          <button 
            onClick={() => {
              localStorage.setItem("klar_cookie_consent", "all");
              setShow(false);
            }}
            className="flex-1 py-2 text-xs font-medium text-black bg-brand-light hover:opacity-90 rounded-lg transition-colors"
          >
            Alle Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}

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
            <button onClick={() => setInAppNotification(null)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
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

          {/* P1: Das Kontingent steht ueber allem, was man damit tut —
              nicht erst im Moment, in dem es zu Ende ist.
              Design-Richtlinie §1 und §8. */}
          {!isChatView && (
            <div className="flex justify-center border-b border-stone-200 dark:border-stone-800 px-4 py-2">
              <KontingentAnzeige kompakt />
            </div>
          )}
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

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/chats" element={<PageWrapper><Chats /></PageWrapper>} />
        <Route path="/chat/:id" element={<PageWrapper><ChatView /></PageWrapper>} />
        <Route path="/ai-coach" element={<PageWrapper><AICoach /></PageWrapper>} />
        <Route path="/tips" element={<PageWrapper><Tips /></PageWrapper>} />
        <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
        <Route path="/rituals" element={<PageWrapper><DatingRituals /></PageWrapper>} />
        <Route path="/safety" element={<PageWrapper><SafetyCenter /></PageWrapper>} />
        {/* P1: Ohne Verifizierung lehnen die Firestore-Regeln jeden Kontakt ab. */}
        <Route path="/verifizierung" element={<PageWrapper><Verifizierung /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
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

  const { user, loading, profileData, updateProfileData } = useAuth();
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

  if (loading || hasCompletedOnboarding === null) return (
    <div className="h-[100dvh] flex items-center justify-center bg-light-bg dark:bg-dark-bg">
       <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse"></div>
    </div>
  );

  if (!user) {
    return <Login />;
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={() => {
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
    }} />;
  }

  return (
    <ErrorBoundary>
      <CookieConsent />
      <SyncBanner />
      <SUSFeedbackModal />
      <BrowserRouter>
        <Layout>
          
          <AnimatedRoutes />

        </Layout>
      </BrowserRouter>
      {import.meta.env.DEV && (
        <button 
          onClick={() => {
            hapticFeedback('strong');
            throw new Error("Sentry Test Error from Floating Action Button");
          }}
          className="fixed bottom-24 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg z-[100] flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Test Error"
        >
          <X size={20} />
        </button>
      )}
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
