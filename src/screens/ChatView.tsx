// @ts-nocheck
import { Languages, Globe, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Moon, HeartPulse, ArrowLeft, Sparkles, Send, CalendarDays, Clock, ShieldAlert, X, CheckCheck, History, Activity, Flag, AlertTriangle, Bookmark, Brain, ListChecks, MapPin, Bell, BellOff, Eye, EyeOff, Mic, MessageSquare, Phone, Video, Settings, Check, ChevronRight, Lightbulb, TrendingUp, TrendingDown, Target, Smile, HelpCircle, FileText, Info, MicOff } from "lucide-react";

import { allProfiles } from "../data";

import { askAICoach } from "../lib/api";
import { NotificationService } from "../services/notificationService";

import { RelationshipProgressWidget } from "../components/RelationshipProgressWidget";
import { RecentIntrosWidget } from "../components/RecentIntrosWidget";
import { ChatDatePlanner } from "../components/ChatDatePlanner";
import { DateProposalMessage } from "../components/DateProposalMessage";
import { DatePrepChecklistModal } from "../components/DatePrepChecklistModal";
import { ChatDateExtractorWidget } from "../components/ChatDateExtractorWidget";
import { QuickRepliesDrawer } from "../components/QuickRepliesDrawer";




// P1-Zusatzbefund: wurde benutzt, aber nie importiert (@ts-nocheck hat es verdeckt).
import { MessageBubble } from "../components/MessageBubble";
import { melde } from "../lib/fehler";

export interface ChatMessage {
  role: 'user' | 'verbindung';
  text: string;
  originalText?: string;
  isTranslated?: boolean;
  translationError?: boolean;
  isRead?: boolean;
  isDateProposal?: boolean;
  proposalDetails?: any;
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

  useEffect(() => {
    localStorage.setItem(`klar_chat_draft_${id}`, input);
  }, [input, id]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isLiveTranslationEnabled, setIsLiveTranslationEnabled] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [icebreakerHistory, setIcebreakerHistory] = useState<string[]>([]);
  const [replySuggestions, setReplySuggestions] = useState<string[]>([]);
  const [chatDynamic, setChatDynamic] = useState<{dynamic: string, explanation: string} | null>(null);
  
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

  useEffect(() => {
    // Fetch chat dynamics if we have some messages
    if (messages.length >= 4) {
      fetch("/api/conversation-dynamics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatHistory: messages })
      }).then(res => res.json()).then(data => {
        if (data && data.dynamic) setChatDynamic(data);
      }).catch(console.error);
    }
  }, [messages.length]);

  useEffect(() => {
    const saved = localStorage.getItem("klar_saved_smart_intros");
    if (saved) {
      try {
        setSavedSmartIntros(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
    const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  const [, setSafetyWarning] = useState<any>(null);
  const [, setIsLongSilence] = useState(false);
  const [, setReentryImpulses] = useState<string[]>([]);
  const [, setIsLoadingImpulses] = useState(false);
  const [, setContextAnalysis] = useState<any>(null);

  const [intensity, setIntensity] = useState(50);
  const [targetLanguage, setTargetLanguage] = useState<string | undefined>(undefined);
      
  if (!profile) return <div>Verbindung nicht gefunden</div>;

  const [isGeneratingSmartIntro, setIsGeneratingSmartIntro] = useState(false);

  const [contextModeActive, setContextModeActive] = useState(false);
    const [isAnalyzingContext, setIsAnalyzingContext] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<{title: string, description: string}[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem("userInterests");
    if (saved) {
      try {
        setUserInterests(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("klar_saved_smart_intros");
    if (saved) {
      try {
        setSavedSmartIntros(JSON.parse(saved).slice(0, 5));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (contextModeActive && messages.length >= 2) {
      analyzeContext();
    }
  }, [messages, contextModeActive]);

  const analyzeContext = async () => {
    if (messages.length < 2) return;
    setIsAnalyzingContext(true);
    try {
      const recentChat = messages.slice(-4).map(m => `${m.role === 'user' ? 'Ich' : profile.name}: ${m.text}`).join('\n');

      const savedSentiment = localStorage.getItem(`klar_chat_sentiment_${id}`);
      const sentimentContext = savedSentiment 
        ? `Beachte: Mein Eindruck vom bisherigen Gespräch mit dieser Person war "${savedSentiment === 'positive' ? 'sehr positiv' : savedSentiment === 'negative' ? 'eher negativ/zäh' : 'neutral/okay'}". `
        : '';

      const prompt = `Analysiere diesen kurzen Dating-Chat-Verlauf:\n${recentChat}\n\n${sentimentContext}Antworte strikt im Format "Stimmung: <ein bis zwei Wörter> | Empfehlung: <ein kurzer Satz für den nächsten Schritt>".`;
      const response = await askAICoach(prompt);
      const parts = response.split('|');
      if (parts.length >= 2) {
        setContextAnalysis({
          mood: (parts[0] || '').replace(/Stimmung:/i, '').trim(),
          recommendation: (parts[1] || '').replace(/Empfehlung:/i, '').trim()
        });
      }
    } catch (e) {
      melde("ChatView", e);
    } finally {
      setIsAnalyzingContext(false);
    }
  };

  const handleSmartIntro = async () => {
    setIsGeneratingSmartIntro(true);
    try {
      const savedInterests = localStorage.getItem("userInterests");
      const userInterests = savedInterests ? JSON.parse(savedInterests).join(", ") : "Nicht angegeben";
      
      
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

  const simulateSilence = async () => {
    setIntensity(15);
    setIsLongSilence(true);
    setIsLoadingImpulses(true);
    try {
      const savedInterests = localStorage.getItem("userInterests");
      const userInterests = savedInterests ? JSON.parse(savedInterests).join(", ") : "Nicht angegeben";
      
      
      const savedSentiment = localStorage.getItem(`klar_chat_sentiment_${id}`);
      const sentimentContext = savedSentiment 
        ? `Beachte: Mein Eindruck vom bisherigen Gespräch mit dieser Person war "${savedSentiment === 'positive' ? 'sehr positiv' : savedSentiment === 'negative' ? 'eher negativ/zäh' : 'neutral/okay'}". `
        : '';

      const prompt = `Du bist ein Dating-Coach. ${sentimentContext}Nach einer längeren Funkstille im Chat mit ${profile.name} (Interessen: ${profile.interests.join(", ")}), schlage 3 kurze, charmante und unaufdringliche "Wiedereinstiegs-Impulse" (Nachrichten) vor, um das Gespräch wieder aufzunehmen. Berücksichtige meine Interessen: ${userInterests}. Antworte nur mit einer unformatierten Liste, jede Nachricht in einer neuen Zeile, ohne Aufzählungszeichen oder Nummern.`;
      
      const response = await askAICoach(prompt);
      const suggestions = response.split('\n').map(s => s.trim().replace(/^[-\d.]\s*/, '')).filter(s => s.length > 5);
      setReentryImpulses(suggestions);
    } catch (e) {
      melde("ChatView", e);
      setReentryImpulses(["Hey, wie war deine Woche bisher?", "Habe gerade an dich gedacht. Alles gut bei dir?"]);
    } finally {
      setIsLoadingImpulses(false);
    }
  };

  
  
  const simulateForeignMessage = async () => {
    const foreignMsg = "Hey there! I saw your profile and thought you seemed really cool. What kind of music do you like?";
    
    let textToStore = foreignMsg;
    let translatedText = undefined;
    let translationError = false;

    if (isLiveTranslationEnabled) {
      try {
        translatedText = await translateMessage(foreignMsg, "Deutsch");
        if (translatedText && translatedText !== foreignMsg) {
          textToStore = translatedText;
        } else {
          translationError = true;
        }
      } catch (e) {
        translationError = true;
      }
    }

    setMessages(prev => {
      const markedRead = prev.map(m => m.role === 'user' ? { ...m, isRead: true } : m);
      return [...markedRead, { 
        role: 'verbindung', 
        text: textToStore,
        originalText: translatedText ? foreignMsg : undefined,
        isTranslated: !!translatedText,
        translationError
      }];
    });
  };

  const simulateRedFlagMessage = async () => {
    const toxicMsg = "Komm schon, sei nicht so verklemmt. Schick mir endlich ein Bild, sonst lösche ich das Verbindung.";
    setMessages(prev => {
      const markedRead = prev.map(m => m.role === 'user' ? { ...m, isRead: true } : m);
      return [...markedRead, { role: 'verbindung', text: toxicMsg }];
    });
    
    setIsCheckingSafety(true);
    try {
        const prompt = `Analysiere diese eingehende Nachricht in einer Dating-App auf unangemessenes Verhalten, Respektlosigkeit oder Red Flags: "${toxicMsg}". 
Wenn sie problematisch ist, antworte mit "FLAG:" gefolgt von einer kurzen Erklärung, und danach "SUGGESTIONS:" gefolgt von 2-3 konkreten Vorschlägen, wie man höflich, deeskalierend und bestimmt antworten kann (als unformatierte Liste, jede Antwort eine neue Zeile). Wenn sie harmlos ist, antworte nur mit "SAFE".`;
        const response = await askAICoach(prompt);
        if (response.includes("FLAG:")) {
            const parts = response.split("SUGGESTIONS:");
            const explanation = parts[0]?.replace("FLAG:", "").trim() || "Unangemessene Nachricht erkannt.";
            const suggestions = parts[1] ? parts[1].split('\n').map(s => s.replace(/^[-\d.]\s*/, '').trim()).filter(s => s.length > 3) : [];
            setSafetyWarning({ explanation, suggestions });
        }
    } catch (e) {
        melde("ChatView", e);
        // We could show an alert or just set the safety warning to the error message.
        setSafetyWarning({ explanation: (e instanceof Error ? e.message : String(e)) || "Fehler beim Generieren. Bitte versuche es später nochmal.", suggestions: [] });
    } finally {
        setIsCheckingSafety(false);
    }
  };

  
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
  const [datePlan, setDatePlan] = useState<{title: string, time: string, location: string, plan: string} | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  const generateDatePlan = async () => {
    setIsLoadingPlan(true);
    try {
      const savedInterests = localStorage.getItem("userInterests");
      const userInterestsStr = savedInterests ? JSON.parse(savedInterests) : [];
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

      if (!res.ok) throw new Error("API request failed");
      const data = await res.text().then(text => text ? JSON.parse(text) : {});
      setDatePlan(data);
    } catch (e) {
      console.warn("Failed to generate date plan", e);
      setDatePlan({
        title: "Kaffee & Spaziergang",
        time: "Samstag, 14:00 Uhr",
        location: "Lokales Lieblingscafé am Park",
        plan: "Wir treffen uns auf einen entspannten Kaffee und machen danach einen kleinen Spaziergang durch den Park, um ungestört quatschen zu können."
      });
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const getDateLocations = async () => {
    try {
      const savedInterests = localStorage.getItem("userInterests");
      const userInterests = savedInterests ? JSON.parse(savedInterests) : [];
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
      
      const data = await res.text().then(text => text ? JSON.parse(text) : {});
      setLocationSuggestions(data.suggestions || []);
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
      const savedInterests = localStorage.getItem("userInterests");
      const userInterests = savedInterests ? JSON.parse(savedInterests) : [];
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
      
      const data = await res.text().then(text => text ? JSON.parse(text) : {});
      setTuningSuggestions(data.suggestions || []);
      
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
      const data = await res.text().then(text => text ? JSON.parse(text) : {});
      setReplySuggestions(data.suggestions || []);
    } catch (e) {
      melde("ChatView", e);
      setReplySuggestions(["Das klingt interessant!", "Erzähl mir mehr.", "Wie meinst du das genau?"]);
    } finally {
      setIsGeneratingReplies(false);
    }
  };

  const getIcebreakers = async () => {
    setIsLoadingAI(true);
    try {
      const savedInterests = localStorage.getItem("userInterests");
      const userInterests = savedInterests ? JSON.parse(savedInterests) : [];
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
      
      const data = await res.text().then(text => text ? JSON.parse(text) : {});
      const newSuggestions = data.suggestions || [];
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

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-black/90  sticky top-0 z-20">
        <div className="flex items-center">
          <button onClick={() => {
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
            <div 
              onClick={simulateSilence}
              className="flex items-center gap-1.5 mt-0.5 cursor-pointer" 
              title="Spannungs-Barometer (Klick für Funkstille)"
            >
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
          <button onClick={() => setReplySuggestions([])} className="p-1.5 text-stone-400 hover:text-stone-600 bg-stone-100 dark:bg-stone-800 rounded-full shrink-0">
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
            {isFocusMode ? <EyeOff size={20} /> : <Eye size={20} />}
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
          <button 
            onClick={() => setContextModeActive(!contextModeActive)}
            className={`p-2 rounded-full transition-colors ${contextModeActive ? 'bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
            title="Context-Aware Coach Modus"
          >
            <Brain size={20} className={isAnalyzingContext ? "animate-pulse" : ""} />
          </button>
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
          <button 
            onClick={simulateForeignMessage}
            className="p-2 bg-stone-100 dark:bg-stone-800 text-blue-500 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title="Englische Nachricht empfangen"
          >
            <Languages size={20} />
          </button>

          <button 
            onClick={simulateRedFlagMessage}
            disabled={isCheckingSafety}
            className="p-2 bg-stone-100 dark:bg-stone-800 text-rose-500 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
            title="Red Flag Message simulieren"
          >
            <ShieldAlert size={20} className={isCheckingSafety ? "animate-pulse" : ""} />
          </button>

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
            <button onClick={() => setShowDatePlan(false)} className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500">
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
          userInterests={(() => {
            try {
              return JSON.parse(localStorage.getItem("userInterests") || "[]");
            } catch (e) {
              return [];
            }
          })()}
          matchInterests={profile.interests || []}
          verbindungName={profile.name}
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
              <button onClick={() => setShowTuning(false)} className="text-xs p-1 bg-stone-200 dark:bg-stone-800 rounded-full font-medium hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors">
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
                    <button onClick={() => setShowIcebreakers(false)} className="text-xs p-1 bg-stone-100 dark:bg-stone-800 rounded-full font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
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
      <div className="p-4 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
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

        
        

        
          <div className="relative">
            <QuickRepliesDrawer 
              isOpen={showQuickReplies} 
              onClose={() => setShowQuickReplies(false)} 
              onSelectReply={(r) => {
                setInput(r);
                setTimeout(() => document.getElementById('chat-input')?.focus(), 50);
              }} 
            />
          </div>
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
          onClick={handleSend}
          disabled={!input.trim()}
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
                  setInput(empathyAnalysis.suggestion);
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
          <button 
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
                {["Unangemessenes Verhalten", "Fakeprofil / Spam", "Belästigung", "Sonstiges"].map(reason => (
                  <label key={reason} className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                    <input 
                      type="radio" 
                      name="reportReason" 
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="text-brand dark:text-brand-light focus:ring-brand dark:focus:ring-brand-light"
                    />
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{reason}</span>
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
                    const daten = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(daten.error || `Server-Antwort ${res.status}`);
                    setReportCaseId(daten.aktenzeichen ?? "—");
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
                localStorage.setItem(`klar_chat_sentiment_${id}`, 'positive');
                const history = JSON.parse(localStorage.getItem('klar_chat_sentiment_history') || '[]');
                history.push({ id, sentiment: 'positive', date: new Date().toISOString() });
                localStorage.setItem('klar_chat_sentiment_history', JSON.stringify(history));
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
                localStorage.setItem(`klar_chat_sentiment_${id}`, 'neutral');
                const history = JSON.parse(localStorage.getItem('klar_chat_sentiment_history') || '[]');
                history.push({ id, sentiment: 'neutral', date: new Date().toISOString() });
                  localStorage.setItem('klar_chat_sentiment_history', JSON.stringify(history));
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
                  
                  
                  localStorage.setItem(`klar_chat_sentiment_${id}`, 'negative');
                  const history = JSON.parse(localStorage.getItem('klar_chat_sentiment_history') || '[]');
                  history.push({ id, sentiment: 'negative', date: new Date().toISOString() });
                  localStorage.setItem('klar_chat_sentiment_history', JSON.stringify(history));
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
