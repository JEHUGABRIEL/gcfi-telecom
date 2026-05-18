import React from 'react';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { motion } from 'motion/react';
import { FileText, Mail, Phone, Building2, Clock, CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Quote } from '@/shared/types';

const STATUS_CONFIG = {
  nouveau:   { label: 'Nouveau',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',   icon: Clock },
  en_cours:  { label: 'En cours',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', icon: RefreshCw },
  traité:    { label: 'Traité',    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
  annulé:    { label: 'Annulé',   color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',         icon: XCircle },
};

export default function QuotesTab() {
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Quote | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    if (error) logError('QuotesTab', error);
    else setQuotes((data || []) as Quote[]);
    setLoading(false);
  };

  React.useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: Quote['status']) => {
    await supabase.from('quotes').update({ status }).eq('id', id);
    setQuotes(q => q.map(x => x.id === id ? { ...x, status } : x));
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Demandes de devis ({quotes.length})</h3>
        <button onClick={fetch} className="text-xs text-slate-500 hover:text-[#C1272D] flex items-center gap-1 transition-colors"><RefreshCw className="w-3 h-3" /> Actualiser</button>
      </div>
      {quotes.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune demande de devis pour l'instant.</p></div>
      ) : (
        <div className="grid gap-3">
          {quotes.map(q => {
            const cfg = STATUS_CONFIG[q.status];
            const Icon = cfg.icon;
            return (
              <motion.div key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 cursor-pointer hover:border-[#C1272D]/30 transition-all"
                onClick={() => setSelected(selected?.id === q.id ? null : q)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <p className="font-bold text-slate-900 dark:text-white">{q.full_name}</p>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1', cfg.color)}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                      <span className="text-xs font-bold text-[#C1272D] bg-red-50 dark:bg-red-900/10 px-2.5 py-0.5 rounded-full">{q.service_type}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{q.email}</span>
                      {q.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{q.phone}</span>}
                      {q.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{q.company}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                    {new Date(q.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {selected?.id === q.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 italic">"{q.message}"</p>
                    {q.budget && <p className="text-xs text-slate-500 dark:text-slate-400 mb-4"><strong>Budget :</strong> {q.budget}</p>}
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(STATUS_CONFIG) as Quote['status'][]).map(s => (
                        <button key={s} onClick={e => { e.stopPropagation(); updateStatus(q.id, s); }}
                          className={cn('px-3 py-1.5 rounded-xl text-xs font-bold transition-all border', q.status === s ? STATUS_CONFIG[s].color + ' border-transparent' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#C1272D] hover:text-[#C1272D]')}>
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                      <a href={`mailto:${q.email}?subject=Votre demande de devis GCFI - ${q.service_type}`} onClick={e => e.stopPropagation()}
                        className="px-3 py-1.5 bg-[#C1272D] text-white rounded-xl text-xs font-bold hover:bg-[#1E4D8C] transition-all ml-auto flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Répondre
                      </a>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
