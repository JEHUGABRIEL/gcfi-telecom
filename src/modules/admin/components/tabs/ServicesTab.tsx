import React from 'react';
import { useAdminToast, AdminToast } from '@/shared/components/AdminToast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Plus, Trash2, RefreshCw, Wrench, AlertTriangle, Edit, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Pagination from '@/shared/components/ui/Pagination';
import { useActivityLog } from '@/shared/hooks/useActivityLog';
import { useLang } from '@/shared/context/LanguageContext';

const PAGE_SIZE = 10;

const ICON_OPTIONS = [
  'Network', 'Wifi', 'Zap', 'Video', 'ShieldCheck', 'Globe', 'Radio',
  'HardDrive', 'Truck', 'Lock', 'Construction', 'KeySquare',
  'LineChart', 'Megaphone', 'Palette', 'Tv', 'Film', 'Server',
  'Cpu', 'Database', 'Phone', 'Monitor', 'Satellite',
];



/* ── Modal de confirmation suppression ───────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel, title, cancelText, confirmText }: {
  message: string; onConfirm: () => void; onCancel: () => void;
  title: string; cancelText: string; confirmText: string;
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
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors">
            {cancelText}
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const EMPTY_FORM = {
  title: '',
  description: '',
  icon: 'Network',
  color: 'blue',
  order_index: '0',
  is_active: true,
};

export default function ServicesTab() {
  const { t } = useLang();
  const ap = t.admin_page;
  const queryClient = useQueryClient();
  const { toast, showToast, dismiss } = useAdminToast();
  const { logActivity } = useActivityLog();
  const [page, setPage]                 = React.useState(1);
  const [showForm, setShowForm]         = React.useState(false);
  const [saving, setSaving]             = React.useState(false);
  const [saveError, setSaveError]       = React.useState<string | null>(null);
  const [editingService, setEditing]    = React.useState<any>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [form, setForm]                 = React.useState(EMPTY_FORM);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: services = [], isLoading: loading, isFetching } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) { logError('ServicesTab/fetch', error); return []; }
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
    setSaveError(null);
  };

  const startEdit = (s: any) => {
    setEditing(s);
    setForm({
      title: s.title ?? '',
      description: s.description ?? '',
      icon: s.icon ?? 'Network',
      color: s.color ?? 'blue',
      order_index: s.order_index?.toString() ?? '0',
      is_active: s.is_active !== false,
    });
    setSaveError(null);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title || !form.description) {
      setSaveError(ap.service_required_error);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        icon: form.icon,
        color: form.color,
        order_index: Number(form.order_index) || 0,
        is_active: form.is_active,
      };

      const { error } = editingService
        ? await supabase.from('services').update(payload).eq('id', editingService.id)
        : await supabase.from('services').insert([payload]);

      if (error) {
        logError('ServicesTab/save', error);
        setSaveError(error.message);
        showToast(error.message, 'error');
      } else {
        const action = editingService ? 'updated' : 'created';
        const msg    = editingService ? `${ap.service_toast_updated}: ${form.title}` : `${ap.service_toast_created}: ${form.title}`;
        logActivity({ action, entity: 'services', entity_id: editingService?.id, label: msg });
        resetForm();
        invalidate();
        showToast(editingService ? ap.service_toast_updated : ap.service_toast_created);
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
      await supabase.from('services').delete().eq('id', deleteTarget.id);
      logActivity({ action: 'deleted', entity: 'services', entity_id: deleteTarget.id, label: `${ap.service_toast_deleted}: ${deleteTarget.title}` });
      setDeleteTarget(null);
      invalidate();
      showToast(ap.service_toast_deleted);
    } catch (err) {
      logError('ServicesTab/delete', err);
      showToast(ap.delete_error, 'error');
    }
  };

  const toggleActive = async (s: any) => {
    await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id);
    logActivity({ action: s.is_active ? 'deactivated' : 'activated', entity: 'services', entity_id: s.id, label: `${s.is_active ? ap.service_toast_deactivated : ap.service_toast_activated}: ${s.title}` });
    invalidate();
    showToast(s.is_active ? ap.service_toast_deactivated : ap.service_toast_activated);
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
            title={ap.confirm_delete_title}
            cancelText={ap.btn_cancel}
            confirmText={ap.confirm_delete_confirm}
            message={`${ap.confirm_delete_message} "${deleteTarget.title}" ?`}
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
                  {editingService ? ap.service_modal_edit : ap.service_modal_new}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {saveError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
                    {saveError}
                  </div>
                )}

                {/* Titre */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">
                    {ap.service_field_title}
                  </label>
                  <input
                    value={form.title}
                    onChange={set('title')}
                    placeholder={ap.service_field_title_placeholder}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">
                    {ap.service_field_desc}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={set('description')}
                    rows={3}
                    placeholder={ap.service_field_desc_placeholder}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D] resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Icône */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.service_field_icon}</label>
                    <select
                      value={form.icon}
                      onChange={set('icon')}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]"
                    >
                      {ICON_OPTIONS.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>

                  {/* Couleur */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.service_field_color}</label>
                    <select
                      value={form.color}
                      onChange={set('color')}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]"
                    >
                      {Object.entries({'blue': ap.service_color_blue, 'sky': ap.service_color_sky, 'emerald': ap.service_color_emerald, 'red': ap.service_color_red, 'violet': ap.service_color_violet, 'amber': ap.service_color_amber, 'rose': ap.service_color_rose, 'indigo': ap.service_color_indigo}).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ordre */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">
                      {ap.service_field_order}
                    </label>
                    <input
                      value={form.order_index}
                      onChange={set('order_index')}
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]"
                    />
                  </div>

                  {/* Statut */}
                  <div className="flex flex-col justify-end">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">
                      {ap.service_field_status}
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                        form.is_active
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {form.is_active ? ap.service_status_active : ap.service_status_inactive}
                    </button>
                  </div>
                </div>

                {/* Aperçu */}
                {(form.title || form.description) && (
                  <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ap.service_preview}</p>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-${form.color}-100 dark:bg-${form.color}-900/20 flex items-center justify-center shrink-0`}>
                        <Wrench className={`w-5 h-5 text-${form.color}-600`} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{form.title || ap.service_preview_title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {form.description || ap.service_preview_desc}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="bg-[#C1272D] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? ap.btn_saving : editingService ? ap.service_btn_edit : ap.service_btn_add}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {ap.btn_cancel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {ap.service_list_title}
            {services.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">({services.length})</span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {ap.service_list_subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={invalidate} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#C1272D] text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> {ap.service_btn_new}
          </button>
        </div>
      </div>

      {/* Liste des services */}
      {services.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{ap.service_empty}</p>
          <p className="text-sm mt-1">{ap.service_empty_hint}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {services.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((s: any) => (
              <motion.div
                key={s.id}
                layout
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4"
              >
                {/* Drag handle */}
                <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 cursor-grab" />

                {/* Icon badge */}
                <div className={`w-10 h-10 rounded-xl bg-${s.color || 'blue'}-100 dark:bg-${s.color || 'blue'}-900/20 flex items-center justify-center shrink-0`}>
                  <Wrench className={`w-5 h-5 text-${s.color || 'blue'}-600`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{s.title}</p>
                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      s.is_active !== false
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {s.is_active !== false ? ap.service_status_active : ap.service_status_inactive}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{s.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">{ap.service_icon_label} {s.icon}</span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[10px] text-slate-400">{ap.service_order_label} {s.order_index ?? 0}</span>
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(s)}
                    title={s.is_active !== false ? ap.service_tooltip_deactivate : ap.service_tooltip_activate}
                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
                  >
                    <span className="text-xs font-bold">{s.is_active !== false ? '⏸' : '▶'}</span>
                  </button>
                  <button
                    onClick={() => startEdit(s)}
                    className="p-2 text-slate-400 hover:text-[#C1272D] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: s.id, title: s.title })}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={Math.ceil(services.length / PAGE_SIZE)}
            totalItems={services.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
    </>
  );
}