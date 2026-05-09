import React from 'react';
import { ShoppingBag, Users } from 'lucide-react';

interface OverviewTabProps {
  onNavigate: (tab: string) => void;
}

export default function OverviewTab({ onNavigate }: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Activités Récentes</h3>
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={`activity-${i}`} className="flex items-start gap-4 pb-6 border-b border-slate-50 dark:border-slate-700 last:border-0 last:pb-0">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                {i === 1 ? <ShoppingBag className="w-5 h-5 text-emerald-500" /> : <Users className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {i === 1 ? "Nouvelle commande Supabase détectée" : "Nouvel utilisateur Supabase inscrit"}
                </p>
                <p className="text-xs text-slate-500 italic">Il y a {i * 15} minutes</p>
              </div>
              <button
                onClick={() => onNavigate(i === 1 ? 'orders' : 'users')}
                className="text-xs font-black uppercase tracking-widest text-[#2563B0] hover:underline"
              >
                Voir
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
