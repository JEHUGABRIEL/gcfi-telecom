import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ImageUpload from '@/shared/components/ImageUpload';
import ConfirmModal from '@/shared/components/ConfirmModal';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Plus, Trash2, Check, X, Star, RefreshCw, Globe } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Testimonial, Achievement, Partner, NewsItem } from '@/shared/types';

// ── Onglet générique pour Témoignages, Réalisations, Partenaires, Actualités ──

type ContentType = 'testimonials' | 'achievements' | 'partners' | 'news';

interface ContentTabProps { type: ContentType; }

const CONFIG = {
  testimonials: {
    label: 'Témoignages', table: 'testimonials',
    fields: ['name', 'role', 'content', 'avatar_url', 'rating'],
    labels: { name: 'Nom', role: 'Poste / Rôle', content: 'Témoignage', avatar_url: 'URL photo', rating: 'Note (1-5)' },
    defaultItem: { name: '', role: '', content: '', avatar_url: '', rating: 5, status: 'pending' },
  },
  achievements: {
    label: 'Réalisations', table: 'achievements',
    fields: ['title', 'description', 'year', 'image'],
    labels: { title: 'Titre', description: 'Description', year: 'Année', image: 'URL image' },
    defaultItem: { title: '', description: '', year: new Date().getFullYear().toString(), image: '' },
  },
  partners: {
    label: 'Partenaires', table: 'partners',
    fields: ['name', 'logo', 'website'],
    labels: { name: 'Nom', logo: 'URL logo', website: 'Site web' },
    defaultItem: { name: '', logo: '', website: '' },
  },
  news: {
    label: 'Actualités', table: 'news',
    fields: ['title', 'excerpt', 'category', 'image', 'source', 'url'],
    labels: { title: 'Titre', excerpt: 'Résumé', category: 'Catégorie', image: 'URL image', source: 'Source', url: 'Lien article' },
    defaultItem: { title: '', excerpt: '', category: 'telecom', image: '', source: '', url: '#', published_at: new Date().toISOString() },
  },
};

export default function ContentTab({ type }: ContentTabProps) {
  const cfg = CONFIG[type];
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState<any>({ ...cfg.defaultItem });
  const [saving, setSaving] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  const queryKey = ['admin', 'content', type];

  const { data: items = [], isLoading: loading, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase.from(cfg.table).select('*').order('created_at', { ascending: false });
      if (error) { logError(`ContentTab/${type}`, error); return []; }
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from(cfg.table).insert([form]);
    if (error) logError(`ContentTab/${type}/insert`, error);
    else { setShowForm(false); setForm({ ...cfg.defaultItem }); invalidate(); }
    setSaving(false);
  };

  const remove = async () => {
    if (!pendingDeleteId) return;
    await supabase.from(cfg.table).delete().eq('id', pendingDeleteId);
    setPendingDeleteId(null);
    invalidate();
  };

  const approveTestimonial = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('testimonials').update({ status }).eq('id', id);
    invalidate();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>;

  return (
    <>
      <ConfirmModal
        open={!!pendingDeleteId}
        message={`Cette action est irréversible. Voulez-vous vraiment supprimer cet élément de "${cfg.label}" ?`}
        onConfirm={remove}
        onCancel={() => setPendingDeleteId(null)}
      />
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cfg.label} ({items.length})</h3>
        <div className="flex gap-2">
          <button onClick={invalidate} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors"><RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} /></button>
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 bg-[#C1272D] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#1E4D8C] transition-all">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {cfg.fields.map(field => (
              <div key={field} className={field === 'content' || field === 'excerpt' || field === 'description' ? 'sm:col-span-2' : ''}>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{cfg.labels[field as keyof typeof cfg.labels]}</label>
                {field === 'content' || field === 'excerpt' || field === 'description' ? (
                  <textarea rows={3} value={form[field] || ''} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
                ) : field === 'image' || field === 'logo' || field === 'avatar_url' ? (
                  <ImageUpload
                    value={form[field] || ''}
                    onChange={url => setForm((f: any) => ({ ...f, [field]: url }))}
                    folder={`gcfi/${cfg.table}`}
                  />
                ) : field === 'category' ? (
                  <select value={form[field] || 'telecom'} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]">
                    <option value="telecom">Télécom</option>
                    <option value="it">IT</option>
                  </select>
                ) : field === 'rating' ? (
                  // ✅ Sélecteur étoiles — bloqué à 5 max
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button"
                        onClick={() => setForm((f: any) => ({ ...f, rating: star }))}
                        className="transition-transform hover:scale-110">
                        <Star className={`w-7 h-7 transition-colors ${
                          star <= (form['rating'] || 0)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`} />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-bold text-slate-500">{form['rating'] || 0}/5</span>
                  </div>
                ) : (
                  <input type="text"
                    value={form[field] || ''} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="bg-[#C1272D] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#1E4D8C] transition-all disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-[#C1272D] transition-all">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>Aucun élément. Cliquez sur "Ajouter" ou exécutez le SQL de seed.</p>
          </div>
        ) : items.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{item.title || item.name || item.full_name}</p>
                {item.year && <span className="text-[10px] font-bold text-[#C1272D] bg-red-50 dark:bg-red-900/10 px-2 py-0.5 rounded-full">{item.year}</span>}
                {item.category && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{item.category}</span>}
                {item.status && (
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                    item.status === 'approved' ? 'bg-green-100 text-green-700' : item.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                    {item.status}
                  </span>
                )}
                {item.rating && <span className="flex items-center gap-0.5 text-yellow-400"><Star className="w-3 h-3 fill-current" /><span className="text-xs text-slate-600 dark:text-slate-400">{item.rating}/5</span></span>}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.role || item.excerpt || item.content || item.logo || item.description || ''}</p>
              {item.website && <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C1272D] flex items-center gap-1 mt-1"><Globe className="w-3 h-3" />{item.website}</a>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Modération témoignages */}
              {type === 'testimonials' && item.status === 'pending' && (
                <>
                  <button onClick={() => approveTestimonial(item.id, 'approved')} title="Approuver" className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"><Check className="w-4 h-4" /></button>
                  <button onClick={() => approveTestimonial(item.id, 'rejected')} title="Rejeter" className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><X className="w-4 h-4" /></button>
                </>
              )}
              <button onClick={() => setPendingDeleteId(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
