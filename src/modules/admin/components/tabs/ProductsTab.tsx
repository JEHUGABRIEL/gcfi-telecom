import React from 'react';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Plus, Trash2, RefreshCw, ShoppingBag, AlertTriangle, X } from 'lucide-react';
import ImageUpload from '@/shared/components/ImageUpload';
import { motion, AnimatePresence } from 'motion/react';

/* ── Modal de confirmation générique ─────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirmer la suppression</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">
            Supprimer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProductsTab() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = React.useState({ name: '', description: '', price: '', category: '', image: '', stock: '0' });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) logError('ProductsTab', error);
    else setProducts(data || []);
    setLoading(false);
  };

  React.useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    const { error } = await supabase.from('products').insert([{
      name: form.name, description: form.description,
      price: Number(form.price), category: form.category,
      image: form.image, stock: Number(form.stock),
      popularity: 0, rating: 0, reviews_count: 0,
    }]);
    if (error) logError('ProductsTab/save', error);
    else {
      setShowForm(false);
      setForm({ name: '', description: '', price: '', category: '', image: '', stock: '0' });
      fetch();
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('products').delete().eq('id', deleteTarget.id);
    setProducts(p => p.filter(x => x.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Modal de confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmModal
            message={`Voulez-vous vraiment supprimer "${deleteTarget.name}" ? Cette action est irréversible.`}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Produits ({products.length})</h3>
        <div className="flex gap-2">
          <button onClick={fetch} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-[#C1272D] text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[['name', 'Nom *'], ['category', 'Catégorie'], ['price', 'Prix (FCFA) *'], ['stock', 'Stock']].map(([k, label]) => (
              <div key={k}>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{label}</label>
                <input value={(form as any)[k]} onChange={set(k)} type={k === 'price' || k === 'stock' ? 'number' : 'text'}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={2}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Image</label>
              <ImageUpload value={form.image} onChange={url => setForm(f => ({ ...f, image: url }))} folder="gcfi/products" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving}
              className="bg-[#C1272D] text-white px-6 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun produit.</p>
          </div>
        ) : products.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4">
            {p.image && <img src={p.image} alt={p.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-[#C1272D] font-bold">{p.price?.toLocaleString()} FCFA</span>
                {p.category && <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">{p.category}</span>}
                <span className="text-xs text-slate-400">Stock: {p.stock ?? 0}</span>
              </div>
            </div>
            <button onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}