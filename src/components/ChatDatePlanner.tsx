// @ts-nocheck
import { useState, useEffect } from "react";
import { Sparkles, Brain, MapPin, CalendarDays, CheckCircle2, X, Clock, History, Star, Edit3, ListChecks, Plus, Trash2, Search, Download, Camera, Filter } from "lucide-react";
import { motion } from "motion/react";
import { askAICoach } from "../lib/api";
import { allProfiles } from "../data";
import { melde } from "../lib/fehler";

interface ChatDatePlannerProps {
  userInterests: string[];
  matchInterests: string[];
  matchName: string;
  chatHistory?: {role: string, text: string}[];
  onSelectDate: (proposal: string, details: any) => void;
  onClose: () => void;
}

interface DateHistoryEntry {
  id: string;
  matchName: string;
  chatHistory?: {role: string, text: string}[];
  title: string;
  date: string;
  rating?: number;
  note?: string;
  photo?: string;
}

export function ChatDatePlanner({ userInterests, matchInterests, matchName, chatHistory = [], onSelectDate, onClose }: ChatDatePlannerProps) {
  const [ideas, setIdeas] = useState<{ title: string; description: string; time: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plan' | 'smart' | 'history' | 'checklist'>('plan');
  const [history, setHistory] = useState<DateHistoryEntry[]>([]);
  const [successFactors, setSuccessFactors] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [dateSurveyData, setDateSurveyData] = useState<{ id: string, answer: number }[]>([]);
  
  useEffect(() => {
    const savedFactors = localStorage.getItem("klar_success_factors");
    if (savedFactors) {
      try { setSuccessFactors(JSON.parse(savedFactors)); } catch(e) {}
    }
    const savedSurvey = localStorage.getItem("klar_date_survey");
    if (savedSurvey) {
      try { setDateSurveyData(JSON.parse(savedSurvey)); } catch(e) {}
    }
  }, []);


  const [smartDates, setSmartDates] = useState<{ date: string; time: string; idea: string; confidence: number }[]>([]);
  const [isSmartLoading, setIsSmartLoading] = useState(false);
  const [smartParsed, setSmartParsed] = useState(false);
  const [smartAdded, setSmartAdded] = useState(false);
  
  
  
  
  
  

  
  // BEFUND 10.08.2026: Diese drei Deklarationen fehlten -- der Block leerer
  // Zeilen darueber ist die Stelle, an der sie einmal standen. runDateCheck
  // stuerzte deshalb beim Antippen ab (ReferenceError), nicht schon beim
  // Rendern; darum war der Fehler bisher nicht aufgefallen.
  //
  // OFFEN, NICHT HIER BEHOBEN: Keiner der drei Werte wird irgendwo gelesen.
  // Die beabsichtigte Anzeige ("pruefe...", Ergebnis des Date-Checks) fehlt
  // vollstaendig. Deklaration ohne Lesenamen haelt das Verhalten exakt so,
  // wie es heute ist, statt eine Oberflaeche zu erfinden.
  const [, setIsCheckingDate] = useState(false);
  const [, setCheckingIdeaIndex] = useState<number | null>(null);
  const [, setDateCheck] = useState<any>(null);

  const runDateCheck = async (ideaIndex: number, dateIdea: string) => {
    setIsCheckingDate(true);
    setCheckingIdeaIndex(ideaIndex);
    try {
      const savedNoGos = localStorage.getItem("userNoGos");
      const userNoGos = savedNoGos ? JSON.parse(savedNoGos) : [];
      const res = await fetch("/api/date-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateIdea, userNoGos })
      });
      const data = await res.text().then(text => text ? JSON.parse(text) : {});
      setDateCheck(data);
    } catch (e) {
      melde("ChatDatePlanner", e);
    } finally {
      setIsCheckingDate(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'smart' && !smartParsed) {
      extractSmartDates();
    }
  }, [activeTab]);

  const extractSmartDates = async () => {
    setIsSmartLoading(true);
    try {
      const historyText = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
      const prompt = `Analysiere diesen Chatverlauf und suche nach konkreten oder impliziten Terminvorschlägen für ein Date:
${historyText}

Extrahiere Datum, Uhrzeit und eine kurze Idee (falls erwähnt).
Gib das Ergebnis als unformatierte JSON-Liste von Objekten zurück, die genau diese Keys haben:
"date" (Format YYYY-MM-DD),
"time" (Format HH:MM),
"idea" (kurze Beschreibung),
"confidence" (Nummer von 0 bis 100, wie sicher du bist, dass ein Treffen ausgemacht wurde oder vorgeschlagen wurde).

Wenn kein Termin vorgeschlagen wurde, gib ein leeres Array [] zurück.
Keine Markdown-Block-Syntax.`;

      const response = await askAICoach(prompt);
      const cleaned = response.replace(/^```(json)?|```$/g, "").trim();
      const parsed = JSON.parse(cleaned);
      
      if (Array.isArray(parsed)) {
        setSmartDates(parsed);
      }
    } catch (e) {
      console.warn("Smart extraction failed", e);
    } finally {
      setIsSmartLoading(false);
      setSmartParsed(true);
    }
  };

  const addSmartDateToCalendar = (suggestion: any) => {
    const saved = localStorage.getItem('klar_planned_dates');
    let dates = [];
    if (saved) {
      try { dates = JSON.parse(saved); } catch (e) {}
    }
    const matchId = allProfiles.find(p => p.name === matchName)?.id || "p1";
    const dateTime = new Date(`${suggestion.date}T${suggestion.time}`).toISOString();
    
    dates.push({
      id: Date.now().toString(),
      profileId: matchId,
      matchName,
      idea: suggestion.idea,
      date: dateTime
    });
    
    localStorage.setItem('klar_planned_dates', JSON.stringify(dates));
    setSmartAdded(true);
    setTimeout(() => setSmartAdded(false), 3000);
  };

  
  const [checklist, setChecklist] = useState<{id: string, text: string, done: boolean}[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterSort, setFilterSort] = useState<'newest' | 'oldest'>('newest');
  
  useEffect(() => {
    const saved = localStorage.getItem("klar_date_checklist_" + matchName);
    if (saved) {
      try {
        setChecklist(JSON.parse(saved));
      } catch (e) {}
    } else {
      setChecklist([
        { id: "1", text: "Outfit planen", done: false },
        { id: "2", text: "Gesprächsthemen überlegen", done: false },
        { id: "3", text: "Ort-Check (Reservierung, Öffnungszeiten)", done: false },
        { id: "4", text: "Kleine Geschenkidee (optional)", done: false }
      ]);
    }
  }, [matchName]);

  const saveChecklist = (newList: {id: string, text: string, done: boolean}[]) => {
    setChecklist(newList);
    localStorage.setItem("klar_date_checklist_" + matchName, JSON.stringify(newList));
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    saveChecklist([...checklist, { id: Date.now().toString(), text: newChecklistItem, done: false }]);
    setNewChecklistItem("");
  };

  const toggleChecklistItem = (id: string) => {
    saveChecklist(checklist.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };
  
  const removeChecklistItem = (id: string) => {
    saveChecklist(checklist.filter(item => item.id !== id));
  };
  
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("klar_date_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'plan' && ideas.length === 0) {
      const fetchIdeas = async () => {
        setIsLoading(true);
        try {
          const uInt = userInterests.length > 0 ? userInterests.join(", ") : "Allgemein";
          const mInt = matchInterests.length > 0 ? matchInterests.join(", ") : "Allgemein";
          
          const prompt = `Erstelle 3 kreative und konkrete Vorschläge für lokale Dates basierend auf den gemeinsamen Interessen: User(${uInt}), Verbindung(${mInt}). Gib die Vorschläge als unformatierte JSON-Liste von Objekten mit "title", "description" (1 Satz) und "time" (z.B. "Samstag Nachmittag", "Donnerstag Abend") zurück. Keine Markdown-Block-Syntax (wie \`\`\`json).`;
          
          const response = await askAICoach(prompt);
          const cleaned = response.replace(/^```(json)?|```$/g, "").trim();
          const parsed = JSON.parse(cleaned);
          
          if (Array.isArray(parsed) && parsed.length > 0) {
            setIdeas(parsed.slice(0, 3));
          } else {
            throw new Error("Format error");
          }
        } catch (e) {
          console.warn("AI Planner fallback", e);
          setIdeas([
            { title: "Kaffee & Spaziergang im Park", description: "Ein entspannter Spaziergang mit einem Coffee to go, perfekt zum ungestörten Kennenlernen.", time: "Samstag Nachmittag" },
            { title: "Galerie & Wein", description: "Zusammen eine lokale Ausstellung besuchen und danach bei einem Glas Wein austauschen.", time: "Freitag Abend" },
            { title: "Bouldern & Smoothie", description: "Sportlich aktiv werden und danach gemeinsam erfrischen.", time: "Sonntag Vormittag" }
          ]);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchIdeas();
    }
  }, [userInterests, matchInterests, activeTab, ideas.length]);

  const handleSelect = (idea: any) => {
    const formattedProposal = `Lass uns ${idea.title} machen! 📅 ${idea.time}\n\n${idea.description}`;
    onSelectDate(formattedProposal, idea);
    
    // Auto-add to history as unrated
    const newEntry: DateHistoryEntry = {
      id: Date.now().toString(),
      matchName,
      title: idea.title,
      date: new Date().toLocaleDateString('de-DE')
    };
    const updated = [newEntry, ...history];
    setHistory(updated);
    localStorage.setItem("klar_date_history", JSON.stringify(updated));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const updatedHistory = history.map(entry => 
          entry.id === id ? { ...entry, photo: base64String } : entry
        );
        setHistory(updatedHistory);
        localStorage.setItem("klar_date_history", JSON.stringify(updatedHistory));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (id: string) => {
    const updatedHistory = history.map(entry => 
      entry.id === id ? { ...entry, photo: undefined } : entry
    );
    setHistory(updatedHistory);
    localStorage.setItem("klar_date_history", JSON.stringify(updatedHistory));
  };

  const saveReview = (id: string) => {
    const updated = history.map(entry => 
      entry.id === id ? { ...entry, rating: editRating, note: editNote } : entry
    );
    setHistory(updated);
    localStorage.setItem("klar_date_history", JSON.stringify(updated));
    setEditingEntry(null);
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    
    // CSV Header
    let csvContent = "Datum,Verbindung,Titel,Bewertung,Notiz\n";
    
    // CSV Rows
    history.forEach(entry => {
      const rating = entry.rating ? entry.rating : "";
      const note = entry.note ? `"${entry.note.replace(/"/g, '""')}"` : "";
      const title = `"${entry.title.replace(/"/g, '""')}"`;
      const verbindung = `"${entry.matchName.replace(/"/g, '""')}"`;
      
      csvContent += `${entry.date},${verbindung},${title},${rating},${note}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "date_historie.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = history.filter(entry => {
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      matchesSearch = (
        entry.title.toLowerCase().includes(query) ||
        entry.matchName.toLowerCase().includes(query) ||
        entry.date.toLowerCase().includes(query) ||
        (entry.note ? entry.note.toLowerCase().includes(query) : false)
      );
    }
    
    let matchesRating = true;
    if (filterRating !== null) {
      if (filterRating === 0) matchesRating = !entry.rating;
      else matchesRating = entry.rating === filterRating;
    }
    
    return matchesSearch && matchesRating;
  }).sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (isNaN(timeA) || isNaN(timeB)) return 0;
    return filterSort === 'newest' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="absolute top-[73px] left-0 right-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-4 z-20 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <CalendarDays size={18} className="text-brand dark:text-brand-light" />
          Date mit {matchName}
        </h4>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex gap-2 mb-4 border-b border-stone-100 dark:border-stone-800 pb-2">
        
        <button 
          onClick={() => setActiveTab('plan')}
          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${activeTab === 'plan' ? 'bg-brand dark:bg-brand-light text-white dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
        >
          Date planen
        </button>
        <button 
          onClick={() => setActiveTab('smart')}
          className={`text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${activeTab === 'smart' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}
        >
          <Brain size={12} />
          Smart Planer
        </button>
        <button 
          onClick={() => setActiveTab('history')}

          className={`text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${activeTab === 'history' ? 'bg-brand dark:bg-brand-light text-white dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
        >
          <History size={12} />
          Historie
        </button>
        <button 
          onClick={() => setActiveTab('checklist')}
          className={`text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${activeTab === 'checklist' ? 'bg-brand dark:bg-brand-light text-white dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
        >
          <ListChecks size={12} />
          Vorbereitung
        </button>
      </div>

      
      {activeTab === 'smart' ? (
        <div className="max-h-[50vh] overflow-y-auto pr-1 flex flex-col gap-3">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
            Die KI analysiert euren Chatverlauf, um Terminabsprachen automatisch zu erkennen und in deinen Kalender zu übertragen.
          </p>
          
          {isSmartLoading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Brain className="animate-pulse text-indigo-500 mb-2" size={24} />
              <p className="text-xs text-stone-500 font-medium animate-pulse">Analysiere Chatverlauf...</p>
            </div>
          ) : smartDates.length > 0 ? (
            <div className="space-y-3">
              {smartAdded && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs p-2 rounded-lg text-center flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Termin zum Kalender hinzugefügt!
                </div>
              )}
              {smartDates.map((date, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="text-sm font-medium text-stone-900 dark:text-stone-100 flex items-center gap-1.5 mb-1">
                        <CalendarDays size={14} className="text-indigo-500" />
                        {date.date} um {date.time} Uhr
                      </h5>
                      <p className="text-xs text-stone-600 dark:text-stone-400">
                        {date.idea}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                        {date.confidence}% Verbindung
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => addSmartDateToCalendar(date)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CalendarDays size={14} /> In Date-Kalender eintragen
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
              <CalendarDays size={32} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Keine Termine gefunden</p>
              <p className="text-xs text-stone-500">Im aktuellen Chatverlauf konnten keine konkreten Date-Absprachen erkannt werden.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'checklist' ? (

        <div className="max-h-[50vh] overflow-y-auto pr-1 flex flex-col gap-3">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Hake wichtige Punkte ab, damit du entspannt ins Date gehst.
          </p>
          <div className="space-y-2">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center gap-2 group">
                <button 
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${item.done ? 'bg-brand border-brand text-white' : 'border-stone-300 dark:border-stone-600 bg-transparent'}`}
                >
                  {item.done && <CheckCircle2 size={12} />}
                </button>
                <span className={`text-sm flex-1 ${item.done ? 'text-stone-400 line-through' : 'text-stone-700 dark:text-stone-200'}`}>
                  {item.text}
                </span>
                <button 
                  onClick={() => removeChecklistItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="text"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
              placeholder="Neuer Punkt..."
              className="flex-1 text-xs px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-brand"
            />
            <button 
              onClick={addChecklistItem}
              className="p-2 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
            </button>
          </div>
        
          {/* 3-Fragen-Umfrage */}
          <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-700">
            <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-1">
              <Star size={14} className="text-brand dark:text-brand-light" />
              Bewerte deinen Date-Ort
            </h4>
            <p className="text-[10px] text-stone-500 mb-3">Hilf dem KI-Coach, zukünftige Orte besser an eure Vibe-Map anzupassen.</p>
            {dateSurveyData.length >= 3 ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={16} /> Danke! Der Algorithmus lernt dazu.
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { id: "q1", text: "Hat der vorgeschlagene Ort gefallen?" },
                  { id: "q2", text: "War die Lautstärke angenehm (nicht zu laut)?" },
                  { id: "q3", text: "Passte die Atmosphäre zum ersten Date?" }
                ].map((q, i) => {
                  const answered = dateSurveyData.find(d => d.id === q.id);
                  return (
                    <div key={q.id} className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
                      <span className="text-[10px] text-stone-700 dark:text-stone-300 flex-1 pr-2">{i+1}. {q.text}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => {
                            if (!answered) {
                              const newD = [...dateSurveyData, {id: q.id, answer: 1}];
                              setDateSurveyData(newD);
                              localStorage.setItem("klar_date_survey", JSON.stringify(newD));
                            }
                          }}
                          className={`p-1.5 rounded-md transition-colors ${answered && answered.answer === 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-white dark:bg-stone-700 text-stone-400 hover:text-emerald-600 border border-stone-200 dark:border-stone-600'}`}
                        >
                          👍
                        </button>
                        <button 
                          onClick={() => {
                            if (!answered) {
                              const newD = [...dateSurveyData, {id: q.id, answer: 0}];
                              setDateSurveyData(newD);
                              localStorage.setItem("klar_date_survey", JSON.stringify(newD));
                            }
                          }}
                          className={`p-1.5 rounded-md transition-colors ${answered && answered.answer === 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 'bg-white dark:bg-stone-700 text-stone-400 hover:text-rose-600 border border-stone-200 dark:border-stone-600'}`}
                        >
                          👎
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      ) : activeTab === 'plan' ? (
        <>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
            Basierend auf euren gemeinsamen Interessen schlägt die KI folgende Dates vor:
          </p>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Sparkles className="animate-pulse text-brand dark:text-brand-light mb-2" size={24} />
              <p className="text-xs text-stone-500 font-medium animate-pulse">Generiere Date-Ideen...</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto pr-1">
              {ideas.map((idea, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleSelect(idea)}
                  className="p-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 hover:border-brand/30 hover:bg-brand/5 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-stone-900 dark:text-stone-100 flex items-center gap-1.5 mb-1">
                        <MapPin size={14} className="text-stone-500" />
                        {idea.title}
                      </h5>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mb-2 leading-relaxed">
                        {idea.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-brand dark:text-brand-light bg-brand/10 dark:bg-brand-light/10 px-2 py-0.5 rounded-full w-fit">
                        <Clock size={10} />
                        {idea.time}
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center border border-stone-200 dark:border-stone-700 group-hover:border-brand dark:group-hover:border-brand-light group-hover:text-brand dark:group-hover:text-brand-light text-stone-300 transition-colors shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          <div className="text-[10px] text-stone-400 text-center flex items-center justify-center gap-1">
            <Sparkles size={10} />
            Wähle eine Idee, um sie als Nachrichtenvorschlag zu übernehmen
          </div>
        </>
      ) : (
        <div className="max-h-[50vh] overflow-y-auto pr-1 flex flex-col gap-3">

          {successFactors.length > 0 && (
            <div className="mb-4 bg-brand/5 dark:bg-brand-light/5 border border-brand/20 dark:border-brand-light/20 p-3 rounded-xl">
              <h4 className="text-xs font-semibold text-brand dark:text-brand-light flex items-center gap-1 mb-2">
                <Sparkles size={12} /> Erfolgs-Archiv (KI-Erkenntnisse)
              </h4>
              <p className="text-[10px] text-stone-500 mb-2">Die KI hat diese Faktoren aus deinen Date-Bewertungen als positiv identifiziert und nutzt sie für den Date-Planer:</p>
              <div className="flex flex-wrap gap-1.5">
                {successFactors.map((f, i) => (
                  <span key={i} className="px-2 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-md text-[10px] font-medium shadow-sm">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nach Datum, Ort oder Stichwort..."
                  className="w-full pl-8 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs focus:outline-none focus:border-brand"
                />
              </div>
              <button
                onClick={handleExportCSV}
                className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 shrink-0"
                title="Als CSV exportieren"
              >
                <Download size={14} />
                <span className="text-xs font-medium hidden sm:inline">CSV</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
              <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wide shrink-0">Filter:</span>
              <button 
                onClick={() => setFilterRating(null)}
                className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap transition-colors ${filterRating === null ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`}
              >
                Alle
              </button>
              <button 
                onClick={() => setFilterRating(5)}
                className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${filterRating === 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`}
              >
                <Star size={10} className={filterRating === 5 ? 'fill-current' : ''} /> 5 Sterne
              </button>
              <button 
                onClick={() => setFilterRating(4)}
                className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${filterRating === 4 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`}
              >
                <Star size={10} className={filterRating === 4 ? 'fill-current' : ''} /> 4 Sterne
              </button>
              <div className="w-px h-4 bg-stone-200 dark:bg-stone-700 shrink-0 mx-1"></div>
              <button 
                onClick={() => setFilterSort(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="text-[10px] px-2 py-1 rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 whitespace-nowrap flex items-center gap-1"
              >
                <Filter size={10} />
                {filterSort === 'newest' ? 'Neueste zuerst' : 'Älteste zuerst'}
              </button>
            </div>
          </div>
          {filteredHistory.length === 0 ? (
            <div className="py-8 text-center text-stone-500 dark:text-stone-400 text-xs">
              {searchQuery ? "Keine Dates gefunden." : "Bisher keine Dates in der Historie."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map(entry => (
                <div key={entry.id} className="p-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-stone-900 dark:text-stone-100">{entry.title}</h5>
                    <span className="text-[10px] text-stone-500">{entry.date}</span>
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                    Mit {entry.matchName}
                  </div>
                  
                  {editingEntry === entry.id ? (
                    <div className="mt-3 p-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                      <div className="flex items-center gap-1 mb-2">
                        {[1,2,3,4,5].map(star => (
                          <Star 
                            key={star} 
                            size={16} 
                            onClick={() => setEditRating(star)}
                            className={`cursor-pointer transition-colors ${editRating >= star ? 'text-amber-400 fill-amber-400' : 'text-stone-300 dark:text-stone-600'}`} 
                          />
                        ))}
                      </div>
                      <textarea 
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Private Notiz (z.B. Lief super, tolle Gespräche...)"
                        className="w-full text-xs p-2 rounded-md bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 mb-2 min-h-[60px]"
                      />
                      <div className="flex justify-between items-center gap-2">
                          <button 
                            onClick={() => setEditNote(prev => prev + (prev ? "\n\n" : "") + "Reflexion:\n1. Was hat mir am besten gefallen?\n- \n2. Gab es Momente der Stille oder Unbehagen?\n- \n3. Möchte ich die Person wiedersehen und warum?\n- ")}
                            className="text-[10px] px-2 py-1 text-brand dark:text-brand-light flex items-center gap-1 hover:underline"
                          >
                            <Sparkles size={10} /> Template einfügen
                          </button>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingEntry(null)} className="text-[10px] px-2 py-1 text-stone-500">Abbrechen</button>
                            <button onClick={() => saveReview(entry.id)} className="text-[10px] px-3 py-1 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-md font-medium">Speichern</button>
                          </div>
                        </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col gap-2">
                      {(entry.rating || entry.note) ? (
                        <>
                          {entry.rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} className={i < entry.rating! ? "text-amber-400 fill-amber-400" : "text-stone-300 dark:text-stone-700"} />
                              ))}
                            </div>
                          )}
                          {entry.note && (
                            <p className="text-xs italic text-stone-600 dark:text-stone-400 bg-black/5 dark:bg-white/5 p-2 rounded-md">
                              "{entry.note}"
                            </p>
                          )}
                          <button onClick={() => {
                            setEditingEntry(entry.id);
                            setEditRating(entry.rating || 0);
                            setEditNote(entry.note || "");
                          }} className="text-[10px] text-stone-500 hover:text-brand flex items-center gap-1 w-fit mt-1">
                            <Edit3 size={10} /> Bearbeiten
                          </button>
                          
                          {entry.photo ? (
                            <div className="relative mt-2">
                              <img src={entry.photo} alt="Date Snapshot" className="w-full h-32 object-cover rounded-lg border border-stone-200 dark:border-stone-700" />
                              <button onClick={() => removePhoto(entry.id)} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <label className="text-[10px] text-stone-500 hover:text-brand flex items-center gap-1 w-fit cursor-pointer">
                                <Camera size={10} /> Foto hinzufügen
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e, entry.id)} />
                              </label>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setEditingEntry(entry.id);
                              setEditRating(0);
                              setEditNote("");
                            }}
                            className="text-[10px] px-3 py-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-md flex-1 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center justify-center gap-1"
                          >
                            <Edit3 size={12} /> Date bewerten
                          </button>
                          {!entry.photo && (
                            <label className="text-[10px] px-3 py-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-center">
                              <Camera size={12} />
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e, entry.id)} />
                            </label>
                          )}
                        </div>
                      )}
                      
                      {!entry.rating && !entry.note && entry.photo && (
                        <div className="relative mt-2">
                          <img src={entry.photo} alt="Date Snapshot" className="w-full h-32 object-cover rounded-lg border border-stone-200 dark:border-stone-700" />
                          <button onClick={() => removePhoto(entry.id)} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
