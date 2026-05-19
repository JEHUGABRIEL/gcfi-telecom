import React from 'react';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Plus, Trash2, RefreshCw, GraduationCap, Edit, X } from 'lucide-react';
import ImageUpload from '@/shared/components/ImageUpload';
import { motion, AnimatePresence } from 'motion/react';

interface Training {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: string;
  image: string;
  tags: string[];
}

export default function TrainingsTab() {
  const [trainings, setTrainings] = React.useState<Training[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingTraining, setEditingTraining] = React.useState<Training | null>(null);
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    price: '',
    category: '',
    duration: '',
    image: '',
    tags: '',
  });

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

  const resetForm = () => {
    setForm({ title: '', description: '', price: '', category: '', duration: '', image: '', tags: '' });
    setEditingTraining(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.title || !form.price) return;
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      duration: form.duration,
      image: form.image,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
    };
    const { error } = editingTraining
      ? await supabase.from('trainings').update(payload).eq('id', editingTraining.id)
      : await supabase.from('trainings').insert([payload]);
    if (error) logError('TrainingsTab/save', error);
    else { resetForm(); fetch(); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette formation ?')) return;
    await supabase.from('trainings').delete().eq('id', id);
    setTrainings(t => t.filter(x => x.id !== id));
  };

  const startEdit = (training: Training) => {
    setEditingTraining(training);
    setForm({
      title: training.title,
      description: training.description || '',
      price: training.price.toString(),
      category: training.category || '',
      duration: training.duration || '',
      image: training.image || '',
      tags: (training.tags || []).join(', '),
    });
    setShowForm(true);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Formations ({trainings.length})</h3>
        <div className="flex gap-2">
          <button onClick={fetch} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-[#C1272D] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#1E4D8C] transition-all">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

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
            <div className="flex gap-2">
              <button onClick={() => startEdit(t)} className="p-2 text-slate-400 hover:text-[#C1272D] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => remove(t.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'ajout / modification */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingTraining ? 'Modifier la formation' : 'Ajouter une formation'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
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
                <div className="flex gap-3 pt-4">
                  <button onClick={save} disabled={saving} className="bg-[#C1272D] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#1E4D8C] transition-all disabled:opacity-50">
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button onClick={resetForm} className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">Annuler</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}