import React from 'react';
import { supabase } from '@/shared/lib/supabase';
import { Plus, Trash2, RefreshCw, BookOpen, Edit, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import ImageUpload from '@/shared/components/ImageUpload';
import { motion, AnimatePresence } from 'motion/react';

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center z-10">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirmer la suppression</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 hover:bg-slate-200 transition-colors">Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">Supprimer</button>
        </div>
      </motion.div>
    </div>
  );
}

const EMPTY = { title: '', excerpt: '', content: '', category: '', author: '', tags: '', image: '', read_time: '5', published: false };

export default function BlogTab() {
  const [posts, setPosts]           = React.useState<any[]>([]);
  const [loading, setLoading]       = React.useState(true);
  const [showForm, setShowForm]     = React.useState(false);
  const [saving, setSaving]         = React.useState(false);
  const [editing, setEditing]       = React.useState<any>(null);
  const [deleteTarget, setDelete]   = React.useState<{ id: string; title: string } | null>(null);
  const [form, setForm]             = React.useState(EMPTY);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  React.useEffect(() => { fetch(); }, []);

  const resetForm = () => { setForm(EMPTY); setEditing(null); setShowForm(false); };

  const startEdit = (p: any) => {
    setEditing(p);
    setForm({
      title: p.title ?? '', excerpt: p.excerpt ?? '', content: p.content ?? '',
      category: p.category ?? '', author: p.author ?? '',
      tags: (p.tags || []).join(', '), image: p.image ?? '',
      read_time: p.read_time?.toString() ?? '5', published: p.published ?? false,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(), excerpt: form.excerpt.trim(), content: form.content.trim(),
      category: form.category.trim(), author: form.author.trim() || 'GCFI Télécom',
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      image: form.image || null, read_time: Number(form.read_time) || 5,
      published: (form as any).published,
    };
    const { error } = editing
      ? await supabase.from('blog_posts').update(payload).eq('id', editing.id)
      : await supabase.from('blog_posts').insert([payload]);
    if (!error) { resetForm(); fetch(); }
    setSaving(false);
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('blog_posts').update({ published: !current }).eq('id', id);
    setPosts(p => p.map(x => x.id === id ? { ...x, published: !current } : x));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('blog_posts').delete().eq('id', deleteTarget.id);
    setPosts(p => p.filter(x => x.id !== deleteTarget.id));
    setDelete(null);
  };

  const inputCls = "w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]";

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {deleteTarget && <ConfirmModal message={`Supprimer "${deleteTarget.title}" ?`} onConfirm={confirmDelete} onCancel={() => setDelete(null)} />}
      </AnimatePresence>

      {/* Modal formulaire */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center z-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editing ? 'Modifier l\'article' : 'Nouvel article'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Titre *</label>
                    <input value={form.title} onChange={set('title')} placeholder="Titre de l'article" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Catégorie</label>
                    <input value={form.category} onChange={set('category')} placeholder="ex: Télécom, Cybersécurité" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Auteur</label>
                    <input value={form.author} onChange={set('author')} placeholder="GCFI Télécom" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Temps de lecture (min)</label>
                    <input value={form.read_time} onChange={set('read_time')} type="number" min="1" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Tags (virgule)</label>
                    <input value={form.tags} onChange={set('tags')} placeholder="ex: 5G, Réseau, RCA" className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Résumé</label>
                    <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} placeholder="Courte description (affichée dans la liste)" className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Contenu *</label>
                    <textarea value={form.content} onChange={set('content')} rows={10} placeholder="Contenu de l'article..." className={inputCls + ' resize-y'} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Image de couverture</label>
                    <ImageUpload value={form.image} onChange={url => setForm(f => ({ ...f, image: url }))} folder="gcfi/blog" />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-3">
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, published: !(f as any).published }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${(form as any).published ? 'bg-green-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${(form as any).published ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {(form as any).published ? 'Publié (visible sur le site)' : 'Brouillon (non visible)'}
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={save} disabled={saving} className="bg-[#C1272D] text-white px-6 py-2 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button onClick={resetForm} className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">Annuler</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header liste */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Articles de blog ({posts.length})</h3>
        <div className="flex gap-2">
          <button onClick={fetch} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#C1272D] text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90">
            <Plus className="w-4 h-4" /> Nouvel article
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun article. Créez votre premier post !</p>
          </div>
        ) : posts.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4">
            {p.image && <img src={p.image} alt={p.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
            {!p.image && <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0"><BookOpen className="w-6 h-6 text-slate-400" /></div>}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                <span className={`shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${p.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.published ? 'Publié' : 'Brouillon'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                {p.category && <span className="text-xs text-[#C1272D] font-bold">{p.category}</span>}
                <span className="text-xs text-slate-400">{p.author}</span>
                <span className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => togglePublish(p.id, p.published)}
                className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg transition-colors"
                title={p.published ? 'Dépublier' : 'Publier'}>
                {p.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => startEdit(p)} className="p-2 text-slate-400 hover:text-[#C1272D] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => setDelete({ id: p.id, title: p.title })} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}