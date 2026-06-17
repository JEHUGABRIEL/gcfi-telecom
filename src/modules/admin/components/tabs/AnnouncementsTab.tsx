import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Plus, Trash2, RefreshCw, Megaphone, AlertTriangle, Edit, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAdminToast, AdminToast } from '@/shared/components/AdminToast';
import { useActivityLog } from '@/shared/hooks/useActivityLog';
import { useLang } from '@/shared/context/LanguageContext';

const BG_OPTIONS = [
  { value: 'red',    preview: 'bg-[#C1272D]' },
  { value: 'blue',   preview: 'bg-blue-600' },
  { value: 'green',  preview: 'bg-emerald-600' },
  { value: 'purple', preview: 'bg-violet-600' },
  { value: 'amber',  preview: 'bg-amber-500' },
  { value: 'slate',  preview: 'bg-slate-800' },
];

const EMPTY = { message: '', link_label: '', link_url: '', bg_color: 'red', is_active: true };

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useLang();
  const ap = t.admin_page;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div onClick={onCancel} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center z-10">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{ap.confirm_delete_title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{ap.confirm_delete_cancel}</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">{ap.confirm_delete_confirm}</button>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsTab() {
  const { t } = useLang();
  const ap = t.admin_page;
  const queryClient = useQueryClient();
  const { toast, showToast, dismiss } = useAdminToast();
  const { logActivity } = useActivityLog();
  const [showForm, setShowForm]         = React.useState(false);
  const [saving, setSaving]             = React.useState(false);
  const [editing, setEditing]           = React.useState<any>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; message: string } | null>(null);
  const [form, setForm]                 = React.useState(EMPTY);
  const [saveError, setSaveError]       = React.useState<string | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: items = [], isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (error) { logError('AnnouncementsTab/fetch', error); return []; }
      return data || [];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });

  const resetForm = () => { setForm(EMPTY); setEditing(null); setShowForm(false); setSaveError(null); };

  const startEdit = (item: any) => {
    setEditing(item);      setForm({ message: item.message, link_label: item.link_label || '', link_url: item.link_url || '', bg_color: item.bg_color || 'red', is_active: item.is_active });
    setSaveError(null);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.message.trim()) { setSaveError(ap.ann_message_required); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const payload = { message: form.message.trim(), link_label: form.link_label.trim() || null, link_url: form.link_url.trim() || null, bg_color: form.bg_color, is_active: form.is_active };
      const { error } = editing
        ? await supabase.from('announcements').update(payload).eq('id', editing.id)
        : await supabase.from('announcements').insert([payload]);
      if (error) { logError('AnnouncementsTab/save', error); setSaveError(error.message); return; }
      logActivity({ action: editing ? 'updated' : 'created', entity: 'notifications', entity_id: editing?.id, label: editing ? `${ap.ann_updated}: ${form.message.slice(0, 40)}` : `${ap.ann_create}: ${form.message.slice(0, 40)}` });
      resetForm(); invalidate();
      showToast(editing ? ap.ann_updated : ap.ann_create);
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('announcements').delete().eq('id', deleteTarget.id);
    logActivity({ action: 'deleted', entity: 'notifications', entity_id: deleteTarget.id, label: `${ap.ann_deleted}: ${deleteTarget.message.slice(0, 40)}` });
    setDeleteTarget(null); invalidate(); showToast(ap.ann_deleted);
  };

  const toggleActive = async (item: any) => {
    await supabase.from('announcements').update({ is_active: !item.is_active }).eq('id', item.id);
    invalidate(); showToast(item.is_active ? ap.ann_deactivated : ap.ann_activated);
  };

  const BG_MAP: Record<string, string> = { red: 'bg-[#C1272D]', blue: 'bg-blue-600', green: 'bg-emerald-600', purple: 'bg-violet-600', amber: 'bg-amber-500', slate: 'bg-slate-800' };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>;

  return (
    <>
      <AdminToast toast={toast} onDismiss={dismiss} />
      <div className="space-y-4">

        <AnimatePresence>
          {deleteTarget && <ConfirmModal message={`${ap.confirm_delete_message}`} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
        </AnimatePresence>

        {/* Modal formulaire */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editing ? ap.ann_edit : ap.ann_new}</h3>
                  <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  {saveError && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-3 text-sm text-red-600">{saveError}</div>}

                  {/* Message */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.ann_message_label} *</label>
                    <textarea value={form.message} onChange={set('message')} rows={2}
                      placeholder='ex: 🔥 Nouvel arrivage de routeurs Mikrotik — Stocks limités !'
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D] resize-none" />
                  </div>

                  {/* Lien optionnel */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.ann_link_label}</label>
                      <input value={form.link_label} onChange={set('link_label')} placeholder={ap.ann_link_placeholder}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.ann_url_label}</label>
                      <input value={form.link_url} onChange={set('link_url')} placeholder={ap.ann_url_placeholder}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
                    </div>
                  </div>

                  {/* Couleur */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">{ap.ann_color_label}</label>
                    <div className="flex gap-2 flex-wrap">
                      {BG_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => setForm(f => ({ ...f, bg_color: opt.value }))}
                          className={`${opt.preview} w-8 h-8 rounded-full transition-all ${form.bg_color === opt.value ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                          title={(ap as any)['announce_bg_' + opt.value] || opt.value} />
                      ))}
                    </div>
                  </div>

                  {/* Statut */}
                  <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${form.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400' : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {form.is_active ? ap.ann_status_visible : ap.ann_status_hidden}
                  </button>

                  {/* Aperçu */}
                  {form.message && (
                    <div className={`${BG_MAP[form.bg_color] ?? 'bg-[#C1272D]'} rounded-xl px-4 py-2.5 text-white text-sm font-bold flex items-center gap-2`}>
                      <Megaphone className="w-4 h-4 shrink-0" />
                      <span className="truncate">{form.message}</span>
                      {form.link_label && <span className="underline shrink-0">{form.link_label}</span>}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button onClick={save} disabled={saving}
                      className="bg-[#C1272D] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
                      {saving ? ap.btn_saving : editing ? ap.btn_edit : ap.btn_publish}
                    </button>
                    <button onClick={resetForm} className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
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
              {ap.ann_title}
              {items.length > 0 && <span className="ml-2 text-sm font-normal text-slate-400">({items.length})</span>}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{ap.ann_subtitle}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={invalidate} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors"><RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /></button>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 bg-[#C1272D] text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
              <Plus className="w-4 h-4" /> {ap.ann_new}
            </button>
          </div>
        </div>

        {/* Liste */}
        {items.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">{ap.ann_empty}</p>
            <p className="text-xs mt-1">{ap.ann_empty_hint}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item: any) => {
              const bgPreview = BG_MAP[item.bg_color] ?? 'bg-[#C1272D]';
              return (
                <motion.div key={item.id} layout
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  {/* Preview bandeau */}
                  <div className={`${bgPreview} px-4 py-2 flex items-center gap-2`}>
                    <Megaphone className="w-3.5 h-3.5 text-white/80 shrink-0" />
                    <p className="text-white text-xs font-bold truncate flex-1">{item.message}</p>
                    {item.link_label && <span className="text-white/80 text-xs underline shrink-0">{item.link_label}</span>}
                  </div>
                  {/* Controls */}
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${item.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                        {item.is_active ? ap.ann_status_visible_short : ap.ann_status_hidden_short}
                      </span>
                      {item.link_url && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{item.link_url}</span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleActive(item)} title={item.is_active ? ap.ann_status_hidden_short : ap.ann_status_visible_short}
                        className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors">
                        <span className="text-xs font-bold">{item.is_active ? '⏸' : '▶'}</span>
                      </button>
                      <button onClick={() => startEdit(item)}
                        className="p-2 text-slate-400 hover:text-[#C1272D] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget({ id: item.id, message: item.message })}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}