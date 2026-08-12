import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldCheck, ExternalLink, Scale, CheckCircle2, Sparkles, History } from "lucide-react";

export interface LegalUpdate {
  id: string;
  title: string;
  description: string;
  aiSummary?: string;
  date: string;
  actionRequired: boolean;
  source: string;
}

interface LegalUpdatesModalProps {
  updates: LegalUpdate[];
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  acknowledgedIds: string[];
}

export function LegalUpdatesModal({ updates, onClose, onAcknowledge, acknowledgedIds }: LegalUpdatesModalProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  const newUpdates = updates.filter(u => !acknowledgedIds.includes(u.id));
  const historyUpdates = updates.filter(u => acknowledgedIds.includes(u.id));

  const displayUpdates = activeTab === 'new' ? newUpdates : historyUpdates;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 "
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md max-h-[85vh] bg-white dark:bg-stone-900 rounded-2xl shadow-md overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-800/50">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <Scale size={20} className="text-brand dark:text-brand-light" />
            <h2 className="font-semibold text-lg">Rechtliche Updates</h2>
          </div>
          <button 
            aria-label="Rechtliche Updates schließen"
            onClick={onClose}
            className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full transition-colors text-stone-500 dark:text-stone-400"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex px-4 pt-2 gap-4 border-b border-stone-200 dark:border-stone-800">
          <button 
            onClick={() => setActiveTab('new')}
            className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'new' ? 'text-brand dark:text-brand-light' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
          >
            Neu ({newUpdates.length})
            {activeTab === 'new' && (
              <motion.div layoutId="legalTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand dark:bg-brand-light rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-2 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${activeTab === 'history' ? 'text-brand dark:text-brand-light' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
          >
            <History size={14} /> Historie
            {activeTab === 'history' && (
              <motion.div layoutId="legalTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand dark:bg-brand-light rounded-t-full" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
            Wir scannen täglich aktuelle gesetzliche Änderungen (z.B. DSGVO) um sicherzustellen, dass deine Daten geschützt bleiben.
          </p>

          <AnimatePresence mode="popLayout">
            {displayUpdates.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 px-4"
              >
                <ShieldCheck size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-4" />
                <h3 className="text-stone-900 dark:text-stone-100 font-medium mb-1">
                  {activeTab === 'new' ? 'Alles auf dem neuesten Stand' : 'Noch keine Historie'}
                </h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  {activeTab === 'new' ? 'Der automatische Scan hat keine neuen relevanten Gesetzesänderungen gefunden.' : 'Du hast bisher keine neuen Bedingungen akzeptiert.'}
                </p>
              </motion.div>
            ) : (
              displayUpdates.map(update => {
                const isAcknowledged = acknowledgedIds.includes(update.id);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={update.id} 
                    className={`border rounded-xl p-4 transition-colors ${
                      update.actionRequired && !isAcknowledged
                        ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/50' 
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm pr-4 leading-tight">{update.title}</h3>
                      {update.actionRequired && !isAcknowledged && (
                        <span className="shrink-0 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full">
                          Aktion erforderlich
                        </span>
                      )}
                      {isAcknowledged && (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 leading-relaxed">
                      {update.description}
                    </p>
                    
                    {update.aiSummary && (
                      <div className="mb-3 bg-brand/5 dark:bg-brand-light/5 border border-brand/20 dark:border-brand-light/20 rounded-lg p-2.5 flex gap-2 items-start">
                        <Sparkles size={14} className="text-brand dark:text-brand-light shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[10px] font-semibold text-brand dark:text-brand-light uppercase tracking-wider mb-0.5">KI-Zusammenfassung</h4>
                          <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{update.aiSummary}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-stone-500">
                        <span>{update.date}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><ExternalLink size={10} /> {update.source}</span>
                      </div>
                      {update.actionRequired && !isAcknowledged && (
                        <button 
                          onClick={() => onAcknowledge(update.id)}
                          className="text-xs bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                          Zustimmen & Schließen
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
