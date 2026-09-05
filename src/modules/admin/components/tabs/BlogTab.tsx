import React from 'react';
import Image from 'next/image';
import { useAdminToast, AdminToast } from '@/shared/components/AdminToast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Plus, Trash2, RefreshCw, BookOpen, Edit, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import ImageUpload from '@/shared/components/ImageUpload';
import RichTextEditor from '@/shared/components/RichTextEditor';
import { sanitizeHtml } from '@/shared/lib/sanitize';
import { motion, AnimatePresence } from 'motion/react';
import Pagination from '@/shared/components/ui/Pagination';
import AdminTable from '@/shared/components/ui/AdminTable';
import { useActivityLog } from '@/shared/hooks/useActivityLog';
import { useLang } from '@/shared/context/LanguageContext';

const PAGE_SIZE = 10;

function ConfirmModal({ message, onConfirm, onCancel, title, cancelText, confirmText }: {
  message: string; onConfirm: () => void; onCancel: () => void;
  title: string; cancelText: string; confirmText: string;
}) {
  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center z-10">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 hover:bg-slate-200 transition-colors">{cancelText}</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">{confirmText}</button>
        </div>
      </motion.div>
    </div>
  );
}

const EMPTY = { title: '', excerpt: '', content: '', category: '', author: '', tags: '', image: '', read_time: '5', published: false, gallery: [] as string[] };

export default function BlogTab() {
  const { t } = useLang();
  const ap = t.admin_page;
  const queryClient = useQueryClient();
  const { toast, showToast, dismiss } = useAdminToast();
  const { logActivity } = useActivityLog();
  const [page, setPage]             = React.useState(1);
  const [showForm, setShowForm]     = React.useState(false);
  const [saving, setSaving]         = React.useState(false);
  const [saveError, setSaveError]   = React.useState<string | null>(null);
  const [editing, setEditing]       = React.useState<any>(null);
  const [deleteTarget, setDelete]   = React.useState<{ id: string; title: string } | null>(null);
  const [form, setForm]             = React.useState(EMPTY);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: posts = [], isLoading: loading } = useQuery({
    queryKey: ['admin', 'blog_posts'],
    queryFn: async () => {
      const { data } = await supabase.from('blog_posts').select('*').is('deleted_at', null).order('created_at', { ascending: false });
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'blog_posts'] });

  const resetForm = () => { setForm(EMPTY); setEditing(null); setShowForm(false); };

  const startEdit = (p: any) => {
    setEditing(p);
    setForm({
      title: p.title ?? '', excerpt: p.excerpt ?? '', content: p.content ?? '',
      category: p.category ?? '', author: p.author ?? '',
      tags: (p.tags || []).join(', '), image: p.image ?? '',
      read_time: p.read_time?.toString() ?? '5', published: p.published ?? false,
      gallery: p.gallery ?? [],
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title || !form.content) return;
    setSaveError(null);
    setSaving(true);
    const payload = {
      title: form.title.trim(), excerpt: form.excerpt.trim(), content: sanitizeHtml(form.content).trim(),
      category: form.category.trim(), author: form.author.trim() || ap.blog_field_author_placeholder,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      image: form.image || null, read_time: Number(form.read_time) || 5,
      gallery: (form as any).gallery || [],
      published: (form as any).published,
    };
    try {
      const { error } = editing
        ? await supabase.from('blog_posts').update(payload).eq('id', editing.id)
        : await supabase.from('blog_posts').insert([payload]);
      if (error) {
        setSaveError(`${ap.save_error}: ${error.message} (${error.code})`);
        showToast(error.message, 'error');
      } else {
        logActivity({ action: editing ? 'updated' : 'created', entity: 'blog', entity_id: editing?.id, label: editing ? `${ap.blog_toast_updated}: ${form.title}` : `${ap.blog_toast_created}: ${form.title}` });
        resetForm();
        invalidate();
        showToast(editing ? ap.blog_toast_updated : ap.blog_toast_created);
      }
    } catch (err: any) {        setSaveError(err.message || ap.save_error);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (id: string, current: boolean, title?: string) => {
    await supabase.from('blog_posts').update({ published: !current }).eq('id', id);
    logActivity({ action: current ? 'unpublished' : 'published', entity: 'blog', entity_id: id, label: current ? `${ap.blog_toast_unpublished}: ${title || id}` : `${ap.blog_toast_published}: ${title || id}` });
    invalidate();
    showToast(current ? ap.blog_toast_unpublished : ap.blog_toast_published);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('blog_posts').update({ deleted_at: new Date().toISOString() }).eq('id', deleteTarget.id);
    logActivity({ action: 'deleted', entity: 'blog', entity_id: deleteTarget.id, label: `${ap.blog_toast_deleted}: ${deleteTarget.title}` });
    setDelete(null);
    invalidate();
    showToast(ap.blog_toast_deleted);
  };

  const inputCls = "w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]";

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>;

  return (
    <>
    <AdminToast toast={toast} onDismiss={dismiss} />
    <div className="space-y-4">
      <AnimatePresence>
        {deleteTarget && <ConfirmModal
            title={ap.confirm_delete_title}
            cancelText={ap.btn_cancel}
            confirmText={ap.confirm_delete_confirm}
            message={`${ap.confirm_delete_message} \"${deleteTarget.title}\" ?`}
            onConfirm={confirmDelete}
            onCancel={() => setDelete(null)} />}
      </AnimatePresence>

      {/* Modal formulaire */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center z-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editing ? ap.blog_modal_edit : ap.blog_modal_new}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.blog_field_title}</label>
                    <input value={form.title} onChange={set('title')} placeholder={ap.blog_field_title_placeholder} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.blog_field_category}</label>
                    <input value={form.category} onChange={set('category')} placeholder={ap.blog_field_category_placeholder} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.blog_field_author}</label>
                    <input value={form.author} onChange={set('author')} placeholder={ap.blog_field_author_placeholder} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.blog_field_read_time}</label>
                    <input value={form.read_time} onChange={set('read_time')} type="number" min="1" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.blog_field_tags}</label>
                    <input value={form.tags} onChange={set('tags')} placeholder={ap.blog_field_tags_placeholder} className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{ap.blog_field_excerpt}</label>
                    <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} placeholder={ap.blog_field_excerpt_placeholder} className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">{ap.blog_field_content}</label>
                    <RichTextEditor
                      value={form.content}
                      onChange={html => setForm(f => ({ ...f, content: html }))}
                      placeholder={ap.blog_field_content_placeholder}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">{ap.blog_field_cover}</label>
                    <ImageUpload value={form.image} onChange={url => setForm(f => ({ ...f, image: url }))} folder="gcfi/blog" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">{ap.content_gallery}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 items-start">
                      {((form as any).gallery || []).map((src: string, i: number) => (
                        <div key={`${src}-${i}`} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                          <Image src={src} alt={`${ap.content_gallery} ${i + 1}`} fill className="object-cover" sizes="160px" />
                          <button
                            type="button"
                            onClick={() => setForm((f: any) => ({ ...f, gallery: (f.gallery || []).filter((_: string, idx: number) => idx !== i) }))}
                            className="absolute top-1 right-1 p-1 bg-slate-900/60 backdrop-blur-sm rounded-md text-white hover:bg-red-600 transition-colors"
                            aria-label={ap.content_gallery}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <ImageUpload
                        value=""
                        folder="gcfi/blog"
                        placeholder={ap.content_add_photo}
                        onChange={(url: string) => setForm((f: any) => ({ ...f, gallery: [...(f.gallery || []), url] }))}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-3">
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, published: !(f as any).published }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${(form as any).published ? 'bg-green-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${(form as any).published ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {(form as any).published ? ap.blog_published : ap.blog_draft}
                    </label>
                  </div>
                </div>
                {saveError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                    ⚠️ {saveError}
                    {saveError && saveError.includes('does not exist') && (
                      <p className="mt-1 font-bold">→ The blog_posts table does not exist yet in Supabase. Create it via the SQL Editor.</p>
                    )}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={save} disabled={saving} className="bg-[#C1272D] text-white px-6 py-2 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
                    {saving ? ap.btn_saving : ap.btn_save}
                  </button>
                  <button onClick={resetForm} className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">{ap.btn_cancel}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header liste */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{ap.blog_list_title} ({posts.length})</h3>
        <div className="flex gap-2">
          <button onClick={invalidate} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-[#C1272D] text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90">
            <Plus className="w-4 h-4" /> {ap.blog_new}
          </button>
        </div>
      </div>

      {/* Liste */}
      {posts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{ap.blog_empty}</p>
        </div>
      ) : (
        <>
          <AdminTable
            columns={[
              {
                header: ap.table_title,
                cell: (p) => (
                  <div className="flex items-center gap-3">
                    {p.image
                      ? <Image src={p.image} alt={p.title} width={44} height={44} className="rounded-lg object-cover shrink-0" />
                      : <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5 text-slate-400" /></div>}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                      <span className={`inline-block mt-0.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${p.published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                        {p.published ? ap.blog_status_published : ap.blog_status_draft}
                      </span>
                    </div>
                  </div>
                ),
              },
              { header: ap.table_category, cell: (p) => p.category ? <span className="text-xs text-[#C1272D] font-bold">{p.category}</span> : <span className="text-slate-300">—</span> },
              { header: ap.blog_field_author, cell: (p) => <span className="text-sm text-slate-600 dark:text-slate-300">{p.author}</span> },
              { header: ap.table_date, cell: (p) => <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('fr-FR')}</span> },
              {
                header: ap.table_actions,
                align: 'right' as const,
                cell: (p) => (
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => togglePublish(p.id, p.published, p.title)}
                      className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg transition-colors"
                      title={p.published ? ap.blog_tooltip_unpublish : ap.blog_tooltip_publish}>
                      {p.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => startEdit(p)} className="p-2 text-slate-400 hover:text-[#C1272D] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDelete({ id: p.id, title: p.title })} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
            getKey={(p) => p.id}
            minWidth="800px"
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(posts.length / PAGE_SIZE)}
            totalItems={posts.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
    </>
  );
}