// ═══════════════════════════════════════════════════════════════════════════
// P2-BEFUND, NICHT BEHOBEN: Dieses Widget erzeugt Daten, die es nicht gibt.
// Angezeigte Verläufe, Werte und Trends sind erfunden — für die bedienende
// Person aber nicht von echten zu unterscheiden.
//
// Nicht stillschweigend entfernt, weil das eine Produktentscheidung ist:
// entweder echte Daten anbinden oder das Widget streichen. Ein drittes
// „Demodaten mit Hinweis" gibt es nicht — ein Hinweis, den man wegklickt,
// macht die Zahl nicht wahr.
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useRef } from 'react';
import { CalendarDays, Sparkles, Loader2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { melde } from "../lib/fehler";

export const WeeklyVibesWidget: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [vibesData, setVibesData] = useState<{summary: string, words: {text: string, size: string, color: string, top: string, left: string}[]} | null>(null);
  
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    if (!pdfRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('Dating_Wochenrueckblick.pdf');
    } catch (e) {
      console.error("PDF export failed", e);
    } finally {
      setIsExporting(false);
    }
  };
  
  const generateVibes = async () => {
    setIsGenerating(true);
    try {
      // Simulated AI generation based on chat history
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData = {
        summary: "Eine Woche voller Neugier und guter Gespräche. Du warst ehrlich zu dir selbst und hast klare Grenzen gesetzt.",
        words: [
          { text: 'Ehrlich', size: 'text-2xl', color: 'text-emerald-500', top: '10%', left: '20%' },
          { text: 'Neugierig', size: 'text-lg', color: 'text-indigo-500', top: '25%', left: '60%' },
          { text: 'Grenzen', size: 'text-xl', color: 'text-amber-500', top: '50%', left: '15%' },
          { text: 'Authentisch', size: 'text-3xl', color: 'text-brand', top: '45%', left: '45%' },
          { text: 'Tiefgründig', size: 'text-base', color: 'text-rose-400', top: '70%', left: '30%' },
          { text: 'Klar', size: 'text-xl', color: 'text-cyan-500', top: '75%', left: '70%' },
        ]
      };
      setVibesData(mockData);
    } catch (e) {
      melde("WeeklyVibesWidget", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="text-brand dark:text-brand-light" size={20} />
          <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">Wochenrückblick-Vibes</h3>
        </div>
        {!vibesData && (
          <button 
            onClick={generateVibes}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            KI-Analyse starten
          </button>
        )}
      </div>
      
      {!vibesData && !isGenerating && (
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-6 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-100 dark:border-stone-800">
          Lass die KI deine Chats und Check-ins der letzten Woche analysieren, um deine Stimmung zusammenzufassen.
        </p>
      )}

      {isGenerating && (
        <div className="py-8 flex flex-col items-center justify-center gap-3 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-100 dark:border-stone-800">
          <Loader2 size={24} className="text-brand dark:text-brand-light animate-spin" />
          <p className="text-sm font-medium text-stone-500">Analysiere Historie...</p>
        </div>
      )}

      {vibesData && (
        <div className="animate-in fade-in duration-500">
          <div ref={pdfRef} className="bg-white dark:bg-stone-900 p-2 rounded-xl">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-6 italic border-l-2 border-brand/50 pl-3">
              "{vibesData.summary}"
            </p>
            <div className="relative h-40 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
              {vibesData.words.map((word, idx) => (
                <span 
                  key={idx}
                  className={`absolute font-serif font-medium ${word.size} ${word.color} opacity-80 hover:opacity-100 transition-opacity cursor-default drop-shadow-sm`}
                  style={{ top: word.top, left: word.left, transform: 'translate(-50%, -50%)' }}
                >
                  {word.text}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
             <button 
                onClick={exportToPDF}
                disabled={isExporting}
                className="text-xs font-medium text-brand dark:text-brand-light hover:text-brand/80 flex items-center gap-1.5 bg-brand/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
             >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
                Als PDF speichern
             </button>
             <button 
                onClick={generateVibes}
                disabled={isGenerating}
                className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 flex items-center gap-1"
             >
                <Sparkles size={12} /> Neu generieren
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
