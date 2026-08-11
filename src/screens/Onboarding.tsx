import { useState } from "react";
import { Sparkles, ArrowRight, Heart, Coffee, Music, Camera, Palette, Globe, Book, Dumbbell, Compass, Wine, Briefcase, Zap, Moon } from "lucide-react";

const INTERESTS = [
  { id: "coffee", label: "Kaffee & Gespräche", icon: Coffee },
  { id: "music", label: "Live Musik", icon: Music },
  { id: "art", label: "Kunst & Kultur", icon: Palette },
  { id: "travel", label: "Reisen & Entdecken", icon: Globe },
  { id: "books", label: "Literatur", icon: Book },
  { id: "fitness", label: "Sport & Fitness", icon: Dumbbell },
  { id: "nature", label: "Natur & Wandern", icon: Compass },
  { id: "food", label: "Foodie & Wein", icon: Wine },
  { id: "career", label: "Karriere & Business", icon: Briefcase },
  { id: "nightlife", label: "Nightlife & Party", icon: Moon },
  { id: "photography", label: "Fotografie", icon: Camera },
  { id: "spirituality", label: "Spiritualität", icon: Zap },
];

const GOALS = [
  { id: "relationship", label: "Eine feste Beziehung", description: "Ich suche nach etwas Langfristigem und Tiefgründigem." },
  { id: "undecided", label: "Noch unsicher", description: "Ich suche etwas Ernstes, lasse es aber auf mich zukommen." },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isAdult, setIsAdult] = useState(false);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedInterests.length > 0 && isAdult) {
      setStep(2);
    } else if (step === 2 && selectedGoal) {
      localStorage.setItem("userInterests", JSON.stringify(selectedInterests));
      localStorage.setItem("userGoal", selectedGoal);
      localStorage.setItem("hasCompletedOnboarding", "true");
      onComplete();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-light-bg dark:bg-dark-bg p-6 pb-safe relative overflow-hidden mx-auto w-full max-w-md shadow-md">
        {step === 1 && (
            <div className="flex-1 flex flex-col pt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="mb-8">
                    <h1 className="text-4xl font-serif text-brand dark:text-brand-light mb-4">Was begeistert dich?</h1>
                    <p className="text-stone-600 dark:text-stone-400">Wähle ein paar Interessen aus, damit wir passende Verbindungen für dich finden können. (Mindestens 1)</p>
                </div>
                
                <div className="flex-1 overflow-y-auto hide-scrollbar pb-4">
                    <div className="flex flex-wrap gap-3">
                        {INTERESTS.map(interest => {
                            const isSelected = selectedInterests.includes(interest.id);
                            const Icon = interest.icon;
                            return (
                                <button
                                    key={interest.id}
                                    onClick={() => toggleInterest(interest.id)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all ${
                                        isSelected 
                                        ? 'border-brand dark:border-brand-light bg-brand dark:bg-brand-light text-white dark:text-stone-900 shadow-md scale-105' 
                                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-brand/50 dark:hover:border-brand-light/50'
                                    }`}
                                >
                                    <Icon size={18} className={isSelected ? "text-white dark:text-stone-900" : "text-brand dark:text-brand-light"} />
                                    <span className="font-medium">{interest.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {/* BEFUND 10.08.2026: Diese Leiste stand `absolute bottom-6`
                    ueber der Liste, mit `bg-…/80` also durchscheinend, und die
                    Liste hatte nur `pb-24` (96px) Platz gelassen. Die Leiste ist
                    aber rund 175px hoch — die untersten Interessen lagen darunter
                    und schimmerten durch die Bestaetigung hindurch.
                    Jetzt ein normales Flex-Kind: Ueberlappung ist damit
                    ausgeschlossen, ohne dass eine Hoehe geraten werden muss. */}
                <div className="shrink-0 flex flex-col gap-4 pt-4">
                    <label className="flex items-center gap-3 p-3 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isAdult} 
                            onChange={(e) => setIsAdult(e.target.checked)} 
                            className="w-5 h-5 rounded border-stone-300 text-brand focus:ring-brand"
                        />
                        <span className="text-sm text-stone-700 dark:text-stone-300">
                            Ich bestätige, dass ich mindestens 18 Jahre alt bin und die AGB akzeptiere.
                        </span>
                    </label>

                    <button 
                        onClick={handleNext}
                        disabled={selectedInterests.length === 0 || !isAdult}
                        className="w-full py-4 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-2xl font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
                    >
                        Weiter <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="flex-1 flex flex-col pt-12 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="mb-8">
                    <h1 className="text-4xl font-serif text-brand dark:text-brand-light mb-4">Was suchst du?</h1>
                    <p className="text-stone-600 dark:text-stone-400">Ehrlichkeit ist bei Klar am wichtigsten. Sag uns, worauf du Lust hast.</p>
                </div>
                
                <div className="flex-1 overflow-y-auto hide-scrollbar pb-4 space-y-4">
                    {GOALS.map(goal => {
                        const isSelected = selectedGoal === goal.id;
                        return (
                            <button
                                key={goal.id}
                                onClick={() => setSelectedGoal(goal.id)}
                                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                                    isSelected 
                                    ? 'border-brand dark:border-brand-light bg-brand/5 dark:bg-brand-light/5 shadow-sm' 
                                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-brand/50 dark:hover:border-brand-light/50'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className={`font-medium text-lg ${isSelected ? 'text-brand dark:text-brand-light' : 'text-stone-900 dark:text-stone-100'}`}>
                                        {goal.label}
                                    </h3>
                                    {isSelected && <Heart size={20} className="text-brand dark:text-brand-light fill-brand dark:fill-brand-light" />}
                                </div>
                                <p className="text-sm text-stone-600 dark:text-stone-400">{goal.description}</p>
                            </button>
                        );
                    })}
                </div>
                
                {/* Gleicher Befund wie in Schritt 1: absolut positioniert, ohne
                    Hintergrund — die Ziel-Karten liefen sichtbar dahinter durch. */}
                <div className="shrink-0 flex gap-3 pt-4">
                    <button 
                        onClick={() => setStep(1)}
                        className="px-6 py-4 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-2xl font-medium transition-colors hover:bg-stone-300 dark:hover:bg-stone-700"
                    >
                        Zurück
                    </button>
                    <button 
                        onClick={handleNext}
                        disabled={!selectedGoal}
                        className="flex-1 py-4 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-2xl font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
                    >
                        Loslegen <Sparkles size={20} />
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}
