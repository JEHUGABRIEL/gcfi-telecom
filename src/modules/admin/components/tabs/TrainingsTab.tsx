import React from 'react';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Plus, Trash2, RefreshCw, GraduationCap } from 'lucide-react';
import ImageUpload from '@/shared/components/ImageUpload';

export default function TrainingsTab() {
  const [trainings, setTrainings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', description: '', price: '', category: '', duration: '', image: '', tags: '' });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('trainings').select('*').order('created_at', { ascending: false });
    if (error) logError('TrainingsTab', error);
    else setTrainings(data || []);
    setLoading(false);
  };

  React.useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!form.title || !form.price) return;
    setSaving(true);
    const { error } = await supabase.from('trainings').insert([{
      title: form.title, description: form.description,
      price: Number(form.price), category: form.category,
      duration: form.duration, image: form.image,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
    }]);
    if (error) logError('TrainingsTab/save', error);
    else { setShowForm(false); setForm({ title: '', description: '', price: '', category: '', duration: '', image: '', tags: '' }); fetch(); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette formation ?')) return;
    await supabase.from('trainings').delete().eq('id', id);
    setTrainings(t => t.filter(x => x.id !== id));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Formations ({trainings.length})</h3>
        <div className="flex gap-2">
          <button onClick={fetch} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 bg-[#C1272D] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#1E4D8C] transition-all">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[['title','Titre *'], ['category','Catégorie'], ['price','Prix (FCFA) *'], ['duration','Durée (ex: 3 semaines)']].map(([k, label]) => (
              <div key={k}>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{label}</label>
                <input value={(form as any)[k]} onChange={set(k)} type={k === 'price' ? 'number' : 'text'}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={2}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Tags (séparés par virgule)</label>
              <input value={form.tags} onChange={set('tags')} placeholder="Réseaux, Cisco, CCNA"
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Image</label>
              <ImageUpload value={form.image} onChange={url => setForm(f => ({ ...f, image: url }))} folder="gcfi/trainings" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="bg-[#C1272D] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#1E4D8C] transition-all disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">Annuler</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {trainings.length === 0 ? (
          <div className="text-center py-12 text-slate-400"><GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune formation.</p></div>
        ) : trainings.map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4">
            {t.image && <img src={t.image} alt={t.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white">{t.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-[#C1272D] font-bold">{t.price?.toLocaleString()} FCFA</span>
                {t.duration && <span className="text-xs text-slate-400">{t.duration}</span>}
                {t.category && <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">{t.category}</span>}
              </div>
            </div>
            <button onClick={() => remove(t.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
