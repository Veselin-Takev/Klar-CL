// @ts-nocheck
import { useState, useEffect } from "react";
import { BookOpen, Sparkles, Send, ChevronDown, ChevronUp, Download, Mic, Square } from "lucide-react";
import { hapticFeedback } from "../lib/haptics";
import jsPDF from "jspdf";
import { motion, AnimatePresence } from "motion/react";
import { melde } from "../lib/fehler";

interface DatingJournalWidgetProps {
  userInterests: string[];
}

export function DatingJournalWidget({ userInterests }: DatingJournalWidgetProps) {
  const [entry, setEntry] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    insights: string[];
    tips: string[];
    summary: string;
    mood?: "positive" | "neutral" | "negative";
  } | null>(null);
  const [moodHistory, setMoodHistory] = useState<("positive" | "neutral" | "negative")[]>([]);
  
  const [isExpanded, setIsExpanded] = useState(false);

  const [proofValues, setProofValues] = useState<string[]>([]);
  
  useEffect(() => {
    // Listen for custom event from ValuesRadar
    const handleProofRequest = (e: any) => {
      const value = e.detail;
      setProofValues(prev => [...prev, `Erlebnis passend zu "${value}" gefunden: "${entry.substring(0, 50)}..."`]);
    };
    window.addEventListener('klar-request-value-proof', handleProofRequest);
    return () => window.removeEventListener('klar-request-value-proof', handleProofRequest);
  }, [entry]);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);


  useEffect(() => {
    const savedHistory = localStorage.getItem("klar_journal_mood_history");
    if (savedHistory) {
      try {
        setMoodHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }
    const savedAnalysis = localStorage.getItem("klar_latest_journal_analysis");
    if (savedAnalysis) {
      try {
        setAnalysis(JSON.parse(savedAnalysis));
      } catch (e) {
        melde("DatingJournalWidget", e);
      }
    }
  }, []);

  
  const exportPDF = () => {
    if (!analysis) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(244, 63, 94); // Rose-500
    doc.text("Klar Dating-Journal Report", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(new Date().toLocaleDateString('de-DE'), 20, 28);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "italic");
    const splitSummary = doc.splitTextToSize('"' + analysis.summary + '"', 170);
    doc.text(splitSummary, 20, 40);
    
    let yPos = 40 + (splitSummary.length * 6) + 10;
    
    doc.setFont("helvetica", "normal");
    
    // Insights
    if (analysis.insights && analysis.insights.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Erkenntnisse", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      analysis.insights.forEach(insight => {
        const splitText = doc.splitTextToSize("• " + insight, 170);
        doc.text(splitText, 20, yPos);
        yPos += splitText.length * 6;
      });
      yPos += 10;
    }
    
    // Tips
    if (analysis.tips && analysis.tips.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Tipps für die Zukunft", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      analysis.tips.forEach(tip => {
        const splitText = doc.splitTextToSize("→ " + tip, 170);
        doc.text(splitText, 20, yPos);
        yPos += splitText.length * 6;
      });
    }
    
    
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.text("Datenschutz-Audit-Bericht", 20, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Dieser Bericht zeigt, welche Datenpunkte Klar für das Matching verwendet.", 20, 30);
      
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("1. Kernwerte (Values):", 20, 45);
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      const values = JSON.parse(localStorage.getItem("klar_user_values") || "[]");
      doc.text(values.length > 0 ? values.join(", ") : "Keine definiert", 20, 55);

      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("2. No-Gos:", 20, 70);
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      const nogos = JSON.parse(localStorage.getItem("userNoGos") || "[]");
      doc.text(nogos.length > 0 ? nogos.join(", ") : "Keine definiert", 20, 80);

    doc.save("Klar-Dating-Journal.pdf");
  };

  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType });
        processAudio(audioBlob, recorder.mimeType);
        stream.getTracks().forEach(t => t.stop());
      };
      setAudioChunks(chunks);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      hapticFeedback([50]);
    } catch (e) {
      melde("DatingJournalWidget", e);
      alert("Mikrofon-Zugriff nicht möglich.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      hapticFeedback([50, 50]);
    }
  };

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsProcessingAudio(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        const res = await fetch("/api/journal-audio-dump", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64: base64data, mimeType })
        });
        const data = await res.text().then(text => text ? JSON.parse(text) : {});
        if (data.transcript) {
          setEntry(prev => prev ? prev + "\n" + data.transcript : data.transcript);
          // Auto trigger analysis if it has insight
          if (data.mood) {
             hapticFeedback([50, 100, 150]);
             const newHistory = [...moodHistory, data.mood].slice(-7);
             setMoodHistory(newHistory);
             localStorage.setItem("klar_journal_mood_history", JSON.stringify(newHistory));
          }
        }
      };
    } catch (e) {
      melde("DatingJournalWidget", e);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleAnalyze = async () => {
    if (!entry.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/dating-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journalEntry: entry, userInterests })
      });
      
      if (!res.ok) throw new Error("Failed to analyze");
      
      const data = await res.text().then(text => text ? JSON.parse(text) : {});
      setAnalysis(data);
      localStorage.setItem("klar_latest_journal_analysis", JSON.stringify(data));
      if (data.mood) {
        const newHistory = [...moodHistory, data.mood].slice(-7);
        setMoodHistory(newHistory);
        localStorage.setItem("klar_journal_mood_history", JSON.stringify(newHistory));
      }
      setEntry("");
      setIsExpanded(true);
      hapticFeedback([50, 100, 150]);
    } catch (e) {
      melde("DatingJournalWidget", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full -z-10" />
      
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="font-serif font-medium text-lg text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              Dating-Journal
              <Sparkles size={14} className="text-rose-500" />
            </h3>
            {moodHistory.length > 0 && (
              <div className="flex gap-1 mt-1">
                {moodHistory.map((m, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${m === 'positive' ? 'bg-emerald-400' : m === 'neutral' ? 'bg-amber-400' : 'bg-rose-400'}`} title={m} />
                ))}
              </div>
            )}
            <p className="text-xs text-stone-500 dark:text-stone-400">Reflektiere dein letztes Date</p>
          </div>
        </div>
        <div className="text-stone-400">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3">
              <div className="relative mb-3">
                <textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="Wie lief dein Date? Was hast du gefühlt? Was lief gut, was weniger? (Oder nutze die Spracheingabe)"
                  className="w-full h-32 p-3 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all dark:text-stone-100"
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessingAudio || isAnalyzing}
                  className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors flex items-center justify-center shadow-sm ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-rose-500 hover:border-rose-200'}`}
                  title="KI-Coach Mind-Dump (Spracheingabe)"
                >
                  {isProcessingAudio ? <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span> : isRecording ? <Square size={16} className="fill-current" /> : <Mic size={16} />}
                </button>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !entry.trim()}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span>
                    Analysiere...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Eintrag reflektieren
                  </>
                )}
              </button>

              {analysis && !isAnalyzing && (
                <div className="mt-4 flex flex-col gap-4">

          {moodHistory.length > 0 && (
            <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-700">
              <h4 className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">Wöchentlicher Gefühls-Trend</h4>
              <div className="flex items-end gap-1 h-12">
                {moodHistory.map((mood, idx) => {
                  const height = mood === 'positive' ? '100%' : mood === 'neutral' ? '50%' : '20%';
                  const color = mood === 'positive' ? 'bg-emerald-400' : mood === 'neutral' ? 'bg-amber-400' : 'bg-rose-400';
                  return (
                    <div key={idx} className="flex-1 flex flex-col justify-end h-full">
                      <div className={`w-full ${color} rounded-t-sm opacity-80`} style={{ height }}></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

                  <div className="flex justify-end mb-[-8px]">
                    <button onClick={exportPDF} className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                      <Download size={14} />
                      Als PDF exportieren
                    </button>
                  </div>
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl">
                    <p className="text-sm text-rose-800 dark:text-rose-200 font-medium italic">
                      "{analysis.summary}"
                    </p>
                  </div>

                  {analysis.insights && analysis.insights.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-2">Erkenntnisse</h4>
                      <ul className="flex flex-col gap-2">
                        {analysis.insights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
                            <span className="text-rose-500 mt-0.5">•</span>
                            <span className="leading-snug">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.tips && analysis.tips.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-2">Tipps für die Zukunft</h4>
                      <ul className="flex flex-col gap-2">
                        {analysis.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
                            <span className="text-emerald-500 mt-0.5">→</span>
                            <span className="leading-snug">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
