// @ts-nocheck
import { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { hapticFeedback } from '../lib/haptics';

export function ValuesQuizWidget() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const questions = [
    {
      text: "Ein freier Sonntag liegt vor dir. Was machst du am liebsten?",
      options: [
        "Spontan einen Roadtrip machen (Abenteuer)",
        "Ein Buch lesen oder meditieren (Ruhe & Achtsamkeit)",
        "Freunde zum Brunch einladen (Soziales & Gemeinschaft)",
        "Ein neues Projekt oder Hobby starten (Kreativität)"
      ],
      values: ["Abenteuer", "Achtsamkeit", "Gemeinschaft", "Kreativität"]
    },
    {
      text: "Wie gehst du mit einem Konflikt in einer Beziehung um?",
      options: [
        "Direkt ansprechen und diskutieren (Ehrlichkeit & Direktheit)",
        "Erst nachdenken, dann ruhig klären (Harmonie & Reflexion)",
        "Einen Kompromiss finden, der beide glücklich macht (Teamwork)",
        "Ich brauche erst einmal Abstand (Unabhängigkeit)"
      ],
      values: ["Ehrlichkeit", "Harmonie", "Teamwork", "Unabhängigkeit"]
    },
    {
      text: "Was ist dir bei einem ersten Date am wichtigsten?",
      options: [
        "Lachen und Leichtigkeit (Humor)",
        "Tiefgründige Gespräche (Tiefgang)",
        "Gemeinsam etwas erleben (Aktivität)",
        "Ein stilvolles Ambiente (Ästhetik & Genuss)"
      ],
      values: ["Humor", "Tiefgang", "Aktivität", "Genuss"]
    }
  ];

  const handleAnswer = (index: number) => {
    hapticFeedback(50);
    const newAnswers = [...answers, index];
    setAnswers(newAnswers);
    
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setIsCompleted(true);
      hapticFeedback([100, 50, 100, 50, 200]);
      
      // Calculate top values
      const topValues = newAnswers.map((ans, i) => questions[i].values[ans]);
      
      // Save to localStorage or update profile
      const currentValues = JSON.parse(localStorage.getItem("klar_user_values") || "[]");
      const combined = Array.from(new Set([...currentValues, ...topValues])).slice(0, 5);
      localStorage.setItem("klar_user_values", JSON.stringify(combined));
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full -z-10" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Werte-Kompass Quiz</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Finde deine wahren Kernwerte</p>
        </div>
      </div>

      {!isCompleted ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center text-[10px] font-medium text-stone-400">
            <span>Frage {step + 1} von {questions.length}</span>
            <span>{Math.round((step / questions.length) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-purple-500 transition-all duration-500" 
              style={{ width: `\${(step / questions.length) * 100}%` }}
            />
          </div>
          
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-2">
            {questions[step].text}
          </p>
          
          <div className="flex flex-col gap-2">
            {questions[step].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="text-left p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:border-purple-200 dark:hover:border-purple-800/50 transition-colors text-xs text-stone-700 dark:text-stone-300 flex justify-between items-center group"
              >
                <span>{opt}</span>
                <ArrowRight size={14} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h4 className="font-serif text-lg text-stone-900 dark:text-stone-100 mb-2">Quiz abgeschlossen!</h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
            Deine Kernwerte wurden analysiert und zu deinem Profil hinzugefügt. Das hilft dem KI-Matchmaker, noch tiefere Verbindungen für dich zu finden.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {answers.map((ans, i) => (
              <span key={i} className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-700">
                {questions[i].values[ans]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
