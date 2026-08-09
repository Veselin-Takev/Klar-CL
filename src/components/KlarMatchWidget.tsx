import { useState, useEffect } from "react";
import { Sparkles, Star, ChevronRight, MessageSquare, Copy, Check, Filter, Info, Eye, X } from "lucide-react";
import { askAICoach } from "../lib/api";
import type { Profile } from "../data";
import { calculateMatchScore } from "../services/matchScore";
import { allProfiles } from "../data";

export function KlarMatchWidget({ onProfileClick }: { onProfileClick: (profile: Profile) => void }) {
  const [verbindungen, setMatches] = useState<Profile[]>([]);
  const [intros, setIntros] = useState<Record<string, string>>({});
  const [loadingIntros, setLoadingIntros] = useState<Record<string, boolean>>({});
  const [copiedIntro, setCopiedIntro] = useState<string | null>(null);
  const [previewIntro, setPreviewIntro] = useState<{verbindung: Profile, text: string} | null>(null);
  const [isInterestFocused, setIsInterestFocused] = useState(false);
  
  const [whyWeMatch, setWhyWeMatch] = useState<Record<string, string>>({});
  const [loadingWhyWeMatch, setLoadingWhyWeMatch] = useState<Record<string, boolean>>({});
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});

  const generateWhyWeMatch = async (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    
    if (whyWeMatch[profile.id]) {
      setExpandedWhy(prev => ({ ...prev, [profile.id]: !prev[profile.id] }));
      return;
    }
    
    setExpandedWhy(prev => ({ ...prev, [profile.id]: true }));
    setLoadingWhyWeMatch(prev => ({ ...prev, [profile.id]: true }));
    
    try {
      const userInterestsStr = localStorage.getItem("userInterests") || "[]";
      const userInterests = JSON.parse(userInterestsStr);
      const prompt = `Erkläre in einem sehr kurzen, charmanten Satz (max 15 Wörter), warum ich (Interessen: ${userInterests.join(", ")}) und ${profile.name} (Interessen: ${profile.interests.join(", ")}) gut zusammenpassen könnten.`;
      
      const response = await askAICoach(prompt);
      setWhyWeMatch(prev => ({ ...prev, [profile.id]: response.replace(/^"|"$/g, '').trim() }));
    } catch (error) {
      console.warn("Failed to generate why we verbindung", error);
      setWhyWeMatch(prev => ({ ...prev, [profile.id]: "Ihr teilt spannende Interessen und Eigenschaften!" }));
    } finally {
      setLoadingWhyWeMatch(prev => ({ ...prev, [profile.id]: false }));
    }
  };

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedIntro(id);
    setTimeout(() => setCopiedIntro(null), 2000);
  };

  const generateSmartIntro = async (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    if (intros[profile.id] || loadingIntros[profile.id]) return;

    setLoadingIntros(prev => ({ ...prev, [profile.id]: true }));
    try {
      const userInterestsStr = localStorage.getItem("userInterests") || "[]";
      const userInterests = JSON.parse(userInterestsStr);
      const prompt = `Erstelle einen kurzen, charmanten Icebreaker-Spruch (1-2 Sätze) für ${profile.name}.
Ihre Interessen: ${profile.interests.join(", ")}.
Meine Interessen: ${userInterests.join(", ")}.
Finde eine Gemeinsamkeit oder stelle eine interessante Frage, um das Gespräch zu beginnen. Sei kreativ, nicht zu kitschig.`;
      
      const response = await askAICoach(prompt);
      const introText = response.replace(/^"|"$/g, '').trim();
      setIntros(prev => ({ ...prev, [profile.id]: introText }));
      
      try {
        const saved = JSON.parse(localStorage.getItem("klar_saved_smart_intros") || "[]");
        const updated = [introText, ...saved.filter((t: string) => t !== introText)].slice(0, 5);
        localStorage.setItem("klar_saved_smart_intros", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to save smart intro", e);
      }
    } catch (error) {
      console.warn("Failed to generate intro", error);
      setIntros(prev => ({ ...prev, [profile.id]: "Hey, tolles Profil! Hast du Lust zu schreiben?" }));
    } finally {
      setLoadingIntros(prev => ({ ...prev, [profile.id]: false }));
    }
  };

  useEffect(() => {
    const interestsStr = localStorage.getItem("userInterests");
    const userInterests = interestsStr ? JSON.parse(interestsStr) : [];
    
    const mustHaveStr = localStorage.getItem("mustHaveInterests");
    const mustHaveInterests = mustHaveStr ? JSON.parse(mustHaveStr) : [];
    
    const userGoal = localStorage.getItem("userGoal") || "undecided";
    
    // Create a daily seed
    const today = new Date().toDateString();
    
    // Sort profiles based on verbindung score + daily random factor
    const scoredProfiles = allProfiles.map(profile => {
      let score = calculateMatchScore(userInterests, profile.interests);
      
      // Calculate must-have overlap
      const mustHaveOverlap = profile.interests.filter(i => mustHaveInterests.includes(i)).length;
      const mustHaveBonus = mustHaveOverlap * 30; // Very high weight for must-have interests
      
      // Add goal-based adjustment (pseudo-random based on string length to simulate compatibility)
      const goalFactor = (profile.bio.length % 10) * (userGoal === "relationship" ? 1.5 : 1);
      let adjustedScore = score + goalFactor;
      
      // Add daily variation
      let hash = 0;
      const seedStr = profile.id + today;
      for (let i = 0; i < seedStr.length; i++) {
        hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
        hash |= 0;
      }
      const dailyBonus = Math.abs(hash % 15);
      
      return { 
        profile, 
        baseScore: score, 
        focusScore: score + mustHaveBonus,
        score: Math.min(99, adjustedScore + dailyBonus) 
      };
    });
    
    if (isInterestFocused) {
      scoredProfiles.sort((a, b) => b.focusScore - a.focusScore);
    } else {
      scoredProfiles.sort((a, b) => b.score - a.score);
    }
    
    setMatches(scoredProfiles.slice(0, 3).map(p => p.profile));
  }, [isInterestFocused]);

  if (verbindungen.length === 0) return null;

  return (
    <>
    <div className=" from-brand/10 to-transparent dark:from-brand-light/10 border border-brand/20 dark:border-brand-light/20 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-brand text-white p-1.5 rounded-lg shadow-sm">
            <Sparkles size={16} />
          </div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Klar-Verbindung des Tages</h3>
        </div>
        <button
          onClick={() => setIsInterestFocused(!isInterestFocused)}
          className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium ${isInterestFocused ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'}`}
          title="Nach wichtigsten Interessen (Must-Haves) priorisieren"
        >
          <Filter size={14} />
          Interessen-Fokus
        </button>
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
        Basierend auf deinen Interessen und deinem Dating-Ziel haben wir diese Profile für dich ausgewählt.
      </p>

      <div className="space-y-3">
                {verbindungen.map((verbindung, idx) => (
          <div 
            key={verbindung.id}
            className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden"
          >
            <div 
              onClick={() => onProfileClick(verbindung)}
              className="flex items-center gap-4 p-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 relative">
                <img 
                  src={verbindung.photoUrl} 
                  alt={verbindung.name} 
                  className="w-full h-full object-cover"
                />
                {idx === 0 && (
                  <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 p-1 rounded-full border-2 border-white dark:border-stone-900 shadow-sm">
                    <Star size={10} className="fill-current" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-stone-900 dark:text-stone-100 truncate">{verbindung.name}, {verbindung.age}</h4>
                  <button 
                    onClick={(e) => generateWhyWeMatch(e, verbindung)}
                    className="p-1 bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-brand dark:hover:text-brand-light rounded-full transition-colors"
                    title="Warum wir passen"
                  >
                    <Info size={14} />
                  </button>
                </div>
                <p className="text-xs text-stone-500 truncate">{verbindung.bio}</p>
              </div>
              <div className="shrink-0 text-stone-400">
                <ChevronRight size={18} />
              </div>
            </div>
            
            {/* Expanded Why We Verbindung section */}
            {expandedWhy[verbindung.id] && (
              <div className="px-3 pb-3 pt-0">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex items-start gap-2">
                    <Sparkles size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    {loadingWhyWeMatch[verbindung.id] ? (
                       <p className="text-xs text-emerald-700 dark:text-emerald-400 animate-pulse">Analysiere eure Synergien...</p>
                    ) : (
                       <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                         {whyWeMatch[verbindung.id]}
                       </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="px-3 pb-3 pt-1 border-t border-stone-50 dark:border-stone-800/50 bg-stone-50/50 dark:bg-stone-800/20">
                            {intros[verbindung.id] ? (
                <div className="bg-brand/5 dark:bg-brand-light/5 p-2.5 rounded-lg border border-brand/10 dark:border-brand-light/10 relative group">
                  <p className="text-xs text-stone-700 dark:text-stone-300 italic pr-8 leading-relaxed">
                    "{intros[verbindung.id]}"
                  </p>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPreviewIntro({ verbindung, text: intros[verbindung.id] || "" }); }}
                      className="p-1.5 bg-white dark:bg-stone-800 rounded-md border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-brand dark:hover:text-brand-light transition-colors shadow-sm"
                      title="Vorschau"
                    >
                      <Eye size={12} />
                    </button>
                    <button 
                      onClick={(e) => handleCopy(e, intros[verbindung.id] || "", verbindung.id)}
                      className="p-1.5 bg-white dark:bg-stone-800 rounded-md border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-brand dark:hover:text-brand-light transition-colors shadow-sm"
                      title="Kopieren"
                    >
                      {copiedIntro === verbindung.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => generateSmartIntro(e, verbindung)}
                  disabled={loadingIntros[verbindung.id]}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-brand dark:text-brand-light bg-brand/10 dark:bg-brand-light/10 hover:bg-brand/20 dark:hover:bg-brand-light/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingIntros[verbindung.id] ? (
                    <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse mb-3"></div>
                  ) : (
                    <MessageSquare size={14} />
                  )}
                  {loadingIntros[verbindung.id] ? "Generiere..." : "Smart Intro"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
      
      {/* Intro Preview Modal */}
      {previewIntro && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 "
          onClick={() => setPreviewIntro(null)}
        >
          <div 
            className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <img src={previewIntro.verbindung.photoUrl} alt={previewIntro.verbindung.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100">{previewIntro.verbindung.name}</h4>
                  <p className="text-xs text-stone-500">Chat-Vorschau</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewIntro(null)}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 bg-stone-50 dark:bg-stone-950 h-64 flex flex-col justify-end">
              <div className="text-center mb-4 text-xs text-stone-400">Heute, 14:20</div>
              <div className="flex justify-end mb-2">
                <div className="bg-brand text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] shadow-sm">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{previewIntro.text}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <span className="text-[10px] text-stone-400">Gelesen</span>
              </div>
            </div>
            
            <div className="p-3 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-stone-100 dark:bg-stone-800 h-10 rounded-full flex items-center px-4">
                  <span className="text-stone-400 text-sm">Nachricht...</span>
                </div>
                <button className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center opacity-50 cursor-not-allowed">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
