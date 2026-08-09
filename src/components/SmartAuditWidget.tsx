// @ts-nocheck
import { useState } from 'react';
import { Sparkles, Activity, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { triggerHaptic } from '../lib/haptics';
import { fetchWithCache } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { melde } from "../lib/fehler";

interface SmartAuditWidgetProps {
  bio: string;
  values: {subject: string, A: number}[];
  profileImageUrl?: string;
  onAuditComplete?: (score: number) => void;
}

export function SmartAuditWidget({ bio, values, profileImageUrl, onAuditComplete }: SmartAuditWidgetProps) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const exportPDF = async () => {
    if (!auditResult) return;
    triggerHaptic('LIGHT_TAP');
    
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(245, 158, 11);
    doc.text('Smart-Audit Profilanalyse', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Generiert am: ' + new Date().toLocaleDateString('de-DE'), 14, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text('Profil-Score: ' + auditResult.overallScore + ' / 10', 14, 45);
    
    let yPos = 60;
    
    // Add radar chart image
    const radarElement = document.getElementById('werte-radar-container');
    if (radarElement) {
      try {
        const canvas = await html2canvas(radarElement, {
          backgroundColor: null,
          scale: 2
        });
        const imgData = canvas.toDataURL('image/png');
        // Aspect ratio 1:1 roughly for the container
        doc.addImage(imgData, 'PNG', 14, yPos, 80, 80);
        yPos += 90;
      } catch (e) {
        console.error("Error capturing radar chart", e);
      }
    }
    
    if (auditResult.strengths && auditResult.strengths.length > 0) {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text('Deine Stärken:', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      auditResult.strengths.forEach((str: string) => {
        const splitText = doc.splitTextToSize(String.fromCharCode(8226) + ' ' + str, 180);
        doc.text(splitText, 14, yPos);
        yPos += splitText.length * 5 + 2;
      });
      yPos += 5;
    }
    
    if (auditResult.suggestions && auditResult.suggestions.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setTextColor(245, 158, 11);
      doc.text('Optimierungspotenzial:', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      auditResult.suggestions.forEach((sug: string) => {
        const splitText = doc.splitTextToSize(String.fromCharCode(8226) + ' ' + sug, 180);
        doc.text(splitText, 14, yPos);
        yPos += splitText.length * 5 + 2;
      });
    }
    
    doc.save('Klar-Smart-Audit-Report.pdf');
    triggerHaptic('SUCCESS');
  };

  const handleAudit = async () => {
    setIsAuditing(true);
    triggerHaptic('LIGHT_TAP');
    
    // Generiere einen einfachen Hash als Cache-Key
    const cacheString = bio + JSON.stringify(values.map(v => v.subject)) + (profileImageUrl || '');
    const cacheKey = 'smartAuditCache_' + btoa(unescape(encodeURIComponent(cacheString))).substring(0, 50);
    
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const data = JSON.parse(cachedData);
        setAuditResult(data);
        if (onAuditComplete) {
          onAuditComplete(data.overallScore);
        }
        setIsAuditing(false);
        triggerHaptic('SUCCESS');
        return;
      } catch (e) {
        console.warn("Invalid cache data", e);
      }
    }

    try {
      const res = await fetchWithCache('/api/smart-audit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ bio, values: values.map(v => v.subject), profileImageUrl })
      });
      const data = await res.text().then(text => text ? JSON.parse(text) : {});
      
      localStorage.setItem(cacheKey, JSON.stringify(data));
      setAuditResult(data);
      
      if (onAuditComplete) {
        onAuditComplete(data.overallScore);
      }
      triggerHaptic('SUCCESS');
    } catch (e) {
      melde("SmartAuditWidget", e);
      triggerHaptic('ERROR');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full -z-10" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
          <Activity size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Smart-Audit Tool</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Analysiert deine Werte-Ausstrahlung</p>
        </div>
      </div>

      {!auditResult ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Lass den KI-Matchmaker prüfen, wie stark deine aktuellen Werte in deinem Profil und Bio-Text zur Geltung kommen, um die besten Deep-Verbindungen anzuziehen.
          </p>
          <button
            onClick={handleAudit}
            disabled={isAuditing || !bio.trim()}
            className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            {isAuditing ? (
              <span className="flex items-center gap-2"><Sparkles size={16} className="animate-pulse" /> Analysiere Profil...</span>
            ) : (
              <span className="flex items-center gap-2"><Sparkles size={16} /> Audit Starten</span>
            )}
          </button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-700">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Profil-Score</span>
              <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-amber-500">
                {auditResult.overallScore} <span className="text-xs text-stone-400 font-sans font-normal">/ 10</span>
              </div>
            </div>

            {auditResult.strengths && auditResult.strengths.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-200 mb-2">Deine Stärken</h4>
                <ul className="flex flex-col gap-2">
                  {auditResult.strengths.map((str: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {auditResult.suggestions && auditResult.suggestions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-200 mb-2">Optimierungspotenzial</h4>
                <ul className="flex flex-col gap-2">
                  {auditResult.suggestions.map((sug: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
                      <ChevronRight size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={exportPDF}
                className="flex items-center justify-center gap-2 flex-1 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-medium text-xs transition-colors"
              >
                <Download size={14} /> Als PDF exportieren
              </button>
              <button
                onClick={() => setAuditResult(null)}
                className="flex items-center justify-center gap-2 flex-1 py-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-xs font-medium transition-colors"
              >
                Neues Audit starten
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
