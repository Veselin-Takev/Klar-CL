import { useState } from "react";
import { Map, MapPin, Cloud, Sparkles, Clock, Navigation, Check, ShieldCheck , Download } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { motion } from "motion/react";
import { melde } from "../lib/fehler";

interface DateIdea {
  title: string;
  description: string;
  locationType: string;
  latOffset?: number;
  lngOffset?: number;
}

export function SmartDatePlannerWidget({ location: initialLocation = "" }: { location?: string | null }) {
  const [location, setLocation] = useState(initialLocation || "");
  const [time, setTime] = useState("");
  const [weather, setWeather] = useState("Sonnig, 22°C");
  const [ideas, setIdeas] = useState<DateIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIdeaIdx, setActiveIdeaIdx] = useState<number | null>(null);

  const [showSafetyPrompt, setShowSafetyPrompt] = useState(false);
  const [dateConfirmed, setDateConfirmed] = useState(false);
  
  
  const handleCalendarSync = (idea: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const eventDetails = `Termin: Date (${idea.locationType})\nThema: ${idea.description}\nZeit: ${time}\nOrt: ${location}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Neues Date',
        text: eventDetails,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(eventDetails);
      alert('Date-Details in die Zwischenablage kopiert!');
    }
  };

  const handleConfirmDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSafetyPrompt(true);
  };
  
  const acceptSafety = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSafetyPrompt(false);
    setDateConfirmed(true);
    setTimeout(() => setDateConfirmed(false), 3000);
  };
  
  const declineSafety = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSafetyPrompt(false);
    setDateConfirmed(true);
    setTimeout(() => setDateConfirmed(false), 3000);
  };


  const weathers = ["Sonnig, 22°C", "Regnerisch, 14°C", "Bewölkt, 18°C", "Kalt, 5°C", "Heiß, 30°C", "Stürmisch, 10°C"];
  
  const handlePlan = async () => {
    if (!location || !time) return;
    setIsLoading(true);
    setActiveIdeaIdx(null);
    try {
      const storedInterests = localStorage.getItem("userInterests");
      const userInterests = storedInterests ? JSON.parse(storedInterests) : [];

      const response = await fetch('/api/smart-date-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, time, weather, userInterests })
      });
      const data = await response.text().then(text => text ? JSON.parse(text) : {});
      // backend returns suggestions instead of ideas
      setIdeas(data.suggestions?.map((s: any) => ({
        title: s.title,
        description: s.description,
        locationType: s.type,
        latOffset: (Math.random() - 0.5) * 100, // random offset for map simulation
        lngOffset: (Math.random() - 0.5) * 160
      })) || []);
    } catch (e) {
      melde("SmartDatePlannerWidget", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm h-full flex flex-col relative z-10 overflow-hidden">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Map size={20} className="text-teal-500" /> 
            Smart Date Planner
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            KI-Vorschläge nach Wetter & Zeit
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {ideas.length === 0 && !isLoading ? (
          <div className="space-y-3">
            <div className="relative">
              <MapPin size={16} className="absolute top-2.5 left-3 text-stone-400" />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Stadt (z.B. Berlin)"
                className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="relative">
              <Clock size={16} className="absolute top-2.5 left-3 text-stone-400" />
              <input
                type="text"
                value={time}
                onChange={e => setTime(e.target.value)}
                placeholder="Zeitpunkt (z.B. Samstag Abend)"
                className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="relative">
              <Cloud size={16} className="absolute top-2.5 left-3 text-stone-400" />
              <select
                value={weather}
                onChange={e => setWeather(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
              >
                {weathers.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            
            <button
              onClick={handlePlan}
              disabled={!location || !time}
              className="w-full mt-2 bg-teal-500 hover:bg-teal-600 text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Sparkles size={16} />
              Date planen
            </button>
          </div>
        ) : isLoading ? (
           <div className="flex flex-col items-center justify-center py-8 text-stone-500">
              <Sparkles className="animate-pulse mb-3 text-teal-500" size={24} />
              <p className="text-xs font-medium animate-pulse text-center px-4">
                Analysiere Wetter & Location für perfekte Dates...
              </p>
            </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-medium text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">
                {location} • {time} • {weather.split(',')[0]}
              </div>
              <button onClick={() => setIdeas([])} className="text-[10px] text-stone-400 hover:text-stone-600 underline">Neu</button>
            </div>

            {/* Simulated Map View */}
            <div className="relative w-full h-48 bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-inner">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle at center, #9ca3af 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}></div>
              
              {/* Central User Location */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>
                <span className="text-[9px] font-bold mt-1 text-stone-700 dark:text-stone-300 drop-shadow-sm bg-white/80 dark:bg-black/80 px-1 rounded">Du</span>
              </div>

              {ideas.map((idea, idx) => (
                <motion.button
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.15 }}
                  onClick={() => setActiveIdeaIdx(idx)}
                  className={`absolute z-20 flex flex-col items-center group cursor-pointer transition-transform duration-300 ${activeIdeaIdx === idx ? 'scale-125 z-30' : ''}`}
                  style={{
                    top: `calc(50% + ${idea.latOffset}px)`,
                    left: `calc(50% + ${idea.lngOffset}px)`,
                  }}
                >
                  <MapPin size={24} className={activeIdeaIdx === idx ? "text-teal-600 drop-shadow-lg fill-teal-100" : "text-stone-500 dark:text-stone-400 drop-shadow-md"} />
                  <div className={`absolute top-full mt-1 bg-white dark:bg-stone-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap transition-opacity ${activeIdeaIdx === idx ? 'opacity-100 z-30' : 'opacity-0 group-hover:opacity-100'}`}>
                    {idea.title}
                  </div>
                </motion.button>
              ))}
            </div>
            
            <div className="space-y-3">
              {ideas.map((idea, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  onClick={() => setActiveIdeaIdx(idx)}
                  className={`p-3 border rounded-xl cursor-pointer transition-colors ${
                    activeIdeaIdx === idx 
                      ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700' 
                      : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-teal-200 dark:hover:border-teal-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-sm text-stone-900 dark:text-stone-100">{idea.title}</h4>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded-md text-right ml-2 shrink-0">{idea.locationType}</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-snug mb-2">{idea.description}</p>
                  
                  
                    <AnimatePresence>
                      {activeIdeaIdx === idx && !showSafetyPrompt && !dateConfirmed && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex gap-2 mt-2"
                        >
                          <button className="flex-1 text-[10px] text-teal-600 dark:text-teal-400 font-medium flex items-center justify-center gap-1 bg-teal-50 dark:bg-teal-900/30 px-2 py-2 rounded-lg">
                            <Navigation size={12} />
                            Route
                          </button>
                          
                          <button 
                            onClick={(e) => handleCalendarSync(idea, e)}
                            className="flex-1 text-[10px] text-stone-600 dark:text-stone-300 font-medium flex items-center justify-center gap-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 px-2 py-2 rounded-lg transition-colors"
                          >
                            <Download size={12} />
                            Kalender-Sync
                          </button>

                          <button 
                            onClick={handleConfirmDate}
                            className="flex-1 text-[10px] text-white font-medium flex items-center justify-center gap-1 bg-teal-500 hover:bg-teal-600 px-2 py-2 rounded-lg transition-colors"
                          >
                            <Check size={12} />
                            Date fixieren
                          </button>
                        </motion.div>
                      )}
                      
                      {activeIdeaIdx === idx && showSafetyPrompt && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700 p-3 rounded-xl"
                        >
                          <div className="flex gap-2 items-start mb-3">
                            <ShieldCheck size={16} className="text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-stone-900 dark:text-stone-100">Sicherheits-Modus aktivieren?</p>
                              <p className="text-[10px] text-stone-500 mt-1">Dieser Ort ({idea.locationType}) ist öffentlich. Möchtest du, dass wir für dieses Date den Sicherheits-Button (Standort & Check-ins) aktivieren?</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={declineSafety} className="flex-1 py-1.5 text-[10px] font-medium text-stone-600 dark:text-stone-400 bg-stone-200 dark:bg-stone-800 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors">
                              Nein, danke
                            </button>
                            <button onClick={acceptSafety} className="flex-1 py-1.5 text-[10px] font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors">
                              Ja, aktivieren
                            </button>
                          </div>
                        </motion.div>
                      )}
                      
                      {activeIdeaIdx === idx && dateConfirmed && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 py-2 rounded-xl border border-teal-100 dark:border-teal-800/50"
                        >
                          <Check size={14} /> Date erfolgreich geplant
                        </motion.div>
                      )}
                    </AnimatePresence>

                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
