import React from 'react';
import Image from 'next/image';
import { useAdminToast, AdminToast } from '@/shared/components/AdminToast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Plus, Trash2, RefreshCw, ShoppingBag, AlertTriangle, Edit, X } from 'lucide-react';
import ImageUpload from '@/shared/components/ImageUpload';
import { motion, AnimatePresence } from 'motion/react';
import Pagination from '@/shared/components/ui/Pagination';

const PAGE_SIZE = 10;

/* ── Modal de confirmation suppression ───────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center z-10">
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

const EMPTY_FORM = { name: '', description: '', price: '', category: '', image: '', stock: '0', discount: '0' };

export default function ProductsTab() {
  const queryClient = useQueryClient();
  const { toast, showToast, dismiss } = useAdminToast();
  const [page, setPage]                 = React.useState(1);
  const [showForm, setShowForm]         = React.useState(false);
  const [saving, setSaving]             = React.useState(false);
  const [saveError, setSaveError]       = React.useState<string | null>(null);
  const [editingProduct, setEditing]    = React.useState<any>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [form, setForm]                 = React.useState(EMPTY_FORM);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: products = [], isLoading: loading, isFetching } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) { logError('ProductsTab/fetch', error); return []; }
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
    setSaveError(null);
  };

  const startEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name ?? '',
      description: p.description ?? '',
      price: p.price?.toString() ?? '',
      category: p.category ?? '',
      image: p.image ?? '',
      stock: p.stock?.toString() ?? '0',
      discount: p.discount?.toString() ?? '0',
    });
    setSaveError(null);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.price) {
      setSaveError('Le nom et le prix sont obligatoires.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const discountVal = Math.min(100, Math.max(0, Number(form.discount) || 0));
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        image: form.image,
        stock: Number(form.stock),
        discount: discountVal,
        is_promo: discountVal > 0,
      };
      const { error } = editingProduct
        ? await supabase.from('products').update(payload).eq('id', editingProduct.id)
        : await supabase.from('products').insert([{ ...payload, popularity: 0, rating: 0, reviews_count: 0 }]);
      if (error) { logError('ProductsTab/save', error); setSaveError(error.message); showToast(error.message, 'error'); }
      else { resetForm(); invalidate(); showToast(editingProduct ? 'Produit modifié avec succès' : 'Produit ajouté avec succès'); }
    } catch (err: any) {
      setSaveError(err?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await supabase.from('products').delete().eq('id', deleteTarget.id);
      setDeleteTarget(null);
      invalidate();
      showToast('Produit supprimé');
    } catch (err) {
      logError('ProductsTab/delete', err);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" />
    </div>
  );

  return (
    <>
    <AdminToast toast={toast} onDismiss={dismiss} />
    <div className="space-y-4">
      {/* Modal suppression */}
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmModal
            message={`Voulez-vous vraiment supprimer "${deleteTarget.name}" ? Cette action est irréversible.`}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal ajout / édition */}
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
                  {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* ✅ Message d'erreur */}
                {saveError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
                    {saveError}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {[['name', 'Nom *'], ['category', 'Catégorie'], ['price', 'Prix (FCFA) *'], ['stock', 'Stock']].map(([k, label]) => (
                    <div key={k}>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{label}</label>
                      <input value={(form as any)[k]} onChange={set(k)} type={k === 'price' || k === 'stock' ? 'number' : 'text'}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Description</label>
                    <textarea value={form.description} onChange={set('description')} rows={2}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
                  </div>

                  {/* ── Promotion (optionnelle) ── */}
                  <div className="sm:col-span-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700 p-4 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Promotion (optionnelle)</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Réduction (%)</label>
                        <input value={form.discount} onChange={set('discount')} type="number" min="0" max="100" placeholder="0"
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      {Number(form.discount) > 0 && Number(form.price) > 0 && (
                        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-3 border border-amber-200">
                          <p className="text-[10px] text-slate-400 mb-1">Aperçu prix</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-[#C1272D]">
                              {Math.round(Number(form.price) * (1 - Number(form.discount) / 100)).toLocaleString()} FCFA
                            </span>
                            <span className="text-xs text-slate-400 line-through">{Number(form.price).toLocaleString()}</span>
                            <span className="text-[10px] font-black bg-[#C1272D] text-white px-1.5 py-0.5 rounded-full">-{form.discount}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {Number(form.discount) === 0 && (
                      <p className="text-xs text-slate-400">Laissez à 0 pour ne pas afficher de promotion.</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Image</label>
                    <ImageUpload value={form.image} onChange={url => setForm(f => ({ ...f, image: url }))} folder="gcfi/products" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={save} disabled={saving}
                    className="bg-[#C1272D] text-white px-6 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button onClick={resetForm}
                    className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Produits
          {products.length > 0 && <span className="ml-2 text-sm font-normal text-slate-400">({products.length})</span>}
        </h3>
        <div className="flex gap-2">
          <button onClick={invalidate} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#C1272D] text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {/* Liste */}
      {products.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun produit.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4">
                {p.image && <Image src={p.image} alt={p.name} width={56} height={56} className="rounded-xl object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#C1272D] font-bold">{p.price?.toLocaleString()} FCFA</span>
                    {p.category && <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">{p.category}</span>}
                    <span className="text-xs text-slate-400">Stock : {p.stock ?? 0}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(p)}
                    className="p-2 text-slate-400 hover:text-[#C1272D] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={Math.ceil(products.length / PAGE_SIZE)}
            totalItems={products.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
    </>
  );
}