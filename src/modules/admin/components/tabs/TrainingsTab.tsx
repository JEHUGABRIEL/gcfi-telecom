import React from 'react';
import Image from 'next/image';
import { useAdminToast, AdminToast } from '@/shared/components/AdminToast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Plus, Trash2, RefreshCw, GraduationCap, Edit, X, AlertTriangle } from 'lucide-react';
import ImageUpload from '@/shared/components/ImageUpload';
import { motion, AnimatePresence } from 'motion/react';
import Pagination from '@/shared/components/ui/Pagination';
import AdminTable from '@/shared/components/ui/AdminTable';
import { useActivityLog } from '@/shared/hooks/useActivityLog';
import { useLang } from '@/shared/context/LanguageContext';

const PAGE_SIZE = 10;

/* ── Modal de confirmation ───────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  const { t } = useLang();
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
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{t.admin_page.confirm_delete_title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors">
            {t.admin_page.confirm_delete_cancel}
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">
            {t.admin_page.confirm_delete_confirm}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  category: '',
  duration: '',
  image: '',
  tags: '',
  discount: '0',
};

export default function TrainingsTab() {
  const { t } = useLang();
  const ap = t.admin_page;
  const queryClient = useQueryClient();
  const { toast, showToast, dismiss } = useAdminToast();
  const { logActivity } = useActivityLog();
  const [page, setPage] = React.useState(1);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [editingTraining, setEditingTraining] = React.useState<any>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: trainings = [], isLoading: loading } = useQuery({
    queryKey: ['admin', 'trainings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trainings').select('*').is('deleted_at', null).order('created_at', { ascending: false });
      if (error) { logError('TrainingsTab/fetch', error); return []; }
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'trainings'] });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingTraining(null);
    setShowForm(false);
    setSaveError(null);
  };

  const startEdit = (training: any) => {
    setEditingTraining(training);
    setForm({
      title: training.title ?? '',
      description: training.description ?? '',
      price: training.price?.toString() ?? '',
      category: training.category ?? '',
      duration: training.duration ?? '',
      image: training.image ?? '',
      tags: (training.tags || []).join(', '),
      discount: training.discount?.toString() ?? '0',
    });
    setSaveError(null);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.price.trim()) {
      setSaveError(ap.title_price_required);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const discountVal = Math.min(100, Math.max(0, Number(form.discount) || 0));
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        category: form.category.trim() || null,
        duration: form.duration.trim() || null,
        image: form.image || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        discount: discountVal,
        is_promo: discountVal > 0,
      };
      const { error } = editingTraining
        ? await supabase.from('trainings').update(payload).eq('id', editingTraining.id)
        : await supabase.from('trainings').insert([payload]);
      if (error) { logError('TrainingsTab/save', error); setSaveError(error.message); showToast(error.message, 'error'); }
      else {
        logActivity({ action: editingTraining ? 'updated' : 'created', entity: 'trainings', entity_id: editingTraining?.id, label: editingTraining ? `${ap.training_updated}: ${form.title}` : `${ap.training_added}: ${form.title}` });
        resetForm(); invalidate(); showToast(editingTraining ? ap.training_updated : ap.training_added);
      }
    } catch (err: any) {
      setSaveError(err?.message || ap.save_error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await supabase.from('trainings').update({ deleted_at: new Date().toISOString() }).eq('id', deleteTarget.id);
      logActivity({ action: 'deleted', entity: 'trainings', entity_id: deleteTarget.id, label: `${ap.training_deleted}: ${deleteTarget.title}` });
      setDeleteTarget(null);
      invalidate();
      showToast(ap.training_deleted);
    } catch (err) {
      logError('TrainingsTab/delete', err);
      showToast(ap.delete_error, 'error');
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
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmModal
            message={`${ap.product_confirm_delete} "${deleteTarget.title}" ? ${ap.product_irreversible}`}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

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
                  {editingTraining ? ap.training_edit : ap.training_add}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {saveError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
                    {saveError}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {[['title', ap.training_title + ' *'], ['category', ap.product_category], ['price', ap.product_price + ' *'], ['duration', (t.formation?.duration || ap.sidebar_trainings)]].map(([k, label]) => (
                    <div key={k}>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{label}</label>
                      <input value={(form as any)[k]} onChange={set(k)} type={k === 'price' ? 'number' : 'text'}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.product_description}</label>
                    <textarea value={form.description} onChange={set('description')} rows={2}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.training_tags}</label>
                    <input value={form.tags} onChange={set('tags')} type="text" placeholder={ap.training_tags_placeholder}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
                  </div>

                  <div className="sm:col-span-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700 p-4 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">{ap.product_promo}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">{ap.product_discount}</label>
                        <input value={form.discount} onChange={set('discount')} type="number" min="0" max="100" placeholder="0"
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      {Number(form.discount) > 0 && Number(form.price) > 0 && (
                        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-3 border border-amber-200">
                          <p className="text-[10px] text-slate-400 mb-1">{ap.product_price_preview}</p>
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
                      <p className="text-xs text-slate-400">{ap.product_promo_hint}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">{ap.product_image}</label>
                    <ImageUpload value={form.image} onChange={url => setForm(f => ({ ...f, image: url }))} folder="gcfi/trainings" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={save} disabled={saving}
                    className="bg-[#C1272D] text-white px-6 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? ap.btn_saving : ap.btn_save}
                  </button>
                  <button onClick={resetForm}
                    className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">
                    {ap.btn_cancel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{ap.sidebar_trainings} ({trainings.length})</h3>
        <div className="flex gap-2">
          <button onClick={invalidate} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#C1272D] text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> {ap.btn_add}
          </button>
        </div>
      </div>

      {trainings.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{ap.training_empty}</p>
        </div>
      ) : (
        <>
          <AdminTable
            columns={[
              {
                header: ap.table_title,
                cell: (t) => (
                  <div className="flex items-center gap-3">
                    {t.image && <Image src={t.image} alt={t.title} width={44} height={44} className="rounded-lg object-cover shrink-0" />}
                    <p className="font-bold text-slate-900 dark:text-white truncate">{t.title}</p>
                  </div>
                ),
              },
              { header: ap.product_category, cell: (t) => t.category ? <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">{t.category}</span> : <span className="text-slate-300">—</span> },
              { header: ap.product_price, align: 'right' as const, cell: (t) => <span className="font-bold text-[#C1272D] whitespace-nowrap">{t.price?.toLocaleString()} FCFA</span> },
              { header: t.formation?.duration || ap.sidebar_trainings, cell: (t) => t.duration ? <span className="text-sm text-slate-600 dark:text-slate-300">{t.duration}</span> : <span className="text-slate-300">—</span> },
              {
                header: ap.table_actions,
                align: 'right' as const,
                cell: (t) => (
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => startEdit(t)}
                      className="p-2 text-slate-400 hover:text-[#C1272D] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget({ id: t.id, title: t.title })}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={trainings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
            getKey={(t) => t.id}
            minWidth="720px"
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(trainings.length / PAGE_SIZE)}
            totalItems={trainings.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
    </>
  );
}
